# 命名约定 / Naming Conventions

> 状态：🟡 Draft
> 最后更新：2026-05-16
> 目的：统一 Cairn 代码、文档、API、DB、事件与 artifact 的命名。

---

## 1. 总原则

- 领域术语以 [`glossary.md`](./glossary.md) 为准。
- 文件、目录和 route 优先使用 kebab-case。
- DB 表、DB 字段、枚举值、事件 type、artifact type 使用 snake_case。
- TypeScript 类型使用 PascalCase。
- 变量和函数使用 camelCase。
- 公开名称宁可长一点，也不要缩写到失去语义。

## 2. 文件与目录

| 对象           | 规则                    | 示例                                  |
| -------------- | ----------------------- | ------------------------------------- |
| 源码文件       | kebab-case              | `orchestration-run-service.ts`        |
| 测试文件       | 被测文件名 + `.spec.ts` | `orchestration-run-service.spec.ts`   |
| React 组件文件 | kebab-case              | `protected-action-dialog.tsx`         |
| 配置文件       | 保留生态约定            | `vite.config.ts`、`drizzle.config.ts` |
| 生成文件       | 保留生成器约定          | Drizzle migration 文件                |

例外必须来自工具生态、生成器或第三方固定入口，不能为个人偏好新增例外。

## 3. TypeScript 符号

| 对象             | 规则                            | 示例                    |
| ---------------- | ------------------------------- | ----------------------- |
| 类型 / 接口 / 类 | PascalCase                      | `OrchestrationRun`      |
| React 组件导出   | PascalCase                      | `ProtectedActionDialog` |
| 变量 / 函数      | camelCase                       | `dispatchTask`          |
| 常量             | UPPER_SNAKE                     | `MAX_RETRIES`           |
| 私有 helper      | camelCase                       | `normalizeRunStatus`    |
| 类型参数         | PascalCase，短泛型可用 `T` 前缀 | `TRow`、`TEvent`        |

## 4. 包与路径别名

| 对象              | 规则                  | 示例                       |
| ----------------- | --------------------- | -------------------------- |
| package name      | `@cairn/<kebab-name>` | `@cairn/runtime-gateway`   |
| package directory | 允许沿用现有目录      | `packages/runtime_gateway` |
| import alias      | `@cairn/<kebab-name>` | `@cairn/shared-contracts`  |

目录名与 package name 不一致时，以 package name 和 `tsconfig.base.json` alias 为导入权威。

## 5. 领域对象

领域对象命名以 PascalCase 表示类型，以 camelCase 表示变量：

| 领域类型         | 类型名             | 变量示例           |
| ---------------- | ------------------ | ------------------ |
| Workspace        | `Workspace`        | `workspace`        |
| Conversation     | `Conversation`     | `conversation`     |
| OrchestrationRun | `OrchestrationRun` | `orchestrationRun` |
| Task             | `Task`             | `task`             |
| AgentRun         | `AgentRun`         | `agentRun`         |
| Artifact         | `Artifact`         | `artifact`         |
| TraceEvent       | `TraceEvent`       | `traceEvent`       |

不要把 `Run`、`Task`、`AgentRun` 混用。术语含义见 [`glossary.md`](./glossary.md)。

## 6. DB 与枚举值

| 对象      | 规则                    | 示例                   |
| --------- | ----------------------- | ---------------------- |
| 表名      | snake_case 复数         | `orchestration_runs`   |
| 字段名    | snake_case              | `workspace_id`         |
| 枚举值    | snake_case              | `single_worker`        |
| migration | 保留 Drizzle 生成器命名 | `0003_last_satana.sql` |

DB 命名优先保证迁移稳定和跨 SQLite / PostgreSQL 可读性。

## 7. HTTP / WebSocket / Artifact

| 对象                 | 规则                       | 示例                 |
| -------------------- | -------------------------- | -------------------- |
| HTTP route           | `/v1` + kebab-case path    | `/v1/code-search`    |
| path param           | camelCase in contract docs | `workspaceId`        |
| JSON field           | camelCase                  | `workspaceId`        |
| WebSocket event type | snake_case                 | `run_status_changed` |
| Artifact type        | snake_case                 | `planner_output`     |
| Runtime capability   | snake_case                 | `streaming_output`   |

如果已有 shared contract 使用不同约定，以 contract 为准，并在变更时统一迁移。

## 8. 禁用与慎用词

禁用：

- `Pipeline`
- `Workflow Builder`
- `Marketplace`
- `Tenant`

慎用：

- `Job`：优先确认是否应为 `Task`、`AgentRun` 或 scheduler 内部概念。
- `Replay`：只表示从 TraceEvent 重建 UI，不表示重新执行。
- `Replan`：只表示新 run 中重新规划，不表示当前 run 内修改 task graph。

## 9. 变更历史

| 日期       | 变更                         |
| ---------- | ---------------------------- |
| 2026-05-16 | 初版：从代码规范拆出命名约定 |
