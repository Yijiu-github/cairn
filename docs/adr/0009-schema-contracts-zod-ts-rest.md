# ADR-0009: Schema 与契约派生采用 Zod + ts-rest + zod-to-openapi

- **状态**：🟢 Accepted
- **日期**：2026-05-14
- **决策者**：项目主理
- **关联**：ADR-0001、ADR-0002、ADR-0008、[`../contracts/runtime-adapter.md`](../contracts/runtime-adapter.md)

---

## 背景

`packages/shared_contracts/` 是双端共享的命脉。需要决定：

1. **Schema / 校验库**：Zod / Valibot / Effect Schema
2. **HTTP 契约表达**：tRPC / ts-rest / 手写 OpenAPI / Hono OpenAPI
3. **流式事件契约**：与 HTTP 契约的关系

约束：

- 桌面 Renderer ↔ Workspace Core 必须强类型
- Web Shell（Release 2）必须能用同样的客户端
- **第三方接入**（Runtime Adapter 开发者、CLI、未来集成）需要 **OpenAPI 文档**
- WebSocket 事件需独立 schema 与版本
- 与 ADR-0008 的 Drizzle schema 对齐（drizzle-zod 已锁定 Zod 路径）

## 决策

**采用 Zod + ts-rest + `@asteasolutions/zod-to-openapi`。**

具体地：

1. **校验库**：Zod 3.x（Zod 4 GA 后升级 — 由独立 ADR 记录迁移）
2. **HTTP 契约**：ts-rest contract（一份 contract → server handler 强类型 + client 强类型 + OpenAPI）
3. **OpenAPI 派生**：通过 zod-to-openapi 从 ts-rest contract 生成 `openapi.generated.json`，供文档站与第三方 SDK
4. **WebSocket 事件**：独立的 Zod discriminated union schema，不走 ts-rest
5. **DB schema ↔ API schema**：通过 drizzle-zod 派生基础 schema，在 `shared_contracts` 中组合为对外 DTO（不直接暴露 DB 内部字段）

## 后果

### 好的

- 一份 Zod schema → 既校验运行时 → 又派生 TS 类型 → 又派生 OpenAPI
- 与 ADR-0008（Drizzle）天然衔接
- 第三方 adapter / SDK / CLI 有标准 OpenAPI 文档
- ts-rest 提供"HTTP 语义 + 强类型 + 客户端代码"三合一
- 与 Fastify 集成顺畅（ts-rest 有 Fastify adapter）

### 坏的

- Zod 3 体积较大（~50KB）；桌面端可忽略，Web 远程模式略影响 bundle
- ts-rest 在 streaming / multipart 上较弱 → 流式事件必须独立 schema
- 维护"两套契约"（HTTP via ts-rest + WS via Zod union）需注意命名一致

### 中性的

- Zod 4 升级路径需追踪 — 大概率向后兼容，少数 API 命名变化
- OpenAPI 由生成产物 + git 不存——构建阶段产出 `openapi.generated.json`

## 备选方案

- **tRPC**：放弃。在桌面 Renderer ↔ sidecar 紧耦合场景极佳，但**无法天然产出 OpenAPI**，第三方接入与文档站需要补一层桥（trpc-openapi 已 deprecated）。我们对外有第三方接入需求。
- **Valibot**：放弃。生态成熟度仍是断层（drizzle-zod / ts-rest / zod-to-openapi 都基于 Zod）；体积优势在桌面端意义不大。
- **Effect Schema**：放弃。学习曲线高，与 Effect 生态绑定，对个人项目过重。
- **手写 OpenAPI**：放弃。双向同步 Zod ↔ OpenAPI 极痛苦，错误高发。
- **Hono OpenAPI**：放弃。会将契约层与具体框架绑定，违反"契约独立于框架"原则。

## 实施提示

### 包结构

```text
packages/shared_contracts/src/
├─ schemas/                  # 基础 Zod schema（drizzle-zod 派生 + 手写补充）
│  ├─ workspace.ts
│  ├─ orchestration-run.ts
│  ├─ task.ts
│  ├─ agent-run.ts
│  ├─ artifact.ts
│  └─ trace-event.ts
├─ contracts/                # ts-rest contract
│  ├─ workspace.contract.ts
│  ├─ run.contract.ts
│  ├─ operator.contract.ts
│  └─ index.ts
├─ ws-events/                # WebSocket 事件 schema
│  ├─ run-events.ts
│  ├─ trace-events.ts
│  └─ index.ts
└─ index.ts
```

### ts-rest contract 示例

```ts
import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { OrchestrationRunSelect } from '../schemas/orchestration-run';

const c = initContract();

export const runContract = c.router({
  list: {
    method: 'GET',
    path: '/workspaces/:wsId/runs',
    pathParams: z.object({ wsId: z.string() }),
    query: z.object({
      status: z.string().optional(),
      limit: z.number().int().min(1).max(100).default(50),
    }),
    responses: { 200: z.array(OrchestrationRunSelect) },
  },
  cancel: {
    method: 'POST',
    path: '/runs/:runId/cancel',
    pathParams: z.object({ runId: z.string() }),
    body: z.object({ reason: z.string().optional() }),
    responses: { 200: OrchestrationRunSelect, 404: z.object({ error: z.literal('not_found') }) },
  },
});
```

### WebSocket 事件 schema 示例

```ts
import { z } from 'zod';

export const RunEvent = z.discriminatedUnion('type', [
  z.object({ type: z.literal('run.queued'), runId: z.string(), at: z.number() }),
  z.object({ type: z.literal('run.started'), runId: z.string(), at: z.number() }),
  z.object({ type: z.literal('run.token'), runId: z.string(), at: z.number(), delta: z.string() }),
  // ... 其余事件
]);
export type RunEvent = z.infer<typeof RunEvent>;
```

### OpenAPI 生成

```bash
pnpm contracts:openapi  # 内部跑 zod-to-openapi → 输出 openapi.generated.json
```

`.gitignore` 排除生成产物；CI 在每次 release 时产出并归档。

### 版本与兼容

- Contract 按 `/v1/...` 路径前缀
- breaking change 升 `/v2/...`，老 v1 保留至少一个版本
- OpenAPI 文档同步发布

## 后续

- [ ] 起草首批 `*.contract.ts`（workspace / run / task / operator）
- [ ] 起草 WebSocket 事件 schema
- [ ] 起草 OpenAPI 生成脚本与 CI job
- [ ] Zod 4 GA 后评估迁移成本

## 变更历史

| 日期       | 变更 |
| ---------- | ---- |
| 2026-05-14 | 初版 |
