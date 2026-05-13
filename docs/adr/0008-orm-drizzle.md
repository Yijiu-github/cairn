# ADR-0008: ORM 采用 Drizzle

- **状态**：🟢 Accepted
- **日期**：2026-05-14
- **决策者**：项目主理
- **关联**：ADR-0002、ADR-0005、[`../design/domain-model.md`](../design/domain-model.md)

---

## 背景

ADR-0005 已定：SQLite first / PostgreSQL ready。

我们需要一个 ORM / query 层，满足：

1. **SQLite + PG 双方言**良好支持
2. **可嵌入 Electron sidecar**（不引入额外原生 binary 让打包复杂化）
3. **TypeScript 一等公民**（schema → 类型推断）
4. **迁移工具完善**
5. **schema 可派生为校验 schema**（与 ADR-0009 的 Zod 契约对齐）

候选：Drizzle、Kysely、Prisma、MikroORM。

## 决策

**采用 Drizzle ORM。**

具体地：

1. `packages/storage/sqlite/` 与 `packages/storage/postgres/` 共享同一份 schema 定义（在 `packages/domain/` 中表达），方言差异封装在 repository 层
2. 使用 **drizzle-kit** 生成与运行迁移（双方言）
3. 通过 **drizzle-zod** 派生 Zod schema → 供 `packages/shared_contracts/` 使用
4. SQLite 启用 `WAL` + `busy_timeout` + foreign_keys
5. PostgreSQL 使用 `node-postgres`（`pg`）作为底层 driver

## 后果

### 好的

- 纯 JS / TS，**无原生 binary 引擎**，Electron 打包简单
- TS 类型从 schema 自动推断，与领域对象天然一致
- drizzle-zod 让"DB schema ↔ API schema"零成本对齐
- 性能接近裸 SQL（无 ORM proxy 开销）
- 学习曲线低：API 接近 SQL builder，新人快速上手
- 双方言兼容：避免 schema 设计被某个方言独有特性绑死

### 坏的

- 部分高级特性（如 PG 的 JSONB 操作符、partial index 表达式）需要原生 SQL 走 `sql\`\`` 模板字面量
- drizzle-kit 迁移工具相对 prisma migrate 仍在成熟中
- 跨方言通用代码需要小心：少数 API（如 datetime / json）方言间有差异，需在 repository 层封装

### 中性的

- 不提供 ActiveRecord / 自动关联 lazy load 等"魔法"——这恰好是我们想要的
- 与 Kysely 风格相近，未来若需要降级到纯 query builder 风险低

## 备选方案

- **Kysely**：放弃为首选。性能与控制力最强，但缺少完善的 schema/迁移工具链；个人项目工程便利度更重要。**保留为退路**——若 Drizzle 在某些边界卡住，可在 repository 层降级到 Kysely / 裸 SQL，不影响 schema。
- **Prisma**：放弃。Rust 引擎打包困难（Electron + macOS arm64 + Win x64 ≥ 3 个原生 binary，每个 10–20MB），SQLite 长期是二等公民，冷启动慢。这些与 ADR-0003 的桌面体验目标严重冲突。
- **MikroORM / TypeORM**：放弃。DataMapper / ActiveRecord 重抽象层与本项目"轻量、可控"风格不符。

## 实施提示

### Schema 位置

```text
packages/domain/src/schema/
  ├─ workspaces.ts
  ├─ orchestration-runs.ts
  ├─ tasks.ts
  ├─ agent-runs.ts
  ├─ artifacts.ts
  ├─ trace-events.ts
  └─ index.ts
```

### 方言差异的封装方式

- 类型差异（如 datetime）：在 schema 中分两套，由 `packages/storage/sqlite` 与 `packages/storage/postgres` 各自引用
- 查询差异（如 SKIP LOCKED）：在 repository 接口中暴露为 `pickReadyTask()`，sqlite 用 `BEGIN IMMEDIATE`、postgres 用 `SELECT ... FOR UPDATE SKIP LOCKED`

### 与 Zod 派生

```ts
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { orchestrationRuns } from '@cairn/domain/schema';

export const OrchestrationRunInsert = createInsertSchema(orchestrationRuns);
export const OrchestrationRunSelect = createSelectSchema(orchestrationRuns);
```

派生出来的 Zod schema 由 `packages/shared_contracts/` 重新组合为对外 API DTO。

### SQLite 启动参数

```ts
db.pragma('journal_mode = WAL');
db.pragma('busy_timeout = 5000');
db.pragma('foreign_keys = ON');
db.pragma('synchronous = NORMAL'); // WAL 下足够
```

### Native 模块选择

- SQLite driver：**`better-sqlite3`**（同步、稳定、性能好，Electron 兼容）
- 与 `electron-builder` 配合：在 `package.json` 的 `build.asarUnpack` 中正确解包 `.node` 文件

## 后续

- [ ] 提交首批 schema（`workspaces` / `orchestration_runs` / `tasks` / `agent_runs` / `artifacts` / `trace_events`）
- [ ] 起草 `engineering/db-migrations.md` 的双方言细则
- [ ] Spike：`better-sqlite3` 在 Electron asar 中的加载验证

## 变更历史

| 日期 | 变更 |
|---|---|
| 2026-05-14 | 初版 |
