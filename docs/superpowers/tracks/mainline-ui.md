# 主线文档与 Desktop UI 对齐

> 状态：🟡 Active
> 最后更新：2026-05-24
> 范围：主索引、状态基线、主题文档和 Desktop UI 事实收口。

---

## 1. 这个主题是什么

这个主题只处理一件事：把 Cairn 的主线文档入口收紧成一个短索引，并确保 Desktop UI 的当前事实只从 `docs/STATUS.md`、产品边界、术语表和设计主稿里推导，不从零散 handoff 里漂移出来。

## 2. 已经收住的东西

- 顶层 UI 口径已经收敛到 `Home / Inbox`、`Runs`、`Runtime Status`、`Settings`。
- `Run Detail`、`Artifact Detail`、`Activity Timeline`、`Task Explorer`、`Replay View` 都只作为二级观察面。
- `docs/design/ux/` 里的信息架构、线框和视觉参考已经对齐到这套主导航。
- `docs/STATUS.md` 已记录当前 GUI smoke 的真实阻塞，不再把 `ready-to-show` 超时写成唯一故障点。

## 3. 还要继续盯住的东西

- 主索引必须短，只保留导航、当前状态和最近接力点。
- 主题轨道只保留会反复引用的约束，不保留每轮聊天记录。
- Desktop UI 只做低风险、可验证的视觉或信息架构收口。
- 现阶段不引入 Web Shell、installer、signing、公证、企业治理、workflow builder 或 marketplace。

## 4. 不要重复的事

- 不要把旧的 `/agents`、`/tasks`、`/artifacts`、`/activity` 再写回主导航。
- 不要把每次对话都加一份新的独立 md。
- 不要在当前 Codex coalition 里重复普通 Electron / Chromium smoke。
- 不要把缺少窗口证据的 UI 猜测写成事实。

## 5. 下一小步

等 GUI 证据路径恢复后，只针对新截图里真正出现的 1280px 与窄窗口差异做最小修正，然后把结论写回 `docs/STATUS.md` 和主索引。
