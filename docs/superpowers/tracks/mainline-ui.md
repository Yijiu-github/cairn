# 主线文档与 Desktop UI 对齐

> 状态：🟡 Active
> 最后更新：2026-05-27
> 范围：主索引、状态基线、主题文档和 Desktop UI 事实收口。

---

## 1. 这个主题是什么

这个主题只处理一件事：把 Cairn 的主线文档入口收紧成一个短索引，并确保 Desktop UI 的当前事实只从 `docs/STATUS.md`、产品边界、术语表和设计主稿里推导，不从零散 handoff 里漂移出来。

## 2. 已经收住的东西

- 顶层 UI 口径已经收敛到 `Home / Inbox`、`Runs`、`Runtime Status`、`Settings`。
- `Run Detail`、`Artifact Detail`、`Activity Timeline`、`Task Explorer`、`Replay View` 都只作为二级观察面。
- `docs/design/ux/` 里的信息架构、线框和视觉参考已经对齐到这套主导航。
- `docs/STATUS.md` 已压回事实基线和下一轮入口，不再保留逐轮验证日志。
- Desktop Home 已落地 visual-v1 风格首屏壳；首屏右栏已收住待处理、固定运行和运行安全信息。
- Run Detail 已增加演示状态条，加载 replay source 后集中显示回放证据、任务、产物、Trace 事件和接管入口状态。
- Artifact Review 已能在已有 replay source 时展示真实 artifact id、用户可读产物标题/摘要和只读来源提示；没有 replay source 时仍保留静态占位。
- 当前 GUI 证据路径仍不稳定：普通 Electron / Chromium smoke 在当前 Codex/macOS 会话里会受 app registration / browser sandbox 影响；不要把缺截图的视觉猜测写成事实。

## 3. 还要继续盯住的东西

- 主索引必须短，只保留导航、当前状态和最近接力点。
- 主题轨道只保留会反复引用的约束，不保留每轮聊天记录。
- Desktop UI 只做低风险、可验证的视觉或信息架构收口。
- 若 GUI 证据仍不可用，优先选择 SSR markup、locale helper、CSS regression、class mapping 等可由测试证明的小块。
- 下一阶段需要从“页面收口”切到“内部试用验收”：验证 Home → Run Detail → Artifact Review 的最小演示路径，而不是继续局部打磨。
- 现阶段不引入 Web Shell、installer、signing、公证、企业治理、workflow builder 或 marketplace。

## 4. 不要重复的事

- 不要把旧的 `/agents`、`/tasks`、`/artifacts`、`/activity` 再写回主导航。
- 不要把每次对话都加一份新的独立 md。
- 不要在当前 Codex/macOS 会话里重复普通 Electron / Chromium smoke。
- 不要把缺少窗口证据的 UI 猜测写成事实。
- 不要连续多轮只做文案/边界微调；连续两轮后必须切 track 或停更。

## 5. 下一小步

下一轮优先恢复可信 GUI 证据路径，并补一条内部试用验收清单：Home 启动内部试用 → Run Detail 观察 replay / Trace / operator note → Artifact Review 查看真实产物。若 GUI 证据仍不可用，只做非 GUI 可验证的小块；不要连续多轮只磨同一页面文案、a11y label 或边界说明。
