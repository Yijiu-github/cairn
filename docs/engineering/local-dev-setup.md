# 本地开发环境 / Local Dev Setup

> 状态：🟡 Draft  
> 最后更新：2026-05-14  
> 目标读者：新协作者、第一次拉代码的人

---

## 1. 前置依赖

| 工具                                     | 版本   | 说明                                                                         |
| ---------------------------------------- | ------ | ---------------------------------------------------------------------------- |
| **Node.js**                              | 20 LTS | 通过 [Volta](https://volta.sh/) 或 [fnm](https://github.com/Schniz/fnm) 管理 |
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
# 一键启动：desktop + workspace-core + web（开发态）
pnpm dev

# 或者分别启动
pnpm --filter @cairn/workspace-core dev
pnpm --filter @cairn/web dev
pnpm --filter @cairn/desktop dev
```

> ⚠️ 桌面端在开发态下 Electron 直接启动，并连接本地 workspace-core sidecar。详见 `apps/desktop/README.md`（代码启动后补）。

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

| 命令                 | 作用                          |
| -------------------- | ----------------------------- |
| `pnpm dev`           | 启动完整开发态                |
| `pnpm build`         | 构建所有包                    |
| `pnpm build:desktop` | 仅构建桌面端                  |
| `pnpm build:web`     | 仅构建 Web                    |
| `pnpm clean`         | 清理 dist / cache             |
| `pnpm db:studio`     | 启动 Drizzle Studio（DB GUI） |
| `pnpm docs:check`    | 校验文档链接                  |

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

`apps/desktop/src/dev/loopback-inspector.ts` 提供调试 endpoint 查看 sidecar 实时状态（待写）。

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

| 日期       | 变更                         |
| ---------- | ---------------------------- |
| 2026-05-14 | 初版（占位，代码启动后填充） |
