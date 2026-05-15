# Phase 3 Implementation Plan — Sensitive Path and Artifact Safety API

> 状态：🟡 Ready for implementation approval  
> 日期：2026-05-15  
> Parent spec：`docs/superpowers/specs/2026-05-15-ui-preview-systemization-design.md`  
> 前置阶段：Phase 1 commit `74aed20`，Phase 2 commit `8964484`  
> 范围：`packages/ui/src/cairn` 的 artifact/path safety API + `apps/ui-preview/src` 调用方迁移

## 1. Objective

Phase 3 的目标是把“本地路径默认隐藏 / 敏感产物明确提示”从 preview 页面自觉上移到共享 UI 组件 API。

当前 `ArtifactCard` 的行为是：只要传入 `path`，就直接显示路径；若传入 `sensitive`，只显示一个通用“可能包含敏感信息” badge。这个行为对原型够用，但长期容易让调用方无意中展示本地绝对路径、用户名、项目结构或诊断文件名。

Phase 3 要让 `ArtifactCard` 默认不展示路径，只有调用方明确 opt-in 时才显示相对路径或完整路径；同时保留兼容性，避免破坏已有 preview 调用方。

## 2. Constraints

- 可以修改 `packages/ui/src/cairn` 的组件 API，但必须小步兼容。
- 可以迁移 `apps/ui-preview/src` 的调用方。
- 不连接 backend。
- 不接 `workspace-core`。
- 不实现真实 secret/token redaction 引擎。
- 不改变 tokens / theme。
- 不做视觉 redesign。
- 不引入第三方 UI 或安全库。
- 不重构 unrelated components。
- 尽量保持现有页面布局不变；行为变化聚焦在 path visibility 与 sensitivity copy。

## 3. Target API

### 3.1 Shared types

在 `packages/ui/src/cairn/types.ts` 新增：

```ts
export type CairnArtifactPathDisplayMode = 'hidden' | 'relative' | 'full';
export type CairnArtifactSensitivity = 'none' | 'local_path' | 'secret_risk';
```

说明：

- `hidden`：默认模式，不展示 path 值，只显示 redaction / hidden label。
- `relative`：显示调用方传入的路径，语义上表示相对路径或已处理路径。
- `full`：显示调用方传入的完整路径，必须伴随明确 sensitivity 提示。
- `none`：无特殊敏感风险。
- `local_path`：路径可能暴露用户名、机器名、私有目录结构。
- `secret_risk`：产物可能涉及 token、secret、环境变量或日志敏感内容。

### 3.2 ArtifactCard props

扩展 `ArtifactCardProps`：

```ts
export interface ArtifactCardProps extends HTMLAttributes<HTMLDivElement> {
  readonly path?: string;
  readonly pathDisplayMode?: CairnArtifactPathDisplayMode;
  readonly sensitivity?: CairnArtifactSensitivity;
  readonly redactionLabel?: string;
  readonly sensitive?: boolean; // compatibility bridge
}
```

默认行为：

- `pathDisplayMode` 默认 `'hidden'`。
- `sensitivity` 默认：
  - 如果显式传入 `sensitivity`，使用该值。
  - 否则如果 legacy `sensitive === true`，映射为 `'secret_risk'`。
  - 否则为 `'none'`。
- `redactionLabel` 默认 `'路径已隐藏'`。
- `pathDisplayMode='hidden'` 且存在 `path` 时，不显示真实 path，显示 `redactionLabel`。
- `pathDisplayMode='relative' | 'full'` 且存在 `path` 时，显示真实 path。
- `pathDisplayMode='full'` 时，即使 `sensitivity='none'`，也显示一个 warning badge 或路径风险提示，避免完整路径被当作普通文本。

### 3.3 Sensitivity labels

建议标签：

```ts
const sensitivityLabel = {
  local_path: '本地路径风险',
  secret_risk: '可能包含敏感信息',
};
```

显示规则：

- `sensitivity='none'`：不显示 sensitivity badge。
- `sensitivity='local_path'`：显示 warning badge。
- `sensitivity='secret_risk'`：显示 danger 或 warning badge；本阶段建议 warning，避免视觉冲击过大。
- `pathDisplayMode='full'`：显示额外 warning label，例如 `完整路径已显示`。

## 4. DiagnosticExportPanel adjustment

当前 `DiagnosticExportPanel` 已有 `includePaths` checkbox 和 warning 文案，符合 Phase 3 方向。

本阶段只做轻量增强：

- 保持 props 不变，避免扩大 API。
- 将现有 warning copy 明确为默认脱敏路径语义：
  - 当前：`Token 默认脱敏；本地路径和文件名仍可能包含个人信息。`
  - 建议：`Token 默认脱敏；本地路径默认隐藏，只有勾选后才会包含可能暴露个人信息的路径和文件名。`
- `includePaths` checkbox 文案保持或微调为：`包含本地路径和文件名`。

不在本阶段新增 path redaction 函数。

## 5. Preview model alignment

`apps/ui-preview/src/preview-models/preview-types.ts` 当前已有：

```ts
export type PreviewArtifactSensitivity = 'none' | 'local_path' | 'secret_risk';
```

Phase 3 应使 preview model 与 `@cairn/ui` sensitivity 语义一致。

计划：

