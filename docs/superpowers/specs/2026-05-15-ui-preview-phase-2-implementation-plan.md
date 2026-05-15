# Phase 2 Implementation Plan — UI Preview ViewModel Boundary

> 状态：🟡 Ready for implementation approval
> 日期：2026-05-15
> Parent spec：`docs/superpowers/specs/2026-05-15-ui-preview-systemization-design.md`
> 前置阶段：Phase 1 已完成，commit `74aed20`
> 范围：仅 `apps/ui-preview/src` 的 preview-only ViewModel 整理；不修改 `@cairn/ui` public API

## 1. Objective

Phase 2 的目标是把 Phase 1 抽出的静态 data 进一步整理成 **preview-only ViewModel boundary**。

当前 `preview-data/*` 已经把数据从页面和 section 中移出，但数据仍然直接贴近具体 UI 组件 props，例如 `RunCard` metrics、`ArtifactCard` actions、`EvidenceTimeline` items、sidebar metadata 等。这样可以降低页面长度，但业务语义仍然分散：run、artifact、risk、approval、runtime、handoff 的关系主要靠文件命名和 JSX 位置理解。

Phase 2 要新增 `apps/ui-preview/src/preview-models/`，建立 preview 专用输入模型和派生 helpers，让 section 更像在消费页面模型，而不是拼接一组零散 fixture。

## 2. Constraints

- 不连接 backend。
- 不接 `workspace-core`。
- 不修改 `packages/ui`。
- 不修改 `@cairn/ui` public API。
- 不改 tokens。
- 不做视觉 redesign。
- 不引入状态管理库。
- 不把 preview-only ViewModel 承诺为未来 backend/API contract。
- 不在本阶段实现真实 redaction、secret scan 或 runtime data adapter。
- 尽量保持现有视觉和交互不变；变化应集中在数据组织和命名边界。

## 3. Target directory structure

新增目录：

```txt
apps/ui-preview/src/preview-models/
```

建议文件：

```txt
apps/ui-preview/src/preview-models/preview-types.ts
apps/ui-preview/src/preview-models/home-inbox-view-model.ts
apps/ui-preview/src/preview-models/run-detail-view-model.ts
apps/ui-preview/src/preview-models/artifact-review-view-model.ts
apps/ui-preview/src/preview-models/components-gallery-view-model.ts
```

保留：

```txt
apps/ui-preview/src/preview-data/
apps/ui-preview/src/preview-sections/
apps/ui-preview/src/pages/
apps/ui-preview/src/demo-data.ts
```

说明：

- `preview-models/preview-types.ts`：定义跨页面复用的 preview-only 类型。
- `preview-models/*-view-model.ts`：从 `preview-data/*` 组合或派生页面 ViewModel。
- `preview-data/*`：保留原始静态 fixtures，可逐步改为更接近 domain seed data。
- `preview-sections/*`：消费 ViewModel / derived data，减少直接引用零散 data 常量。

## 4. Preview-only type model

### 4.1 Shared primitive aliases

在 `preview-types.ts` 定义 preview 层语义类型。类型名使用 `Preview*` 前缀，避免被误认为 production contract。

建议包含：

```ts
export type PreviewRunStatus = 'running' | 'completed' | 'blocked' | 'failed' | 'waiting' | 'todo';
export type PreviewArtifactKind = 'document' | 'log' | 'image' | 'patch';
export type PreviewReviewState = 'pending_review' | 'approved' | 'changes_requested' | 'rejected';
export type PreviewArtifactSensitivity = 'none' | 'local_path' | 'secret_risk';
export type PreviewHandoffKind = 'approval' | 'review' | 'diagnostic';
export type PreviewAgentStatus = 'running' | 'thinking' | 'waiting' | 'idle';
```

这些类型只描述 preview 需要表达的状态，不从 backend 或 `workspace-core` 导入。

### 4.2 Shared interfaces

建议定义：

```ts
export interface PreviewMetric {
  label: string;
  value: string;
}

export interface PreviewAction {
  label: string;
  tone?: 'primary' | 'secondary' | 'danger';
}

export interface PreviewAgent {
  id: string;
  label: string;
  status: PreviewAgentStatus;
  task: string;
}

export interface PreviewRunSummary {
  id: string;
  title: string;
  description: string;
  status: PreviewRunStatus;
  progress?: number;
  agentLabel: string;
  metrics: readonly PreviewMetric[];
}

export interface PreviewArtifact {
  artifactId: string;
  title: string;
  kind: PreviewArtifactKind;
  reviewState: PreviewReviewState;
  summary: string;
  path?: string;
  source?: string;
  sensitivity: PreviewArtifactSensitivity;
  verification?: string;
  actions?: readonly PreviewAction[];
}
```

