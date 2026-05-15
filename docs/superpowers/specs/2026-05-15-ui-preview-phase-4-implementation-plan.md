# Phase 4 Implementation Plan — Tokens and Theme Responsibility Cleanup

> 状态：🟡 Ready for implementation approval  
> 日期：2026-05-15  
> Parent spec：`docs/superpowers/specs/2026-05-15-ui-preview-systemization-design.md`  
> 前置阶段：Phase 1 commit `74aed20`，Phase 2 commit `8964484`，Phase 3 commit `2e4eff4`  
> 范围：`packages/ui/src/tokens` 与 `apps/ui-preview/src/styles.css` 的职责边界整理

## 1. Objective

Phase 4 的目标是明确共享 UI tokens 与 UI preview shell styles 的职责边界，降低后续视觉演进时的重复和漂移风险。

当前状态：

- `packages/ui/src/tokens/index.ts` 已有 radii、space、motion、status tone 等基础 token，但尚未覆盖 Cairn preview 中反复出现的 app shell 视觉语义。
- `apps/ui-preview/src/styles.css` 维护了一组 `--preview-*` CSS variables，其中一部分是 preview app shell 专属；另一部分是可复用的 semantic surface / text / border / accent / shadow / radius 等视觉语义。
- 当前没有 consumer 使用 `@cairn/ui` tokens，Phase 4 可以安全小步扩展 tokens，而不需要做大规模迁移。

本阶段要做的是：把可复用视觉语义收进 `packages/ui/src/tokens`，同时保留 preview shell 专属变量在 `styles.css`，不做主题系统重建。

## 2. Non-goals

- 不引入 Tailwind。
- 不引入 theme provider。
- 不改组件 className 架构。
- 不把所有 CSS 重写为 token-driven。
- 不做视觉 redesign。
- 不修改页面布局。
- 不重构 primitives / feedback / data-display 组件。
- 不要求 preview app 在 runtime 从 JS token 自动注入 CSS variables。

## 3. Responsibility boundary

### 3.1 Shared tokens: `packages/ui/src/tokens`

共享 tokens 应描述可跨 app / package 复用的基础和语义值：

- Radius scale：已有 `cairnRadii`。
- Spacing scale：已有 `cairnSpace`。
- Motion durations/easing：已有 `cairnMotion`。
- Status tone mapping：已有 `cairnStatusTone`。
- 新增 semantic color tokens：surface、border、text、accent、code 等。
- 新增 elevation tokens：preview/card shadow 等可复用层级。
- 新增 optional CSS variable map：用于把 JS token 明确映射成 CSS custom properties，方便 preview shell 或未来 app 引用。

### 3.2 Preview shell styles: `apps/ui-preview/src/styles.css`

Preview shell 应保留只服务 demo app frame 的变量和样式：

- `--preview-bg`
- `--preview-radius-lg/md/sm` 如果它们是 app shell large panel radius，而非 shared component radius。
- `--preview-gap`
- `.preview-shell`
- `.hero`
- `.preview-nav*`
- page layout classes：`.home-layout`、`.run-detail-layout`、`.artifact-review-layout` 等。
- demo-only selectors：`.artifact-code-block`、`.filter-pill` 等。

## 4. Target token shape

在 `packages/ui/src/tokens/index.ts` 小步新增：

```ts
export const cairnColors = {
  surface: {
    canvas: '#eef3f8',
    panel: '#ffffff',
    muted: '#f8fafc',
    inverse: '#0f172a',
  },
  border: {
    subtle: '#dbe5f0',
    strong: '#cbd5e1',
  },
  text: {
    primary: '#0f172a',
    muted: '#64748b',
    subtle: '#475569',
    inverse: '#ffffff',
  },
  accent: {
    blue: '#2563eb',
    blueSoft: '#dbeafe',
    blueStrong: '#1d4ed8',
  },
  code: {
    background: '#0f172a',
    foreground: '#dbeafe',
  },
} as const;

export const cairnElevation = {
  panel: '0 24px 70px rgb(15 23 42 / 8%)',
  navItem: '0 10px 24px rgb(15 23 42 / 14%)',
} as const;
```

再新增可选 CSS variable map：

```ts
export const cairnCssVariables = {
  '--cairn-color-surface-canvas': cairnColors.surface.canvas,
  '--cairn-color-surface-panel': cairnColors.surface.panel,
  ...
} as const;
```

说明：

- 本阶段只导出 token 对象，不做 runtime injection。
- 命名使用 `cairn*`，保持已有 token 风格。
- CSS variable prefix 用 `--cairn-*`，避免与 `--preview-*` 混淆。

## 5. Preview CSS migration

在 `apps/ui-preview/src/styles.css` 中做轻量迁移：

1. 在 `:root` 中新增 shared semantic CSS variables：

