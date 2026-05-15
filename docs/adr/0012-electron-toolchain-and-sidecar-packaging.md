# ADR-0012: Electron 工具链 + Sidecar 打包 + 自动更新

- **状态**：🟢 Accepted
- **日期**：2026-05-14
- **决策者**：项目主理
- **关联**：ADR-0003、ADR-0007、[`../design/distribution-and-signing.md`](../design/distribution-and-signing.md)

---

## 背景

ADR-0003 钉死了 Electron 作为桌面壳。落地需要确定 3 件事：

1. **开发与构建工具链**：electron-vite + electron-builder / electron-forge
2. **Sidecar（Workspace Core）打包方式**：携带 Node binary / Node SEA / pkg / nexe
3. **自动更新方案**：electron-updater / 自建 manifest / Sparkle wrapper

这 3 件事彼此关联，单独决策会冲突。

## 决策

### 1. 开发与构建工具链：**electron-vite + electron-builder**

- 开发态：`electron-vite` 提供 Main / Preload / Renderer 三进程 HMR
- 构建/打包/签名/公证：`electron-builder`
- 不采用 electron-forge（功能等价但 plugin 生态偏小，签名灵活度略差）

### 2. Sidecar 打包：**携带完整 Node binary + 单文件 bundle**

- 把对应平台的 `node` 可执行文件**作为 extraResource 随包发布**
- Workspace Core 入口通过 `esbuild` / `rollup` 打成 ESM 单文件 bundle
- Native 模块（如 `better-sqlite3`、`node-pty`）通过 `asarUnpack` 解包到磁盘
- Electron Main 通过 `child_process.spawn(<bundledNode>, [sidecarEntry])` 启动 sidecar
- **不采用 Node SEA**（GA 但 native 模块仍需外置文件，损失"单文件"优势）
- **不采用 pkg / nexe**（pkg 维护停滞；nexe 同样存在问题）

### 3. 自动更新：**分阶段策略**

- **Release 1**：自建 manifest + 引导下载安装（详见 distribution-and-signing.md）
- **Release 2**：启用 `electron-updater`，提供受控自动更新（后台下载 + 用户触发重启）
- **Release 3**：多通道（stable / beta），可选差分更新

### 4. 桌面端目录布局（用于打包）

```text
apps/desktop/
├─ src/
│  ├─ main/                  # Electron Main 进程入口
│  ├─ preload/               # contextBridge allowlist
│  └─ renderer/              # React UI 入口（引用 packages/ui）
├─ resources/
│  ├─ node-binaries/         # 各平台 node 可执行文件（CI 注入）
│  └─ icons/
├─ electron.vite.config.ts
├─ electron-builder.yml
└─ package.json
```

### 5. electron-builder 关键配置

```yaml
appId: io.cairn.app
productName: Cairn
directories:
  output: release
files:
  - dist/**
asarUnpack:
  - 'node_modules/better-sqlite3/build/Release/*.node'
  - 'resources/node-binaries/${platform}-${arch}/node*'
extraResources:
  - from: 'resources/node-binaries/${platform}-${arch}/'
    to: 'node-binaries/'
mac:
  category: public.app-category.developer-tools
  target:
    - target: dmg
      arch: [arm64]
  hardenedRuntime: true
  gatekeeperAssess: false
  entitlements: build/entitlements.mac.plist
  entitlementsInherit: build/entitlements.mac.plist
  notarize: true
win:
  target:
    - target: nsis
      arch: [x64]
  signtoolOptions:
    sign: scripts/sign-windows.js
```

## 后果

### 好的

- electron-vite HMR 体验最佳，三进程切换无缝
- 携带 Node binary 与 native 模块兼容性最好（`better-sqlite3` / `node-pty` 都是 native）
- electron-builder 签名/公证/auto-update 端到端覆盖
- 分阶段更新策略降低 Release 1 风险（自动更新比手动下载错误面更大）

### 坏的

- 安装包体积增加 ~50MB（Node binary）；总包体积 ~200MB 起步
- 多平台 Node binary 需要在 CI 注入与签名
- electron-builder 配置（macOS entitlements、Windows signtool 钩子）较复杂

### 中性的

- Node SEA 在 2026 已 GA，未来如果 native 模块生态适配良好，可重新评估（→ 新 ADR supersede 本 ADR 的 §2）
- electron-forge 仍是合格备选，未来若 plugin 生态翻盘可重新评估

## 备选方案

### 工具链

- **electron-forge**：放弃。功能近似但 plugin 生态比 builder 小，签名/公证流水线灵活度略差。
- **手搭 Vite + electron-builder**（无 electron-vite）：放弃。HMR 与三进程联调体验差。

### Sidecar 打包

- **Node SEA**：放弃为默认。Node 22+ GA，但 native 模块仍需 sidecar 文件方式或动态加载，损失"单文件"优势；签名复杂度也并未真正降低。
- **pkg**：放弃。Vercel 已停止维护（2024 起）。
- **nexe**：放弃。社区维护慢，跨架构支持脆弱。
- **共用 Electron 内的 Node**（Main 直接 spawn）：放弃。破坏 ADR-0003 三进程边界；Electron 的 Node ABI 与独立 Node 可能不一致，跨版本风险。

### 自动更新

- **Sparkle wrapper（macOS 原生）**：放弃。增加平台不一致；electron-updater 已足够。

## 实施提示

### CI 注入 Node binary

`release.yml` 中：

```yaml
- name: Download Node binary (macOS arm64)
  if: runner.os == 'macOS'
  run: |
    curl -fsSL https://nodejs.org/dist/v20.x.y/node-v20.x.y-darwin-arm64.tar.gz | tar -xz
    mkdir -p apps/desktop/resources/node-binaries/darwin-arm64/
    cp node-v20.x.y-darwin-arm64/bin/node apps/desktop/resources/node-binaries/darwin-arm64/
```

Windows / Linux 类似。

### IPC 与 preload

- Renderer ↔ Main：**手搭 contextBridge + 自定义 RPC**
- Renderer ↔ Workspace Core：走 ADR-0007 的 loopback HTTP/WS（不经过 Main 转发）
- 不引入 `electron-trpc`（与 ADR-0009 的 ts-rest 重叠）

### 签名注意

- macOS：Node binary 也必须签名（`codesign --deep` 会覆盖，但要确保 entitlements 一致）
- Windows：signtool 钩子脚本路径要绝对，CI 中注入证书后由 electron-builder 调用

## 后续

- [ ] 提交 `electron.vite.config.ts` 模板
- [ ] 提交 `electron-builder.yml` 模板
- [ ] 提交 `build/entitlements.mac.plist` 与 `scripts/sign-windows.js` 草稿
- [ ] Spike：携带 Node binary 启动 sidecar 的端到端流程
- [ ] Spike：macOS 公证全链路（含 Node binary 与 native 模块）

## 变更历史

| 日期       | 变更 |
| ---------- | ---- |
| 2026-05-14 | 初版 |