备注：

- `path` 仍可存在，但 Phase 2 不改变展示规则；真正默认隐藏路径留到 Phase 3。
- `sensitivity` 在 Phase 2 先进入模型层，用来给 Phase 3 的组件 API 改造铺路。
- `actions` 仍是 preview-level action copy，不绑定真实行为。

## 5. Per-page ViewModel plan

### 5.1 Home Inbox

新增：

```txt
preview-models/home-inbox-view-model.ts
```

导出：

```ts
export interface HomeInboxViewModel {
  workspace: {
    name: string;
    summary: string;
    stats: readonly PreviewMetric[];
  };
  runs: readonly PreviewRunSummary[];
  handoffQueue: readonly PreviewHandoffItem[];
  agents: readonly PreviewAgent[];
  runtime: PreviewRuntimeSummary;
  filters: readonly string[];
}

export const homeInboxViewModel: HomeInboxViewModel = ...;
```

Section 调整：

- `HomeCommandBarSection` 从 `homeInboxViewModel.workspace` 读取 workspace 名称和摘要文案。
- `HomeHandoffSection` 从 `homeInboxViewModel.handoffQueue` 读取 handoff items。
- `HomeRunsSection` 从 `homeInboxViewModel.runs` 读取 run summaries。
- `HomeRuntimeSidebar` 从 `homeInboxViewModel.agents/runtime/stats/filters` 读取侧栏数据。

### 5.2 Run Detail

新增：

```txt
preview-models/run-detail-view-model.ts
```

导出：

```ts
export interface RunDetailViewModel {
  run: PreviewRunDetail;
  agents: readonly PreviewAgent[];
  runtime: PreviewRuntimeSummary;
  cost: PreviewCostSummary;
  attribution: readonly PreviewMetric[];
  protectedAction: PreviewProtectedAction;
}

export const runDetailViewModel: RunDetailViewModel = ...;
```

`PreviewRunDetail` 建议包含：

- `id`
- `workspaceId`
- `title`
- `summary`
- `status`
- `tasks`
- `evidence`
- `artifacts`

Section 调整：

- `RunDetailHeroSection` 从 `runDetailViewModel.run` 和 `protectedAction` 读取标题、summary、run id、workspace id。
- `RunTaskTreeSection` 从 `run.tasks` 读取 task tree。
- `RunEvidenceSection` 从 `run.evidence` 读取证据链。
- `RunArtifactsSection` 从 `run.artifacts` 派生 `ArtifactCard` props。
- `RunDetailSidebar` 从 `agents/runtime/cost/attribution/protectedAction` 读取侧栏数据。

### 5.3 Artifact Review

新增：

```txt
preview-models/artifact-review-view-model.ts
```

导出：

```ts
export interface ArtifactReviewViewModel {
  artifact: PreviewArtifact;
  runId: string;
  hero: {
    title: string;
    summary: string;
    badges: readonly PreviewStatusBadge[];
  };
  relatedArtifacts: readonly PreviewArtifact[];
  provenance: readonly PreviewEvidenceItem[];
  reviewContext: PreviewArtifactReviewContext;
  diagnosticExport: PreviewDiagnosticExportSummary;
  protectedAction: PreviewProtectedAction;
}

export const artifactReviewViewModel: ArtifactReviewViewModel = ...;
```

Section 调整：

- `ArtifactReviewHeroSection` 从 `artifactReviewViewModel.hero/artifact/runId` 读取标题和 badge。
- `ArtifactOverviewSection` 从 `relatedArtifacts` 读取产物卡片数据。
- `ArtifactProvenanceSection` 从 `provenance` 读取来源链。
- `ArtifactReviewContextSection` 从 `reviewContext` 读取 diff/risk/decision 内容。
- `ArtifactReviewSidebar` 从 `diagnosticExport` 与 `protectedAction` 读取导出说明和 protected action copy。

### 5.4 Components Gallery

新增：

```txt
preview-models/components-gallery-view-model.ts
```

导出：

```ts
export interface ComponentsGalleryViewModel {
  foundation: PreviewGallerySectionSummary;
  product: PreviewGalleryProductExamples;
  evidenceRuntime: PreviewGalleryEvidenceRuntime;
  protectedActions: PreviewGalleryProtectedActions;
  feedback: PreviewGalleryFeedbackExamples;
  footer: readonly PreviewMetric[];
}

export const componentsGalleryViewModel: ComponentsGalleryViewModel = ...;
```

