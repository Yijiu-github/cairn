# UX Design

存放与界面、信息架构、关键流程相关的设计文档。

## 文件（计划）

| 文件                                 | 作用                                           | 状态     |
| ------------------------------------ | ---------------------------------------------- | -------- |
| `information-architecture.md`        | 导航结构、页面层级、URL/路由                   | 🟡 Draft |
| `screen-inventory.md`                | 屏幕清单 + 每屏责任 + 桌面/Web 差异            | 🟡 Draft |
| `key-flows.md`                       | 关键流程（新建 run、接管、回放、retry、rerun） | 🟡 Draft |
| `desktop-wireframes.md`              | 桌面端低保真线框稿                             | 🟡 Draft |
| `design-system-notes.md`             | R1 设计系统基线、状态色、组件清单              | 🟡 Draft |
| `component-mapping.md`               | UX 页面/组件到工程边界与契约草案               | 🟡 Draft |
| `research-and-optimization-notes.md` | 竞品/实践调研、设计优化方向与回填清单          | 🟡 Draft |
| `visual-reference-v1.md`             | UI 第一版视觉参考图与视觉规则                  | 🟡 Draft |

## 与其他目录的关系

- 输入：`../../product/target-users-and-scenarios.md`、`../设计文档V0.1.0.md`
- 输出：影响 `packages/ui/` 的组件层和 `apps/desktop` / `apps/web` 的页面结构

## 设计稿

当前仓库内先落低保真文字线框稿：[`desktop-wireframes.md`](desktop-wireframes.md)。后续 Figma / Sketch 高保真稿应引用这些文档作为信息结构基线。

可预览 SVG 放在 [`design-assets/`](design-assets/)：Home / Inbox、Run Detail、First Launch、Runtime Status。

不要把大尺寸位图直接提交到仓库；如确需提交轻量 SVG / Mermaid / PNG，请放入 `design-assets/` 并在对应文档中说明来源与用途。
