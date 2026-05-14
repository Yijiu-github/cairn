# @cairn/shared-contracts

> 双端共享的契约层：**所有跨进程、跨包传输的数据形状都在这里定义**。

## 这个包是什么

- ✅ Zod schema：领域对象的运行时 + 编译时校验
- ✅ ts-rest contract：HTTP API 的强类型契约（client + server 共享）
- ✅ WebSocket 事件 schema：流式事件的 discriminated union
- ✅ 类型推断：`z.infer<typeof X>` 派生 TypeScript 类型

## 这个包不是什么

- ❌ 业务逻辑（属于 `@cairn/application`）
- ❌ 数据库 schema（属于 `@cairn/domain` + `@cairn/storage`）
- ❌ 具体的 HTTP server / client 实现（在 `apps/workspace-core` 与 `apps/web`、`apps/desktop`）
- ❌ Runtime Adapter 接口（在 `@cairn/runtime-gateway`）

## 依赖方向

```text
apps/* / packages/* ───► @cairn/shared-contracts
                              │
                              └─ zod / @ts-rest/core
```

**这个包是上游**，本身**只**依赖 Zod 与 ts-rest，不依赖任何 Cairn 业务包。

详见 [`docs/engineering/repo-layout.md §5`](../../docs/engineering/repo-layout.md)。

## 结构

```text
src/
├─ schemas/                 ← 领域对象 Zod schema
│  ├─ ids.ts
│  ├─ common.ts
│  ├─ workspace.ts
│  ├─ conversation.ts
│  ├─ event.ts
│  ├─ message.ts
│  ├─ orchestration-run.ts
│  ├─ task.ts
│  ├─ agent-run.ts
│  ├─ artifact.ts
│  └─ trace-event.ts
├─ contracts/               ← ts-rest HTTP contract
│  ├─ workspace.contract.ts
│  ├─ run.contract.ts
│  └─ operator.contract.ts
├─ ws-events/               ← WebSocket 事件
│  ├─ run-events.ts
│  └─ trace-events.ts
└─ index.ts                 ← 顶层 barrel
```

## 使用

```ts
// 类型 + 校验
import { OrchestrationRun, OrchestrationRunStatus } from '@cairn/shared-contracts';
const run: OrchestrationRun = OrchestrationRun.parse(rawJson);

// HTTP 客户端
import { runContract } from '@cairn/shared-contracts/contracts';
import { initClient } from '@ts-rest/core';
const client = initClient(runContract, { baseUrl: '...', baseHeaders: {} });
const runs = await client.list({ params: { wsId: 'ws_...' } });

// WebSocket 事件
import { RunEvent } from '@cairn/shared-contracts/ws-events';
ws.on('message', (msg) => {
  const event = RunEvent.parse(JSON.parse(msg));
  // 类型已收敛为 discriminated union
});
```

## 命名约定

- **字段**：camelCase（如 `workspaceId`, `createdAt`）
- **DB 列**：snake_case（由 `@cairn/storage` 的 Drizzle 映射）
- **ID 字符串**：ULID（26 字符），见 `schemas/ids.ts`
- **时间戳**：ISO 8601 字符串（如 `2026-05-14T01:39:20.123Z`），不用 Unix 毫秒

## 版本兼容

- 新增字段（向后兼容）：可在 patch / minor 版本
- 删除 / 重命名字段（破坏性）：必须配 ADR + major 版本
- contract 路径前缀使用 `/v1/`；breaking change 升 `/v2/`

## 与 Drizzle schema 的关系

当前版本：**手写 Zod schema**，与 Drizzle schema **独立但字段对齐**。

未来（`packages/domain` 与 `packages/storage` 就位后）：

- 选项 A：用 `drizzle-zod` 派生基础 schema，在本包组合为 API DTO
- 选项 B：保持独立，添加 contract 测试验证两者字段一致

具体走哪条由 ADR-0008 后续记录。

## 相关 ADR

- [ADR-0009](../../docs/adr/0009-schema-contracts-zod-ts-rest.md): Schema 与契约派生采用 Zod + ts-rest + zod-to-openapi
- [ADR-0008](../../docs/adr/0008-orm-drizzle.md): ORM 采用 Drizzle
- [ADR-0014](../../docs/adr/0014-orchestration-scheduler-port.md): OrchestrationScheduler 端口
