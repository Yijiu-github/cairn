# M4a Desktop Observer Prep Design

> 状态：🟡 Draft  
> 日期：2026-05-20  
> 分支：`develop`  
> 上游路线：R1 evidence-chain roadmap / M4 Desktop Real Observation Console

---

## 1. 目标

M4a 的目标是把 Desktop 从“只能触发 bounded mock smoke 并显示摘要”推进到“可以安全读取
真实 Workspace Core replay evidence”。

本轮选择 **只读 Desktop observer prep**：

- Desktop preload 新增最小只读 allowlist：读取指定 run 的 replay source。
- Desktop main 继续作为 loopback Workspace Core 的唯一 token 持有者。
- Renderer 可以用 mock smoke 生成的真实 run id 加载 run / task / agent run /
  artifact metadata / trace timeline / inspector 摘要。
- Run Detail 的核心证据区从静态 fixture 过渡到真实 Workspace Core evidence。

M4a 不实现完整 Desktop 产品 UI，不实现 operator action，不读取本地文件路径，不暴露 artifact
payload 正文，不启动 Web Shell，也不新增 Workspace Core API。

---

## 2. 背景与现状

当前 `develop` 已具备：

- M1：Workspace Core 可以通过 RuntimeAdapter-backed path 验证真实运行时提交与 drain。
- M2：Workspace Core 已提供 `GET /v1/runs/:runId/replay-source`，聚合 run、tasks、
  agentRuns、artifacts、traceEvents 与 inspector 摘要。
- M3：cancel / retry / rerun 的接管证据已写入 TraceEvent，并能通过 run trace /
  replay-source 读取。
- Desktop main 已能启动 loopback Workspace Core sidecar，使用 per-launch bearer token。
- Desktop preload 目前只暴露 `workspaceCore.getStatus()` 与
  `workspaceCore.runMockSmoke()`。
- Desktop renderer 的 Run Detail、Artifact Review、Settings 仍主要使用静态 fixture。

薄弱点：

- `runMockSmoke()` 返回摘要后，Desktop 没有正式 API 再读取该 run 的完整 replay source。
- Run Detail 仍不能展示真实 Workspace Core evidence，因此 M2/M3 的证据链还没有进入
  Desktop 可消费边界。
- Desktop bridge 还没有一个清晰的只读 evidence client 模型，后续 operator action 容易过早混入。

---

## 3. 设计决策

### 3.1 先只读，不接管

M4a 只做观察，不做控制。

允许：

- 读取 sidecar 健康状态。
- 触发现有 bounded mock smoke。
- 根据 run id 读取 replay source。
- 在 renderer 中显示 run 状态、任务、agent run、artifact metadata、trace timeline 和
  inspector 摘要。

禁止：

- pause / resume / cancel / retry / rerun。
- artifact payload 正文读取。
- 本地路径 reveal、导出、删除或文件系统写入。
- 读取任意 URL 或允许 renderer 传入 Workspace Core base URL / token。

原因：

- M4 的第一步是证明 Desktop 可以消费真实 evidence，而不是先扩展本地能力面。
- M2/M3 的证据已经足够支撑只读 Run Detail。
- operator action 需要额外 UI 确认、安全边界和错误恢复设计，应进入后续 M4b。

### 3.2 Main process 持有 Workspace Core 权限

Renderer 不能拿到 sidecar token，也不能拼接 Workspace Core URL。

数据流固定为：

```text
Renderer
  -> preload allowlist
  -> ipcMain handler
  -> workspace-core-client.ts
  -> loopback Workspace Core with bearer token
  -> sanitized replay source
```

这延续 Desktop 安全基线：renderer 是受限 UI，main/preload 才是系统能力边界。

### 3.3 使用现有 replay-source 契约

M4a 不新增 Workspace Core endpoint，也不修改 `RunReplaySource` schema。

Desktop client 读取：

- `GET /v1/runs/:runId/replay-source`

返回值可以直接使用 shared contracts 的 `RunReplaySource` 类型；如果 renderer 需要更小的视图模型，
在 Desktop 内部派生，不改变 core API。

### 3.4 Mock smoke 成为真实 observer 入口

M4a 不新增 run 列表或 run 选择器。

最小入口是：

