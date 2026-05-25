# Cairn 主线索引 / Mainline Index

> 状态：🟡 Active
> 最后更新：2026-05-25
> 目的：给主会话与自动化轮次提供短入口，只保留当前状态、活动主题和最近接力点。

---

## 1. 当前状态

Cairn 当前主线仍是 `docs/STATUS.md` 所述的 **R1 工程基线 + Desktop UI 收口阶段**。当前重点不是扩张功能，而是把 Desktop internal trial 的可体验路径、文档事实口径和自动化接力入口收紧到同一套导航上。

当前自动化入口采用“短主索引 + 主题轨道 + 必要 handoff 摘要”：

- 本文件是第一入口，只记录当前状态、活动主题和下一步优先级。
- 主题轨道记录会被反复引用的约束和下一小步。
- 旧的长 handoff 只保留压缩摘要和历史指针，不再承载逐轮流水账。

## 2. 活动主题

| 主题                       | 文件                                             | 当前作用                                   |
| -------------------------- | ------------------------------------------------ | ------------------------------------------ |
| 主线文档与 Desktop UI 对齐 | [`tracks/mainline-ui.md`](tracks/mainline-ui.md) | 收口主索引、主题轨道和 Desktop UI 事实口径 |

## 3. 最近入口

1. [`../STATUS.md`](../STATUS.md) - 当前事实基线
2. [`../design/README.md`](../design/README.md) - 设计主文档导航
3. [`../product/roadmap.md`](../product/roadmap.md) - Release 切片
4. [`plans/2026-05-21-nightly-cleanup-handoff.md`](plans/2026-05-21-nightly-cleanup-handoff.md) - 压缩后的自动化接力摘要

## 4. 下一步优先级

1. 先读本索引、活动主题轨道和 `docs/STATUS.md`；不要把长 handoff 当第一入口。
2. Desktop UI 只做低风险、可验证的事实对齐，不扩到 Web Shell、installer、signing、公证、marketplace 或 workflow builder。
3. 若 GUI 证据路径不可用，优先做 SSR markup、copy helper、class mapping 或 CSS regression 这类可验证小块。
4. 等拿到可信 1280px / 窄窗口证据后，再做 Desktop Home 的最小视觉修正。
5. 若同一 track 连续两轮只做文案、边界收窄或无事实变化复核，下一轮必须切换 track，或记录“no commit: no valuable next step this round”后停更。

## 5. 不变规则

- `docs/STATUS.md` 是事实基线，不是长日志。
- 主题轨道只保留会被反复引用的约束和下一步。
- 每轮只推进一个清晰子块，避免把历史对话再次展开成新文档。
- 不要为了产生提交而制造 docs-only bookkeeping。
