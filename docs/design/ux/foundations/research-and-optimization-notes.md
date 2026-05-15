# 设计调研与优化说明 / Research & Optimization Notes

> 状态：🟡 Draft
> 最后更新：2026-05-15
> 范围：Release 1 Personal Desktop Edition 的 UX 设计补强。本文不是视觉稿来源记录；当前 SVG 仍是手写低保真线框，不是 image2 生成图。

---

## 1. 调研结论摘要

这轮调研重点看了三类参考：

1. **Agent coding / workspace 产品**：OpenHands、Cursor background agents 相关实践、Devin/Jules 类后台工程 agent。
2. **Agent observability / debugging 工具**：LangSmith、LangGraph Studio、MLflow/Langfuse 类 traces、evals、human annotation。
3. **Human-agent handoff / artifact management**：人类接管、产物归属、review/rework 成本与 provenance。

对 Cairn 最有价值的结论：

- Cairn 不应该只展示“agent 正在输出什么”，而要展示 **为什么这样做、证据在哪里、下一步谁负责**。
- 产物不是附件列表，而是协作交接物；每个 artifact 必须有 ownership、provenance、review 状态和可复用上下文。
- Trace 不只是 debug log，而是 run 的可解释性骨架；UI 要能从失败点反查到 task、agent run、tool call、artifact。
- 人类接管要分成 **in-the-loop** 与 **on-the-loop**：前者批准/拒绝具体步骤，后者调整下一轮执行策略或模板。
- 对本地优先工具来说，runtime/core 健康、权限边界、敏感路径脱敏要作为产品体验的一部分，而不是隐藏在日志里。

## 2. 参考点与设计启发

| 参考方向                                   | 观察                                                                     | 对 Cairn 的启发                                                                     |
| ------------------------------------------ | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| OpenHands / autonomous coding agents       | 强调在用户环境中执行真实工程任务，区别于 IDE 补全                        | Cairn 的首页应突出 run / artifact / verification，不要退回聊天 UI                   |
| Cursor background agent loops              | 真实价值来自 implement → review → revise 的闭环与证据附件                | Run Detail 需要明确显示 review loop、acceptance checks、evidence artifacts          |
| LangSmith / LangGraph Studio               | trace、step-level cost/latency、time-travel、human annotation 是调试关键 | Inspector 应增加 cost/latency、first failure、event compare、annotation/review 状态 |
| Agent artifact management                  | 产物需要命名、归属、权限、可检索与 human handoff                         | Artifact Detail 增加 owner、review state、source inputs、reuse policy               |
| Human-agent handoff patterns               | 糟糕交接会导致重新解释上下文、重复 review、责任扩散                      | Intervention Composer 必须说明“提交后会发生什么”，并保存 decision record            |
| Workspace benchmark / realistic file tasks | agent 产物路径可能不可预测，真实 workspace 文件关系复杂                  | Cairn 应强制 artifact registry，避免只靠 agent 最终回复找文件                       |

## 3. 设计优化方向

### 3.1 从“三栏观察”升级为“控制台 + 证据链”

原设计已经有 Task Tree / Active Work Surface / Inspector。优化后，Run Detail 的核心不是“看日志”，而是回答：

1. 目标是什么？验收标准是什么？
2. 当前执行到了哪个 task？为什么卡住？
3. 已经产生了哪些可审阅证据？
4. 哪些动作需要人类判断？
5. 如果失败，第一分歧点/第一失败点在哪里？

### 3.2 Artifact 作为一等交接物

Artifact 需要新增字段/状态：

- `review_state`: unreviewed / accepted / rejected / superseded
- `owner_type`: agent / human / system
- `source_input_refs`: 生成它所依赖的输入 artifact / files
- `verification_refs`: 对应 test log、screenshot、CI result、manual review note
- `reuse_policy`: reusable / run-local / sensitive / expired

UI 上 Artifact Detail 右侧 Provenance Panel 应显示：

- 由哪个 task / agent run 生成
- 基于哪些输入
- 经过哪些检查
- 是否被人类接受
- 是否可作为下一轮 run 的上下文

### 3.3 Handoff Queue：把“待我处理”做实

Home / Inbox 的 Needs attention 不只是卡片，应成为轻量 handoff queue：

