# Phase 5 Implementation Plan — Primitives Accessibility Hardening

> 状态：🟡 Ready for implementation approval
> 日期：2026-05-15
> Parent spec：`docs/superpowers/specs/2026-05-15-ui-preview-systemization-design.md`
> 前置阶段：Phase 1 commit `74aed20`，Phase 2 commit `8964484`，Phase 3 commit `2e4eff4`，Phase 4 commit `2359bdd`
> 范围：`packages/ui/src/primitives/tabs.tsx`、`packages/ui/src/primitives/dialog.tsx` 及必要 preview 调用方验证

## 1. Objective

Phase 5 的目标是强化 `Tabs` 与 `Dialog` primitives 的可访问性基础，同时尽量保持现有 API 和视觉行为稳定。

当前状态：

- `TabsList` 已有 `role="tablist"`。
- `TabsTrigger` 已有 `role="tab"` 和 `aria-selected`。
- `TabsContent` 已有 `role="tabpanel"`，但缺少 trigger/panel id linkage。
- `Tabs` 是受控 value，但没有统一 `onValueChange`；现有调用方通过 `TabsTrigger onClick` 自行更新 state。
- `DialogPanel` 已有 `role="dialog"`、`aria-labelledby`、`aria-describedby`。
- `Dialog` 打开时没有 `aria-modal`、Escape 关闭、backdrop close 或初步 focus management。

本阶段要补齐常见 a11y 语义和键盘交互，但避免引入大型 focus-trap 或 breaking API。

## 2. Non-goals

- 不引入 Radix / Headless UI 等第三方库。
- 不实现完整 focus trap。
- 不实现 portal。
- 不重写 Dialog 架构。
- 不改视觉样式。
- 不改变 preview 页面内容。
- 不要求所有 Tabs 调用方立刻切到新 controlled API，但新 API 应可用。

## 3. Tabs target behavior

### 3.1 API extension

扩展 `TabsProps`：

```ts
export interface TabsProps extends HTMLAttributes<HTMLDivElement> {
  readonly onValueChange?: (value: string) => void;
  readonly value: string;
}
```

扩展 context：

```ts
interface TabsContextValue {
  readonly baseId: string;
  readonly onValueChange?: (value: string) => void;
  readonly value: string;
}
```

使用 `useId()` 为同一个 Tabs instance 生成稳定 base id。

### 3.2 Trigger/panel linkage

为每个 trigger/content 根据 `baseId` + sanitized `value` 生成：

- trigger id：`${baseId}-trigger-${safeValue}`
- panel id：`${baseId}-panel-${safeValue}`

`TabsTrigger` 设置：

- `id={triggerId}`，除非调用方显式传 id。
- `aria-controls={panelId}`，除非调用方显式传 aria-controls。
- `aria-selected={selected}`。
- `tabIndex={selected ? 0 : -1}`，除非调用方显式传 tabIndex。
- `data-state="active" | "inactive"`。
- click 时先调用原 `onClick`，若未 `defaultPrevented`，调用 `onValueChange?.(value)`。

`TabsContent` 设置：

- `id={panelId}`，除非调用方显式传 id。
- `aria-labelledby={triggerId}`，除非调用方显式传 aria-labelledby。
- `role="tabpanel"`。

当前 `TabsContent` 对非 active panel 直接 `return null`。本阶段保留这个行为，避免改变页面 DOM/布局。

### 3.3 Keyboard navigation

在 `TabsList` 中支持 roving focus：

- ArrowRight / ArrowDown：聚焦下一个 enabled tab。
- ArrowLeft / ArrowUp：聚焦上一个 enabled tab。
- Home：聚焦第一个 enabled tab。
- End：聚焦最后一个 enabled tab。

实现方式：

