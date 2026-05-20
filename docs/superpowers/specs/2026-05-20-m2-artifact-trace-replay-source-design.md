# M2 Artifact / Trace Replay Source Design

> 状态：🟡 Draft  
> 日期：2026-05-20  
> 分支：`codex/m2-artifact-trace-replay-source-design`  
> 上游路线：R1 evidence-chain roadmap / M2 Artifact And Trace Evidence Layer

---

## 1. 目标

M2 的目标是把现有 Artifact / Trace demo loop 收束为可被后续 Run Detail Inspector
和 Desktop 真实观察台依赖的最小证据层。

本轮选择 **Inspector-ready Replay Source API + 最小 Artifact Store 加固**：

- 新增 Workspace Core 聚合端点 `GET /v1/runs/:runId/replay-source`。
- Replay Source 一次返回 Run Detail Inspector 所需的对象快照、timeline 与轻量摘要。
- Artifact payload 内容仍通过现有 payload API 懒加载，不在 replay source 中内联。
- Local Artifact Store 加固到原子写、安全 payload ref、路径不泄露与保留边界文档化。

M2 不实现 Desktop UI、Replay UI、artifact 导出、retention 删除、hash 字段或 schema
migration。

---

## 2. 背景与现状

当前 `develop` 已具备：

- `apps/workspace-core` 可创建 run/task/agent-run，并通过 runtime drain 写回状态。
- `GET /v1/runs/:runId/artifacts` 返回 Artifact metadata。
- `GET /v1/artifacts/:artifactId/payload` 返回 bounded text payload。
- `GET /v1/runs/:runId/trace` 返回 TraceEvent timeline。
- `LocalArtifactStore` 以 `artifact-payload://...` 引用保存文本/json payload。
- `docs/STATUS.md` 仍把 Artifact store 文件边界、保留策略、导出、TraceEvent replay UI
  标为未完成能力。

这些能力已经能证明 demo loop，但消费者需要多次请求、自己拼 Task / AgentRun / Artifact /
Trace 关系，也缺少统一的 Inspector 摘要。M2 先把读取面钉成稳定契约，再给 M4 Desktop
真实观察台使用。

---

## 3. 设计决策

### 3.1 采用 Workspace Core 聚合端点

M2 新增 `GET /v1/runs/:runId/replay-source`。端点位于 `apps/workspace-core`，通过现有
repository 方法聚合数据：

- `getRun(runId)`
- `listTasksByRun(runId)`
- `listAgentRunsByTask(taskId)`
- `listArtifactsByRun(runId)`
- `listTraceEventsByRun(runId)`

本轮不新增 application service，也不新增 repository 复合查询。原因是 M2 首要目标是固定
产品契约和证据包形态；性能或复用需求明确后，再把聚合逻辑下沉。

### 3.2 Replay Source 是证据包，不是执行入口

Replay Source 只用于重建 UI 视图、时间线与 inspector 摘要：

- 不调用 RuntimeAdapter。
- 不提交新 Task。
- 不重新执行 Codex。
- 不下载或内联大 payload。

这延续 `docs/design/replay-and-recovery.md` 的语义：replay 指从 TraceEvent 重建 UI，
不是重新执行。

### 3.3 Artifact payload 继续懒加载

Replay Source 返回 Artifact metadata 和 payload API 链接语义，但不返回 artifact 正文。
用户展开 artifact 时继续调用 `GET /v1/artifacts/:artifactId/payload`。

这样能避免：

- API 响应塞入大正文。
- 无意暴露源码、日志或本地路径。
- 把 Replay Source 变成下载 API。

---

## 4. API 设计

### 4.1 Endpoint

```http
GET /v1/runs/:runId/replay-source
```

响应成功时返回 `RunReplaySource`：

```ts
interface RunReplaySource {
  run: OrchestrationRun;
  tasks: Task[];
  agentRuns: AgentRun[];
  artifacts: Artifact[];
  traceEvents: TraceEvent[];
  inspector: RunReplayInspector;
}
```

`artifacts` 必须沿用 Workspace Core 现有 `sanitizeArtifactForResponse()` 规则：

- 不返回本地绝对路径。
- `uriOrPath` 对 payload artifact 使用 opaque `artifact-payload://...` 或 redacted 值。
- 只在 artifact 存在 `payloadRef` 时返回 payload reference。

`traceEvents` 按 `createdAt` 升序返回，作为 timeline 输入。M2 不做复杂 filter。

### 4.2 Inspector 摘要

`RunReplayInspector` 是 Workspace Core 聚合出的轻量摘要，首轮包含：

```ts
interface RunReplayInspector {
  status: OrchestrationRun['status'];
  taskCount: number;
  agentRunCount: number;
  artifactCount: number;
  traceEventCount: number;
  errorEventCount: number;
  warningEventCount: number;
  finalArtifactId?: ArtifactId;
  firstFailureEventId?: TraceEventId;
  firstFailureEventType?: string;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
}
```

派生规则：

- `finalArtifactId` 优先使用 `run.finalResponseRef`，否则可从 output artifact 中选择最早
  `artifactRole=output` 的 artifact。
- `firstFailureEventId` 取第一个 `level=error` 或 `eventType` 以 `.failed` / `.timeout` /
  `.cancelled` 结尾的 TraceEvent。