1. 用户点击现有 `Run Mock Smoke`。
2. Desktop 获得 smoke 生成的 `runId`。
3. Renderer 保存该 `runId` 为当前 observed run。
4. 用户进入 Run Detail，Desktop 调 `getRunReplaySource(runId)`。
5. Run Detail 展示真实 replay evidence。

如果没有 observed run，Run Detail 保留静态 fixture 或空态提示。

---

## 4. API 与模块设计

### 4.1 Desktop main client

在 `apps/desktop/src/main/workspace-core-client.ts` 新增：

```ts
export interface GetWorkspaceCoreRunReplaySourceOptions {
  readonly authToken: string;
  readonly baseUrl: string;
  readonly fetch?: typeof fetch | undefined;
  readonly runId: string;
}

export const getWorkspaceCoreRunReplaySource = async (
  options: GetWorkspaceCoreRunReplaySourceOptions,
): Promise<RunReplaySource> => {
  // GET /v1/runs/:runId/replay-source
};
```

约束：

- 复用现有 `requestJson()`，继续只支持 allowlisted request。
- `runId` 只作为 path segment 使用，先做最小字符串校验；实施时优先复用
  `OrchestrationRunId.safeParse()` 或 shared contracts 类型。
- HTTP 非 2xx 统一转成普通 `Error`，不泄露 token。

### 4.2 IPC handler

在 `apps/desktop/src/main/index.ts` 新增 handler：

```text
workspace-core:get-run-replay-source
```

行为：

1. 确保 sidecar healthy；若未 healthy，调用 `start()`。
2. 如果仍不健康，抛出普通错误。
3. 调 `getWorkspaceCoreRunReplaySource()`。
4. 返回 replay source。

handler 不接受 base URL、token 或任意 endpoint。

### 4.3 Preload bridge

在 `apps/desktop/src/preload/index.ts` 的 `workspaceCore` allowlist 新增：

```ts
readonly getRunReplaySource: (runId: string) => Promise<RunReplaySource>;
```

Renderer 只能传 `runId`。

### 4.4 Renderer model

在 `apps/desktop/src/renderer/src/desktop-app.tsx` 中新增最小状态：

- `observedRunId?: string`
- `runReplaySource?: RunReplaySource`
- `runReplayLoading: boolean`
- `runReplayError?: string`

交互：

- `runMockSmoke()` 成功后设置 `observedRunId = result.runId`。
- Run Detail view mount 或用户刷新时，根据 `observedRunId` 调
  `window.cairnDesktop.workspaceCore.getRunReplaySource(observedRunId)`。
- Run Detail 优先显示真实 replay source；无 observed run 时显示现有静态 fixture/空态。

首轮展示内容保持克制：

- RunCard 或 metadata：run id、status、task count、artifact count、trace count。
- TaskTree：由 replay source 的 tasks 派生最小 task tree。
- EvidenceTimeline：由 traceEvents 派生时间线，展示 event type、level、createdAt 和 source id。
- Artifact summary：只展示 artifact metadata，不调用 payload API。
- Inspector summary：first failure、warning/error count、duration、final artifact id。

### 4.5 UI 边界

M4a 可以复用现有 `@cairn/ui` primitives，不做新的复杂组件系统。

允许修改 Run Detail 的局部渲染，避免重做整个 Desktop shell。

必须保留：

- operator controls 仍 disabled。
- artifact review action 仍 disabled。
- path exposure policy 仍 redacted。
- Settings 的 source root 本地文件能力仍 unavailable。

---

## 5. 数据流

```text
Run Mock Smoke
  -> create run / task / agent run / artifacts / trace in Workspace Core
  -> returns runId
  -> renderer stores observedRunId

Run Detail
  -> renderer calls preload.getRunReplaySource(observedRunId)
  -> main process ensures sidecar healthy
  -> main client GET /v1/runs/:runId/replay-source
  -> Workspace Core returns sanitized RunReplaySource
  -> renderer derives small display model
  -> UI shows real evidence summaries and timeline
```

Replay 仍然只表示从 TraceEvent / Artifact metadata 重建 UI，不重新执行 runtime。

---

## 6. 错误处理

M4a 使用简单、可解释的错误边界：

