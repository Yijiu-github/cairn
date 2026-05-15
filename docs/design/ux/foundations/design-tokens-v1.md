# Design Tokens V1

> 状态：🟡 Draft
> 最后更新：2026-05-15
> 来源：从 `visual-reference-v1.md` 与 `design-assets/ui-v1-*.svg` 抽取；未使用 image2。

---

## 1. 设计目标

Tokens V1 用于把视觉参考图里的样式沉淀为可实现的 UI 基线。它不是最终品牌规范，但应足够指导 `packages/ui` 的第一批组件实现。

## 2. Color tokens

### 2.1 Surface

| Token                    | Value                    | 用途              |
| ------------------------ | ------------------------ | ----------------- |
| `color.surface.app.from` | `#f8fafc`                | app 背景渐变起点  |
| `color.surface.app.mid`  | `#eef4ff`                | app 背景渐变中段  |
| `color.surface.app.to`   | `#f7f3ff`                | app 背景渐变终点  |
| `color.surface.panel`    | `rgba(255,255,255,0.88)` | 顶层应用面板      |
| `color.surface.card`     | `#ffffff`                | 卡片 / 内容容器   |
| `color.surface.subtle`   | `#f8fafc`                | 输入框 / 次级块   |
| `color.border.default`   | `#dbe3ef`                | 默认边框          |
| `color.border.subtle`    | `#e2e8f0`                | 分割线 / hairline |

### 2.2 Text

| Token                  | Value     | 用途                 |
| ---------------------- | --------- | -------------------- |
| `color.text.primary`   | `#0f172a` | 主标题 / 重要文本    |
| `color.text.secondary` | `#64748b` | 描述文本             |
| `color.text.tertiary`  | `#94a3b8` | placeholder / 弱提示 |
| `color.text.inverse`   | `#ffffff` | 深色背景上的文本     |

### 2.3 Brand & states

| Token                 | Value     | 用途                                |
| --------------------- | --------- | ----------------------------------- |
| `color.brand.blue`    | `#2563eb` | 主品牌色 / active                   |
| `color.brand.purple`  | `#7c3aed` | 品牌渐变终点                        |
| `color.state.success` | `#16a34a` | completed / accepted / healthy      |
| `color.state.warning` | `#d97706` | blocked / pending / needs attention |
| `color.state.danger`  | `#dc2626` | failed / destructive                |
| `color.state.info`    | `#2563eb` | running / selected / informative    |

状态色必须配合 icon 与 label，不允许只靠颜色表达状态。

## 3. Radius tokens

| Token            | Value  | 用途                             |
| ---------------- | ------ | -------------------------------- |
| `radius.control` | `10px` | 小按钮、badge、segmented control |
| `radius.button`  | `13px` | 主按钮                           |
| `radius.input`   | `14px` | 输入框                           |
| `radius.card`    | `18px` | 普通卡片                         |
| `radius.card-lg` | `22px` | handoff / artifact 卡片          |
| `radius.panel`   | `24px` | 大内容区域                       |
| `radius.app`     | `32px` | app shell 外层面板               |

## 4. Shadow tokens

| Token               | Value                                | 用途                    |
| ------------------- | ------------------------------------ | ----------------------- |
| `shadow.app`        | `0 14px 36px rgba(15, 23, 42, 0.10)` | app 外层容器            |
| `shadow.focus-card` | `0 14px 36px rgba(15, 23, 42, 0.10)` | New Run / 关键 composer |
| `shadow.none`       | `none`                               | 普通卡片，避免层级噪音  |

V1 原则：阴影只用于顶层容器和最重要的输入/接管区域。

## 5. Typography tokens

| Token                | Value                                                                                        | 用途                |
| -------------------- | -------------------------------------------------------------------------------------------- | ------------------- |
| `font.sans`          | `Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` | UI 文本             |
| `font.mono`          | `SFMono-Regular, Menlo, Monaco, Consolas, monospace`                                         | log、diff、id、path |
| `font.weight.normal` | `400`                                                                                        | 正文                |
| `font.weight.medium` | `600`                                                                                        | 次级强调            |
| `font.weight.bold`   | `760`                                                                                        | 标题 / 主动作       |

