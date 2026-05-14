# @cairn/storage

SQLite-first 的存储适配层，后续会扩展 PostgreSQL remote workspace 实现。

## 当前范围

- 打开 SQLite 数据库文件或 `:memory:` 测试库
- 启用本地模式必要 PRAGMA：`foreign_keys`、`busy_timeout`、`journal_mode=WAL`、`synchronous=NORMAL`
- 复用 `@cairn/domain` 的 Drizzle schema 与迁移目录
- 提供迁移执行入口，供未来 `apps/workspace-core` 启动时调用

## 数据库策略

R1 Personal Desktop Edition 使用 SQLite：数据库是一个本地文件，默认规划为 `workspace.sqlite`，可以随 workspace 数据目录一起备份、迁移或打包。SQLite 驱动 `better-sqlite3` 会作为 Electron sidecar 的 Node native 依赖随桌面应用打包，不要求用户单独安装数据库服务。

R2 Remote Workspace Edition 预留 PostgreSQL：storage 包会在相同 repository 语义下增加 `postgres/` 实现，让 Workspace Core 可以部署到用户自控 server。领域层与契约层不依赖具体数据库。

## 工程备注

- 完整 SQLite 测试需要 `better-sqlite3` native binding。请优先使用项目钉住的 Node 22；Node 24 当前没有对应 prebuild，本地会要求 C++ 工具链。
- 当前包通过根 `tsconfig.base.json` 的 path alias 解析 `@cairn/domain/schema`。由于 Windows + `node-linker=hoisted` 下 pnpm 对 workspace scoped symlink 有已知链接问题，暂未在 `package.json` 中声明 `@cairn/domain` 直接依赖；后续调整 pnpm 配置或发布形态时应恢复显式依赖。

## 入口

```ts
import { openSqliteStorage, runSqliteMigrations } from '@cairn/storage/sqlite';

const storage = openSqliteStorage({ databasePath: 'workspace.sqlite' });
runSqliteMigrations(storage.db);
storage.close();
```
