# @cairn/domain

领域层 **Drizzle ORM schema**（SQLite 方言首版），供 `packages/storage` 与 `apps/workspace-core` 引用。

## 对齐

- 字段与枚举：`@cairn/shared-contracts` 中 Zod 对象（概念对齐，**不**反向依赖该包，避免与后续 `drizzle-zod` 派生产生环依赖）。
- 表结构：`docs/design/domain-model.md`、`docs/adr/0008-orm-drizzle.md`。

## 当前表（5）

| Drizzle 导出        | SQL 表名             |
| ------------------- | -------------------- |
| `workspaces`        | `workspaces`         |
| `orchestrationRuns` | `orchestration_runs` |
| `tasks`             | `tasks`              |
| `agentRuns`         | `agent_runs`         |
| `artifacts`         | `artifacts`          |

## 本包内相对导入无 `.js` 后缀

`drizzle-kit` 以 CJS 加载 `schema` 入口；使用 `./foo` 而非 `./foo.js`，以便在**未先编译到 dist** 时仍能解析 `.ts` 源文件。其余仓库包仍按既有约定使用 `.js` 后缀。

## 脚本

| 命令             | 说明                                    |
| ---------------- | --------------------------------------- |
| `pnpm typecheck` | `tsc --noEmit`                          |
| `pnpm test`      | Vitest（校验初始迁移 SQL 含五张核心表） |

迁移 SQL 位于 `drizzle/`；运行时执行迁移由未来的 `packages/storage` 封装（`migrate()` + 连接参数）。

首版迁移在文件**首尾**增加了 `PRAGMA foreign_keys = OFF` / `ON`：drizzle-kit 生成的 `CREATE TABLE` 顺序在 SQLite 下会先于被引用表创建子表，关闭外键检查可避免首次执行迁移失败；执行完毕后重新开启外键。
