# Accessibility

> 状态：🟡 Draft
> 最后更新：2026-05-15
> 范围：Cairn Desktop/Web 共享可访问性规则。

---

## 1. 目标

Cairn 面向开发者高频使用，不能只追求“看起来像控制台”。界面必须支持键盘、读屏、弱视、色弱和 reduce motion 用户。

## 2. 基线要求

| 主题   | 要求                                                          |
| ------ | ------------------------------------------------------------- |
| 键盘   | 所有可点击元素必须可通过键盘到达和触发                        |
| 焦点   | `:focus-visible` 必须有清晰 focus ring，不能只靠阴影          |
| 颜色   | 状态不能只靠颜色表达，必须有 icon + label                     |
| 对比度 | 正文和关键状态至少满足 WCAG AA 对比度                         |
| 动效   | 支持 `prefers-reduced-motion` 降低非必要动效                  |
| 语义   | Button、Dialog、Tabs、Toast 等使用原生语义或 Radix primitives |

## 3. 焦点规则

- Hover 和 focus 分离。
- Hover：轻微背景、阴影或位移。
- Focus：统一 ring，建议 `2px` outline + `2px` offset。
- 危险 dialog 打开时，默认 focus 放在“返回/取消”，不是危险主按钮。

## 4. 键盘规则

| 组件         | 键盘行为                                             |
| ------------ | ---------------------------------------------------- |
| Command menu | `⌘K` / `Ctrl+K` 打开，↑/↓ 选择，Enter 执行，Esc 关闭 |
| Dialog       | Tab 循环在弹窗内，Esc 关闭；危险动作需要二次确认     |
| Tabs         | ←/→ 切换，Home/End 到首尾项                          |
| Table        | 行级操作不能只在 hover 出现，focus 时也必须出现      |
| Toast        | 不抢焦点，操作型 toast 的 action 可键盘到达          |

## 5. 状态表达

状态组件必须同时包含：

- icon
- label
- optional metadata

示例：

```text
✓ 已完成 · 3 个产物
! 已阻塞 · 等待批准文件写入
× 失败 · 执行层错误
```

## 6. 内容规则

- 空状态要给下一步，不只写“暂无数据”。
- 错误状态要写明错误层级：orchestration / task / execution / artifact / runtime。
- 危险动作按钮必须写具体影响，如“取消运行”，不能写“确认”。
- 诊断导出必须提示本地路径和文件名可能包含个人信息。

## 7. 验收清单

- [ ] 纯键盘可完成核心流程。
- [ ] 焦点顺序符合视觉顺序。
- [ ] 所有 icon-only button 有 accessible label。
- [ ] 状态不只靠颜色。
- [ ] Dialog 有标题和描述。
- [ ] Form error 关联到字段。
- [ ] reduce motion 下无大幅位移或循环动效。
