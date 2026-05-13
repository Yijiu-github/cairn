# ADR-0011: Monorepo 工具采用 pnpm + turborepo

- **状态**：🟢 Accepted
- **日期**：2026-05-14
- **决策者**：项目主理
- **关联**：ADR-0002、[`../engineering/repo-layout.md`](../engineering/repo-layout.md)

---

## 背景

仓库形态为 monorepo（`apps/*` + `packages/*`，详见 ADR-0001 与 repo-layout.md）。需要决定：

1. **包管理器**：pnpm / npm / yarn berry / bun
2. **任务编排（task runner）**：turborepo / nx / 自建 npm scripts / 无

约束：

- TypeScript ESM
- 双端共享 packages
- 开发者机器与 CI 都要快
- 个人 / 小团队节奏，避免大型工具复杂度

## 决策

**采用 pnpm（workspaces）+ turborepo。**

具体地：

1. 包管理器：**pnpm 9.x+**
2. 任务编排：**turborepo 2.x**
3. 锁文件：`pnpm-lock.yaml`，CI 必须 `--frozen-lockfile`
4. Workspace 声明：`pnpm-workspace.yaml`（`apps/*` + `packages/*`）
5. 任务定义：`turbo.json`，覆盖 `dev` / `build` / `lint` / `typecheck` / `test` 等
6. Remote cache：**Release 1 不开启**；Release 2 视需要评估（Turborepo OSS remote cache / Vercel）

## 后果

### 好的

- pnpm 严格符号链接 + content-addressable store → 磁盘占用最小、安装最快
- turborepo 任务级缓存 + 并行调度 → 大幅缩短 CI 时间
- 配置极简：`turbo.json` 30 行起步
- 与 GitHub Actions 集成成熟
- 不引入大型工具学习成本（不像 nx）

### 坏的

- turborepo 部分高级功能（细粒度 input 指纹）需要正确声明依赖，配置失误会"假命中"缓存
- 远程缓存默认依赖 Vercel；自建需 OSS turbo-cache server
- pnpm 在某些极端 native 模块场景（如旧版 better-sqlite3）需要 `node-linker=hoisted` 调整

### 中性的

- 未来若需要 generator / module graph 可视化等重型能力，可平滑迁移到 nx（不强制）
- Bun 在 2026 已有一定可用度，但 Electron 与原生模块集成仍不如 Node + pnpm 稳

## 备选方案

- **nx**：放弃。功能最全但学习曲线陡，generator / executor / project graph 等能力对个人项目过重。
- **自建 npm scripts**：放弃。无缓存、无依赖图，跨包构建会越来越慢。
- **Bun**：放弃（作为默认 runtime / package manager）。Electron 与 native 模块兼容性、`node-pty` 等仍需追赶。可在工具脚本中按需使用 `bun` 跑特定脚本。
- **Yarn Berry**：放弃。PnP 模式与 Electron / Vite 工具链兼容性时有问题。

## 实施提示

### `pnpm-workspace.yaml`

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

### `turbo.json`（草案）

```jsonc
{
  "$schema": "https://turborepo.org/schema.json",
  "ui": "tui",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", "build/**"],
      "inputs": ["src/**", "package.json", "tsconfig*.json"]
    },
    "typecheck": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "lint": {
      "outputs": []
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

### `package.json` 顶层

```jsonc
{
  "name": "cairn-workspace",
  "private": true,
  "packageManager": "pnpm@9.x.y",
  "engines": { "node": "20.x" },
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "typecheck": "turbo run typecheck",
    "lint": "turbo run lint",
    "test": "turbo run test"
  }
}
```

### pnpm 配置

`.npmrc`：

```ini
auto-install-peers=true
strict-peer-dependencies=false
public-hoist-pattern[]=@types/*
public-hoist-pattern[]=eslint-*
node-linker=isolated
```

## 后续

- [ ] 提交 `pnpm-workspace.yaml` / `turbo.json` / 根 `package.json`
- [ ] Release 2 前评估是否启用 turbo remote cache（OSS server 或 Vercel）

## 变更历史

| 日期 | 变更 |
|---|---|
| 2026-05-14 | 初版 |
