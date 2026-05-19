# R1 Evidence Chain Roadmap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Execute the R1 evidence-chain roadmap from collaboration baseline cleanup through a 0.1.0 Personal Desktop Edition pre-release path.

**Architecture:** Treat this as a master implementation plan. M0 can be executed directly from this document; M1-M5 are phase gates that should each begin by creating or selecting a focused sub-plan before code changes, because they touch multiple packages and require TDD-level detail. The route stays vertical: Workspace Core real run lifecycle, Codex RuntimeAdapter execution, Artifact/Trace evidence, operator control, Desktop observation, and release hardening.

**Tech Stack:** TypeScript strict ESM, pnpm/Turborepo, Fastify Workspace Core, SQLite/Drizzle storage, RuntimeAdapter/Codex CLI, Electron Desktop Shell, Vitest, markdownlint-cli2, Prettier.

---

## Scope Check

This plan covers several independent surfaces: documentation, Workspace Core, Runtime Gateway,
Application, Artifact Store, Desktop, release packaging, and operations docs. Because those surfaces
are too broad for one safe code-level plan, this document is the R1 master execution plan. It locks
the milestone order, files, verification gates, and handoff rules. Complex engineering milestones
must use focused sub-plans before implementation.

## File Map

### M0 Collaboration And Verification Baseline

- Modify `AGENTS.md`
  - Remove named role table entries for the previous assistant roles.
  - Replace them with the two-person collaboration model.
- Modify `docs/engineering/agent-collaboration.md`
  - Align AI collaboration guidance with product owner + Codex execution.
- Modify `docs/STATUS.md`
  - Record the R1 evidence-chain route and current verification setup.
- Modify `docs/product/roadmap.md`
  - Preserve R1/R2/R3 product scope while adding current execution route context.
- Modify `CHANGELOG.md`
  - Record collaboration model and R1 roadmap planning updates.
- Verify existing `package.json`, `pnpm-lock.yaml`, `.nvmrc`, and `docs/engineering/local-dev-setup.md`
  - Confirm local setup commands are accurate.

### M1 Real Runtime Loop

- Inspect and likely modify `apps/workspace-core/src/runtime/runtime-gateway-factory.ts`
- Inspect and likely modify `apps/workspace-core/src/runtime/runtime-adapter-gateway-port.ts`
- Inspect and likely modify `apps/workspace-core/src/service/app.ts`
- Inspect and likely modify `apps/workspace-core/src/service/container.ts`
- Inspect and likely modify `packages/runtime_gateway/src/adapters/codex/codex-adapter.ts`
- Inspect and likely modify `packages/runtime_gateway/src/adapters/codex/codex-process.ts`
- Add or update tests next to the changed files.
- Update `docs/engineering/local-dev-setup.md`, `docs/STATUS.md`, and `CHANGELOG.md`.

### M2 Artifact And Trace Evidence Layer

- Inspect and likely modify `apps/workspace-core/src/artifacts/local-artifact-store.ts`
- Inspect and likely modify `apps/workspace-core/src/storage/sqlite-application-repository.ts`
- Inspect and likely modify `apps/workspace-core/src/service/app.ts`
- Inspect and likely modify `packages/application/src/ports/artifact-store-port.ts`
- Inspect and likely modify `packages/application/src/ports/run-repository.ts`
- Inspect and likely modify `packages/application/src/orchestration/orchestration-run-service.ts`
- Inspect and likely modify `packages/shared_contracts/src/schemas/artifact.ts`
- Update tests next to the changed files.
- Update `docs/design/r1-codex-e2e-artifact-trace.md`, `docs/STATUS.md`, and `CHANGELOG.md`.

### M3 Minimal Real Operator Control

- Inspect and likely modify `packages/application/src/orchestration/orchestration-run-service.ts`
- Inspect and likely modify `packages/application/src/orchestration/status.ts`
- Inspect and likely modify `apps/workspace-core/src/service/app.ts`
- Inspect and likely modify `apps/workspace-core/src/runtime/runtime-adapter-gateway-port.ts`
- Update tests in `packages/application/src/orchestration/orchestration-run-service.spec.ts`
- Update tests in `apps/workspace-core/src/service/app.spec.ts`
- Update `docs/design/state-machines.md`, `docs/STATUS.md`, and `CHANGELOG.md` if behavior changes.

### M4 Desktop Real Observation Console

