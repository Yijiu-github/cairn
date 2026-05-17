# 竞品与差异化定位 / Competitive Positioning

> 状态：🟡 Draft  
> 最后更新：2026-05-17  
> 关联：[`positioning-and-boundaries.md`](positioning-and-boundaries.md)、[`roadmap.md`](roadmap.md)

---

## 1. 结论

Cairn 不与 Codex、Claude Code、Cursor、Windsurf 正面竞争“谁更会写代码”。这些工具是 Cairn 应该接入和编排的 runtime。

Cairn 的差异化是：**本地优先、runtime-neutral、可观察、可回放、可接管的 Agent 工程控制台**。

## 2. 容易被官方工具商品化的能力

- worktree 创建与隔离。
- 并行 agent session。
- 基础任务分派。
- 自动运行测试。
- 生成 commit / PR。
- 单一 runtime 的代码生成质量。

这些能力可以使用，但不应作为 Cairn 的长期护城河。

## 3. Cairn 的差异化重心

| 维度    | Cairn 目标                                               |
| ------- | -------------------------------------------------------- |
| Runtime | Codex / Claude / 本地模型都通过 Runtime Adapter 接入     |
| 数据    | 默认本地或用户自控 server，不上报业务内容                |
| 记忆    | run / task / artifact / trace / planning output 长期沉淀 |
| 回放    | 从 TraceEvent 与 Artifact 重建执行过程                   |
| 接管    | 人类可暂停、取消、重试、rerun、replan、注入说明          |
| 团队    | 从个人本地工作台自然延展到小团队共享控制台               |

## 4. 产品边界

Cairn 不做：

- 企业级多租户审批治理平台。
- 开放 worker marketplace。
- 拖拽式 workflow builder。
- 单一聊天 bot。
- 单一 IDE 补全 copilot。

## 5. 市场节奏

- R1：个人本地工作台，验证可信闭环。
- R2：远程 workspace，打开小团队入口。
- R3：小团队 agent 工程控制台，增强共享观察面、operator handoff 与受保护步骤。
