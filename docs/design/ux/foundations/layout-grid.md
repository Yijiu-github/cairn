# Layout Grid

> 状态：🟡 Draft
> 最后更新：2026-05-15
> 范围：Cairn Desktop/Web 布局、间距、断点与密度规则。

---

## 1. 布局模型

Cairn 采用工程控制台布局：左侧导航、中心工作区、右侧 inspector。Desktop 与 Web 共享语义，但 Desktop 可以拥有更强的本地上下文入口。

```text
┌────────────┬──────────────────────────────┬──────────────────┐
│ Sidebar    │ Main Workspace                │ Inspector        │
│ 240-280px  │ fluid                         │ 320-420px        │
└────────────┴──────────────────────────────┴──────────────────┘
```

## 2. 断点

| 名称      | 宽度         | 策略                                |
| --------- | ------------ | ----------------------------------- |
| `compact` | `< 960px`    | Sidebar 折叠，Inspector 变为 drawer |
| `default` | `960-1439px` | Sidebar + Main，Inspector 按需打开  |
| `wide`    | `>= 1440px`  | Sidebar + Main + Inspector 常驻     |

## 3. 尺寸建议

| 区域             | 建议                                          |
| ---------------- | --------------------------------------------- |
| Sidebar          | 240px 默认，最大 280px                        |
| Inspector        | 360px 默认，范围 320-420px                    |
| 主内容 max width | 文档/设置类页面 1080px；运行详情可 full width |
| 页面 padding     | 24px default，32px wide                       |
| 卡片间距         | 16px default，20px wide                       |

## 4. 间距刻度

使用 4px 基础网格：

```text
space.1 = 4px
space.2 = 8px
space.3 = 12px
space.4 = 16px
space.5 = 20px
space.6 = 24px
space.8 = 32px
space.10 = 40px
space.12 = 48px
```

## 5. 密度

Cairn 默认密度为 comfortable，未来可支持 compact。

| 密度        | 用途                                |
| ----------- | ----------------------------------- |
| comfortable | 默认，适合长时间阅读与审阅          |
| compact     | Run List / Task Explorer 等密集表格 |

## 6. 滚动策略

- Sidebar 独立滚动。
- Main Workspace 独立滚动。
- Inspector 独立滚动，顶部标题和关键动作 sticky。
- Dialog 内部滚动不能让页面背景滚动。

## 7. 可调整区域

- Inspector 宽度可拖拽，范围 320-520px。
- Task Tree 与 Artifact Preview 可使用 resizable panels。
- 调整后的布局偏好按 workspace 保存。
