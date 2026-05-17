# UI Preview Planning Output Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show the PlanningOutput shape in the static Run Detail UI preview so the next Desktop Shell can see planning summary, blocked reason, preconditions, and action tree affordances.

**Architecture:** Keep `apps/ui-preview` static and source-only. Add preview-only PlanningOutput view-model data, render it in `Run Detail` before the runtime Task Tree, and update styles without touching `apps/desktop`, `apps/web`, Workspace Core behavior, or shared schemas.

**Tech Stack:** React, TypeScript ESM, Vite, existing `@cairn/ui` primitives, CSS.

---

## Scope Check

In scope:

- Add preview model types for PlanningOutput display.
- Add mock PlanningOutput data aligned with existing shared schema fields.
- Add a Run Detail section for planning summary, blocked reason, preconditions, and action tree.
- Add minimal CSS for planning cards and action rows.
- Update `CHANGELOG.md` and this plan checklist.

Out of scope:

- Do not call Workspace Core from UI preview.
- Do not create Desktop or Web app code.
- Do not change shared PlanningOutput schema or Workspace Core API.
- Do not add a workflow builder or editable action graph.

## File Structure

Modify these files:

- `apps/ui-preview/src/preview-models/preview-types.ts`
  - Adds preview-only PlanningOutput display interfaces.
- `apps/ui-preview/src/preview-data/run-detail-data.ts`
  - Adds static PlanningOutput data.
- `apps/ui-preview/src/preview-models/run-detail-view-model.ts`
  - Exposes planning output on the Run Detail view model.
- `apps/ui-preview/src/preview-sections/run-detail-sections.tsx`
  - Renders the planning output section.
- `apps/ui-preview/src/pages/run-detail-preview-page.tsx`
  - Places the planning section before the task tree.
- `apps/ui-preview/src/styles.css`
  - Adds planning output preview styles.
- `CHANGELOG.md`
  - Records the UI preview alignment.

## Task 1: PlanningOutput Preview Model

**Files:**

- Modify: `apps/ui-preview/src/preview-models/preview-types.ts`
- Modify: `apps/ui-preview/src/preview-data/run-detail-data.ts`
- Modify: `apps/ui-preview/src/preview-models/run-detail-view-model.ts`

- [x] **Step 1: Add preview interfaces**

In `apps/ui-preview/src/preview-models/preview-types.ts`, after `PreviewRunDetail`, add:

```ts
export interface PreviewPlanningAction {
  id: string;
  title: string;
  intent: string;
  status: 'ready' | 'blocked' | 'running' | 'completed';
  dependsOn: readonly string[];
}

export interface PreviewPlanningPrecondition {
  label: string;
  status: 'satisfied' | 'pending' | 'failed';
  detail: string;
}

export interface PreviewPlanningOutput {
  id: string;
  status: 'pending' | 'ready' | 'blocked' | 'failed';
  summary: string;
  blockedReason?: string;
  preconditions: readonly PreviewPlanningPrecondition[];
  actions: readonly PreviewPlanningAction[];
}
```

- [x] **Step 2: Add mock PlanningOutput data**

In `apps/ui-preview/src/preview-data/run-detail-data.ts`, after `runDetailTasks`, add:

```ts
export const runDetailPlanningOutput = {
  id: 'plan_01JDEMOHOME0000000000001',
  status: 'blocked' as const,
  summary:
    'Goal Planner 已把 Run Detail 拆成信息架构、受保护动作说明、预览构建和视觉验收四个动作；当前阻塞在截图确认。',
  blockedReason: '需要 operator 确认是否继续写入 UI preview 页面与样式文件。',
  preconditions: [
    {
      label: '产品边界',
      status: 'satisfied' as const,
      detail: '仅更新静态 UI preview，不创建 Desktop / Web Shell。',
    },
    {
      label: '数据来源',
      status: 'satisfied' as const,
      detail: '使用 mock PlanningOutput，不连接 Workspace Core。',
    },
    {
      label: '视觉验收',
      status: 'pending' as const,
      detail: '需要在 production build 后截图确认信息密度。',
    },
  ],
  actions: [
    {
      id: 'inspect_current_run_detail',
      title: 'Inspect current Run Detail',
      intent: '确认现有任务树、证据链和产物卡片的布局入口。',
      status: 'completed' as const,
      dependsOn: [],
    },
    {
      id: 'add_planning_panel',
      title: 'Add PlanningOutput panel',
      intent: '展示 summary、blocked reason、preconditions 和 action tree。',
      status: 'running' as const,
      dependsOn: ['inspect_current_run_detail'],
    },
    {
      id: 'capture_preview',
      title: 'Capture preview evidence',
      intent: '构建 UI preview 并为后续 Desktop Shell 保留验收参考。',
      status: 'blocked' as const,
      dependsOn: ['add_planning_panel'],
    },
  ],
};
```

- [x] **Step 3: Expose planning output view model**

In `apps/ui-preview/src/preview-models/run-detail-view-model.ts`:

1. Import `runDetailPlanningOutput` from `run-detail-data`.
2. Import type `PreviewPlanningOutput`.
3. Add `planningOutput: PreviewPlanningOutput;` to `RunDetailViewModel`.
4. Add `planningOutput: runDetailPlanningOutput,` to `runDetailViewModel`.

- [x] **Step 4: Run model verification**

Run:

```bash
pnpm --filter @cairn/ui-preview typecheck
```

Expected: command exits `0`.

- [x] **Step 5: Commit model slice**

Run:

```bash
git add apps/ui-preview/src/preview-models/preview-types.ts apps/ui-preview/src/preview-data/run-detail-data.ts apps/ui-preview/src/preview-models/run-detail-view-model.ts
git commit -m "feat(ui-preview): 增加规划输出预览模型 / add planning output preview model"
```

Expected: commit succeeds.

## Task 2: Run Detail Planning Section

**Files:**

- Modify: `apps/ui-preview/src/preview-sections/run-detail-sections.tsx`
- Modify: `apps/ui-preview/src/pages/run-detail-preview-page.tsx`
- Modify: `apps/ui-preview/src/styles.css`

- [x] **Step 1: Add section component**

In `apps/ui-preview/src/preview-sections/run-detail-sections.tsx`, add this function before `RunTaskTreeSection`:

```tsx
export function RunPlanningOutputSection() {
  const planningOutput = runDetailViewModel.planningOutput;

  return (
    <section className="preview-section" aria-labelledby="planning-output-heading">
      <div className="section-heading split-heading">
        <div>
          <div className="section-kicker">Planning Output</div>
          <h2 id="planning-output-heading">规划结果</h2>
          <p>展示 Goal Planner 产出的 summary、阻塞原因、前置条件和 action tree。</p>
        </div>
        <StatusBadge label={planningOutput.status} tone="warning" />
      </div>

      <Card className="planning-output-card">
        <CardHeader>
          <CardTitle>{planningOutput.id}</CardTitle>
        </CardHeader>
        <CardContent className="planning-output-content">
          <p className="planning-summary">{planningOutput.summary}</p>

          {planningOutput.blockedReason === undefined ? undefined : (
            <InlineAlert tone="warning">{planningOutput.blockedReason}</InlineAlert>
          )}

          <div className="planning-columns">
            <div className="planning-column">
              <h3>Preconditions</h3>
              <div className="planning-list">
                {planningOutput.preconditions.map((precondition) => (
                  <div className="planning-list-item" key={precondition.label}>
                    <div>
                      <strong>{precondition.label}</strong>
                      <p>{precondition.detail}</p>
                    </div>
                    <StatusBadge label={precondition.status} tone="neutral" />
                  </div>
                ))}
              </div>
            </div>

            <div className="planning-column">
              <h3>Action Tree</h3>
              <div className="planning-list">
                {planningOutput.actions.map((action) => (
                  <div className="planning-list-item" key={action.id}>
                    <div>
                      <strong>{action.title}</strong>
                      <p>{action.intent}</p>
                      <span>
                        depends_on:{' '}
                        {action.dependsOn.length === 0 ? 'none' : action.dependsOn.join(', ')}
                      </span>
                    </div>
                    <StatusBadge label={action.status} tone="info" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
```