### Type scale

| Token       | Value  | 用途            |
| ----------- | ------ | --------------- |
| `text.xs`   | `12px` | metadata、badge |
| `text.sm`   | `13px` | 次级说明        |
| `text.base` | `14px` | 默认 UI 文本    |
| `text.md`   | `15px` | 导航 / 表单说明 |
| `text.lg`   | `17px` | 区块标题        |
| `text.xl`   | `22px` | 页面区块标题    |
| `text.2xl`  | `28px` | 页面标题        |
| `text.3xl`  | `34px` | hero / 首屏标题 |

## 6. Interaction state tokens

### 6.1 Pointer hover

鼠标悬停应有轻微“抬升”感，但不能让界面变得浮躁。

| Token                         | Value                                | 用途                               |
| ----------------------------- | ------------------------------------ | ---------------------------------- |
| `shadow.hover.control`        | `0 4px 10px rgba(15, 23, 42, 0.08)`  | 普通按钮 / 可点击卡片 hover        |
| `shadow.hover.card`           | `0 10px 24px rgba(15, 23, 42, 0.10)` | Handoff card / Artifact card hover |
| `transform.hover.raise`       | `translateY(-1px)`                   | 可点击卡片轻微上浮                 |
| `duration.interaction.fast`   | `120ms`                              | hover / press 过渡                 |
| `easing.interaction.standard` | `cubic-bezier(0.2, 0, 0, 1)`         | 默认交互曲线                       |

### 6.2 Keyboard focus

键盘 focus 不应只靠阴影表达，必须有可见 focus ring。

| Token                  | Value                               | 用途                                   |
| ---------------------- | ----------------------------------- | -------------------------------------- |
| `outline.focus.width`  | `2px`                               | focus ring 宽度                        |
| `outline.focus.color`  | `#2563eb`                           | focus ring 主色                        |
| `outline.focus.offset` | `2px`                               | 与控件边界间距                         |
| `shadow.focus.control` | `0 0 0 4px rgba(37, 99, 235, 0.16)` | focus ring 外层柔光，可与 outline 共用 |

### 6.3 Active / pressed

| Token                    | Value           | 用途                  |
| ------------------------ | --------------- | --------------------- |
| `transform.active.press` | `translateY(0)` | 按下时回落            |
| `shadow.active.control`  | `none`          | 按下时取消 hover 抬升 |

原则：hover 可以用阴影，focus 必须用 outline/ring；危险动作 focus ring 仍用品牌蓝，危险含义由按钮颜色、文案和确认弹窗表达。

## 7. Component-level tokens

### 7.1 Status badge

| Token   | 建议                        |
| ------- | --------------------------- |
| height  | `30px`                      |
| radius  | `10px`                      |
| padding | `0 18px`                    |
| content | icon + label；可选 metadata |

### 7.2 Handoff card

| Token           | 建议                                    |
| --------------- | --------------------------------------- |
| radius          | `22px`                                  |
| min height      | `150px`                                 |
| icon box        | `36px` square, `12px` radius            |
| required fields | source、reason、age、recommended action |

### 7.3 Artifact card

| Token           | 建议                                           |
| --------------- | ---------------------------------------------- |
| radius          | `18px`                                         |
| review state    | unreviewed / accepted / rejected / superseded  |
| required fields | title、kind、reviewState、verification summary |

### 7.4 Intervention composer

| Token            | 建议                                      |
| ---------------- | ----------------------------------------- |
| radius           | `20px`                                    |
| effect label     | applies now / applies next / records only |
| dangerous action | 二次确认；使用 danger 色但必须有明确文案  |

## 8. 实现建议

- 先在 `packages/ui` 建立 token 常量或 CSS variables，再做组件。
- Desktop/Web 共用 tokens；桌面端可以额外使用 native window chrome spacing。
- 不要把渐变和大阴影滥用到普通业务卡片，Cairn 要保持工程工具的克制感。

## 9. 变更历史

| 日期       | 变更                                                          |
| ---------- | ------------------------------------------------------------- |
| 2026-05-15 | 初版：从 V1 视觉参考抽取颜色、圆角、阴影、字体与组件级 tokens |