- `startedAt` 可取 run 的 `startedAt`，没有则取第一条 trace event 时间。
- `completedAt` 可取 run 的 `completedAt`，没有则在终态 run 上取最后一条 trace event 时间。
- `durationMs` 只在 started/completed 都可解析时返回。

这些字段只用于 Inspector 初始判断，不替代原始对象。

### 4.3 错误处理

- `runId` 非法：`400 BAD_REQUEST`。
- run 不存在：`404 NOT_FOUND`。
- repository 读取失败：沿用 Workspace Core 现有 internal error 处理。

M2 不新增权限模型；后续远程 workspace 鉴权会统一包住 Workspace Core API。

---

## 5. Artifact Store 最小加固

M2 只加固本地 payload 文件写入边界。

### 5.1 原子写

`LocalArtifactStore.writeText()` 改为：

1. 生成安全相对路径。
2. 写入同目录临时文件。
3. 完成写入后 `rename` 到最终文件名。
4. 返回 `artifact-payload://...` opaque ref。

这样避免 API 或 DB 指向半写入文件。实现时应尽量保证同目录 rename，以保留文件系统原子性。

### 5.2 安全 payload ref

保留并测试现有安全规则：

- payload ref 必须以 `artifact-payload://` 开头。
- key segments 只能包含 `[A-Za-z0-9._-]`。
- 不允许空 segment、`.`、`..`、绝对路径或路径穿越。

读 API 不接受本地路径；只能接受 payload ref。

### 5.3 Payload 边界

本轮继续只支持：

- `text/plain`
- `application/json`

写入时遵守 `maxBytes` 与 store 的 `maxInlineBytes`，截断时返回 `truncated=true`。
读取时只返回 bounded text、media type、truncated。

### 5.4 保留边界

R1/M2 默认保留 artifact payload。清理、导出、hash 校验和 retention 策略进入后续里程碑。
本轮只在设计文档、状态页或本地开发文档中明确该边界，不提供删除或导出 API。

---

## 6. 数据流

1. Runtime drain 或 mock smoke 产生 run/task/agent-run/artifact/trace 数据。
2. Artifact payload 通过 `LocalArtifactStore` 写入本地文件，DB 保存 metadata 与
   `payloadRef`。
3. `GET /v1/runs/:runId/replay-source` 聚合 run、tasks、agentRuns、artifacts、traceEvents。
4. Workspace Core 派生 `inspector` 摘要。
5. Desktop / Run Detail Inspector 用 replay source 渲染状态树、timeline 和摘要。
6. 用户展开 artifact 时再调用 payload API。

---

## 7. 测试策略

### 7.1 shared contracts

新增或扩展 `packages/shared_contracts` 测试：

- `RunReplayInspector` schema 接受完整摘要。
- `RunReplaySource` schema 接受 run、tasks、agentRuns、artifacts、traceEvents 与 inspector。
- `runContract` 暴露 `getRunReplaySource` 路由。

### 7.2 Workspace Core

新增或扩展 `apps/workspace-core` 测试：

- 成功路径：runtime drain 后 replay source 返回 run、tasks、agentRuns、artifacts、
  traceEvents、inspector。
- Inspector 摘要包含 artifact count、trace count、agent run count、error/warn count、final
  artifact id。
- invalid run id 返回 `400`。
- missing run 返回 `404`。
- artifact metadata 继续使用 sanitized response，不暴露本地路径。

### 7.3 Local Artifact Store

新增或扩展 `apps/workspace-core/src/artifacts/local-artifact-store.spec.ts`：

- `writeText()` 使用临时文件再 rename，最终 payload 可读。
- 失败或读取路径穿越 ref 时返回 payload not found / storage error，不读取 rootDir 外文件。
- payload ref 中的本地路径、`..`、空 segment 被拒绝。
- payload API 不暴露本地绝对路径。

### 7.4 验证命令

实施时至少运行：

```bash
pnpm --filter @cairn/shared-contracts test
pnpm --filter @cairn/workspace-core test
pnpm run check
pnpm test
git diff --check
```

---

## 8. 非目标

- 不做 Desktop UI 或 Browser 验证。
- 不做 Replay UI。
- 不做 artifact export / download API。
- 不做 retention 删除。
- 不新增 hash 字段或 checksum schema。
- 不新增第二 runtime。
- 不启动 `apps/web`。
- 不改变 RuntimeAdapter 执行语义。
- 不把 TraceEvent replay 描述成重新执行。

---

## 9. 文档同步

实现 M2 时需要同步：

- `docs/design/r1-codex-e2e-artifact-trace.md`：补充 replay source API 与 artifact store 原子写边界。
- `docs/STATUS.md`：更新 M2 已完成 / 未完成能力，避免 overclaim export/hash/retention。
- `CHANGELOG.md`：记录 Replay Source API 与 Artifact Store 最小加固。

如果 implementation plan 发现需要新增 schema 字段或持久化迁移，必须先回到设计讨论，不在
M2 默认范围内直接扩张。

---

## 10. 自查

- 无 Desktop/Web 行为变更。
- 无真实 Codex CLI 默认测试要求。
- 无 artifact 正文内联进 replay source。
- 无本地绝对路径暴露。
- 无 hash、导出、retention、schema migration 范围外扩张。
- Replay 明确定义为从 TraceEvent / Artifact 重建视图，不重新执行。