- Sidecar 未启动或不健康：显示 Workspace Core action failed，并保留静态/空态。
- Run id 非法：preload/main 返回普通错误，renderer 显示“无法加载 run evidence”。
- Run 不存在：Workspace Core 返回 404，Desktop 显示普通错误，不创建假数据。
- Replay source 请求失败：不清空 `observedRunId`，允许用户刷新重试。
- Artifact payload 缺失：M4a 不读 payload，因此不进入本轮错误面。

错误信息不包含 token、本地绝对路径或 sidecar 内部启动命令。

---

## 7. 测试策略

### 7.1 Desktop main client tests

扩展 `apps/desktop/src/main/workspace-core-client.spec.ts`：

- `getWorkspaceCoreRunReplaySource()` 请求
  `/v1/runs/:runId/replay-source` 并带 bearer token。
- 非 2xx 响应转成普通错误。
- 不允许调用任意 path。

### 7.2 IPC / preload contract tests

根据当前测试结构扩展：

- `apps/desktop/src/main/index.spec.ts`：确认注册
  `workspace-core:get-run-replay-source` handler。
- preload 类型或 build 验证：`window.cairnDesktop.workspaceCore.getRunReplaySource` 可用。

### 7.3 Renderer behavior

优先用现有 Desktop build/typecheck 验证，必要时补轻量 renderer 单测。

需要证明：

- mock smoke 成功后保存 observed run id。
- Run Detail 可以在有 replay source 时显示真实 counts/timeline。
- operator controls 仍 disabled。

### 7.4 Verification

实施时至少运行：

```bash
pnpm --filter @cairn/desktop test
pnpm --filter @cairn/desktop build
pnpm run check
pnpm test
git diff --check
```

如果修改了 shared contracts 类型或 Workspace Core 契约，再补：

```bash
pnpm --filter @cairn/shared-contracts test
pnpm --filter @cairn/workspace-core test
```

---

## 8. 文档同步

实现 M4a 时需要同步：

- `docs/STATUS.md`：说明 Desktop 已可只读消费真实 replay source，但仍不是完整真实 UI。
- `CHANGELOG.md`：记录 Desktop observer prep。
- `docs/design/security-model.md`：如 preload allowlist 描述需要更新，补充只读 replay-source
  bridge 边界。

不更新：

- `docs/product/roadmap.md`，除非 M4/M5 范围发生变化。
- ADR，除非引入新的持久化、安全或基础设施决策。

---

## 9. 非目标

M4a 明确不做：

- 不实现 Desktop operator action。
- 不实现 cancel / retry / rerun 的 UI。
- 不实现 artifact payload 正文查看、导出、删除或 hash 校验。
- 不实现 run 列表、搜索、过滤或多 run 选择器。
- 不新增 Workspace Core endpoint 或 schema migration。
- 不启动 `apps/web`。
- 不读取、显示或上传本地绝对路径。
- 不做 Electron packaging、签名、公证或安装器。

---

## 10. 完成定义

M4a 完成后应该满足：

- Desktop preload 暴露一个新的只读 replay-source allowlist 方法。
- Renderer 无法获得 Workspace Core token、base URL 或任意 endpoint 调用能力。
- 用户可以通过现有 mock smoke 生成真实 run，并在 Run Detail 看到该 run 的真实
  replay evidence 摘要。
- Run Detail 能展示 run/task/agentRun/artifact/trace/inspector 的最小真实信息。
- operator controls 和 artifact actions 仍保持 disabled。
- 测试覆盖 Desktop main client 与 IPC/preload contract 的关键边界。
- 文档准确说明 M4a 是 observer prep，不是完整 Desktop UI 或 operator control UI。

---

## 11. 后续切片

M4a 之后建议拆为：

1. **M4b Desktop Operator Action Gate**：只接 cancel / retry / rerun 的最小安全 UI，并明确确认与错误恢复。
2. **M4c Run List And Selection**：从 Workspace Core 读取 run 列表，让 Desktop 不依赖 mock smoke 入口。
3. **M4d Artifact Payload Viewer**：在不暴露本地路径的前提下读取 bounded payload，并加入 size/error 状态。
4. **M5 Pre-release Hardening**：Desktop packaging、诊断、安装、隐私与 smoke checklist。
