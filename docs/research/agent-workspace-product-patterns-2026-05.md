# Agent Workspace 产品模式调研（2026-05）

> 状态：🟡 Draft
>
> 最后更新：2026-05-17
>
> 范围：Codex / Claude Code / agent observability / human-agent handoff 对 Cairn R1/R2 的产品与设计影响。
>
> 用法：本文是调研输入；已采纳结论必须同步到 `product/`、`design/`、`contracts/`、`legal/` 或 `ops/`。

---

## 1. 结论先行

Agent 产品正在从“聊天框 + 自动执行”演进为“长任务工作台”：任务有计划、执行有状态、产物有证据、失败能归因、人类能接管、恢复不靠模型记忆。

对 Cairn 的直接结论：

1. **核心体验必须 run-driven**：Home / Inbox 不能退回聊天入口，Run / Task / AgentRun / Artifact / Trace 才是主语。
2. **Artifact 必须是一等交接物**：每个用户可见产物都要回答“谁生成、基于什么、是否验过、能否复用”。
3. **Inspector 必须解释因果**：只按时间列日志不够；需要 first failure、causality、cost / latency、retry 次数。
4. **Handoff Queue 是 P0**：用户首先要知道“现在该我处理什么”，而不是在多个 run 里寻找阻塞点。
5. **恢复语义必须产品化**：replay 是回放视图，不是重新执行；retry / rerun / replan 必须可解释、可审计。
6. **Runtime Adapter 先做能力画像**：首发 Codex CLI；R2 优先通用 OpenAI-compatible adapter，不为单一第三方转发项目写专属逻辑。

---

## 2. 外部模式观察

### 2.1 长任务 agent 需要 durable protocol

Codex / Claude Code 的近期演进共同指向：长任务不是一次聊天，而是一个可恢复的协议。

有效长任务通常具备：

- 清晰 spec / goal。
- 可拆分 task 与里程碑。
- 独立工作目录或 worktree。
- 持续验证与 acceptance checks。
- 过程事件、产物、错误、决策的长期记录。
- 完成或等待人类判断时的通知 / queue。

**对 Cairn 的约束**：R1 文档和 UI 不能把“agent 最终回复”当主产物；必须以 OrchestrationRun 为中心组织 task tree、artifact、trace 与 handoff。

### 2.2 Artifact viewer 正在变成信任界面

长任务 agent 的输出经常包括 patch、日志、截图、报告、测试结果、上下文包。用户真正要审的是“产物是否可信”，不是“模型说完成了”。

Artifact Detail 需要显示：

- 生成来源：run / task / agent run。
- 输入来源：prompt、ContextPack、文件片段、上游 artifact。
- 验证来源：test log、CI result、screenshot、manual review note。
- 审阅状态：未审、接受、拒绝、被新版本取代。
- 复用策略：可复用、仅当前 run、敏感、过期。

**对 Cairn 的约束**：Artifact schema 需要 provenance / review / reuse 字段；UI 不能只做文件预览器。

### 2.3 Trace / observability 要从 timeline 升级为 causality

LangSmith、LangGraph Studio、Langfuse、MLflow 类工具说明：agent debugging 的关键不是“更多日志”，而是“解释为什么失败”。

R1 可先支持三种 Inspector 视角：

1. **Timeline**：按时间看 TraceEvent。
2. **Causality**：从 failure / artifact 反查上游 task、agent run、tool call、输入 artifact。
3. **Cost & latency**：按 task / agent run 汇总耗时、token、重试次数。

**对 Cairn 的约束**：TraceEvent payload 必须保留足够的关联 id；大 payload 仍走 Artifact，避免把 prompt / 代码片段塞进 trace。

### 2.4 Human-agent handoff 要分 in-the-loop 与 on-the-loop

“接管”至少有两种不同语义：

- **In-the-loop**：批准 / 拒绝当前受保护步骤，或审阅当前 artifact。
- **On-the-loop**：不直接改当前步骤，而是调整下一轮策略，例如 acceptance criteria、runtime profile、review policy、task template。

**对 Cairn 的约束**：Intervention Composer 必须显示 effect：`applies now` / `applies next` / `records only`。所有 intervention 都要写 TraceEvent，并能在 replay 中看到。

### 2.5 本地优先产品要把健康与隐私做成可见体验

