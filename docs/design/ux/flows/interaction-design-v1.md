# Interaction Design V1

> 状态：🟡 Draft
> 最后更新：2026-05-15
> 范围：Cairn R1 桌面端主要页面交互；中文为主，英文可切换。

---

## 1. 总原则

- Cairn 是工程任务控制台，交互应稳定、可预期，不追求花哨动效。
- 用户必须始终知道：当前对象是什么、状态是什么、下一步动作会造成什么影响。
- Hover 用于提示“可点击”，focus-visible 用于键盘可达性；两者不可互相替代。
- 危险动作必须有摩擦：明确文案、影响范围、二次确认。
- 接管动作必须进入 trace，不能只是前端状态变化。

## 2. 全局交互

| 交互          | 规则                                               |
| ------------- | -------------------------------------------------- |
| hover         | 可点击按钮/卡片轻微阴影，卡片可 `translateY(-1px)` |
| focus-visible | 2px focus ring + 4px 柔光，不只靠阴影              |
| active        | 回落，阴影减弱                                     |
| loading       | 保留原尺寸，显示 spinner 或进度文案                |
| disabled      | 不响应 hover，原因可通过 tooltip 或说明文本展示    |
| command menu  | `⌘K` / `Ctrl+K` 打开命令和搜索入口                 |
| escape        | 关闭弹层；若有未保存输入，需确认                   |

## 3. 页面级交互

### 3.1 Run List

- 默认排序：blocked / failed / running / queued / completed。
- 单击行打开 Run Detail。
- hover 行显示轻阴影和主操作入口。
- 状态筛选支持键盘左右切换。
- 批量操作 R1 不做，避免误操作。

### 3.2 Activity Timeline

- 点击事件打开来源对象。
- Shift 点击固定 Inspector，方便对照多个事件。
- 支持复制脱敏事件摘要。
- 默认隐藏 raw metadata，展开后提示可能包含本地路径。

### 3.3 Task Explorer

- 单击选择任务，Enter 打开任务对应的 Run Detail。
- 任务预览显示依赖、attempt、最近 trace 和产物。
- `Retry task` 只对 retryable task 出现。
- `Add instruction` 默认 effect 为 `applies_next`。

### 3.4 Replay View

- Space 播放/暂停。
- 左右键跳转上一个/下一个事件。
- 拖动时间轴预览事件，不改变当前 run 状态。
- 点击产物快照进入 Artifact Detail。
- Replay 是观察/复盘，不允许直接修改历史事件。

### 3.5 Settings

- 语言切换即时生效。
- Hover 动效可以关闭或降低（未来接系统 reduce motion）。
- 诊断导出默认脱敏；导出前展示包含内容清单。
- 危险区操作必须二次确认，不可通过 Enter 误触发。

## 4. 图片示例

本轮新增以下中文主界面 SVG 示例：

| 页面              | 示例                                                                                                       |
| ----------------- | ---------------------------------------------------------------------------------------------------------- |
| Run List          | [`../assets/visual-v1/ui-v1-run-list-zh.svg`](../assets/visual-v1/ui-v1-run-list-zh.svg)                   |
| Activity Timeline | [`../assets/visual-v1/ui-v1-activity-timeline-zh.svg`](../assets/visual-v1/ui-v1-activity-timeline-zh.svg) |
| Task Explorer     | [`../assets/visual-v1/ui-v1-task-explorer-zh.svg`](../assets/visual-v1/ui-v1-task-explorer-zh.svg)         |
| Replay View       | [`../assets/visual-v1/ui-v1-replay-view-zh.svg`](../assets/visual-v1/ui-v1-replay-view-zh.svg)             |
| Settings          | [`../assets/visual-v1/ui-v1-settings-zh.svg`](../assets/visual-v1/ui-v1-settings-zh.svg)                   |

## 5. 变更历史

| 日期       | 变更                                                                  |
| ---------- | --------------------------------------------------------------------- |
| 2026-05-15 | 初版：补 Run List、Activity、Task Explorer、Replay、Settings 页面交互 |