| 队列项           | 示例                     | 主动作                   |
| ---------------- | ------------------------ | ------------------------ |
| Protected action | 写入受保护路径           | Approve once / Reject    |
| Failed task      | 测试失败但可重试         | Retry / Add instruction  |
| Review artifact  | patch 待审阅             | Accept / Request changes |
| Runtime issue    | Codex auth 过期          | Configure runtime        |
| Ambiguous plan   | planner 需要用户选择范围 | Choose option            |

每个队列项必须显示：来源 run、阻塞原因、等待时长、默认推荐动作。

### 3.4 Human-in/on-the-loop 双模式

Cairn 的“接管”不要只有审批：

- **In-the-loop**：批准/拒绝某个 protected step，或者审阅某个 artifact。
- **On-the-loop**：不直接改当前步骤，而是调整下一轮策略，例如修改 acceptance criteria、runtime profile、review policy、task template。

UI 表达：Intervention Composer 增加 “Effect” 区块：

- `Applies now`：会立即 resume / retry / cancel。
- `Applies next`：作为下一次 planning / retry 的上下文。
- `Records only`：只沉淀 note，不改变调度。

### 3.5 Debugging：增加 First failure / Divergence / Cost 视角

Inspector 的 trace 需要支持三种模式：

1. **Timeline**：按时间看事件。
2. **Causality**：从 artifact / failure 反查上游依赖。
3. **Cost & latency**：按 task / agent run / tool call 汇总耗时、token、重试次数。

R1 不必做复杂图可视化，但数据结构和 UI 占位要先留好。

### 3.6 本地优先的信任细节

桌面端设计需要继续强化：

- 显示 core 与 runtime 是两个健康面，不混在一起。
- 所有本地路径显示“可见但敏感”：复制/导出前脱敏提示。
- protected action 默认只支持 approve once，不提供“永远允许所有危险动作”的显眼入口。
- 诊断包默认 redacted，用户可展开查看包含内容。

## 4. R1 设计优先级调整

| 优先级 | 原因                                            | 应补强位置                            |
| ------ | ----------------------------------------------- | ------------------------------------- |
| P0     | Handoff Queue 决定用户是否知道自己该做什么      | Home / Inbox、Run Header              |
| P0     | Artifact provenance 决定用户是否信任 agent 产出 | Artifact Detail、Run Detail Inspector |
| P0     | Runtime/Core 健康决定本地首启可用性             | First Launch、Runtime Status          |
| P1     | Replay / compare 提升 debug 与复盘能力          | Replay View、Activity Timeline        |
| P1     | Cost/latency 让长任务可解释                     | Inspector、Run List                   |

## 5. 对现有文档的具体改动建议

- `information-architecture.md`
  - 增加 Handoff Queue 与 Review Center 语义。
  - Run Detail 增加 Evidence / Cost / Causality 视角。
- `desktop-wireframes.md`
  - Home 增加 handoff queue 字段。
  - Run Detail 增加 Acceptance Criteria、Evidence rail、Effect-aware Intervention Composer。
  - Artifact Detail 增加 review state 与 provenance。
- `key-flows.md`
  - 新增 artifact review / request changes 流程。
  - 新增 on-the-loop 策略调整流程。
- `component-mapping.md`
  - 增加 `HandoffQueue`、`EvidencePanel`、`ArtifactReviewPanel`、`TraceCausalityView`。
- `design-system-notes.md`
  - 增加 evidence、review、sensitive path、cost badge 的视觉规则。

## 6. 视觉稿来源说明

当前仓库里的 `docs/design/ux/design-assets/*.svg` 是低保真工程线框稿，适合表达结构和信息层级；它们不是 image2 生成图，也还不是最终视觉设计。

后续如果要用 image2 / Figma / Sketch 生成高保真稿，建议把来源、prompt、版本和取舍写进同目录的 `design-assets/README.md`，避免之后分不清哪些是设计决策、哪些只是视觉探索。

## 7. 变更历史

| 日期       | 变更                                                                           |
| ---------- | ------------------------------------------------------------------------------ |
| 2026-05-15 | 初版：调研 agent workspace、observability、human handoff，并提炼到 Cairn R1 UX |