- `TabsList` 添加 `onKeyDown`。
- 从 `event.currentTarget.querySelectorAll<HTMLElement>('[role="tab"]')` 收集 tabs。
- 跳过 `aria-disabled="true"` 和 `disabled` 的 tab。
- 只做 focus，不自动 select。理由：当前组件是受控 value，且调用方可能希望 click/Enter/Space 才改变 selection；这比自动 select 更保守。
- 保留调用方传入的 `onKeyDown`，若调用方 `preventDefault()` 则不执行内置逻辑。

## 4. Dialog target behavior

### 4.1 API extension

扩展 `DialogProps`：

```ts
export interface DialogProps extends HTMLAttributes<HTMLDivElement> {
  readonly children: ReactNode;
  readonly closeOnBackdrop?: boolean;
  readonly closeOnEscape?: boolean;
  readonly initialFocusRef?: RefObject<HTMLElement>;
  readonly onOpenChange?: (open: boolean) => void;
  readonly open: boolean;
}
```

默认：

- `closeOnBackdrop = true`
- `closeOnEscape = true`

兼容性：不要求现有调用方传 `onOpenChange`。若没有传，Escape/backdrop 不会改变外部 state，但也不会报错。

### 4.2 aria-modal

`DialogPanel` 增加：

- `aria-modal="true"`
- 保留 `role="dialog"`
- 保留 `aria-labelledby` / `aria-describedby`

### 4.3 Escape close

`Dialog` root overlay 添加 `onKeyDown`：

- 先调用调用方 `onKeyDown`。
- 若 event 已被 preventDefault，停止。
- 当 `event.key === 'Escape' && closeOnEscape` 时：
  - `event.stopPropagation()`
  - `onOpenChange?.(false)`

### 4.4 Backdrop close

`Dialog` root overlay 添加 `onMouseDown`：

- 先调用调用方 `onMouseDown`。
- 若 event 已被 preventDefault，停止。
- 当 `event.target === event.currentTarget && closeOnBackdrop` 时：
  - `onOpenChange?.(false)`

注意：使用 `onMouseDown` 而不是 `onClick` 可以避免 panel 内部点击冒泡误触。

### 4.5 Initial focus

在 `Dialog` open 后做轻量 focus management：

- 若传入 `initialFocusRef.current`，focus 它。
- 否则尝试在 overlay 内找第一个可聚焦元素：button、input、select、textarea、a[href]、[tabindex]:not([tabindex="-1"])。
- 若找不到，focus overlay 本身。
- overlay 设置 `tabIndex={-1}`，除非调用方显式传 tabIndex。

不做完整 focus trap；这留给后续阶段。

## 5. ProtectedActionDialog integration

`ProtectedActionDialog` 当前调用 `<Dialog open={open}>`，并在 footer 中已有 onCancel / onApprove / onDeny。

Phase 5 可小步增强：

```tsx
<Dialog
  onOpenChange={(nextOpen) => {
    if (!nextOpen) {
      onCancel();
    }
  }}
  open={open}
>
```

这样 Escape/backdrop 会走现有 cancel path。

不改变 approve/deny 行为。

## 6. Preview call site migration

当前 preview 中有两个 Tabs 调用：

- `ArtifactReviewContextSection`：已有 `reviewTab` state 和 trigger `onClick`。
- `GalleryFeedbackSection`：固定 `value="empty"`，无 state。

计划：

- `ArtifactReviewContextSection` 改为 `<Tabs onValueChange={onReviewTabChange} value={reviewTab}>`，去掉 trigger 上重复的 `onClick`。
- `GalleryFeedbackSection` 保持固定 value，不传 `onValueChange`；它仍可展示静态组件状态。

Dialog preview：

- `GalleryHiddenDialog` 使用 `open={false}`，不需要迁移。
- 页面级 `ProtectedActionDialog` 通过 package component 自动获得 Escape/backdrop cancel。

## 7. Implementation order

1. 修改 `packages/ui/src/primitives/tabs.tsx`：
   - context 增加 `baseId` / `onValueChange`。
   - `Tabs` 使用 `useId()`。
   - `TabsList` 增加 keyboard roving focus。
   - `TabsTrigger` 增加 id / aria-controls / tabIndex / data-state / onClick bridge。
   - `TabsContent` 增加 id / aria-labelledby。
