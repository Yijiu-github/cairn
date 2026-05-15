# Phase 1 Implementation Plan — UI Preview Structure Cleanup

> 状态：🟡 Ready for implementation approval
> 日期：2026-05-15
> Parent spec：`docs/superpowers/specs/2026-05-15-ui-preview-systemization-design.md`
> 范围：仅 `apps/ui-preview/src` 的结构整理；不修改 `@cairn/ui` public API

## 1. Objective

Phase 1 的目标是让 UI preview 页面文件变薄、职责更清楚，同时保持视觉和交互基本不变。

当前 `apps/ui-preview/src/pages` 中主要页面行数：

- `home-inbox-preview-page.tsx`：约 240 行
- `run-detail-preview-page.tsx`：约 314 行
- `artifact-review-preview-page.tsx`：约 332 行
- `components-gallery-page.tsx`：约 333 行

这些文件同时承担了 demo data、section layout、页面 state 与页面组合职责。Phase 1 只拆结构，不改数据模型语义，不改 shared UI 组件 API。

## 2. Constraints

- 不连接 backend。
- 不接 `workspace-core`。
- 不改 `packages/ui`。
- 不改 tokens。
- 不做视觉 redesign。
- 不引入状态管理库。
- 不把 preview-only 类型包装成未来 API contract。
- 本阶段只移动/拆分现有静态数据和 JSX section，尽量避免行为变化。

## 3. Target directory structure

新增目录：

```txt
apps/ui-preview/src/preview-data/
apps/ui-preview/src/preview-sections/
```

保留：

```txt
apps/ui-preview/src/pages/
apps/ui-preview/src/demo-data.ts
apps/ui-preview/src/ui-preview-app.tsx
apps/ui-preview/src/styles.css
```

说明：

- `preview-data/`：页面级静态 demo data。
- `preview-sections/`：页面内可命名 section 组件。
- `demo-data.ts`：暂时保留 gallery 共享小样例，避免本阶段把所有 gallery fixture 一次性重排；后续可在 Phase 2 合并到 ViewModel。

## 4. Data extraction plan

### 4.1 Home Inbox

从 `pages/home-inbox-preview-page.tsx` 抽出：

```txt
preview-data/home-inbox-data.ts
```

包含：

- `activeRuns`
- `queueItems`
- agent status 列表
- runtime health metrics
- 今日摘要 metadata
- filter pill labels

### 4.2 Run Detail

从 `pages/run-detail-preview-page.tsx` 抽出：

```txt
preview-data/run-detail-data.ts
```

包含：

- `runTasks`
- `evidenceItems`
- sidebar agent status
- cost/latency metrics
- runtime health metrics
- artifact card data
- handoff item copy
- protected action copy

### 4.3 Artifact Review

从 `pages/artifact-review-preview-page.tsx` 抽出：

```txt
preview-data/artifact-review-data.ts
```

包含：

- `provenanceItems`
- `relatedArtifacts`
- diff/risk/decision tab copy
- diagnostic export copy
- protected action copy

### 4.4 Components Gallery

从 `pages/components-gallery-page.tsx` 抽出一部分重复/大型 inline fixtures：

```txt
preview-data/components-gallery-data.ts
```

包含：

- evidence sample items
- agent status sample items
- artifact review sample data
- diagnostic export sample copy
- dialog sample copy

已有 `demo-data.ts` 的 `defaultInterventionEffect`、`runActions`、`taskItems` 本阶段可以暂时保留，并由 gallery 继续引用。

## 5. Section extraction plan

### 5.1 Home Inbox sections

新增：

```txt
preview-sections/home-inbox-sections.tsx
```

导出：

- `HomeCommandBarSection`
- `HomeHandoffSection`
- `HomeRunsSection`
- `HomeRuntimeSidebar`

页面保留：

- `HomeInboxPreviewPage`
- 顶层 layout：`prototype-page`、`home-layout`、`home-main-column`、`home-side-column`

### 5.2 Run Detail sections

新增：

```txt
preview-sections/run-detail-sections.tsx
```

导出：

- `RunDetailHeroSection`
- `RunTaskTreeSection`
- `RunEvidenceSection`
- `RunArtifactsSection`
- `RunDetailSidebar`

页面保留：

- `useState` for `composerMessage`
- `useState` for `composerEffect`
- `useState` for `protectedOpen`
- `ProtectedActionDialog` 的 open/close wiring，除非 section props 更清晰

### 5.3 Artifact Review sections

新增：

```txt
preview-sections/artifact-review-sections.tsx
```

导出：

- `ArtifactReviewHeroSection`
- `ArtifactOverviewSection`
- `ArtifactProvenanceSection`
- `ArtifactReviewContextSection`
- `ArtifactDecisionSection`
- `ArtifactReviewSidebar`

页面保留：

- `useState` for `reviewNote`
- `useState` for `includeLogs`
- `useState` for `includePaths`
- `useState` for `protectedOpen`
- `useState` for `reviewTab`
- tab state wiring 可以通过 props 传入 `ArtifactReviewContextSection`

### 5.4 Components Gallery sections

新增：

```txt
preview-sections/components-gallery-sections.tsx
```

导出：

- `GalleryFoundationSection`
- `GalleryProductComponentsSection`
- `GalleryEvidenceRuntimeSection`
- `GalleryProtectedActionsSection`

页面保留：

- gallery demo states
- section composition order

## 6. Implementation order

按最小风险顺序执行：

1. 创建 `preview-data/`，先抽纯数据，不改 JSX 结构。
2. 运行 `@cairn/ui-preview typecheck`。
3. 创建 `preview-sections/`，先拆 `HomeInboxPreviewPage`，因为 state 最少。
4. 拆 `RunDetailPreviewPage`，保留 page-level state，section 通过 props 接收 state 与 handlers。
5. 拆 `ArtifactReviewPreviewPage`，特别注意 tabs 与 protected dialog state wiring。
6. 拆 `ComponentsGalleryPage`，保守处理，避免因过度抽象降低 gallery 可读性。
7. 运行完整验证。
8. 检查 diff，确认没有 unintended `packages/ui` 变更。

## 7. Validation commands

实现完成后运行：

```bash
pnpm --filter @cairn/ui-preview typecheck
pnpm --filter @cairn/ui-preview lint
pnpm --filter @cairn/ui-preview build
pnpm --filter @cairn/ui typecheck
pnpm --filter @cairn/ui lint
```

如果 preview server 可用，可补充人工 visual sanity check：

```bash
pnpm --filter @cairn/ui-preview dev
```

检查页面：

- Home / Inbox
- Run Detail
- Artifact Review
- Components Gallery

## 8. Acceptance criteria

- `pages/*` 文件只保留页面组合、局部 state 和最少 wiring。
- `preview-data/*` 不包含 React component。
- `preview-sections/*` 不引入 backend/runtime 依赖。
- UI 文案、状态、按钮和 section 顺序保持基本不变。
- 不修改 `packages/ui`。
- 所有 validation commands 通过。
- 如果某个页面拆分导致 props 过多，优先减少 section 粒度，不引入全局状态。

## 9. Rollback strategy

- 每个页面单独拆分，必要时可单独 revert。
- 如果 gallery 拆分后可读性变差，允许只抽大型 data，暂缓 section 化。
- 如果某个 section props 变得过长，保留该部分在 page 文件中，等 Phase 2 ViewModel 后再拆。

## 10. Out of scope for Phase 1

- `ArtifactCard` path safety API。
- `Tabs` / `Dialog` a11y hardening。
- token/theme cleanup。
- ViewModel 类型收口。
- i18n key 化。
- visual redesign。
