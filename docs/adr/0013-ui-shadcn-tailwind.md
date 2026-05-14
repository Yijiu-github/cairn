# ADR-0013: UI 组件采用 shadcn/ui + Tailwind CSS

- **状态**：🟢 Accepted
- **日期**：2026-05-14
- **决策者**：项目主理
- **关联**：ADR-0001、ADR-0002、`packages/ui/`

---

## 背景

桌面 Renderer 与 Web Shell 共用 `packages/ui/`。UI 选型决定：

- 一个人 / 小团队能否在 6 个月内做出**有设计感**的界面
- 桌面专属交互（密集信息、键盘快捷键、可调分屏、虚拟化列表 / 树）是否容易做
- 长期可维护性、视觉差异化
- 桌面 + Web 一致性

候选：

- shadcn/ui + Tailwind
- Radix Primitives + 自建样式（vanilla-extract / panda CSS）
- Mantine
- Ant Design / arco-design
- Headless UI + Tailwind

## 决策

**采用 shadcn/ui（基于 Radix Primitives）+ Tailwind CSS 4.x，配合若干桌面专属重型组件库。**

具体地：

1. **基础组件**：从 shadcn/ui 复制源码到 `packages/ui/src/components/`，**完全可控**（不依赖远程包升级）
2. **底座**：Radix Primitives（shadcn 内置依赖）提供可访问性
3. **样式系统**：Tailwind CSS 4.x（CSS-first 配置）
4. **桌面专属组件**：
   - `react-resizable-panels`：分屏 / 可调面板
   - `@tanstack/react-table`：数据表
   - `@tanstack/react-virtual`：虚拟化大列表 / 树
   - `cmdk`：命令面板（⌘K）
   - 长任务时间线 / Trace 视图：**自建**（无现成最佳实践）
5. **图标**：`lucide-react`（与 shadcn 默认对齐，体积可摇树）
6. **主题与暗色模式**：Tailwind CSS variables + 单一 `data-theme` 切换
7. **动画**：Tailwind + `framer-motion`（仅在必要处，避免过度动画）

## 后果

### 好的

- shadcn 的"组件源码在你这里"特性 → 长期可控、深度定制零成本
- Radix Primitives 提供工业级可访问性（焦点、键盘、ARIA）
- Tailwind 4.x 在 2026 已稳定，CSS-first 配置降低工具链复杂度
- 桌面 + Web 一份 UI 代码、一份风格
- 与"开发者工具感"调性匹配（不像 Mantine / Ant Design 一眼库味）

### 坏的

- shadcn 升级靠手 diff（不是 npm 包）→ 需要建立"组件升级 issue"工作流
- 桌面专属组件（密集 tree / Trace 时间线）必须自建，工程量集中
- 初学 Tailwind 的开发者有上手成本

### 中性的

- 视觉系统设计（color tokens / spacing scale / typography）需要主设计师一次性确定，否则容易杂乱
- 国际化（多语言、RTL）后续需要单独 ADR 与组件审视

## 备选方案

- **Mantine**：放弃。组件多但**风格固定**，做出来一眼是 Mantine。
- **Ant Design / arco-design**：放弃。企业风强烈，与 local-first 开发者工具调性违和。
- **Radix Primitives + 自建样式**：放弃为默认。完全可控但工程量过大，不适合个人项目首发。
- **Headless UI + Tailwind**：放弃。Headless UI 维护节奏比 Radix 慢，组件覆盖少。
- **MUI / Joy UI**：放弃。MUI 偏 web 应用风，定制深度受限。

## 实施提示

### 包结构

```text
packages/ui/src/
├─ components/             # 从 shadcn 复制 + 自建
│  ├─ button.tsx
│  ├─ dialog.tsx
│  ├─ ...
│  └─ desktop/             # 桌面专属（resizable / cmdk wrapper / trace timeline）
├─ hooks/
├─ theme/
│  ├─ tokens.css           # CSS variables
│  └─ themes.css
├─ icons/                  # lucide 重导出 + 自建 logo
└─ index.ts
```

### Tailwind 4.x 关键配置

- 使用 CSS-first 配置（`@theme` directive）
- 不再使用 `tailwind.config.js`（v4 简化路径）
- 与 Vite 通过 `@tailwindcss/vite` 集成

```css
/* packages/ui/src/theme/tokens.css */
@import 'tailwindcss';

@theme {
  --color-brand-50: oklch(0.97 0.02 250);
  --color-brand-500: oklch(0.55 0.16 250);
  --color-brand-900: oklch(0.25 0.1 250);

  --font-display: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;

  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
}
```

### 暗色模式

- 通过 `<html data-theme="dark">` 切换
- 用户偏好：尊重 OS（`prefers-color-scheme`）+ 提供手动覆盖

### shadcn 升级流程

- 周期性 review shadcn/ui 上游变更
- 影响公共组件时开 issue + 人工 diff + PR
- 不允许在不通知的情况下直接覆盖（破坏可控性）

### 国际化预留

- 文案不硬编码进组件，统一通过 `t('key')` 获取
- i18n 框架（如 `i18next` / `lingui`）由独立 ADR 决定

### 命令面板（⌘K）

- 使用 `cmdk` 构建全局快捷指令入口
- 与桌面端 keyboard shortcut 接入

### 大数据列表

- TraceEvent 时间线、artifact 列表、task tree 都必须用 `@tanstack/react-virtual`，避免 DOM 节点爆炸

## 后续

- [ ] 提交 `packages/ui/` 初始 shadcn 组件清单（Button / Dialog / Dropdown / Tabs / Tooltip 等）
- [ ] 起草 design tokens（color / spacing / typography）
- [ ] 起草桌面专属组件（resizable panels / trace timeline）的接口
- [ ] 设计师介入后做一次完整视觉审视
- [ ] 国际化 ADR（独立）

## 变更历史

| 日期       | 变更 |
| ---------- | ---- |
| 2026-05-14 | 初版 |