- Inspect and likely modify `apps/desktop/src/main/workspace-core-client.ts`
- Inspect and likely modify `apps/desktop/src/main/workspace-core-bootstrap.ts`
- Inspect and likely modify `apps/desktop/src/preload/index.ts`
- Inspect and likely modify `apps/desktop/src/renderer/src/preload.d.ts`
- Inspect and likely modify `apps/desktop/src/renderer/src/desktop-app.tsx`
- Inspect and likely modify `apps/desktop/src/renderer/src/desktop-model.ts`
- Inspect and likely modify `apps/desktop/src/renderer/src/styles.css`
- Update Desktop tests next to the changed files.
- Update `docs/design/security-model.md`, `docs/STATUS.md`, and `CHANGELOG.md` if preload or Desktop behavior changes.

### M5 0.1.0 Pre-release Hardening

- Modify `docs/engineering/release-playbook.md`
- Modify `docs/engineering/local-dev-setup.md`
- Modify `docs/ops/install-guide.md`
- Modify `docs/ops/troubleshooting.md`
- Modify `docs/legal/privacy-statement.md`
- Modify `docs/legal/data-locality.md`
- Modify `docs/design/distribution-and-signing.md`
- Modify `docs/STATUS.md`
- Modify `CHANGELOG.md`
- Verify `apps/desktop/package.json`, Electron build config, and package command behavior.

---

## Task 0: Prepare Execution Branch And Dependency Baseline

**Files:**

- Read: `package.json`
- Read: `.nvmrc`
- Read: `pnpm-lock.yaml`
- Read: `docs/engineering/local-dev-setup.md`

- [ ] **Step 1: Confirm branch state**

Run:

```bash
git status --short --branch
```

Expected: the current branch is an execution branch, and there are no unrelated local edits. If this
plan is being executed from the roadmap branch, create a new implementation branch from `develop`
before changing M0 project files.

- [ ] **Step 2: Install dependencies**

Run:

```bash
pnpm install --frozen-lockfile
```

Expected: install completes. If native SQLite warnings appear under Node 26, record them in the task
notes only if tests fail.

- [ ] **Step 3: Capture baseline verification**

Run:

```bash
pnpm run check
pnpm test
git diff --check
```

Expected: all commands exit 0. If a command fails, stop feature work and create a short baseline
fix or baseline failure note before continuing.

- [ ] **Step 4: Commit only if baseline files changed**

If dependency or setup files changed as part of baseline repair, run:

```bash
git add package.json pnpm-lock.yaml docs/engineering/local-dev-setup.md
git commit -m "chore(setup): 修复 R1 本地验证基线 / repair R1 local verification baseline"
```

Expected: commit is created only for actual baseline changes. If no files changed, skip this step.

---

## Task 1: M0 Collaboration Document Update

**Files:**

- Modify: `AGENTS.md`
- Modify: `docs/engineering/agent-collaboration.md`
- Modify: `docs/STATUS.md`
- Modify: `docs/product/roadmap.md`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Inspect current collaboration references**

Run:

```bash
rg -n "白霓|海棠|多 Agent 协作角色|haitang|feature/desktop-ui-v0|Codex（本地）" AGENTS.md docs CHANGELOG.md
```

Expected: output shows every stale role reference that must be evaluated.

- [ ] **Step 2: Update `AGENTS.md` collaboration section**

Replace the named role table in `AGENTS.md` with a concise two-person model:

```markdown
### 7.1 当前协作模型

当前 Cairn 按“产品裁剪人 + Codex”推进：

| 角色                | 责任边界                                                               | 推荐分支                              |
| ------------------- | ---------------------------------------------------------------------- | ------------------------------------- |
| 产品裁剪人（Owner） | 最终决定当前阶段做什么 / 不做什么；裁剪范围、排优先级、确认完成定义    | 不固定                                |
| Codex（本地）       | 主工程实现、核心框架设计、模块边界、代码推进、验证、文档同步与风险提示 | `develop` 或从 `develop` 切出的短分支 |

协作规则：

1. Codex 负责往前造，但涉及产品边界时必须让产品裁剪人拍板。
2. UI、QA、文档与工程验证不再按独立 agent 角色拆分，而是纳入每个里程碑的完成定义。
3. 产品裁剪人保留最终范围决策权；Codex 主动给出利弊、风险与建议。
4. 普通功能 / 修复 / 文档 PR 的 base 仍为 `develop`；不要直接 PR 到 `main`。
5. 实际代码变更优先拆成短分支和小 PR。
```