```css
--cairn-color-surface-canvas: #eef3f8;
--cairn-color-surface-panel: #ffffff;
--cairn-color-surface-muted: #f8fafc;
--cairn-color-border-subtle: #dbe5f0;
--cairn-color-border-strong: #cbd5e1;
--cairn-color-text-primary: #0f172a;
--cairn-color-text-muted: #64748b;
--cairn-color-text-subtle: #475569;
--cairn-color-accent-blue: #2563eb;
--cairn-color-accent-blue-soft: #dbeafe;
--cairn-color-accent-blue-strong: #1d4ed8;
--cairn-color-code-background: #0f172a;
--cairn-color-code-foreground: #dbeafe;
--cairn-elevation-panel: 0 24px 70px rgb(15 23 42 / 8%);
--cairn-elevation-nav-item: 0 10px 24px rgb(15 23 42 / 14%);
```

2. 将 `--preview-*` 变量改为 alias 到 `--cairn-*`，保留现有 selector 代码可读性：

```css
--preview-surface: var(--cairn-color-surface-panel);
--preview-border: var(--cairn-color-border-subtle);
--preview-text: var(--cairn-color-text-primary);
```

3. 将 hard-coded repeated values 替换为 semantic variables：

- `#0f172a` → `var(--preview-text)` 或 `var(--cairn-color-code-background)`，视语义而定。
- `#dbeafe` → `var(--preview-blue-soft)` 或 `var(--cairn-color-code-foreground)`，视语义而定。
- `#ffffff` → `var(--preview-surface)` 或 `var(--cairn-color-text-inverse)`，视语义而定。
- `#1d4ed8` → `var(--cairn-color-accent-blue-strong)`。
- nav item shadow → `var(--cairn-elevation-nav-item)`。

4. 保留 preview-only variables：

- `--preview-radius-lg/md/sm`
- `--preview-gap`
- `--preview-bg` 可以保留为 alias，因它既是 app canvas，也用于 gradient。

## 6. Visual behavior constraint

Phase 4 应是 visual no-op：

- 页面布局不变。
- 色值不变。
- shadow 不变。
- radius 不变。
- CSS class names 不变。

允许的变化仅是 token/source-of-truth 更清楚。

## 7. Implementation order

1. 修改 `packages/ui/src/tokens/index.ts`：新增 `cairnColors`、`cairnElevation`、`cairnCssVariables`。
2. 跑 `pnpm --filter @cairn/ui typecheck`。
3. 跑 `pnpm --filter @cairn/ui lint`。
4. 修改 `apps/ui-preview/src/styles.css`：
   - 增加 `--cairn-*` variables。
   - 将 `--preview-*` alias 到 `--cairn-*`。
   - 替换明显重复 hard-coded values。
5. 跑 `pnpm --filter @cairn/ui-preview lint`。
6. 跑 `pnpm --filter @cairn/ui-preview build`。
7. 如可行，用 browser 打开 preview 做一张截图或至少 build artifact 验证。
8. 跑完整验证：
   - `pnpm --filter @cairn/ui typecheck`
   - `pnpm --filter @cairn/ui lint`
   - `pnpm --filter @cairn/ui-preview typecheck`
   - `pnpm --filter @cairn/ui-preview lint`
   - `pnpm --filter @cairn/ui-preview build`
9. `git diff --check`。
10. 检查 diff 范围：只应涉及 `packages/ui/src/tokens/index.ts` 和 `apps/ui-preview/src/styles.css`。
11. 提交 Phase 4 实现 commit。

## 8. Acceptance criteria

Phase 4 完成后应满足：

- `packages/ui/src/tokens/index.ts` 导出 semantic color/elevation tokens。
- `apps/ui-preview/src/styles.css` 明确区分 `--cairn-*` shared semantics 与 `--preview-*` app-shell aliases。
- Preview CSS 中主要复用色值不再散落为无语义 hard-coded hex。
- 视觉应保持不变或近似完全一致。
- 不引入 theme provider / runtime injection。
- 不影响 `@cairn/ui` public component API。
- `@cairn/ui` 与 `@cairn/ui-preview` 验证通过。

## 9. Risks and mitigations

### Risk: JS tokens 与 CSS variables 手动重复，未来可能漂移

缓解：本阶段接受轻量重复，因为当前没有 build-time token pipeline；通过相同命名和 plan 文档明确 source-of-truth。若未来需要，可另起阶段生成 CSS variables。

### Risk: 替换 CSS 值时误改视觉语义

缓解：只替换一眼等价的色值/阴影；布局、尺寸和 radius 不做大规模调整。

### Risk: token surface 一次性膨胀太大

缓解：只新增 preview 已经使用且跨组件/页面有复用价值的 semantic tokens，不加入未使用 token。

## 10. Out of scope

- 自动生成 CSS variables。
- 深色模式。
- 多主题支持。
- Tailwind/theme provider。
- 重构 component internals 使用 tokens。
- 修改 primitives accessibility。
- 改 preview visual design。

## 11. Self-review

- Placeholder scan：无未完成占位或待补项。
- Scope check：本阶段足够小，限定 tokens + preview CSS。
- Consistency check：保留 `--preview-*` shell aliases，同时新增 `--cairn-*` shared semantics，与 parent spec 一致。
- Ambiguity check：明确本阶段不做 runtime injection，只导出 JS token 和手动 CSS variables。
