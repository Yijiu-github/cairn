# UI 视觉参考 V1 / Visual Reference V1

> 状态：🟡 Draft
> 最后更新：2026-05-15
> 来源：手写 SVG，未使用 image2。
> 语言策略：中文为主，英文可切换；现有英文图作为英文 locale 参考。

---

## 1. 目标

这版视觉参考用于启动 Cairn 的 UI 设计方向，不是最终高保真稿。默认以中文界面为主，英文作为可切换 locale。目标是先确认：

- 产品气质：本地优先的工程任务控制台，而不是聊天应用。
- 信息密度：run / task / artifact / trace / intervention 同屏可理解。
- 信任机制：证据链、审阅状态、人类接管动作足够显眼。
- 双端延展：Desktop 优先，但组件和语义可迁移到 Web Shell。

## 2. V1 设计关键词

| 关键词            | 说明                                                   |
| ----------------- | ------------------------------------------------------ |
| Calm control room | 冷静、克制、可靠，不做游戏化 dashboard                 |
| Evidence first    | 产物、测试、trace 是核心视觉对象                       |
| Operator visible  | Approve、Retry、Cancel、Request changes 不能藏起来     |
| Local trust       | 本地路径、runtime、diagnostics 要透明但可脱敏          |
| Developer-native  | 使用 diff、log、trace、metadata 等工程师熟悉的信息形态 |

## 3. 屏幕参考

### 3.1 Home / Inbox

![Home / Inbox 中文主界面参考](../assets/visual-v1/ui-v1-home-inbox-zh.svg)

英文 locale 参考：[`ui-v1-home-inbox.svg`](../assets/visual-v1/ui-v1-home-inbox.svg)

重点：

- 新建 run 仍然明显，但不把产品退化成聊天框。
- Handoff queue 是首页主角之一，直接告诉用户“现在等你判断什么”。
- Runtime status 作为本地优先产品的信任锚点常驻侧栏区域。

### 3.2 Run Detail

![Run Detail](../assets/visual-v1/ui-v1-run-detail.svg)

重点：

- Task Tree、Active Work Surface、Evidence、Intervention、Inspector 五个区域共同回答“现在发生了什么，为什么，需要我做什么”。
- Intervention 明确标识 `Effect`，避免用户不知道提交后会不会立即影响 run。
- Inspector 从 timeline 扩展到 causality / cost / first failure 的信息架构。

### 3.3 Artifact Detail

![Artifact Detail](../assets/visual-v1/ui-v1-artifact-detail.svg)

重点：

- Artifact 是可审阅的交接物，不是普通附件。
- Preview 与 Provenance 并列，用户能看到来源、输入、验证和审阅决策。
- Accept / Request changes / Reject / Reuse as context 是 artifact 的核心动作。

### 3.4 First Launch

![First Launch](../assets/visual-v1/ui-v1-first-launch.svg)

重点：

- 首启不是普通欢迎页，而是本地 workspace、core、runtime 三件事的透明配置流程。
- 左侧 setup map 明确当前步骤与后续检查。
- Privacy note 提醒用户数据、产物、日志默认在本地。

### 3.5 Runtime Status

![Runtime Status](../assets/visual-v1/ui-v1-runtime-status.svg)

重点：

- Workspace Core 与 Codex CLI Runtime 分成两个健康面，避免“系统挂了”时无法定位。
- Queue & failures 把运行中/阻塞状态和最近失败直接暴露。
- Diagnostics 操作默认强调 redacted status 与 diagnostic bundle，符合本地优先的信任边界。

### 3.6 Run List

![Run List](../assets/visual-v1/ui-v1-run-list-zh.svg)

重点：阻塞/失败优先，筛选清楚，行 hover 显示轻阴影与主操作。

### 3.7 Activity Timeline

![Activity Timeline](../assets/visual-v1/ui-v1-activity-timeline-zh.svg)

重点：跨运行事件复盘、审计与来源跳转，不替代 Run Detail。

### 3.8 Task Explorer

![Task Explorer](../assets/visual-v1/ui-v1-task-explorer-zh.svg)

重点：跨 run 查任务、看依赖与 attempt，快速回到来源 run。

### 3.9 Replay View

![Replay View](../assets/visual-v1/ui-v1-replay-view-zh.svg)

重点：按时间重播 run 的关键事件和产物快照，只观察，不修改历史。

### 3.10 Settings

![Settings](../assets/visual-v1/ui-v1-settings-zh.svg)

重点：语言、hover/focus、诊断脱敏和危险区都明确可见。

### 3.11 Component States

![Component States](../assets/components/ui-v1-component-states-zh.svg)

重点：把 hover、focus-visible、loading、empty、error 与 danger confirmation 做成统一状态语言。

### 3.12 Detail Themes

![Command Menu](../assets/detail-themes/ui-v1-command-menu-zh.svg)

![Protected Action](../assets/detail-themes/ui-v1-protected-action-zh.svg)

![Diagnostic Export](../assets/detail-themes/ui-v1-diagnostic-export-zh.svg)

![Appearance and Language](../assets/detail-themes/ui-v1-appearance-language-zh.svg)

![Empty and Error Detail](../assets/detail-themes/ui-v1-empty-error-detail-zh.svg)

重点：补齐命令入口、危险确认、诊断导出、外观语言、空错态这些非页面但高频出现的细节主题。

### 3.13 Common Components

![Common Components](../assets/components/ui-v1-common-components-zh.svg)

重点：统一 Button、Input、Badge、Card、Dialog、Toast、Tooltip、Table、Progress、Skeleton 等常用组件，避免页面设计发散。

## 4. 初版视觉规则

| 项       | V1 规则                                       |
| -------- | --------------------------------------------- |
| 背景     | 极浅冷色渐变，弱化装饰，突出白色工作面板      |
| 品牌色   | 蓝到紫渐变，仅用于主动作与品牌点缀            |
| 状态色   | green/amber/red/blue，但必须配合文字与 icon   |
| 圆角     | 面板 24-32px，卡片 16-22px，按钮 10-13px      |
| 阴影     | 只用于顶层容器和重点 composer，不制造层级噪音 |
| 字体     | Inter / system-ui；日志和 id 使用 monospace   |
| 信息密度 | 接近开发工具，不追求消费级留白                |

## 5. 下一步设计任务

1. 把 V1 SVG 中的颜色、圆角、阴影沉淀成 design tokens。
2. 为 `StatusBadge`、`HandoffQueueItem`、`ArtifactCard`、`InterventionComposer` 做组件规格。
3. 补 First Launch 与 Runtime Status 的视觉参考图。
4. 选择是否进入 Figma / Sketch 高保真稿；如果使用图像生成工具，需要记录来源。

## 6. 变更历史

| 日期       | 变更                                                                                     |
| ---------- | ---------------------------------------------------------------------------------------- |
| 2026-05-15 | 初版：Home、Run Detail、Artifact Detail、First Launch、Runtime Status 十七张视觉参考 SVG |
