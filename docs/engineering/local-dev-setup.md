# 本地开发环境 / Local Dev Setup

> 状态：🟡 Draft
> 最后更新：2026-05-18
> 目标读者：新协作者、第一次拉代码的人

---

## 1. 前置依赖

| 工具                                     | 版本   | 说明                                                                         |
| ---------------------------------------- | ------ | ---------------------------------------------------------------------------- |
| **Node.js**                              | ≥ 22   | 通过 [Volta](https://volta.sh/) 或 [fnm](https://github.com/Schniz/fnm) 管理 |
| **pnpm**                                 | ≥ 9.x  | `npm i -g pnpm`                                                              |
| **Git**                                  | ≥ 2.40 |                                                                              |
| **Python**（仅 macOS 编译原生模块时）    | 3.11+  |                                                                              |
| **Xcode Command Line Tools**（macOS）    | 最新   | `xcode-select --install`                                                     |
| **Visual Studio Build Tools**（Windows） | 最新   | 包含 C++ 桌面开发                                                            |

## 2. 第一次拉代码

```bash
git clone <repo>
cd cairn-workspace

# 安装依赖
pnpm install

# 复制环境变量模板（如果有）
cp .env.example .env
# 编辑 .env，填入开发用的 provider key 等
```

## 3. 启动

```bash
# 当前已启动的是 workspace-core 最小服务
pnpm --filter @cairn/workspace-core dev

# 当前 desktop 是 Electron shell 骨架，可在开发态启动 workspace-core sidecar 并显示只读状态
pnpm --filter @cairn/desktop dev

# Web 应用创建后再补齐：
# pnpm --filter @cairn/web dev
```

> ⚠️ 目前 `apps/desktop` 仍是 shell 骨架：renderer 的 run / artifact / settings 内容仍使用静态
> fixtures，preload 只暴露 Workspace Core connection status / restart allowlist，不暴露真实
> run/task/artifact action、文件系统能力或本地路径。`apps/web` 尚未创建。

### macOS Desktop 本机开发闭环

这条路径验证当前 Electron shell、开发态 Workspace Core sidecar 探活与只读 preload 状态桥。
它仍不代表 Desktop 已经接入真实 run/task/artifact 数据。

1. 检查本机依赖：

   ```bash
   node --version
   pnpm --version
   xcode-select -p
   ```

   如果 `xcode-select -p` 失败，先安装 Xcode Command Line Tools：

   ```bash
   xcode-select --install
   ```

2. 安装依赖并跑基础校验：

   ```bash
   pnpm install
   pnpm --filter @cairn/desktop typecheck
   pnpm --filter @cairn/desktop lint
   ```

3. 分开启动当前可用的开发入口：

   ```bash
   # Electron Desktop shell；开发态会由 main 进程启动本地 workspace-core sidecar
   pnpm --filter @cairn/desktop dev

   # 可选：浏览器里的 UI preview
   pnpm --filter @cairn/ui-preview dev
   ```

   `pnpm dev` 当前会让 Turborepo 运行所有已存在 workspace 的 `dev` task；它不会创建
   Web app。调试 Desktop 时优先使用上面的分开启动方式。

4. Desktop Shell smoke 清单：
   - Electron 窗口标题为 Cairn。
   - 左侧可在 Home / Inbox、Run Detail、Artifact Review、Settings 间切换。
   - Sidebar 显示 preview-safe shell。
   - 顶部 Workspace Core 状态来自 preload allowlist，开发态可显示 connected / starting /
     failed；打包态当前显示 degraded。
   - Operator controls 保持 disabled。
   - Artifact Review 中本地路径语言保持 redacted / hidden。

5. 调试 Electron：

   ```bash
   pnpm --filter @cairn/desktop dev:debug
   ```

   - Main process inspector：在 Chrome / Edge 打开 `chrome://inspect`，附加到
     `127.0.0.1:9229`。
   - Renderer DevTools：Electron 窗口聚焦后按 `Option` + `Command` + `I`。
   - Chromium remote debugging：需要浏览器检查 renderer 时使用 `127.0.0.1:9230`。

6. 开发态构建和 macOS 本机打包：

   ```bash
   pnpm --filter @cairn/desktop build
   pnpm --filter @cairn/desktop package:mac:dir
   ```

   `package:mac:dir` 生成的是开发态 ad-hoc directory package，输出在
   `apps/desktop/release/`。如果 macOS Gatekeeper 对本机开发包加了 quarantine，可只对
   本机生成物执行：

   ```bash
   xattr -cr apps/desktop/release
   ```

   正式发布形态使用 `pnpm --filter @cairn/desktop package:mac:dmg`，它依赖 Developer ID
   签名与 notarization 凭据。DMG 发布和自动更新仍未启动，后续需要单独设计。

## 4. 数据库

### 本地 SQLite（默认）

零配置。数据库文件位于：

```text
<userData>/Cairn-dev/workspaces/<id>/workspace.sqlite
```

### 本地 PostgreSQL（可选）

如果要测试远程模式，启动本地 Postgres：

```bash
# 使用 docker
docker run -d --name cairn-pg \
  -e POSTGRES_PASSWORD=devpass \
  -e POSTGRES_DB=cairn \
  -p 5432:5432 \
  postgres:16

# 设置环境变量
echo "DATABASE_URL=postgres://postgres:devpass@localhost:5432/cairn" >> .env
```

### 迁移

```bash
pnpm db:migrate          # 应用所有迁移
pnpm db:migrate:make new # 生成新迁移
pnpm db:reset            # 重置（仅开发态）
```

## 5. 测试

```bash
pnpm test               # 全量（unit + contract）
pnpm test:unit
pnpm test:contract
pnpm test:integration
pnpm test:e2e           # 启动桌面 e2e（需先 build）
pnpm test:watch         # watch 模式
```

## 6. Lint / Format / Typecheck

```bash
pnpm lint               # ESLint
pnpm lint:fix
pnpm format             # Prettier
pnpm typecheck          # tsc --noEmit
```

提交前自动跑（Husky + lint-staged）。

## 7. 常用脚本

| 命令                 | 作用                                     |
| -------------------- | ---------------------------------------- |
| `pnpm dev`           | 启动完整开发态（Desktop/Web 创建后补齐） |
| `pnpm dev:core`      | 启动 Workspace Core 开发服务             |
| `pnpm build`         | 构建所有包                               |
| `pnpm build:desktop` | 仅构建桌面端                             |
| `pnpm build:web`     | 仅构建 Web                               |
| `pnpm clean`         | 清理 dist / cache                        |
| `pnpm db:studio`     | 启动 Drizzle Studio（DB GUI）            |
| `pnpm docs:check`    | 校验文档链接                             |

## 8. IDE 推荐

### VS Code / Cursor

仓库内 `.vscode/extensions.json.example` 列出推荐插件：

- ESLint
- Prettier
- TypeScript (built-in)
- Playwright
- Drizzle ORM

### WebStorm / IntelliJ

启用 ESLint 插件，配置 Prettier 为默认 formatter。

## 9. 调试

### Workspace Core

直接用 `node --inspect` / IDE debugger。

### Electron Main / Renderer

```bash
pnpm --filter @cairn/desktop dev:debug
```

Main 进程通过 `127.0.0.1:9229` 附加调试；Renderer DevTools 可在 Electron 窗口中按
`Option` + `Command` + `I` 打开。

### Sidecar 与 Main 通信

当前 Desktop main 在开发态通过 `pnpm --filter @cairn/workspace-core start` 启动本地
Workspace Core sidecar，绑定 `127.0.0.1:<ephemeral-port>`，并为本次启动生成
`CAIRN_WORKSPACE_CORE_AUTH_TOKEN`。preload 只暴露 connection status / restart allowlist；
renderer 不接收 token、端口、文件路径或进程句柄。

打包态尚未内置 Workspace Core sidecar binary，因此会返回 degraded 状态。

## 10. 常见问题

> 详细问题清单见 [`../ops/troubleshooting.md`](../ops/troubleshooting.md)（面向用户）。

| 问题                                      | 解决                                              |
| ----------------------------------------- | ------------------------------------------------- |
| `pnpm install` 卡在原生模块编译           | 装好 Xcode CLI / VS Build Tools，或使用预编译版本 |
| Electron 启动报 "App is damaged"（macOS） | dev 态请用 `xattr -cr` 清除隔离属性               |
| Sidecar 启动后立刻退出                    | 检查端口冲突，或查看 sidecar 日志                 |
| Drizzle 迁移失败                          | 删除本地 SQLite 文件重跑 `pnpm db:reset`          |

## 11. 团队协作

- 分支策略：见 `git-workflow.md`（待写）
- Commit：见 `commit-convention.md`（标题需中文在前、英文在后）
- PR 规范：见 `../../CONTRIBUTING.md`

## 12. 待办

- [ ] 补充 Windows 上桌面端调试流程
- [ ] 录制一段 30 秒的"零到运行"演示视频

## 变更历史

| 日期       | 变更                                 |
| ---------- | ------------------------------------ |
| 2026-05-18 | 补充 macOS Desktop 本机开发闭环      |
| 2026-05-15 | 更新 Workspace Core 最小服务启动方式 |
| 2026-05-14 | 初版（占位，代码启动后填充）         |