Keep the rest of `AGENTS.md` unchanged unless a nearby sentence directly contradicts this model.

- [ ] **Step 3: Update engineering collaboration guide**

In `docs/engineering/agent-collaboration.md`, adjust sections that name the old roles so the guide
refers to:

```markdown
本文服务于产品裁剪人与 Codex 的协作。Codex 可以在需要时使用临时子任务或 review
清单，但项目计划不再假设固定的 UI / QA 专职 agent 角色。
```

Also add one bullet under the usage principles:

```markdown
- **两人协作默认值**：UI、QA、文档和验证都必须写进每个任务的完成定义，而不是留给独立角色兜底。
```

- [ ] **Step 4: Update project status**

In `docs/STATUS.md`, add a short current collaboration note near the top:

```markdown
> 协作口径：自 2026-05-20 起，Cairn 当前按产品裁剪人 + Codex 两方推进；旧的白霓 / 海棠固定角色分工不再作为项目计划依据。
```

In the "近期主线" section, add the R1 evidence-chain route:

```markdown
当前 R1 主线按证据链优先推进：Workspace Core 真实 Run 生命周期 -> Codex RuntimeAdapter 可观测执行 -> Artifact / Trace 证据层 -> Operator control -> Desktop 真实观察台 -> 0.1.0 预发布硬化。
```

- [ ] **Step 5: Update roadmap execution note**

In `docs/product/roadmap.md`, under Release 1, add:

```markdown
当前执行路线采用证据链优先：先打通 Workspace Core + Codex RuntimeAdapter + Artifact / Trace + Operator control 的真实闭环，再把 Desktop Shell 接到真实 Core 数据面，最后做 0.1.0 预发布硬化。
```

Do not change R2/R3 scope.

- [ ] **Step 6: Update changelog**

In `CHANGELOG.md` under `[Unreleased]` / `Changed`, add:

```markdown
- R1 执行路线调整为证据链优先，并将当前协作模型收口为产品裁剪人 + Codex 两方推进；UI、QA 与文档验证纳入每个里程碑完成定义。
```

- [ ] **Step 7: Verify stale role references**

Run:

```bash
rg -n "白霓|海棠|haitang|feature/desktop-ui-v0" AGENTS.md docs CHANGELOG.md
```

Expected: no matches, except historical design/spec files under `docs/superpowers/` if the team
decides those archived planning records should stay immutable. If matches remain in active project
docs, update them or explicitly document why they are historical.

- [ ] **Step 8: Run document verification**

Run:

```bash
pnpm exec markdownlint-cli2 AGENTS.md docs/engineering/agent-collaboration.md docs/STATUS.md docs/product/roadmap.md CHANGELOG.md
pnpm exec prettier --check AGENTS.md docs/engineering/agent-collaboration.md docs/STATUS.md docs/product/roadmap.md CHANGELOG.md
git diff --check
```

Expected: all commands exit 0.

- [ ] **Step 9: Commit M0 collaboration update**

Run:

```bash
git add AGENTS.md docs/engineering/agent-collaboration.md docs/STATUS.md docs/product/roadmap.md CHANGELOG.md
git commit -m "docs(collaboration): 收口双人协作模型 / align two-person collaboration model"
```

Expected: one documentation commit.

---

## Task 2: M1 Real Runtime Loop Sub-plan

**Files:**

- Create: `docs/superpowers/plans/2026-05-20-m1-real-runtime-loop.md`
- Read: `docs/superpowers/specs/2026-05-20-r1-evidence-chain-roadmap-design.md`
- Read: `docs/design/r1-codex-e2e-artifact-trace.md`
- Read: `docs/superpowers/plans/2026-05-18-codex-runtime-hardening.md`
- Read: `apps/workspace-core/src/runtime/runtime-gateway-factory.ts`
- Read: `apps/workspace-core/src/service/app.ts`
- Read: `packages/runtime_gateway/src/adapters/codex/codex-adapter.ts`

- [ ] **Step 1: Confirm current runtime state**

Run:

```bash
pnpm --filter @cairn/runtime-gateway test
pnpm --filter @cairn/workspace-core test
```

Expected: both package test suites pass before planning M1 changes. If they fail, repair or record
the baseline failure first.

- [ ] **Step 2: Write M1 sub-plan with TDD tasks**

