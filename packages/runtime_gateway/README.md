# @cairn/runtime-gateway

Runtime Gateway 是 Cairn 连接具体 agent runtime 的执行总线。当前包先落 `RuntimeAdapter` 契约、错误归一化、mock adapter 与 conformance 测试辅助，真实 Codex CLI adapter 会在 Spike S5 验证后接入。

## 当前范围

- 定义 `RuntimeAdapter`、`CapabilityProfile`、提交请求、流式事件、取消与状态查询类型
- 归一化 adapter 错误码，供 application / Workspace Core 做统一恢复策略
- 提供 `createMockRuntimeAdapter`，用于无真实 runtime 的单元测试
- 提供 `defineRuntimeAdapterConformanceSuite`，让未来 Codex / Claude / OpenAI-compatible adapter 复用同一套契约测试
- 提供 Codex CLI `exec --json` 子进程封装、stdout JSONL 协议解析、stderr 收集与基础错误映射

## 边界

这个包不负责：

- 任务规划、结果综合与 operator 接管（属于 `@cairn/application`）
- 数据库读写与 artifact 内容落盘（属于 `@cairn/storage` / Workspace Core）
- 桌面系统能力桥接（属于 `@cairn/desktop-bridge`）
- 完整 Codex RuntimeAdapter 生命周期编排（后续在 `codex-adapter.ts` 实现）

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

## 后续

- 将 `codex-process.ts` 接入 `codex-adapter.ts`，实现完整 RuntimeAdapter
- 用真实长任务验证 Windows 下取消行为与 stdout JSONL 流式粒度
- 让真实 adapter 通过 conformance suite
- 补 `docs/ops/install-guide.md` 与 `docs/ops/troubleshooting.md`