边界：

- Gallery 本质是组件展示页，不需要过度 domain 化。
- 可以继续引用 `demo-data.ts` 中的 `runActions`、`taskItems`、`defaultInterventionEffect`，但应通过 `componentsGalleryViewModel` 暴露给 sections。
- 不把 Gallery 的 every-control demo 都包装成复杂模型；只收拢跨 section 的样例数据和文案。

## 6. Derivation helpers

为避免 section 直接知道太多转换细节，可以在各 ViewModel 文件中定义小型 mapper：

```ts
export function toArtifactCardProps(artifact: PreviewArtifact) { ... }
export function toRunCardProps(run: PreviewRunSummary) { ... }
```

约束：

- helper 只做 preview data → current UI props 的轻量转换。
- 不引入 React。
- 不返回带真实 side effect 的 handler。
- 不把 helper 移入 `packages/ui`。
- 若映射很短，可以先内联在 section；不要为了抽象而抽象。

## 7. Implementation order

1. 新建 `preview-models/preview-types.ts`，定义 shared preview-only 类型。
2. 新建 `home-inbox-view-model.ts`，让 Home sections 改读 `homeInboxViewModel`。
3. 运行 `pnpm --filter @cairn/ui-preview typecheck`。
4. 新建 `run-detail-view-model.ts`，让 Run Detail sections 改读 `runDetailViewModel`。
5. 运行 `pnpm --filter @cairn/ui-preview typecheck`。
6. 新建 `artifact-review-view-model.ts`，让 Artifact Review sections 改读 `artifactReviewViewModel`。
7. 运行 `pnpm --filter @cairn/ui-preview typecheck`。
8. 新建 `components-gallery-view-model.ts`，让 Gallery sections 改读 `componentsGalleryViewModel`。
9. 运行 `pnpm --filter @cairn/ui-preview typecheck`。
10. 跑完整验证：
    - `pnpm --filter @cairn/ui-preview typecheck`
    - `pnpm --filter @cairn/ui-preview lint`
    - `pnpm --filter @cairn/ui-preview build`
    - `pnpm --filter @cairn/ui typecheck`
    - `pnpm --filter @cairn/ui lint`
11. 检查 diff：确认没有 `packages/ui` 变更，没有 tokens 变更，没有视觉 CSS 变更。
12. 提交 Phase 2 实现 commit。

## 8. Acceptance criteria

Phase 2 完成后应满足：

- `apps/ui-preview/src/preview-models/` 存在并包含 shared preview types 与页面 ViewModel。
- `preview-sections/*` 主要消费 ViewModel，而不是散落 data 常量。
- run、artifact、risk、approval、runtime 等语义集中到 ViewModel 层。
- `PreviewArtifact.sensitivity` 已出现在模型层，为 Phase 3 safety API 做准备。
- `preview-data/*` 仍可作为 seed fixture 存在，但不再是 section 的主要 public input。
- 页面视觉和交互基本不变。
- 不修改 `packages/ui`。
- 不连接 backend / `workspace-core`。
- 验证命令全部通过。

## 9. Risks and mitigations

### Risk: ViewModel 过早像 backend API contract

缓解：所有类型使用 `Preview*` 前缀，并在文件注释中明确 preview-only，不从 backend/runtime 导入。

### Risk: 抽象过度，让 preview 更难读

缓解：只抽跨 section 的业务语义和 repeated copy；组件展示页保持适度直白。

### Risk: 映射 helper 变成第二套组件 API

缓解：helper 保持局部、轻量，不导出到 `packages/ui`，不承诺稳定 public API。

### Risk: Phase 2 顺手改视觉或安全行为

缓解：本阶段不改 CSS、不改 `ArtifactCard` path 展示行为；path hiding 与 safety API 留到 Phase 3。

## 10. Out of scope

- `ArtifactCard` / `DiagnosticExportPanel` public API 改造。
- 默认隐藏本地路径。
- 真实 path redaction。
- token/tailwind/theme cleanup。
- Tabs/Dialog accessibility behavior changes。
- PR 创建、push、merge。

## 11. Self-review

- Placeholder scan：无未完成占位或待补项。
- Scope check：仅限 `apps/ui-preview/src`，符合 Phase 2。
- Consistency check：不修改 `packages/ui`，与 Parent spec 的 Phase 2 边界一致。
- Ambiguity check：明确 ViewModel 是 preview-only，不是 backend/API contract。