- [x] **Step 2: Place section in page**

In `apps/ui-preview/src/pages/run-detail-preview-page.tsx`:

1. Add `RunPlanningOutputSection` to the import from `run-detail-sections`.
2. Render `<RunPlanningOutputSection />` immediately before `<RunTaskTreeSection />`.

- [x] **Step 3: Add CSS**

In `apps/ui-preview/src/styles.css`, after `.stack`, add:

```css
.planning-output-card {
  overflow: hidden;
}

.planning-output-content,
.planning-list,
.planning-column {
  display: grid;
  gap: 12px;
}

.planning-summary,
.planning-list-item p,
.planning-list-item span {
  color: var(--preview-subtle);
  line-height: 1.6;
}

.planning-columns {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.planning-column h3 {
  font-size: 14px;
  letter-spacing: -0.01em;
  margin: 0;
}

.planning-list-item {
  align-items: start;
  background: var(--preview-surface-muted);
  border: 1px solid var(--preview-border);
  border-radius: 18px;
  display: grid;
  gap: 12px;
  grid-template-columns: minmax(0, 1fr) auto;
  padding: 12px;
}

.planning-list-item strong {
  display: block;
  margin-bottom: 4px;
}

.planning-list-item span {
  display: block;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New',
    monospace;
  font-size: 12px;
  margin-top: 6px;
}
```

In the mobile media query where `.grid.two` becomes one column, add `.planning-columns` to the same rule.

- [x] **Step 4: Run UI verification**

Run:

```bash
pnpm --filter @cairn/ui-preview typecheck
pnpm --filter @cairn/ui-preview lint
pnpm --filter @cairn/ui-preview build
```

Expected: all commands exit `0`.

- [x] **Step 5: Commit UI section**

Run:

```bash
git add apps/ui-preview/src/preview-sections/run-detail-sections.tsx apps/ui-preview/src/pages/run-detail-preview-page.tsx apps/ui-preview/src/styles.css
git commit -m "feat(ui-preview): 展示规划输出详情 / show planning output details"
```

Expected: commit succeeds.

## Task 3: Docs and Final Verification

**Files:**

- Modify: `CHANGELOG.md`
- Modify: `docs/superpowers/plans/2026-05-17-ui-preview-planning-output.md`

- [x] **Step 1: Update changelog**

Under `[Unreleased]` → `### Added`, after the Planning Output API entry, add:

```md
- **UI Preview Planning Output**：Run Detail preview 新增静态 PlanningOutput 展示，覆盖 planning summary、blocked reason、preconditions 与 action tree。
```

- [x] **Step 2: Run final verification**

Run:

```bash
pnpm --filter @cairn/ui-preview typecheck
pnpm --filter @cairn/ui-preview lint
pnpm --filter @cairn/ui-preview build
pnpm exec markdownlint-cli2 CHANGELOG.md docs/superpowers/plans/2026-05-17-ui-preview-planning-output.md
pnpm exec prettier --check apps/ui-preview/src/preview-models/preview-types.ts apps/ui-preview/src/preview-data/run-detail-data.ts apps/ui-preview/src/preview-models/run-detail-view-model.ts apps/ui-preview/src/preview-sections/run-detail-sections.tsx apps/ui-preview/src/pages/run-detail-preview-page.tsx apps/ui-preview/src/styles.css CHANGELOG.md docs/superpowers/plans/2026-05-17-ui-preview-planning-output.md
git diff --check
```

Expected: all commands exit `0`.

- [x] **Step 3: Commit docs**

Run:

```bash
git add CHANGELOG.md docs/superpowers/plans/2026-05-17-ui-preview-planning-output.md
git commit -m "docs(ui-preview): 记录规划输出预览 / document planning output preview"
```

Expected: commit succeeds.