2. 跑 `pnpm --filter @cairn/ui typecheck`。
3. 跑 `pnpm --filter @cairn/ui lint`。
4. 修改 `packages/ui/src/primitives/dialog.tsx`：
   - 扩展 props。
   - overlay 增加 Escape/backdrop close。
   - open 后初步 focus。
   - `DialogPanel` 增加 `aria-modal="true"`。
5. 修改 `packages/ui/src/cairn/protected-action-dialog.tsx`：
   - 传 `onOpenChange`，false 时调用 `onCancel`。
6. 跑 `pnpm --filter @cairn/ui typecheck` / `lint`。
7. 修改 `apps/ui-preview/src/preview-sections/artifact-review-sections.tsx`：
   - `Tabs` 传 `onValueChange={onReviewTabChange}`。
   - 删除 trigger `onClick` handlers。
8. 跑 `pnpm --filter @cairn/ui-preview typecheck` / `lint` / `build`。
9. 跑完整验证：
   - `pnpm --filter @cairn/ui typecheck`
   - `pnpm --filter @cairn/ui lint`
   - `pnpm --filter @cairn/ui-preview typecheck`
   - `pnpm --filter @cairn/ui-preview lint`
   - `pnpm --filter @cairn/ui-preview build`
10. `git diff --check`。
11. 检查 diff 范围：只应涉及 primitives、ProtectedActionDialog 和必要 preview call site。
12. 提交 Phase 5 实现 commit。

## 8. Acceptance criteria

Phase 5 完成后应满足：

- Tabs trigger 与 active panel 有 id / aria-controls / aria-labelledby linkage。
- Tabs trigger 有 roving tabIndex。
- TabsList 支持 Arrow/Home/End 聚焦 tab。
- Tabs 支持 optional `onValueChange`，且旧的 trigger `onClick` 调用方式仍兼容。
- DialogPanel 有 `aria-modal="true"`。
- Dialog 支持 optional Escape / backdrop close。
- Dialog 打开后有初步 focus target。
- ProtectedActionDialog 的 Escape/backdrop close 会走 `onCancel`。
- Preview 中 Artifact Review tabs 使用 `onValueChange`，不再重复 trigger onClick wiring。
- `@cairn/ui` 与 `@cairn/ui-preview` 验证通过。

## 9. Risks and mitigations

### Risk: Dialog focus effect 在 SSR 或测试环境中访问 DOM

缓解：focus logic 放在 `useEffect` 中，且检查 element/ref 是否存在。当前项目为 Vite client preview，风险低。

### Risk: Backdrop close 改变 protected action dialog 行为

缓解：只在 `onOpenChange` false 时调用现有 `onCancel`；用户仍可通过 `closeOnBackdrop={false}` 禁用，如后续有更严格审批需求可在 ProtectedActionDialog 中关闭。

### Risk: Tabs keyboard navigation 与调用方自定义 onKeyDown 冲突

缓解：先调用用户 handler；若 `event.defaultPrevented`，内置 navigation 不执行。

### Risk: `useId()` 生成的 id 包含冒号

缓解：React `useId()` 生成值可用于 HTML id；只需对 tab value 做简单 non-word 替换，避免 value 中斜杠/空格进入 id。

## 10. Out of scope

- 完整 focus trap。
- Portal rendering。
- aria-hidden/inert background management。
- Automated a11y tests。
- Visual redesign。
- Removing old TabsTrigger `onClick` compatibility。

## 11. Self-review

- Placeholder scan：无未完成占位或待补项。
- Scope check：聚焦 Tabs/Dialog primitives 和必要调用方，不碰其他组件。
- Consistency check：增强 API 都是 optional，符合“不破坏现有 preview”的阶段目标。
- Ambiguity check：明确 Tabs 键盘行为只 focus 不 auto-select，Dialog close 行为默认开启但依赖 optional `onOpenChange` 才改变 state。
