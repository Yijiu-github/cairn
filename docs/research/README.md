# Research

回答："**外部产品、技术趋势与用户研究给 Cairn 带来什么约束和机会**"。

本目录保存调研输入与分析结论。它不是最终产品规则本身；被采纳的结论必须继续同步到 `product/`、`design/`、`contracts/`、`adr/`、`legal/` 或 `ops/` 中。

## 文件

| 文件                                          | 作用                                                                                               | 状态     |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------- | -------- |
| `agent-workspace-product-patterns-2026-05.md` | 汇总 agent workspace、长任务 agent、artifact / trace / handoff 模式，并映射到 Cairn R1/R2 文档落点 | 🟡 Draft |

## 使用规则

1. **Research 是输入，不是规范**：任何实现不得只引用 research 文档作为唯一依据。
2. **采纳必须落地**：如果一条调研结论影响产品行为，必须同步到对应的设计、契约、ADR 或用户文档。
3. **保留来源与日期**：外部产品能力变化很快，每份调研必须写明观察时间与来源。
4. **避免追热点**：只沉淀会影响 Cairn 核心对象（run / task / agent run / artifact / trace / operator intervention）的结论。

## 已提升为设计约束的结论

- Artifact 是一等交接物，不是附件列表；字段见 [`../design/domain-model.md`](../design/domain-model.md#9-artifact)。
- Inspector 需要同时支持 timeline、causality、cost / latency 与 first failure 视角；R1 闭环见 [`../design/r1-codex-e2e-artifact-trace.md`](../design/r1-codex-e2e-artifact-trace.md#6-traceevent-设计)。
- Handoff Queue 是 Home / Inbox 与 Run Header 的 P0 入口；信息架构见 [`../design/ux/foundations/information-architecture.md`](../design/ux/foundations/information-architecture.md#54-handoff-queue)。
- Replay 只重建视图，不重新执行；恢复语义见 [`../design/replay-and-recovery.md`](../design/replay-and-recovery.md)。
- Runtime Adapter 首发 Codex CLI，R2 优先 Generic OpenAI-Compatible Adapter；契约见 [`../contracts/runtime-adapter.md`](../contracts/runtime-adapter.md)。
