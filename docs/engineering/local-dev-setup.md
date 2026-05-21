# 本地开发环境 / Local Dev Setup

> 状态：🟡 Draft
> 最后更新：2026-05-22
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

# 当前 desktop 是 Electron 最小 shell 骨架，开发态会后台启动 workspace-core sidecar
pnpm --filter @cairn/desktop dev

# Web 应用创建后再补齐：
# pnpm --filter @cairn/web dev
```

> ⚠️ 目前 `apps/desktop` 是最小 shell 骨架：renderer 仍以静态 fixtures 为主，preload
> 只暴露 Workspace Core status / internal-trial / replay-source allowlist。开发态 sidecar
> bridge 已可启动本地 Workspace Core，默认 runtime 为 mock；如需让 Desktop 自拉起
> Codex-backed sidecar，可设置 `CAIRN_DESKTOP_SIDECAR_RUNTIME=codex`。生产 sidecar
> 打包与完整真实 runtime UI 仍未完成；operator action 仅有 internal-trial 最小
> allowlist，不代表完整接管台。
> `apps/web` 尚未创建。

第一轮**内部开发者试用**的完整范围、gate 与记录口径见 [`../ops/internal-trial-runbook.md`](../ops/internal-trial-runbook.md)。本页只保留通用开发环境与底层手动 smoke 参考。

### Workspace Core runtime 选择

默认 runtime 是 mock，不需要本机安装 Codex CLI：

```bash
pnpm --filter @cairn/workspace-core dev
```

如要显式启用 Codex CLI adapter：

```bash
CAIRN_WORKSPACE_CORE_RUNTIME=codex \
CAIRN_WORKSPACE_CORE_RUNTIME_WORKDIR="$PWD/.cairn/runtime" \
pnpm --filter @cairn/workspace-core dev
```

可选变量：

| 变量                                      | 默认值           | 说明                                                                                   |
| ----------------------------------------- | ---------------- | -------------------------------------------------------------------------------------- |
| `CAIRN_WORKSPACE_CORE_RUNTIME`            | `mock`           | `mock` 或 `codex`                                                                      |
| `CAIRN_WORKSPACE_CORE_RUNTIME_WORKDIR`    | `.cairn/runtime` | Codex CLI adapter 的受控工作目录；手动 smoke 建议传入 `$PWD/.cairn/...` 形式的绝对路径 |
| `CAIRN_WORKSPACE_CORE_CODEX_EXECUTABLE`   | `codex`          | 自定义 Codex CLI 可执行文件路径                                                        |
| `CAIRN_WORKSPACE_CORE_CODEX_SANDBOX_MODE` | `read-only`      | `read-only` / `workspace-write` / `danger-full-access`                                 |

### Manual Codex Runtime Smoke (Opt-In)

真实 Codex smoke 是手动证据步骤，不属于默认 `pnpm test` 或 CI，也不能替代 mock / fixture 自动化覆盖。

第一轮内部开发者试用的完整步骤、记录模板与故障归类统一维护在
[`../ops/internal-trial-runbook.md`](../ops/internal-trial-runbook.md)。本页只保留底层启动口径：

- 只在本机已安装 Codex CLI 且完成本地会话准备时执行。
- prompt 必须使用合成 smoke 文本，不输入真实凭据、业务秘密、客户数据或仓库外敏感内容。
- 启动 Workspace Core 时显式设置 `CAIRN_WORKSPACE_CORE_RUNTIME=codex` 与
  `CAIRN_WORKSPACE_CORE_RUNTIME_WORKDIR="$PWD/.cairn/..."`。
- 若 Codex CLI 缺失、凭据不可用或 runtime 非零退出，记录为手动环境/运行证据，不放宽自动化门禁。

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
pnpm db:migrate   # 应用所有迁移
pnpm db:generate  # 生成新迁移
pnpm db:reset     # 重置（仅开发态）
```

## 5. 测试

```bash
pnpm test               # 全量（unit + contract）
pnpm --filter @cairn/desktop test
pnpm --filter @cairn/workspace-core test
pnpm --filter @cairn/runtime-gateway test
```

> 根目录目前没有 `test:unit` / `test:contract` / `test:e2e` 聚合脚本；按包运行更可靠。内部试用 gate 见 runbook。

## 6. Lint / Format / Typecheck

```bash
pnpm lint               # ESLint
pnpm lint:fix
pnpm format             # Prettier
pnpm typecheck          # tsc --noEmit
```

提交前自动跑（Husky + lint-staged）。

## 7. 常用脚本

| 命令                    | 作用                                                 |
| ----------------------- | ---------------------------------------------------- |
| `pnpm dev`              | 启动当前已存在 app/package 的开发任务                |
| `pnpm dev:core`         | 启动 Workspace Core 开发服务                         |
| `pnpm dev:desktop`      | 启动 Desktop 开发态                                  |
| `pnpm dev:ui-preview`   | 启动 UI preview                                      |
| `pnpm build`            | 构建所有已存在 package/app                           |
| `pnpm build:desktop`    | 仅构建桌面端                                         |
| `pnpm build:ui-preview` | 仅构建 UI preview                                    |
| `pnpm build:web`        | 占位脚本；`apps/web` 尚未创建，当前不作为可运行 gate |
| `pnpm db:migrate`       | 应用所有迁移                                         |
| `pnpm db:generate`      | 生成迁移                                             |
| `pnpm db:reset`         | 重置开发态数据库                                     |
| `pnpm docs:lint`        | 校验 Markdown                                        |

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

DevTools 自动打开 Renderer；Main 进程附加 `--inspect=9229`。

### Sidecar 与 Main 通信

开发态 Desktop 会在 Electron `userData` 下写入不含 token 的 sidecar 诊断快照：
`diagnostics/workspace-core-sidecar.json`。该文件用于确认 sidecar pid、端口、健康状态与
`runtime: "mock" | "codex"`，不要把 bearer token、真实业务 payload 或凭据写入诊断输出。

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

- [ ] 仓库代码启动后填充实际 `pnpm dev` 行为
- [ ] 补充 Windows 上桌面端调试流程
- [ ] 录制一段 30 秒的"零到运行"演示视频

## 变更历史

| 日期       | 变更                                 |
| ---------- | ------------------------------------ |
| 2026-05-15 | 更新 Workspace Core 最小服务启动方式 |
| 2026-05-14 | 初版（占位，代码启动后填充）         |
