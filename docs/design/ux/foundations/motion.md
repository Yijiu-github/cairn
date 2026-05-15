# Motion

> 状态：🟡 Draft
> 最后更新：2026-05-15
> 范围：Cairn Desktop/Web 动效原则、时长、缓动与 reduce motion 策略。

---

## 1. 原则

Cairn 的动效服务于工程控制台体验：帮助理解状态变化，不制造娱乐化反馈。

- Calm：轻，不抢注意力。
- Informative：用于解释状态、层级和因果。
- Fast：高频操作不拖慢节奏。
- Respectful：遵守 `prefers-reduced-motion`。

## 2. 时长

| 类型                  | 时长                                 |
| --------------------- | ------------------------------------ |
| hover / press         | 120ms                                |
| focus ring            | 0-80ms                               |
| small surface enter   | 160ms                                |
| dialog / command menu | 180ms                                |
| route transition      | 200ms                                |
| progress shimmer      | 1200ms loop，可被 reduce motion 禁用 |

## 3. 缓动

| Token             | 用途                        |
| ----------------- | --------------------------- |
| `ease.standard`   | 普通 opacity / background   |
| `ease.emphasized` | dialog / command menu enter |
| `ease.exit`       | surface exit                |

建议值：

```text
ease.standard = cubic-bezier(0.2, 0, 0, 1)
ease.emphasized = cubic-bezier(0.2, 0.8, 0.2, 1)
ease.exit = cubic-bezier(0.4, 0, 1, 1)
```

## 4. 组件动效规则

| 组件         | 规则                                                     |
| ------------ | -------------------------------------------------------- |
| Card         | hover 可上浮 1-2px，focus 不上浮，只显示 ring            |
| Button       | press 使用轻微 scale 或背景变化，不使用弹跳              |
| Dialog       | opacity + scale 0.98 → 1，reduce motion 下只保留 opacity |
| Command menu | opacity + translateY 4px，reduce motion 下禁用位移       |
| Toast        | 从右下轻入；失败 toast 不应太快消失                      |
| Progress     | 不确定进度可用 shimmer，reduce motion 下改为静态条纹     |

## 5. 禁止项

- 禁止彩带、爆炸、游戏化奖励动效。
- 禁止关键错误自动滑走且不可追溯。
- 禁止仅靠动效表达状态变化。
- 禁止影响阅读的循环动画。
