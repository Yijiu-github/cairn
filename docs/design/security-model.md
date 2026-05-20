# 安全模型 / Security Model

> 状态：🟡 Draft
> 最后更新：2026-05-14
> 来源：[`设计文档V0.1.0.md §14`](设计文档V0.1.0.md) 扩展
> 关联：ADR-0003（Electron）、`SECURITY.md`

---

## 1. 总则

桌面端一旦成为一等产品，安全边界**必须前置设计**。本文件回答：

- 进程之间如何信任？
- 凭据如何存？
- 桌面系统能力如何受控暴露？
- 沟通信道如何鉴权？

## 2. 进程边界

```text
┌──────────────────────────┐
│ Electron Renderer (UI)   │  ← 完全沙箱化，无 Node 能力
│   contextIsolation: true │
│   nodeIntegration: false │
│   sandbox: true          │
└──────┬───────────────────┘
       │ contextBridge (allowlist)
       ▼
┌──────────────────────────┐
│ Electron Main            │  ← 窗口、托盘、通知、升级、桥接
└──────┬───────────────────┘
       │ loopback HTTP+WS + token
       ▼
┌──────────────────────────┐
│ Embedded Workspace Core  │  ← 业务编排、运行状态
│   独立 Node sidecar 进程  │
└──────────────────────────┘
```

## 3. Renderer 安全基线

强制配置（无例外）：

```ts
new BrowserWindow({
  webPreferences: {
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: true,
    preload: path.join(__dirname, 'preload.js'),
  },
});
```

`preload.js` 通过 `contextBridge.exposeInMainWorld()` 暴露**白名单 API**，每个 API 必须：

- 明确入参 / 出参类型（Zod 校验）
- 不直接暴露 Node 原生对象
- 文档化用途与权限边界

当前 Desktop Shell 的 Workspace Core allowlist 仅包含：

- `workspaceCore.getStatus()`：读取 sidecar 健康状态，不返回 token。
- `workspaceCore.runMockSmoke()`：触发 bounded mock runtime smoke，由 Main process 持有
  sidecar token 并调用固定 Workspace Core endpoint。
- `workspaceCore.getRunReplaySource(runId)`：只读读取 Workspace Core 已清洗的
  `RunReplaySource`；renderer 只能传 run id，不能传 base URL、token 或任意 endpoint。

Operator action、artifact payload 正文、本地路径 reveal 与文件系统能力仍需后续显式
allowlist、用户确认与错误恢复设计。

## 4. 桌面能力暴露规则

| 能力                      | 默认                | 说明                                   |
| ------------------------- | ------------------- | -------------------------------------- |
| 打开本地产物目录          | ✅ 允许             | 仅产物目录，路径校验                   |
| 打开日志目录              | ✅ 允许             | 仅日志目录                             |
| 系统通知                  | ✅ 允许             |                                        |
| 自动启动（开机启动）      | ✅ 允许（用户开关） |                                        |
| 选择文件 / 文件夹         | ✅ 允许             | 标准 dialog                            |
| **任意路径读写**          | ❌ 默认禁止         | 仅在用户显式选择路径后允许该次操作     |
| **shell / process / pty** | ⚠️ 受控             | 需要 capability flag + 用户确认        |
| **系统命令执行**          | ⚠️ 受控             | runtime adapter 内部使用，需 allowlist |
| **凭据查看 / 导出**       | ❌ 默认禁止         | 只读访问通过 secret store API          |

**原则：不是不能给，而是必须经过显式能力层与白名单约束。**

## 5. Sidecar 鉴权

Workspace Core 监听 `127.0.0.1:<port>`，必须满足：

1. **Loopback 绑定**：不监听非 loopback 地址
2. **Per-launch token**：每次启动生成临时 token，仅由 Electron Main / Desktop Bridge 持有
3. **Token 注入**：所有请求必须携带 `Authorization: Bearer <token>`
4. **CSRF / Origin 校验**：拒绝非本地 origin
5. **WebSocket 升级**：握手时校验 token，断线重连重发

> 即使是 loopback，也要假设同机其他用户进程可访问 → token 必须有

## 6. Secret 管理

### 6.1 存储

| 平台    | 方案                                    |
| ------- | --------------------------------------- |
| Windows | DPAPI（通过 Electron `safeStorage`）    |
| macOS   | Keychain（通过 Electron `safeStorage`） |
| Linux   | libsecret（如适用）                     |

provider key / token 不允许：

- 明文写入普通配置文件
- 写入 git 仓库
- 通过普通 IPC 暴露给 Renderer
- 出现在日志中（必须脱敏）

### 6.2 访问路径

Renderer 永远拿不到原始 secret，只能：

1. 发起"使用某个 secret 调用 X 服务"的请求
2. 由 Workspace Core 内部读取 secret 并执行
3. 返回结果（不含 secret）

## 7. 数据目录分层

| 目录                          | 用途                  | 加密                   |
| ----------------------------- | --------------------- | ---------------------- |
| `<userData>/workspaces/<id>/` | 业务数据库            | ❌（信任 OS 文件权限） |
| `<userData>/artifacts/<id>/`  | artifact 文件         | ❌                     |
| `<userData>/logs/`            | 运行日志              | ❌（必须脱敏）         |
| `<userData>/secrets-meta/`    | secret 索引（非内容） | ❌                     |
| 系统 Keychain / DPAPI         | secret 内容           | ✅ OS 级               |

- Windows：`%APPDATA%\Cairn\`
- macOS：`~/Library/Application Support/Cairn/`

## 8. 更新通道

- 升级包必须**代码签名校验**
- 升级 manifest 必须 HTTPS + 校验签名
- 不允许"自动从任意 URL 拉取并执行"
- 详见 [`distribution-and-signing.md`](distribution-and-signing.md)

## 9. 第三方 runtime 命令执行

当 Runtime Adapter 涉及执行用户系统命令（如 CLI 工具调用）时：

- 必须 allowlist 命令名
- 必须沙箱化（chdir / 限定环境变量）
- 必须超时
- 必须可被 operator 取消
- 必须记录 TraceEvent

## 10. 依赖供应链

- `package.json` 锁定版本范围；CI 校验 `pnpm-lock.yaml`
- 定期运行 `pnpm audit` / `npm audit`
- 新依赖加入需 PR review，附简短理由
- 关键二进制依赖（如原生模块）固定版本 + 校验 hash

## 11. 威胁模型简表

| 威胁                     | 缓解                                       |
| ------------------------ | ------------------------------------------ |
| 同机恶意进程读取 sidecar | loopback + token                           |
| Renderer 被注入恶意脚本  | contextIsolation + CSP + preload allowlist |
| secret 落盘明文          | safeStorage / OS keychain                  |
| 升级包被替换             | 代码签名 + manifest 校验                   |
| 第三方依赖供应链         | 锁版本 + audit + PR review                 |
| log 中泄露 secret        | 统一脱敏中间件                             |
| 任意路径读写             | dialog only + 路径白名单                   |

## 12. 待办

- [ ] 起草 preload allowlist API 清单
- [ ] 写 CSP 策略具体规则
- [ ] 起草日志脱敏规范（哪些字段必须 mask）
- [ ] Spike：safeStorage 在 macOS 锁屏 / 第二用户场景下的行为

## 变更历史

| 日期       | 变更                     |
| ---------- | ------------------------ |
| 2026-05-14 | 初版，从 V0.1.0 §14 扩展 |