本地桌面 agent 的失败点包括：sidecar 没启动、runtime CLI 不在 PATH、凭据过期、loopback 端口被占用、artifact 路径不可写、诊断包泄露敏感路径。

**对 Cairn 的约束**：Runtime Status 需要分开显示 app shell、Workspace Core、Runtime Adapter；诊断导出默认脱敏；自定义 endpoint 必须有责任边界提示。

---

## 3. 提升到 Cairn 文档的规则

### 3.1 Product / UX 规则

- Home / Inbox 的 Needs attention 必须是 **Handoff Queue**，不是普通通知列表。
- Run Detail 的 Inspector 默认回答“为什么现在是这个状态”，而不是默认显示 raw log。
- Artifact Detail 右侧必须有 provenance / verification / review 信息。
- Runtime Status 不替代 Run Detail：前者解释“系统能不能跑”，后者解释“这个 run 为什么这样”。

### 3.2 Domain / Contract 规则

- 用户可见 Artifact 必须有 `review_state`、`owner_type`、`source_input_refs`、`verification_refs`、`reuse_policy`。
- TraceEvent 可以内嵌小摘要，但完整 prompt、完整代码片段、stdout/stderr、错误栈必须通过 Artifact 引用。
- Handoff Queue 可以先做 projection，不必 R1 立刻持久化为独立表；但每个 queue item 必须能追到源对象与 TraceEvent。
- Retry 只能新建 AgentRun attempt；rerun / replan 必须新建 OrchestrationRun。

### 3.3 Runtime Adapter 规则

- Adapter 先声明 Capability Profile，再进入调度与 UI。
- Codex CLI 是 R1 首发 adapter。
- Generic OpenAI-Compatible Adapter 是 R2 首位候选，用于覆盖官方兼容接口、本地推理引擎与用户自配 endpoint。
- Cairn 不内置、不背书、不教学任何具体“订阅转 API / 第三方反代”项目；用户自配 endpoint 的隐私、稳定性、合规由用户负责。

---

## 4. 对应文档落点

| 结论                       | 已落点                                                                                                                                                                                                                                            |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Research 独立成区          | [`README.md`](README.md)、[`../README.md`](../README.md)                                                                                                                                                                                          |
| Artifact 一等交接物        | [`../design/domain-model.md`](../design/domain-model.md#9-artifact)、[`../design/r1-codex-e2e-artifact-trace.md`](../design/r1-codex-e2e-artifact-trace.md#5-artifact-设计)                                                                       |
| Inspector 证据链 / 因果链  | [`../design/r1-codex-e2e-artifact-trace.md`](../design/r1-codex-e2e-artifact-trace.md#6-traceevent-设计)、[`../design/ux/foundations/information-architecture.md`](../design/ux/foundations/information-architecture.md#44-inspector)             |
| Handoff Queue P0           | [`../design/ux/foundations/information-architecture.md`](../design/ux/foundations/information-architecture.md#54-handoff-queue)、[`../design/ux/screens/desktop-wireframes.md`](../design/ux/screens/desktop-wireframes.md#42-handoff-queue-卡片) |
| Replay / recovery 产品规则 | [`../design/replay-and-recovery.md`](../design/replay-and-recovery.md)                                                                                                                                                                            |
| Adapter 通用策略与合规边界 | [`../contracts/runtime-adapter.md`](../contracts/runtime-adapter.md#release-2-候选尚未承诺按优先级)、[`../legal/data-locality.md`](../legal/data-locality.md#41-用户自配-endpoint-的责任边界重要)                                                 |

---

## 5. 来源

- [OpenAI Developers — Codex changelog](https://developers.openai.com/codex/changelog)
- [OpenAI Developers — Run long horizon tasks with Codex](https://developers.openai.com/blog/run-long-horizon-tasks-with-codex)
- [OpenAI Help Center — Codex rate card](https://help.openai.com/en/articles/20001106-codex-rate-card)
- [Anthropic Docs — Claude Platform API release notes](https://docs.anthropic.com/en/release-notes/api)
- [Claude Code CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- [Claude Code SDK docs](https://docs.anthropic.com/en/docs/claude-code/sdk/sdk-typescript)
- Cairn UX research notes: [`../design/ux/foundations/research-and-optimization-notes.md`](../design/ux/foundations/research-and-optimization-notes.md)
