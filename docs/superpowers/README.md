# Cairn 主线索引 / Mainline Index

> 状态：🟡 Active
> 最后更新：2026-05-24
> 目的：给主会话与自动化轮次提供短入口，只保留当前状态、活动主题和最近接力点。

---

## 1. 当前状态

Cairn 当前主线仍是 `docs/STATUS.md` 所述的 **R1 工程基线 + Desktop UI 收口阶段**。当前重点不是扩张功能，而是把文档主索引、主题轨道和 Desktop UI 的事实口径收紧到同一套导航上。

视觉烟测的可用证据仍受当前 macOS / Codex 会话里的 GUI app registration 阻塞影响；在这条证据路径恢复前，不重复普通 Electron / Chromium smoke，不把缺证据的视觉猜测写成事实。

## 2. 活动主题

| 主题                       | 文件                                             | 当前作用                                   |
| -------------------------- | ------------------------------------------------ | ------------------------------------------ |
| 主线文档与 Desktop UI 对齐 | [`tracks/mainline-ui.md`](tracks/mainline-ui.md) | 收口主索引、主题轨道和 Desktop UI 事实口径 |

## 3. 最近入口

1. [`../STATUS.md`](../STATUS.md) - 当前事实基线
2. [`../design/README.md`](../design/README.md) - 设计主文档导航
3. [`../product/roadmap.md`](../product/roadmap.md) - Release 切片
4. [`../superpowers/plans/2026-05-21-nightly-cleanup-handoff.md`](plans/2026-05-21-nightly-cleanup-handoff.md) - 当前接力记录

## 4. 下一步优先级

1. 保持这个索引短，只加当前主题，不回填历史聊天。
2. 只在 `docs/STATUS.md` 和主题轨道里记录会影响下一轮决策的事实。
3. Desktop UI 只做低风险、可验证的事实对齐，不扩到 Web Shell、installer、signing、公证、marketplace 或 workflow builder。
4. 等 GUI 证据路径恢复后，再按窗口宽度分辨率做最小视觉修正。

## 5. 不变规则

- `docs/STATUS.md` 是事实基线，不是长日志。
- 主题轨道只保留会被反复引用的约束和下一步。
- 每轮只推进一个清晰子块，避免把历史对话再次展开成新文档。
