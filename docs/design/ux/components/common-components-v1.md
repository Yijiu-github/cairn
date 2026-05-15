# Common Components V1

> 状态：🟡 Draft
> 最后更新：2026-05-15
> 范围：Cairn R1 常用基础组件统一设计；中文为主，英文可切换。

---

## 1. 目标

统一 Cairn 的常用组件，避免页面级设计各自发散。本文面向 `packages/ui` 的第一批 primitives 与 Cairn product components。

图片总览：[`../assets/components/ui-v1-common-components-zh.svg`](../assets/components/ui-v1-common-components-zh.svg)

## 2. 组件分层

| 层            | 组件                                                                                       | 说明                      |
| ------------- | ------------------------------------------------------------------------------------------ | ------------------------- |
| Primitives    | Button、Input、Textarea、Select、Checkbox、Radio、Switch、Tabs、Tooltip、Dialog、Toast     | 无 Cairn 业务语义         |
| Feedback      | StatusBadge、Progress、Skeleton、EmptyState、ErrorState、InlineAlert                       | 可通用，但状态文案走 i18n |
| Data display  | Card、Table、MetadataList、TimelineItem、CodeBlock、DiffBlock                              | 展示数据和工程证据        |
| Cairn product | RunCard、TaskTree、ArtifactCard、HandoffQueueItem、InterventionComposer、RuntimeHealthCard | 带 Cairn 领域语义         |

## 3. Primitives

### 3.1 Button

| Variant     | 用途             | 视觉                         |
| ----------- | ---------------- | ---------------------------- |
| `primary`   | 页面主动作       | brand gradient / blue        |
| `secondary` | 次动作           | white + border               |
| `ghost`     | 低权重动作       | transparent / subtle hover   |
| `danger`    | 危险动作         | red background 或 red subtle |
| `warning`   | 需要注意但非破坏 | amber subtle                 |

要求：

- 不使用只写“确定”的危险按钮；必须写具体动作，如“取消运行”。
- loading 时保留宽度，禁止重复点击。
- focus-visible 使用统一 focus ring。

### 3.2 Input / Textarea

状态：default、hover、focus、error、disabled、readonly、loading suggestion。

要求：

- helper text 和 error text 分离。
- 路径输入使用 monospace 或局部 monospace。
- sensitive input 默认隐藏值，显示 reveal 动作时需要说明风险。

### 3.3 Select / Combobox

用于 runtime、workspace、语言、筛选条件。

要求：

- 支持键盘搜索。
- 选项过多时使用 command-style combobox。
- 语言切换显示 native label：`简体中文` / `English`。

### 3.4 Tabs / Segmented Control

用于 Inspector 的 Trace / Causality / Cost，也用于设置页分组。

要求：

- Tabs 表示内容分区。
- Segmented control 表示同一数据的视图切换。
- 当前项必须有 aria-selected。

## 4. Feedback components

### 4.1 StatusBadge

状态色必须配合 icon + label。状态文案集中维护，不在页面硬编码。

### 4.2 Progress

| 类型          | 用途                |
| ------------- | ------------------- |
| linear        | run/task progress   |
| steps         | first launch wizard |
| indeterminate | 未知耗时 loading    |

### 4.3 Skeleton

用于首次加载，而不是错误或空状态。

规则：

- 只模拟布局，不模拟真实文字。
- 超过 3 秒应出现 loading 文案或诊断提示。

### 4.4 EmptyState / ErrorState

详见 [`empty-error-states-v1.md`](empty-error-states-v1.md)。

## 5. Data display

### 5.1 Card

| Variant       | 用途                        |
| ------------- | --------------------------- |
| `default`     | 普通内容块                  |
| `interactive` | 可点击卡片，hover 有轻阴影  |
| `handoff`     | 待我处理卡片，强调阻塞原因  |
| `artifact`    | 产物卡片，展示 review state |
| `danger`      | 危险区或错误块              |

### 5.2 Table

用于 Run List 和未来 Task Explorer 的密集视图。

要求：

- 列宽自适应，避免中文被挤坏。
- 行 hover 显示主操作。
- blocked / failed 排序优先。
- 支持空筛选状态。

### 5.3 CodeBlock / DiffBlock

用于 log、trace metadata、patch diff。

要求：

- monospace。
- 支持复制。
- 复制前如含敏感字段，走 redaction 或提示。
- DiffBlock 至少区分 added / removed / context。

## 6. Overlay components

### 6.1 Dialog

用于危险确认、诊断导出、artifact review。

要求：

- 标题写清动作。
- 主按钮写清影响。
- Esc 关闭前检查是否有未保存输入。
- 危险 dialog 默认 focus 放在取消/返回，而不是危险动作。

### 6.2 Toast

用于轻量反馈：复制成功、保存成功、后台任务开始。

要求：

- 不承载关键错误；关键错误应在页面内展示。
- 允许操作型 toast，例如“查看详情”。
- 自动消失时间 4-6 秒；危险/失败 toast 不应太快消失。

### 6.3 Tooltip

用于解释图标、缩略 metadata、敏感提示。

要求：

- 不把必要信息只放在 tooltip。
- 支持键盘 focus 展示。

## 7. Product components

### 7.1 RunCard

详见 [`component-state-specs-v1.md`](component-state-specs-v1.md)。

### 7.2 HandoffQueueItem

必须显示：来源、等待时间、阻塞原因、推荐主动作。

### 7.3 ArtifactCard

必须显示：kind、review state、verification summary、sensitive 标记。

### 7.4 InterventionComposer

必须显示 effect：立即生效 / 下次生效 / 仅记录。

## 8. 实现命名建议

```text
packages/ui/src/primitives/button.tsx
packages/ui/src/primitives/input.tsx
packages/ui/src/primitives/dialog.tsx
packages/ui/src/primitives/toast.tsx
packages/ui/src/feedback/status-badge.tsx
packages/ui/src/feedback/empty-state.tsx
packages/ui/src/data-display/code-block.tsx
packages/ui/src/cairn/run-card.tsx
packages/ui/src/cairn/handoff-queue-item.tsx
packages/ui/src/cairn/artifact-card.tsx
packages/ui/src/cairn/intervention-composer.tsx
```

## 9. 变更历史

| 日期       | 变更                                                            |
| ---------- | --------------------------------------------------------------- |
| 2026-05-15 | 初版：统一常用基础组件、反馈组件、数据展示组件与 Cairn 业务组件 |
