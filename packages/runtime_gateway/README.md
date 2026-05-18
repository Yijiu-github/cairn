# @cairn/runtime-gateway

Runtime Gateway 是 Cairn 连接具体 agent runtime 的执行总线。当前包先落
`RuntimeAdapter` 契约、错误归一化、mock adapter、conformance 测试辅助与
Codex CLI adapter 最小生命周期实现。

## 当前范围

- 定义 `RuntimeAdapter`、`CapabilityProfile`、提交请求、流式事件、取消与状态查询类型
- 归一化 adapter 错误码，供 application / Workspace Core 做统一恢复策略
- 提供 `createMockRuntimeAdapter`，用于无真实 runtime 的单元测试
- 提供 `defineRuntimeAdapterConformanceSuite`，让未来 Codex / Claude / OpenAI-compatible adapter 复用同一套契约测试
- 提供 Codex CLI `exec --json` 子进程封装、stdout JSONL 协议解析、stderr 收集与基础错误映射
- 提供 `createCodexRuntimeAdapter`，把 Codex CLI 子进程封装为
  `RuntimeAdapter` 的 submit / stream / cancel / query 生命周期

## 边界

这个包不负责：

- 任务规划、结果综合与 operator 接管（属于 `@cairn/application`）
- 数据库读写与 artifact 内容落盘（属于 `@cairn/storage` / Workspace Core）
- 桌面系统能力桥接（属于 `@cairn/desktop-bridge`）
- Workspace Core 的真实 Codex runtime 选择、artifact payload 解析与端到端调度

## 使用

```ts
import { createMockRuntimeAdapter } from '@cairn/runtime-gateway/adapters/mock';

const adapter = createMockRuntimeAdapter();
await adapter.init({ workdir: '/tmp/cairn-run', config: {}, secrets, logger });
await adapter.submit(request);

for await (const event of adapter.stream(request.runId)) {
  // Runtime Gateway 在这里把 AdapterStreamEvent 映射成 AgentRun / TraceEvent 更新。
}
```

Codex CLI adapter 的最小用法：

```ts
import { createCodexRuntimeAdapter } from '@cairn/runtime-gateway/adapters/codex';

const adapter = createCodexRuntimeAdapter();
await adapter.init({ workdir: '/tmp/cairn-run', config: {}, secrets, logger });
await adapter.submit({
  runId: 'agent-run-id',
  model: 'gpt-5.5',
  inputs: [{ artifactId: 'input-artifact-id' }],
  traceId: 'trace-id',
  options: { prompt: 'Summarize this workspace.' },
});
```

## 后续

- 将 `createCodexRuntimeAdapter` 接入 Workspace Core 的实际 runtime 选择路径
- 补 artifact payload resolver，让 Codex adapter 不依赖 `options.prompt` 传入提示词
- 用真实长任务验证 Windows 下取消行为与 stdout JSONL 流式粒度
- 补 `docs/ops/install-guide.md` 与 `docs/ops/troubleshooting.md`