- 保留 `PreviewArtifactSensitivity` 名称，避免 preview-only 边界消失。
- 让 `PreviewArtifact.sensitivity` 传入 `ArtifactCard.sensitivity`。
- 在需要展示路径的 demo 中显式传入 `pathDisplayMode`：
  - Run Detail：建议 `relative`，因为展示的是 repo-relative source path。
  - Artifact Review：对普通 source path 使用 `relative`；对强调风险的卡片可以使用 `hidden` 或 `relative` + `local_path`，以演示不同状态。
  - Components Gallery：使用 `relative`，因为这是组件展示页中的 repo-relative path。

## 6. Call site migration

### 6.1 Run Detail

文件：`apps/ui-preview/src/preview-sections/run-detail-sections.tsx`

迁移：

- 给 `ArtifactCard` 传入 `sensitivity={artifact.sensitivity}`。
- 给 source path demo 传入 `pathDisplayMode="relative"`。
- 保持现有 actions、title、summary、verification 不变。

### 6.2 Artifact Review

文件：`apps/ui-preview/src/preview-sections/artifact-review-sections.tsx`

迁移：

- 取消旧的 `sensitive` props 派生，改用 `sensitivity={artifact.sensitivity}`。
- 根据 artifact sensitivity 决定 path display：
  - `local_path`：可先用 `pathDisplayMode="relative"`，保留当前原型展示效果。
  - Phase 3 后续如果视觉审阅认为更安全，可把 local path demo 切到 `hidden`。
- 用 `redactionLabel="本地路径已隐藏"` 展示新的 API 能力。

### 6.3 Components Gallery

文件：`apps/ui-preview/src/preview-sections/components-gallery-sections.tsx`

迁移：

- 给 Gallery artifact demo 传入 `sensitivity="none"`。
- 给 demo path 显式传入 `pathDisplayMode="relative"`，让“要显示路径必须 opt-in”的规则在代码中可见。

## 7. Backward compatibility

Phase 3 不应立刻删除 `sensitive?: boolean`。

兼容策略：

- `sensitive` 保留在 `ArtifactCardProps`。
- 如果调用方仍传 `sensitive`，组件继续显示敏感 badge。
- 新 props 优先级高于 legacy `sensitive`。
- 暂不在 runtime warning 或 console warning 中提示 deprecated，避免污染 preview 输出。
- 后续如要移除 `sensitive`，另起阶段处理。

## 8. Implementation order

1. 在 `packages/ui/src/cairn/types.ts` 新增 path display 与 sensitivity types。
2. 修改 `packages/ui/src/cairn/artifact-card.tsx`：
   - 导入新类型。
   - 扩展 props。
   - 实现默认 hidden path 行为。
   - 实现 sensitivity / full path badges。
   - 保留 legacy `sensitive` 映射。
3. 跑 `pnpm --filter @cairn/ui typecheck`。
4. 跑 `pnpm --filter @cairn/ui lint`。
5. 修改 `apps/ui-preview/src/preview-sections/*` 的 `ArtifactCard` 调用方。
6. 轻量更新 `DiagnosticExportPanel` 文案。
7. 跑 `pnpm --filter @cairn/ui-preview typecheck`。
8. 跑完整验证：
   - `pnpm --filter @cairn/ui typecheck`
   - `pnpm --filter @cairn/ui lint`
   - `pnpm --filter @cairn/ui-preview typecheck`
   - `pnpm --filter @cairn/ui-preview lint`
   - `pnpm --filter @cairn/ui-preview build`
9. 检查 diff：确认只涉及 `packages/ui/src/cairn` 与 `apps/ui-preview/src` 的调用方。
10. 提交 Phase 3 实现 commit。

## 9. Acceptance criteria

Phase 3 完成后应满足：

- `ArtifactCard` 默认不直接展示 `path`。
- 调用方必须通过 `pathDisplayMode="relative" | "full"` 显式 opt-in 才展示路径。
- `sensitivity="local_path" | "secret_risk"` 会显示清楚的 warning badge。
- legacy `sensitive` 仍可用，不破坏现有调用方。
- Preview 页面仍能展示需要演示的 repo-relative path。
- Diagnostic export copy 明确“路径默认隐藏，勾选才包含”。
- `@cairn/ui` 与 `@cairn/ui-preview` typecheck / lint / build 通过。

## 10. Risks and mitigations

### Risk: 默认隐藏 path 导致现有 preview 看起来少信息

缓解：在 preview 调用方中显式传 `pathDisplayMode="relative"`，保持当前视觉意图；默认 hidden 主要保护未来调用方。

### Risk: API 太多导致 ArtifactCard 复杂

缓解：只新增两个类型和三个 props；不引入 redaction 函数、不引入 format callback。

### Risk: `full` 模式被误用

缓解：组件层在 `full` 模式显示额外 warning badge，让误用在 UI 上可见。

### Risk: legacy `sensitive` 与新 `sensitivity` 冲突

缓解：新 `sensitivity` 优先；`sensitive` 只作为 fallback bridge。

## 11. Out of scope

- 移除 `sensitive` legacy prop。
- 真实路径脱敏算法。
- Secret/token 扫描。
- Diagnostic export 文件生成逻辑。
- Tokens/theme cleanup。
- Tabs/Dialog accessibility hardening。
- 后端/runtime API 设计。

## 12. Self-review

- Placeholder scan：无未完成占位或待补项。
- Scope check：本阶段可修改 `packages/ui/src/cairn`，但不做 unrelated refactor。
- Consistency check：默认隐藏 path 与 Parent spec Phase 3 一致；preview 调用方显式 opt-in 保持演示效果。
- Ambiguity check：明确 `sensitive` legacy prop 的兼容和优先级。
