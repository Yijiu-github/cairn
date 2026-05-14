# 设计系统笔记 / Design System Notes

> 状态：🟡 Draft
> 最后更新：2026-05-15
> 范围：Release 1 UI 基线，服务 `packages/ui` 与 `apps/desktop` / `apps/web`。

---

## 1. 设计原则

1. **结构先于装饰**：Cairn 的价值来自 run / task / artifact / trace 的关系可见，不靠重视觉效果。
2. **状态永远清楚**：running、blocked、failed、completed 不能只靠颜色区分。
3. **危险动作有摩擦**：cancel、reset workspace、删除 artifact、暴露 token 等动作必须二次确认。
4. **本地路径可信但敏感**：路径可见，但复制/导出诊断包时要提示可能包含个人信息。
5. **人类接管是一等动作**：Add note、Retry、Pause、Cancel、Approve 不藏在三级菜单。

## 2. 色彩语义

| Token     | 用途                              | 备注                          |
| --------- | --------------------------------- | ----------------------------- |
| `neutral` | 默认文本、边框、背景              | 大面积使用                    |
| `accent`  | 主操作、当前选择                  | 不等同于成功                  |
| `success` | completed / healthy               | 图标 + 文案一起出现           |
| `warning` | blocked / needs attention         | 用于需要人看但未失败          |
| `danger`  | failed / destructive              | destructive button 必须有确认 |
| `info`    | planning / syncing / reconnecting | 轻量提示                      |

## 3. 状态标签

每个状态标签包含：icon + label + optional metadata。

| 状态      | Label     | Icon 建议      |
| --------- | --------- | -------------- |
| queued    | Queued    | clock          |
| planning  | Planning  | list-tree      |
| running   | Running   | activity       |
| blocked   | Blocked   | triangle-alert |
| failed    | Failed    | circle-x       |
| completed | Completed | circle-check   |
| cancelled | Cancelled | ban            |

## 4. 布局 token

| Token             | 值     | 用途              |
| ----------------- | ------ | ----------------- |
| sidebar width     | 220px  | 主导航            |
| topbar height     | 48px   | app chrome        |
| inspector width   | 320px  | 右侧检查器        |
| task tree width   | 280px  | Run Detail 左中栏 |
| content max width | 1120px | 文档/设置页面     |
| radius-sm         | 6px    | 小按钮、标签      |
| radius-md         | 10px   | card              |
| radius-lg         | 16px   | modal / wizard    |

## 5. 字体与数字

- UI 字体：系统字体栈
- 日志 / trace / code / id：monospace
- ID 默认截断：`run_01H…9KQ`，点击复制完整值
- 时间默认相对时间 + tooltip 绝对时间

## 6. 可访问性

- 所有状态不能只靠颜色表达。
- 所有 destructive action 使用 `danger` 样式 + 文案确认。
- Trace timeline 支持键盘上下移动。
- Command Center 支持键盘执行主要操作。
- 日志区域暂停自动滚动后必须明确显示 “Scroll locked”。

## 7. Motion

谨慎使用动效：

- 运行中 task 可使用轻微 activity indicator。
- 新 artifact 出现可以淡入。
- Inspector drawer 可滑入。
- 不使用大面积 loading skeleton 掩盖真实状态；长操作必须给事件/日志。

## 8. 文案基调

文案应该像工程同伴，不像 SaaS 营销：

- 好：`Run is blocked by a protected file write.`
- 差：`Oops! Something went wrong.`
- 好：`Codex CLI was not found. Configure it now or continue in read-only mode.`
- 差：`Please set up integrations to unlock productivity.`

中文界面后续本地化时，也保持直接、克制、可操作。

## 9. 变更历史

| 日期       | 变更 |
| ---------- | ---- |
| 2026-05-15 | 初版 |
