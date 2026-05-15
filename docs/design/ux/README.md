# UX Design

> 状态：🟡 Draft
> 最后更新：2026-05-15
> 范围：Cairn Desktop/Web 共享 UX、视觉方向、组件规格与设计资产。

---

## 目录结构

| 目录                           | 作用                                                                      |
| ------------------------------ | ------------------------------------------------------------------------- |
| [`foundations/`](foundations/) | 设计原则、信息架构、tokens、i18n、调研笔记                                |
| [`screens/`](screens/)         | 页面清单、线框图、V1 视觉参考                                             |
| [`flows/`](flows/)             | 关键流程、页面交互、细节主题                                              |
| [`components/`](components/)   | 常用组件、组件状态、空错态、实现映射                                      |
| [`assets/`](assets/)           | SVG 设计资产，按 wireframes / visual-v1 / components / detail-themes 分类 |

## 推荐阅读顺序

1. [`foundations/research-and-optimization-notes.md`](foundations/research-and-optimization-notes.md)
2. [`foundations/information-architecture.md`](foundations/information-architecture.md)
3. [`screens/screen-inventory.md`](screens/screen-inventory.md)
4. [`screens/visual-reference-v1.md`](screens/visual-reference-v1.md)
5. [`components/common-components-v1.md`](components/common-components-v1.md)
6. [`components/component-state-specs-v1.md`](components/component-state-specs-v1.md)
7. [`flows/detail-themes-v1.md`](flows/detail-themes-v1.md)
8. [`foundations/layout-grid.md`](foundations/layout-grid.md)
9. [`foundations/motion.md`](foundations/motion.md)
10. [`foundations/accessibility.md`](foundations/accessibility.md)

## 设计原则摘要

- Cairn 是本地优先的工程任务控制台，不是聊天工具。
- 默认语言为 `zh-CN`，支持 `en-US` 切换。
- 用户可见文案必须走 i18n key。
- 状态不能只靠颜色表达，必须有 icon + label。
- Hover 和 keyboard focus 分离：hover 可轻微阴影/上浮，focus 必须有 focus ring。
- 危险动作必须明确影响范围，并使用二次确认。
- SVG 是仓库内版本化设计资产；PNG 仅用于预览，不提交。

## 资产来源

详见 [`assets/README.md`](assets/README.md)。当前 V1 视觉参考均为手写 SVG，未使用 image2。