Create `docs/superpowers/plans/2026-05-20-m1-real-runtime-loop.md` using the required plan header.
The sub-plan must include these task groups:

- Codex adapter smoke fixture and deterministic short-task path.
- Workspace Core runtime selection and submit/drain proof through the real RuntimeAdapter-backed gateway.
- Route-level or service-level test proving a real adapter stream updates AgentRun/Task/Run state.
- Manual Codex smoke documentation in `docs/engineering/local-dev-setup.md`.
- Status and changelog updates.

The sub-plan must not add a second runtime adapter or a complex planner.

- [ ] **Step 3: Verify M1 sub-plan document**

Run:

```bash
pnpm exec markdownlint-cli2 docs/superpowers/plans/2026-05-20-m1-real-runtime-loop.md
pnpm exec prettier --check docs/superpowers/plans/2026-05-20-m1-real-runtime-loop.md
git diff --check
```

Expected: all commands exit 0.

- [ ] **Step 4: Commit M1 sub-plan**

Run:

```bash
git add docs/superpowers/plans/2026-05-20-m1-real-runtime-loop.md
git commit -m "docs(runtime): 规划 M1 真实运行时闭环 / plan M1 real runtime loop"
```

Expected: one planning commit.

- [ ] **Step 5: Execute M1 sub-plan**

Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` as required by the
sub-plan. M1 is complete only after its tests, smoke documentation, `docs/STATUS.md`, and
`CHANGELOG.md` updates are committed.

---

## Task 3: M2 Artifact And Trace Evidence Sub-plan

**Files:**

- Create: `docs/superpowers/plans/2026-05-20-m2-artifact-trace-evidence.md`
- Read: `docs/design/r1-codex-e2e-artifact-trace.md`
- Read: `docs/design/replay-and-recovery.md`
- Read: `apps/workspace-core/src/artifacts/local-artifact-store.ts`
- Read: `apps/workspace-core/src/service/app.ts`
- Read: `packages/application/src/ports/artifact-store-port.ts`
- Read: `packages/shared_contracts/src/schemas/artifact.ts`

- [ ] **Step 1: Confirm M1 completion evidence**

Run:

```bash
rg -n "M1|Codex|real runtime|smoke" docs/STATUS.md CHANGELOG.md docs/engineering/local-dev-setup.md
pnpm --filter @cairn/runtime-gateway test
pnpm --filter @cairn/workspace-core test
```

Expected: M1 status and smoke docs exist, and relevant tests pass.

- [ ] **Step 2: Write M2 sub-plan with TDD tasks**

Create `docs/superpowers/plans/2026-05-20-m2-artifact-trace-evidence.md` using the required plan
header. The sub-plan must include:

- Local artifact store boundary tests for bounded payload reads and path traversal rejection.
- Application/repository tests proving artifact metadata and TraceEvents explain a run.
- Workspace Core read API tests for planning output, artifact metadata, artifact payload, and trace.
- Documentation updates to `docs/design/r1-codex-e2e-artifact-trace.md`.
- Status and changelog updates.

The sub-plan must not create a full file versioning system, large artifact export, or advanced
inspector UI.

- [ ] **Step 3: Verify M2 sub-plan document**

Run:

```bash
pnpm exec markdownlint-cli2 docs/superpowers/plans/2026-05-20-m2-artifact-trace-evidence.md
pnpm exec prettier --check docs/superpowers/plans/2026-05-20-m2-artifact-trace-evidence.md
git diff --check
```

Expected: all commands exit 0.

- [ ] **Step 4: Commit M2 sub-plan**

Run:

```bash
git add docs/superpowers/plans/2026-05-20-m2-artifact-trace-evidence.md
git commit -m "docs(evidence): 规划 M2 artifact trace 证据层 / plan M2 artifact trace evidence"
```

Expected: one planning commit.

- [ ] **Step 5: Execute M2 sub-plan**

Use `superpowers:subagent-driven-development` or `superpowers:executing-plans`. M2 is complete only
after read APIs, tests, evidence docs, `docs/STATUS.md`, and `CHANGELOG.md` are committed.

---

## Task 4: M3 Minimal Real Operator Control Sub-plan

**Files:**

- Create: `docs/superpowers/plans/2026-05-20-m3-operator-control.md`
- Read: `docs/design/state-machines.md`
- Read: `docs/reference/glossary.md`
- Read: `packages/application/src/orchestration/orchestration-run-service.ts`
- Read: `apps/workspace-core/src/service/app.ts`
- Read: `packages/application/src/ports/runtime-gateway-port.ts`

- [ ] **Step 1: Confirm M2 completion evidence**

Run:

```bash
rg -n "Artifact|Trace|evidence|replay" docs/STATUS.md CHANGELOG.md docs/design/r1-codex-e2e-artifact-trace.md
pnpm --filter @cairn/application test
pnpm --filter @cairn/workspace-core test
```

Expected: M2 docs mention the evidence layer status, and relevant tests pass.

- [ ] **Step 2: Write M3 sub-plan with TDD tasks**

Create `docs/superpowers/plans/2026-05-20-m3-operator-control.md` using the required plan header.
The sub-plan must include:

- Tests proving `cancel` reaches the runtime gateway when an AgentRun is active.
- Tests proving `retry` creates a new AgentRun attempt without mutating terminal records.
- Tests proving `rerun` creates a new OrchestrationRun linked to the previous run.
- Tests proving operator notes become trace or evidence records.
- State-machine documentation updates if behavior is clarified.
- Status and changelog updates.

The sub-plan must not add enterprise approval workflows, voting, arbitration, or a thick handoff UI.

- [ ] **Step 3: Verify M3 sub-plan document**

Run:

```bash
pnpm exec markdownlint-cli2 docs/superpowers/plans/2026-05-20-m3-operator-control.md
pnpm exec prettier --check docs/superpowers/plans/2026-05-20-m3-operator-control.md
git diff --check
```

Expected: all commands exit 0.

- [ ] **Step 4: Commit M3 sub-plan**

Run:

```bash
git add docs/superpowers/plans/2026-05-20-m3-operator-control.md
git commit -m "docs(operator): 规划 M3 接管闭环 / plan M3 operator control loop"
```

Expected: one planning commit.

- [ ] **Step 5: Execute M3 sub-plan**

Use `superpowers:subagent-driven-development` or `superpowers:executing-plans`. M3 is complete only
after operator action tests, docs, `docs/STATUS.md`, and `CHANGELOG.md` are committed.

---

## Task 5: M4 Desktop Real Observation Console Sub-plan

**Files:**

- Create: `docs/superpowers/plans/2026-05-20-m4-desktop-real-observation.md`
- Read: `docs/design/security-model.md`
- Read: `docs/design/r1-codex-e2e-artifact-trace.md`
- Read: `apps/desktop/src/main/workspace-core-client.ts`
- Read: `apps/desktop/src/preload/index.ts`
- Read: `apps/desktop/src/renderer/src/desktop-app.tsx`
- Read: `apps/desktop/src/renderer/src/desktop-model.ts`

- [ ] **Step 1: Confirm M3 completion evidence**

Run:

```bash
rg -n "cancel|retry|rerun|operator note|Operator" docs/STATUS.md CHANGELOG.md docs/design/state-machines.md
pnpm --filter @cairn/application test
pnpm --filter @cairn/workspace-core test
```

Expected: M3 operator behavior is documented, and relevant tests pass.

- [ ] **Step 2: Write M4 sub-plan with TDD and UI verification tasks**

Create `docs/superpowers/plans/2026-05-20-m4-desktop-real-observation.md` using the required plan
header. The sub-plan must include:

- Preload allowlist type tests for only the required Workspace Core methods.
- Main-process client tests for runs, run detail, artifact payload, trace list, and operator action calls.
- Renderer model tests or smoke tests for mapping Core responses into UI state.
- Electron build verification.
- A manual or automated Electron smoke path that proves the R1 main path.
- Security documentation updates if the preload API changes.
- Status and changelog updates.

The sub-plan must not expose generic filesystem, shell, command execution, or broad local
automation powers.

- [ ] **Step 3: Verify M4 sub-plan document**

Run:

```bash
pnpm exec markdownlint-cli2 docs/superpowers/plans/2026-05-20-m4-desktop-real-observation.md
pnpm exec prettier --check docs/superpowers/plans/2026-05-20-m4-desktop-real-observation.md
git diff --check
```

Expected: all commands exit 0.

- [ ] **Step 4: Commit M4 sub-plan**

Run:

```bash
git add docs/superpowers/plans/2026-05-20-m4-desktop-real-observation.md
git commit -m "docs(desktop): 规划 M4 真实观察台 / plan M4 real observation console"
```

Expected: one planning commit.

- [ ] **Step 5: Execute M4 sub-plan**

Use `superpowers:subagent-driven-development` or `superpowers:executing-plans`. M4 is complete only
after Desktop tests/build/smoke docs, security docs if changed, `docs/STATUS.md`, and `CHANGELOG.md`
are committed.

---

## Task 6: M5 0.1.0 Pre-release Hardening Sub-plan

**Files:**

- Create: `docs/superpowers/plans/2026-05-20-m5-0-1-0-hardening.md`
- Read: `docs/engineering/release-playbook.md`
- Read: `docs/engineering/local-dev-setup.md`
- Read: `docs/ops/install-guide.md`
- Read: `docs/ops/troubleshooting.md`
- Read: `docs/legal/privacy-statement.md`
- Read: `docs/legal/data-locality.md`
- Read: `docs/design/distribution-and-signing.md`
- Read: `apps/desktop/package.json`

- [ ] **Step 1: Confirm M4 completion evidence**

Run:

```bash
rg -n "Desktop|Electron|sidecar|preload|smoke" docs/STATUS.md CHANGELOG.md docs/design/security-model.md
pnpm --filter @cairn/desktop test
pnpm --filter @cairn/desktop build
```

Expected: M4 Desktop status is documented, and Desktop tests/build pass.

- [ ] **Step 2: Write M5 sub-plan with release checklist tasks**

Create `docs/superpowers/plans/2026-05-20-m5-0-1-0-hardening.md` using the required plan header.
The sub-plan must include:

- Desktop package command verification.
- Sidecar packaging and launch diagnostics review.
- Install guide update.
- Troubleshooting guide update.
- Privacy and data-locality docs update.
- Release playbook update.
- Manual smoke checklist for the R1 main path.
- Release notes and known alpha limitations.

The sub-plan must distinguish internal unsigned alpha from formal signed/notarized `0.1.0`
requirements.

- [ ] **Step 3: Verify M5 sub-plan document**

Run:

```bash
pnpm exec markdownlint-cli2 docs/superpowers/plans/2026-05-20-m5-0-1-0-hardening.md
pnpm exec prettier --check docs/superpowers/plans/2026-05-20-m5-0-1-0-hardening.md
git diff --check
```

Expected: all commands exit 0.

- [ ] **Step 4: Commit M5 sub-plan**

Run:

```bash
git add docs/superpowers/plans/2026-05-20-m5-0-1-0-hardening.md
git commit -m "docs(release): 规划 M5 0.1.0 硬化 / plan M5 0.1.0 hardening"
```

Expected: one planning commit.

- [ ] **Step 5: Execute M5 sub-plan**

Use `superpowers:subagent-driven-development` or `superpowers:executing-plans`. M5 is complete only
after packaging verification, smoke checklist, release docs, `docs/STATUS.md`, and `CHANGELOG.md`
are committed.

---

## Task 7: R1 Completion Review Gate

**Files:**

- Modify: `docs/STATUS.md`
- Modify: `CHANGELOG.md`
- Read: `docs/engineering/review-gates.md`
- Read: `docs/superpowers/specs/2026-05-20-r1-evidence-chain-roadmap-design.md`

- [ ] **Step 1: Run full verification**

Run:

```bash
pnpm run check
pnpm test
pnpm run build
pnpm run standards:check
git diff --check
```

Expected: all commands exit 0. If any fail, fix or document the exact blocking command before
claiming R1 completion.

- [ ] **Step 2: Fill review gate summary**

Read `docs/engineering/review-gates.md` and write a short R1 completion summary in
`docs/STATUS.md` with:

- Risk level.
- Changed surfaces.
- Verification commands and results.
- Docs updated.
- Residual risks.

- [ ] **Step 3: Update changelog for completion state**

In `CHANGELOG.md`, ensure the `[Unreleased]` section names the completed M0-M5 slices and any known
alpha limitations.

- [ ] **Step 4: Verify final docs**

Run:

```bash
pnpm exec markdownlint-cli2 docs/STATUS.md CHANGELOG.md
pnpm exec prettier --check docs/STATUS.md CHANGELOG.md
git diff --check
```

Expected: all commands exit 0.

- [ ] **Step 5: Commit completion review**

Run:

```bash
git add docs/STATUS.md CHANGELOG.md
git commit -m "docs(status): 收口 R1 完成审查 / record R1 completion review"
```

Expected: one documentation commit.
