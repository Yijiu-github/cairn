# Nightly Cleanup Handoff

> 状态：🟡 Active
> 最后更新：2026-05-21 16:57 CST
> 工作区：`/Users/taosiyu/Code/cairn`
> 基线提交：`56aa3894db1cd99d023c80595d087f5cbaf968a7`

---

## 1. 用途

这份文件是跨轮定时任务的接力入口。后续每一轮自动化或子 agent 开始前，必须先读本文件，再读 `AGENTS.md`、`docs/STATUS.md` 与任务相关文档；每轮结束前必须更新本文件，记录事实状态、验证结果、剩余风险和下一轮任务。

不要把它当成正式产品文档。它是临时工程交接板，用来避免第二轮、第三轮在不同上下文中重复探索或误判当前进度。

---

## 2. 每轮固定流程

1. 读取 `AGENTS.md`、`docs/STATUS.md`、`docs/product/positioning-and-boundaries.md`、`docs/reference/glossary.md`、`docs/design/设计文档V0.1.0.md`。
2. 读取本文件，确认上一轮完成、阻塞、验证命令与禁止事项。
3. 执行 `git status --short` 与 `git diff --name-only`，不要回滚非本轮明确负责的改动。
4. 按“内部试用必需 / 低风险整理 / 文档同步 / 疑似无关”分组当前改动。
5. 优先处理低风险且可验证的整理、代码问题排查、文档同步和测试修复。
6. 跑与改动范围匹配的验证；如果全量验证太慢，至少记录 targeted verification 与未跑原因。
7. 更新本文件的“当前状态”“验证记录”“下一轮任务”和“阻塞/风险”。

---

## 3. 当前工作目标

本轮目标是把第一轮内部开发者试用推进到更可接力的状态：

- 审计当前 dirty worktree，确认哪些变更属于 internal trial 主线。
- 整理 Desktop internal-trial / Codex sidecar / Workspace Core replay evidence / runtime gateway / application orchestration 相关代码。
- 同步 README、STATUS、CHANGELOG、internal trial runbook、本地开发与测试文档。
- 运行 targeted tests、lint、typecheck、build 与 docs lint；必要时记录全量验证风险。
- 不做大范围架构重构，不创建 `apps/web`，不把内部试用写成 public alpha、installer 或签名验证。

---

## 4. 当前 Dirty Worktree 分组

### 4.1 Internal Trial 主线改动

- `apps/desktop/**`：Desktop internal-trial IPC/preload/client/renderer/sidecar bridge 与 Electron build 配置。
- `docs/ops/internal-trial-runbook.md`：内部试用运行手册。
- `docs/superpowers/specs/2026-05-20-internal-trial-core-first-design.md`：内部试用设计拆分。
- `docs/superpowers/plans/2026-05-20-internal-trial-core-first-implementation-plan.md`：内部试用实现计划。

### 4.2 文档同步改动

- `README.md`
- `CHANGELOG.md`
- `docs/STATUS.md`
- `docs/design/security-model.md`
- `docs/engineering/local-dev-setup.md`
- `docs/engineering/testing-strategy.md`
- `docs/superpowers/plans/2026-05-21-nightly-cleanup-handoff.md`

### 4.3 待确认项

- 暂无明确无关改动；后续轮次仍需用 `git diff --name-only` 复核。
- 历史文档中可能仍有 `runMockSmoke` 作为历史记录存在；不要机械替换 changelog 或历史 plan/spec 中的上下文，优先只清理当前状态文档和当前代码路径。
- `apps/desktop/src/renderer/src/run-replay-loader.ts` 是本轮新增的可测 helper；不把它拆回组件内。

### 4.4 建议拆分的 Review Chunk

2026-05-21 16:57 CST 只读统计：当前未提交区包含 16 个已跟踪文件、5 个未跟踪文件，约
1018 additions / 287 deletions。建议下一步不要继续在同一个宽 diff 上叠功能，而是按下面顺序拆：

1. **Desktop bridge + renderer internal-trial chunk**：`apps/desktop/**`、`apps/desktop/README.md`。
   这是最大块，包含 IPC allowlist、sidecar bridge、artifact payload preview、renderer replay loader
   与 Electron Vite config 测试；拆 PR 时可再按 main/preload/renderer 分成子提交。
2. **Docs/runbook chunk**：`README.md`、`CHANGELOG.md`、`docs/STATUS.md`、`docs/ops/internal-trial-runbook.md`、
   `docs/engineering/**`、`docs/contracts/**`、`docs/design/**`、`docs/adr/**` 与 internal-trial plan/spec。
   该 chunk 应明确：Desktop sidecar 默认 mock、真实 Codex 需 env opt-in、`apps/web` 尚未创建。

已完成拆分：

- **Contracts/schema chunk**：`packages/shared_contracts/**` 已提交为 `54c31f4`
  `test(contracts): 补齐回放契约覆盖 / cover replay contracts`，包含 contracts 与 replay-source
  schema tests，不再处于当前 dirty worktree。
- **Runtime Gateway + Application chunk**：`packages/runtime_gateway/**` 与 `packages/application/**`
  已提交为 `7ae1498` `fix(runtime): 收紧 Codex 终态证据 / harden codex terminal evidence`，
  包含 Codex adapter/process/error mapping、runtime terminal event 与 evidence 状态推进，不再处于当前
  dirty worktree。
- **Workspace Core evidence/storage chunk**：`apps/workspace-core/**` 已提交为 `b1a98ba`
  `fix(core): 收紧回放证据读取 / harden replay evidence reads`，包含 replay/evidence API、
  runtime gateway factory、local artifact store 与 SQLite repository 补测，不再处于当前 dirty
  worktree。
- **Desktop config chunk**：`apps/desktop/electron.vite.config.ts` 与
  `apps/desktop/src/electron-vite-config.spec.ts` 已提交为 `aaea412`
  `fix(desktop): 修正 preload 构建输出 / fix preload build output`，包含 preload CJS output 与
  shared-contracts bundling guard，不再处于当前 dirty worktree。
- **Desktop main/client/sidecar bridge chunk**：`apps/desktop/src/main/**` 已提交为 `09120c1`
  `feat(desktop): 收紧 Core 桥接边界 / harden core bridge boundary`，包含 sidecar runtime/env/
  diagnostic、client response schema 与 bounded artifact payload、main IPC allowlist / action guards /
  redaction，不再处于当前 dirty worktree。

当前未跟踪文件：

- `apps/desktop/src/renderer/src/run-replay-loader.ts`
- `apps/desktop/src/renderer/src/run-replay-loader.spec.ts`
- `docs/ops/internal-trial-runbook.md`
- `docs/superpowers/plans/2026-05-20-internal-trial-core-first-implementation-plan.md`
- `docs/superpowers/specs/2026-05-20-internal-trial-core-first-design.md`

---

## 5. 已知验证记录

上一轮已报告通过的 targeted verification：

- `pnpm --filter @cairn/desktop lint`
- `pnpm --filter @cairn/desktop typecheck`
- `pnpm --filter @cairn/desktop test -- --run src/main/index.spec.ts src/main/workspace-core-client.spec.ts src/main/workspace-core-sidecar.spec.ts src/main/workspace-core-bootstrap.spec.ts src/electron-vite-config.spec.ts`
- `pnpm --filter @cairn/desktop build`
- `pnpm run docs:lint`
- `pnpm --filter @cairn/application test -- orchestration-run-service.spec.ts`
- `pnpm --filter @cairn/workspace-core test -- app.spec.ts runtime-gateway-factory.spec.ts sqlite-application-repository.spec.ts`
- `pnpm --filter @cairn/runtime-gateway test -- codex-process.spec.ts codex-adapter.spec.ts`
- `git diff --check`

本轮必须重新运行关键验证后，才能声明当前状态通过。

2026-05-21 03:50 CST 已完成并通过的新鲜验证：

- `pnpm --filter @cairn/workspace-core typecheck`
- `pnpm --filter @cairn/workspace-core lint`
- `pnpm --filter @cairn/workspace-core test -- runtime-gateway-factory.spec.ts`
- `pnpm --filter @cairn/workspace-core test -- app.spec.ts runtime-gateway-factory.spec.ts`
- `pnpm run check`
- `pnpm test`
- `pnpm --filter @cairn/ui-preview build`
- `pnpm --filter @cairn/desktop build`
- `git diff --check`

2026-05-21 03:59 CST 追加验证：

- `pnpm exec prettier --check CHANGELOG.md`
- `git diff --check`
- `rg -n "runMockSmoke|run-mock-smoke|workspaceCore\\.runMockSmoke|Run Mock Smoke|bounded mock smoke|Desktop observer smoke" README.md CHANGELOG.md docs/STATUS.md docs/ops/internal-trial-runbook.md docs/engineering/local-dev-setup.md docs/design/security-model.md apps/desktop/src -g '*.{md,ts,tsx}'`

2026-05-21 04:29 CST 追加验证：

- `pnpm exec prettier --check apps/desktop/README.md`
- `pnpm exec markdownlint-cli2 apps/desktop/README.md`
- `git diff --check`
- `rg -n "mock smoke|bounded mock smoke|runMockSmoke|run-mock-smoke|Desktop observer smoke" apps/desktop/README.md README.md CHANGELOG.md docs/STATUS.md docs/ops/internal-trial-runbook.md docs/engineering/local-dev-setup.md docs/design/security-model.md apps/desktop/src -g '*.{md,ts,tsx}'`

2026-05-21 04:56 CST 追加验证：

- `find packages/shared_contracts packages/domain packages/storage packages/runtime_gateway packages/application packages/ui apps/ui-preview apps/desktop apps/workspace-core -name '*.spec.ts'`
- `pnpm exec prettier --check docs/STATUS.md`
- `pnpm exec markdownlint-cli2 docs/STATUS.md`
- `git diff --check`

2026-05-21 05:29 CST 追加验证：

- `pnpm exec prettier --check docs/STATUS.md docs/engineering/local-dev-setup.md`
- `pnpm exec markdownlint-cli2 docs/STATUS.md docs/engineering/local-dev-setup.md`
- `rg -n "runMockSmoke|run-mock-smoke|workspaceCore\\.runMockSmoke|Run Mock Smoke|bounded mock smoke|Desktop observer smoke|loopback-inspector|不能假设已接入 Workspace Core" README.md CHANGELOG.md docs/STATUS.md docs/ops/internal-trial-runbook.md docs/engineering/local-dev-setup.md docs/engineering/testing-strategy.md docs/design/security-model.md apps/desktop/src apps/desktop/README.md -g '*.{md,ts,tsx}'`
- `git diff --check`
- `pnpm run docs:lint`

2026-05-21 06:05 CST 追加验证：

- `pnpm --filter @cairn/desktop test -- --run src/main/workspace-core-client.spec.ts`
- `pnpm --filter @cairn/desktop test -- --run src/main/index.spec.ts`
- `pnpm --filter @cairn/desktop typecheck`
- `pnpm --filter @cairn/desktop test -- --run src/main/workspace-core-client.spec.ts src/main/index.spec.ts`
- `pnpm --filter @cairn/desktop lint`
- `pnpm --filter @cairn/desktop test -- --run src/main/index.spec.ts src/main/workspace-core-client.spec.ts src/main/workspace-core-sidecar.spec.ts src/main/workspace-core-bootstrap.spec.ts src/electron-vite-config.spec.ts`
- `pnpm --filter @cairn/desktop build`
- `pnpm exec prettier --check CHANGELOG.md docs/STATUS.md apps/desktop/README.md docs/ops/internal-trial-runbook.md apps/desktop/src/main/index.ts apps/desktop/src/main/index.spec.ts apps/desktop/src/main/workspace-core-client.ts apps/desktop/src/main/workspace-core-client.spec.ts apps/desktop/src/preload/index.ts apps/desktop/src/renderer/src/desktop-app.tsx apps/desktop/src/renderer/src/styles.css`
- `pnpm exec markdownlint-cli2 CHANGELOG.md docs/STATUS.md apps/desktop/README.md docs/ops/internal-trial-runbook.md`
- `git diff --check`
- `pnpm run docs:lint`

2026-05-21 06:20 CST 手动/文档验证：

- `command -v codex`
- `codex --help`
- `pnpm exec tsx -e "... StartRunBody.safeParse(... taskKind: 'analysis' ...) ..."`：确认旧
  runbook 示例会被当前契约拒绝。
- `pnpm exec tsx -e "... StartRunBody.safeParse(... taskKind: 'custom' ...) ..."`：确认
  `custom` 为当前可用 smoke task kind。
- Workspace Core + Codex API smoke（合成 prompt，`CAIRN_WORKSPACE_CORE_RUNTIME=codex`，
  `CAIRN_WORKSPACE_CORE_RUNTIME_WORKDIR="$PWD/.cairn/manual-smoke-20260521-0554-abs/runtime"`，
  `CAIRN_WORKSPACE_CORE_CODEX_SANDBOX_MODE=read-only`）：run / task / agent-run 均
  `succeeded`，replay-source 可读，artifact 数量 2，trace event 数量 12，error / warning
  数量均为 0。
- 同一 smoke SQLite 上调用 `POST /v1/runs/:runId/notes`：operator note 成功写入，
  replay-source 可读回 `operator.note` trace event，trace event 数量增至 13。
- `pnpm --filter @cairn/workspace-core test -- app.spec.ts runtime-gateway-factory.spec.ts sqlite-application-repository.spec.ts`
  通过：3 files / 46 tests。
- `pnpm --filter @cairn/runtime-gateway test -- codex-process.spec.ts codex-adapter.spec.ts codex-protocol.spec.ts`
  通过：3 files / 30 tests。
- `pnpm exec prettier --check CHANGELOG.md docs/STATUS.md docs/ops/internal-trial-runbook.md docs/engineering/local-dev-setup.md docs/superpowers/plans/2026-05-21-nightly-cleanup-handoff.md`
  通过。
- `pnpm exec markdownlint-cli2 CHANGELOG.md docs/STATUS.md docs/ops/internal-trial-runbook.md docs/engineering/local-dev-setup.md docs/superpowers/plans/2026-05-21-nightly-cleanup-handoff.md`
  通过。
- `pnpm run docs:lint` 通过：148 files / 0 errors。
- `git diff --check` 通过。
- stale scan 通过；唯一命中是 `docs/ops/internal-trial-runbook.md` 手动证据记录中对旧
  `taskKind: "analysis"` 的根因说明，不是当前命令示例残留。

2026-05-21 09:29 CST 追加验证：

- `pnpm --filter @cairn/desktop test -- --run src/renderer/src/run-replay-loader.spec.ts src/main/workspace-core-client.spec.ts`
- `pnpm --filter @cairn/desktop typecheck`
- `pnpm exec prettier --check apps/desktop/src/renderer/src/desktop-app.tsx apps/desktop/src/renderer/src/run-replay-loader.ts apps/desktop/src/renderer/src/run-replay-loader.spec.ts docs/superpowers/plans/2026-05-21-nightly-cleanup-handoff.md`
- `git diff --check`

2026-05-21 09:55 CST 追加验证：

- `pnpm --filter @cairn/desktop test -- --run src/main/workspace-core-sidecar.spec.ts`
  - 先按 TDD 跑出 spawn error secret/path redaction 回归失败，再补净化规则后通过。
- `pnpm --filter @cairn/desktop test -- --run src/main/workspace-core-sidecar.spec.ts src/renderer/src/run-replay-loader.spec.ts`
- `pnpm --filter @cairn/desktop typecheck`
- `pnpm exec prettier --check README.md apps/desktop/src/main/workspace-core-sidecar.ts apps/desktop/src/main/workspace-core-sidecar.spec.ts apps/desktop/src/renderer/src/desktop-app.tsx docs/superpowers/plans/2026-05-21-nightly-cleanup-handoff.md`
- `pnpm exec markdownlint-cli2 README.md docs/STATUS.md docs/ops/internal-trial-runbook.md docs/superpowers/plans/2026-05-21-nightly-cleanup-handoff.md`
- `rg -n "runMockSmoke|run-mock-smoke|workspaceCore\\.runMockSmoke|Run Mock Smoke|bounded mock smoke|Desktop observer smoke|Live actions.*disabled until reviewed|Operator actions remain disabled|不能假设已接入 Workspace Core" README.md CHANGELOG.md docs/STATUS.md docs/ops/internal-trial-runbook.md docs/engineering/local-dev-setup.md docs/engineering/testing-strategy.md docs/design/security-model.md apps/desktop/src apps/desktop/README.md -g '*.{md,ts,tsx}'`
  - 命令 exit 1，表示目标范围无命中。
- `git diff --check`

2026-05-21 10:10 CST 追加验证：

- `pnpm --filter @cairn/desktop test -- --run src/main/index.spec.ts`
  - 先按 TDD 跑出 blank rerun `operatorNote` 会触发 fetch 的失败，再补 main-process guard 后通过。
- `pnpm --filter @cairn/desktop typecheck`
- `pnpm exec prettier --check apps/desktop/src/main/index.ts apps/desktop/src/main/index.spec.ts`
- `pnpm --filter @cairn/desktop test -- --run src/main/index.spec.ts src/main/workspace-core-client.spec.ts src/main/workspace-core-sidecar.spec.ts src/renderer/src/run-replay-loader.spec.ts`
  - 4 files / 34 tests 通过。
- `pnpm exec prettier --check apps/desktop/src/main/index.ts apps/desktop/src/main/index.spec.ts docs/superpowers/plans/2026-05-21-nightly-cleanup-handoff.md`
- `rg -n "runMockSmoke|run-mock-smoke|workspaceCore\\.runMockSmoke|Run Mock Smoke|bounded mock smoke|Desktop observer smoke|Live actions.*disabled until reviewed|Operator actions remain disabled|不能假设已接入 Workspace Core" README.md CHANGELOG.md docs/STATUS.md docs/ops/internal-trial-runbook.md docs/engineering/local-dev-setup.md docs/engineering/testing-strategy.md docs/design/security-model.md apps/desktop/src apps/desktop/README.md -g '*.{md,ts,tsx}'`
  - 命令 exit 1，表示目标范围无命中。
- `git diff --check`

2026-05-21 10:39 CST 追加验证：

- `pnpm --filter @cairn/desktop test -- --run src/main/index.spec.ts`
  - 先按 TDD 跑出超长 cancel reason / retry reason / rerun operator note / operator note
    都会继续触发 `fetch failed`，再补 main-process length guard 后通过。
- `pnpm --filter @cairn/desktop typecheck`
- `pnpm --filter @cairn/desktop test -- --run src/main/index.spec.ts src/main/workspace-core-client.spec.ts src/main/workspace-core-sidecar.spec.ts src/renderer/src/run-replay-loader.spec.ts`
  - 4 files / 38 tests 通过。
- `pnpm exec prettier --write apps/desktop/src/main/index.spec.ts`
  - 仅格式化本轮新增测试。
- `rg -n "runMockSmoke|run-mock-smoke|workspaceCore\\.runMockSmoke|Run Mock Smoke|bounded mock smoke|Desktop observer smoke|Live actions.*disabled until reviewed|Operator actions remain disabled|不能假设已接入 Workspace Core" README.md CHANGELOG.md docs/STATUS.md docs/ops/internal-trial-runbook.md docs/engineering/local-dev-setup.md docs/engineering/testing-strategy.md docs/design/security-model.md apps/desktop/src apps/desktop/README.md -g '*.{md,ts,tsx}'`
  - 命令 exit 1，表示目标范围无命中。

2026-05-21 11:09 CST 追加验证：

- `pnpm --filter @cairn/desktop test -- --run src/main/index.spec.ts`
  - 先按 TDD 跑出 cancel / retry / rerun / operator note 的 malformed success response
    会原样穿过 Desktop bridge，再补 response schema guard 后通过。
- `pnpm --filter @cairn/desktop typecheck`
- `pnpm --filter @cairn/desktop test -- --run src/main/index.spec.ts src/main/workspace-core-client.spec.ts src/main/workspace-core-sidecar.spec.ts src/renderer/src/run-replay-loader.spec.ts`
  - 4 files / 46 tests 通过。
- `pnpm exec prettier --check apps/desktop/src/main/index.ts apps/desktop/src/main/index.spec.ts`
- `rg -n "runMockSmoke|run-mock-smoke|workspaceCore\\.runMockSmoke|Run Mock Smoke|bounded mock smoke|Desktop observer smoke|Live actions.*disabled until reviewed|Operator actions remain disabled|不能假设已接入 Workspace Core" README.md CHANGELOG.md docs/STATUS.md docs/ops/internal-trial-runbook.md docs/engineering/local-dev-setup.md docs/engineering/testing-strategy.md docs/design/security-model.md apps/desktop/src apps/desktop/README.md -g '*.{md,ts,tsx}'`
  - 命令 exit 1，表示目标范围无命中。

2026-05-21 11:42 CST 追加验证：

- `pnpm --filter @cairn/desktop test -- --run src/main/index.spec.ts`
  - 先按 TDD 跑出 Workspace Core non-2xx action error 会把 `token=...`、`/Users/...` 与
    loopback URL 原样穿过 Desktop bridge，再补错误文案净化后通过。
- `pnpm --filter @cairn/desktop typecheck`
- `pnpm --filter @cairn/desktop test -- --run src/main/index.spec.ts src/main/workspace-core-client.spec.ts src/main/workspace-core-sidecar.spec.ts src/renderer/src/run-replay-loader.spec.ts`
  - 4 files / 47 tests 通过。
- `pnpm exec prettier --check apps/desktop/src/main/index.ts apps/desktop/src/main/index.spec.ts docs/superpowers/plans/2026-05-21-nightly-cleanup-handoff.md`
- `pnpm exec markdownlint-cli2 docs/superpowers/plans/2026-05-21-nightly-cleanup-handoff.md`
- `rg -n "runMockSmoke|run-mock-smoke|workspaceCore\\.runMockSmoke|Run Mock Smoke|bounded mock smoke|Desktop observer smoke|Live actions.*disabled until reviewed|Operator actions remain disabled|不能假设已接入 Workspace Core" README.md CHANGELOG.md docs/STATUS.md docs/ops/internal-trial-runbook.md docs/engineering/local-dev-setup.md docs/engineering/testing-strategy.md docs/design/security-model.md apps/desktop/src apps/desktop/README.md -g '*.{md,ts,tsx}'`
  - 命令 exit 1，表示目标范围无命中。
- `git diff --check`

2026-05-21 12:08 CST 追加验证：

- `pnpm --filter @cairn/desktop test -- --run src/main/index.spec.ts`
  - 先按 TDD 跑出 Desktop action `fetch()` transport error 会把 `token=...`、`/Users/...` 与
    loopback URL 原样穿过 Desktop bridge，再补 transport error formatter 后通过。
- `pnpm --filter @cairn/desktop typecheck`
- `pnpm --filter @cairn/desktop test -- --run src/main/index.spec.ts src/main/workspace-core-client.spec.ts src/main/workspace-core-sidecar.spec.ts src/renderer/src/run-replay-loader.spec.ts`
  - 4 files / 48 tests 通过。
- `pnpm exec prettier --check apps/desktop/src/main/index.ts apps/desktop/src/main/index.spec.ts docs/superpowers/plans/2026-05-21-nightly-cleanup-handoff.md`
- `pnpm exec markdownlint-cli2 docs/superpowers/plans/2026-05-21-nightly-cleanup-handoff.md`
- `rg -n "runMockSmoke|run-mock-smoke|workspaceCore\\.runMockSmoke|Run Mock Smoke|bounded mock smoke|Desktop observer smoke|Live actions.*disabled until reviewed|Operator actions remain disabled|不能假设已接入 Workspace Core" README.md CHANGELOG.md docs/STATUS.md docs/ops/internal-trial-runbook.md docs/engineering/local-dev-setup.md docs/engineering/testing-strategy.md docs/design/security-model.md apps/desktop/src apps/desktop/README.md -g '*.{md,ts,tsx}'`
  - 命令 exit 1，表示目标范围无命中。
- `git diff --check`

2026-05-21 12:39 CST 追加验证：

- `pnpm --filter @cairn/desktop test -- --run src/main/index.spec.ts`
  - 先按 TDD 跑出 sidecar unhealthy `lastError` 会把 `token=...`、`/Users/...` 与 loopback URL
    原样穿过 Desktop bridge，再补 sidecar health error formatter 后通过。
- `pnpm --filter @cairn/desktop typecheck`
  - 先发现测试 harness 把 `workspaceCoreSidecarStatus.state` 推窄成 `"healthy"`，导致新增
    `"unhealthy"` fixture 编译失败；已把该字段显式拓宽为 `WorkspaceCoreSidecarStatus`。
- `pnpm --filter @cairn/desktop test -- --run src/main/index.spec.ts src/main/workspace-core-client.spec.ts src/main/workspace-core-sidecar.spec.ts src/renderer/src/run-replay-loader.spec.ts`
  - 4 files / 49 tests 通过。
- `pnpm exec prettier --check apps/desktop/src/main/index.ts apps/desktop/src/main/index.spec.ts docs/superpowers/plans/2026-05-21-nightly-cleanup-handoff.md`
- `pnpm exec markdownlint-cli2 docs/superpowers/plans/2026-05-21-nightly-cleanup-handoff.md`
- `rg -n "runMockSmoke|run-mock-smoke|workspaceCore\\.runMockSmoke|Run Mock Smoke|bounded mock smoke|Desktop observer smoke|Live actions.*disabled until reviewed|Operator actions remain disabled|不能假设已接入 Workspace Core" README.md CHANGELOG.md docs/STATUS.md docs/ops/internal-trial-runbook.md docs/engineering/local-dev-setup.md docs/engineering/testing-strategy.md docs/design/security-model.md apps/desktop/src apps/desktop/README.md -g '*.{md,ts,tsx}'`
  - 命令 exit 1，表示目标范围无命中。
- `git diff --check`

2026-05-21 13:09 CST 追加验证：

- `pnpm --filter @cairn/desktop test -- --run src/main/index.spec.ts`
  - 先按 TDD 跑出 `workspace-core:get-status` 会把 sidecar `status.lastError` 中的
    `token=...`、`/Users/...` 与 loopback URL 原样返回 renderer，再补 status return-path
    净化后通过：1 file / 25 tests。
- `pnpm --filter @cairn/desktop typecheck`
- `pnpm --filter @cairn/desktop test -- --run src/main/index.spec.ts src/main/workspace-core-client.spec.ts src/main/workspace-core-sidecar.spec.ts src/renderer/src/run-replay-loader.spec.ts`
  - 4 files / 50 tests 通过。
- `pnpm exec prettier --check apps/desktop/src/main/index.ts apps/desktop/src/main/index.spec.ts docs/superpowers/plans/2026-05-21-nightly-cleanup-handoff.md`
- `pnpm exec markdownlint-cli2 docs/superpowers/plans/2026-05-21-nightly-cleanup-handoff.md`
- `git diff --check`

2026-05-21 13:40 CST 追加验证：

- `pnpm --filter @cairn/desktop test -- --run src/main/index.spec.ts`
  - 先按 TDD 跑出 `workspace-core:get-status` 仍会把 internal sidecar `baseUrl` 返回 renderer；
    再补 renderer-facing `DesktopWorkspaceCoreStatus`，把 connection 改成 display-safe
    `connectionLabel: "local sidecar"` 后通过：1 file / 25 tests。
- `pnpm --filter @cairn/desktop typecheck`
- `pnpm --filter @cairn/desktop test -- --run src/main/index.spec.ts src/main/workspace-core-client.spec.ts src/main/workspace-core-sidecar.spec.ts src/renderer/src/run-replay-loader.spec.ts`
  - 4 files / 50 tests 通过。
- `pnpm --filter @cairn/desktop lint`
  - 首次运行暴露既有测试 helper 的 `require-await` 与一次 unnecessary type assertion；已做纯测试
    helper 整理后通过。
- `pnpm exec prettier --check apps/desktop/README.md docs/design/security-model.md apps/desktop/src/main/index.ts apps/desktop/src/main/index.spec.ts apps/desktop/src/preload/index.ts apps/desktop/src/renderer/src/desktop-app.tsx apps/desktop/src/renderer/src/run-replay-loader.spec.ts docs/superpowers/plans/2026-05-21-nightly-cleanup-handoff.md`
- `pnpm exec markdownlint-cli2 apps/desktop/README.md docs/design/security-model.md docs/superpowers/plans/2026-05-21-nightly-cleanup-handoff.md`
- `rg -n "runMockSmoke|run-mock-smoke|workspaceCore\\.runMockSmoke|Run Mock Smoke|bounded mock smoke|Desktop observer smoke|Live actions.*disabled until reviewed|Operator actions remain disabled|不能假设已接入 Workspace Core" README.md CHANGELOG.md docs/STATUS.md docs/ops/internal-trial-runbook.md docs/engineering/local-dev-setup.md docs/engineering/testing-strategy.md docs/design/security-model.md apps/desktop/src apps/desktop/README.md -g '*.{md,ts,tsx}'`
  - 命令 exit 1，表示目标范围无命中。
- `git diff --check`

2026-05-21 14:11 CST 追加验证：

- `pnpm --filter @cairn/desktop test -- --run src/main/index.spec.ts`
  - 新增 non-JSON Workspace Core action error body 回归测试后先直接通过：1 file / 26 tests。
  - 为验证测试有效性，临时把实现改成读取 raw text body，测试按预期失败并显示 raw body 会穿过
    bridge；随后恢复原实现，再次通过：1 file / 26 tests。
- `pnpm --filter @cairn/desktop test -- --run src/main/index.spec.ts src/main/workspace-core-client.spec.ts src/main/workspace-core-sidecar.spec.ts src/renderer/src/run-replay-loader.spec.ts`
  - 4 files / 51 tests 通过。
- `pnpm --filter @cairn/desktop typecheck`
- `pnpm --filter @cairn/desktop lint`
- `pnpm exec prettier --check apps/desktop/src/main/index.ts apps/desktop/src/main/index.spec.ts docs/superpowers/plans/2026-05-21-nightly-cleanup-handoff.md`
- `pnpm exec markdownlint-cli2 docs/superpowers/plans/2026-05-21-nightly-cleanup-handoff.md`
- `rg -n "runMockSmoke|run-mock-smoke|workspaceCore\\.runMockSmoke|Run Mock Smoke|bounded mock smoke|Desktop observer smoke|Live actions.*disabled until reviewed|Operator actions remain disabled|不能假设已接入 Workspace Core" README.md CHANGELOG.md docs/STATUS.md docs/ops/internal-trial-runbook.md docs/engineering/local-dev-setup.md docs/engineering/testing-strategy.md docs/design/security-model.md apps/desktop/src apps/desktop/README.md -g '*.{md,ts,tsx}'`
  - 命令 exit 1，表示目标范围无命中。
- `git diff --check`

2026-05-21 14:38 CST 追加验证：

- `pnpm run check` 通过：
  - typecheck：12 tasks successful。
  - lint：9 tasks successful。
  - docs lint：148 files / 0 errors。
  - format check：All matched files use Prettier code style。
- `pnpm test` 通过：
  - packages/apps 测试任务全部成功。
  - Desktop 本轮 fresh run：6 files / 59 tests。
  - Workspace Core 当前测试基线：6 files / 59 tests。
  - Shared contracts 当前测试基线：16 files / 174 tests。
- `pnpm --filter @cairn/ui-preview build` 通过。
- `pnpm --filter @cairn/desktop build` 通过。
- `rg -n "runMockSmoke|run-mock-smoke|workspaceCore\\.runMockSmoke|Run Mock Smoke|bounded mock smoke|Desktop observer smoke|Live actions.*disabled until reviewed|Operator actions remain disabled|不能假设已接入 Workspace Core" README.md CHANGELOG.md docs/STATUS.md docs/ops/internal-trial-runbook.md docs/engineering/local-dev-setup.md docs/engineering/testing-strategy.md docs/design/security-model.md apps/desktop/src apps/desktop/README.md -g '*.{md,ts,tsx}'`
  - 命令 exit 1，表示目标范围无命中。
- `git diff --check`

2026-05-21 15:05 CST 追加验证：

- `git status --short`
- `git diff --name-only`
- `git diff --stat`
  - 当前未提交区约 43 个 tracked files、3924 additions / 493 deletions。
- `git diff --numstat`
- `git ls-files --others --exclude-standard`
  - 当前未跟踪文件 6 个，均已在 §4.4 记录。
- 本轮只读审计和 handoff 更新后，仍需执行 handoff 文档格式校验、markdownlint、`git diff --check`。

2026-05-21 15:14 CST 追加验证：

- `pnpm --filter @cairn/shared-contracts test -- src/contracts/index.spec.ts src/schemas/run-replay-source.spec.ts`
  通过：2 files / 24 tests。
- `pnpm --filter @cairn/shared-contracts typecheck` 通过。
- `pnpm --filter @cairn/shared-contracts lint` 通过。
- `pnpm exec prettier --check packages/shared_contracts/src/contracts/index.spec.ts packages/shared_contracts/src/schemas/run-replay-source.spec.ts`
  通过。
- `git diff --check` 通过。
- 已只 stage `packages/shared_contracts/src/contracts/index.spec.ts` 与
  `packages/shared_contracts/src/schemas/run-replay-source.spec.ts`，并提交 `54c31f4`
  `test(contracts): 补齐回放契约覆盖 / cover replay contracts`。

2026-05-21 15:29 CST 追加验证：

- `pnpm --filter @cairn/runtime-gateway test -- codex-process.spec.ts codex-adapter.spec.ts codex-protocol.spec.ts`
  通过：3 files / 30 tests。
- `pnpm --filter @cairn/application test -- orchestration-run-service.spec.ts` 通过：1 file / 26 tests。
- `pnpm --filter @cairn/runtime-gateway typecheck` 通过。
- `pnpm --filter @cairn/application typecheck` 通过。
- `pnpm --filter @cairn/runtime-gateway lint` 通过。
- `pnpm --filter @cairn/application lint` 通过。
- `pnpm exec prettier --check packages/application/src/orchestration/orchestration-run-service.ts packages/application/src/orchestration/orchestration-run-service.spec.ts packages/runtime_gateway/src/adapters/codex/codex-adapter.ts packages/runtime_gateway/src/adapters/codex/codex-adapter.spec.ts packages/runtime_gateway/src/adapters/codex/codex-errors.ts packages/runtime_gateway/src/adapters/codex/codex-process.ts packages/runtime_gateway/src/adapters/codex/codex-process.spec.ts packages/runtime_gateway/src/adapters/codex/codex-protocol.spec.ts`
  通过。
- `git diff --check` 通过。
- 已只 stage runtime/application 8 个文件，并提交 `7ae1498`
  `fix(runtime): 收紧 Codex 终态证据 / harden codex terminal evidence`。

2026-05-21 15:39 CST 追加验证：

- `pnpm --filter @cairn/workspace-core test -- local-artifact-store.spec.ts app.spec.ts runtime-gateway-factory.spec.ts sqlite-application-repository.spec.ts`
  通过：4 files / 55 tests。
- `pnpm --filter @cairn/workspace-core typecheck` 通过。
- `pnpm --filter @cairn/workspace-core lint` 通过。
- `pnpm exec prettier --check apps/workspace-core/src/artifacts/local-artifact-store.ts apps/workspace-core/src/artifacts/local-artifact-store.spec.ts apps/workspace-core/src/runtime/runtime-adapter-gateway-port.ts apps/workspace-core/src/runtime/runtime-gateway-factory.ts apps/workspace-core/src/runtime/runtime-gateway-factory.spec.ts apps/workspace-core/src/service/app.ts apps/workspace-core/src/service/app.spec.ts apps/workspace-core/src/storage/sqlite-application-repository.spec.ts`
  通过。
- `git diff --check` 通过。
- 检修结果：Workspace Core chunk 未发现需额外修复的 blocker；已只 stage 8 个 Workspace Core 文件，
  并提交 `b1a98ba` `fix(core): 收紧回放证据读取 / harden replay evidence reads`。

2026-05-21 16:42 CST 追加验证：

- `pnpm --filter @cairn/desktop test -- --run src/electron-vite-config.spec.ts` 通过：1 file / 2 tests。
- `pnpm --filter @cairn/desktop typecheck` 通过。
- `pnpm --filter @cairn/desktop lint` 通过。
- `pnpm exec prettier --check apps/desktop/electron.vite.config.ts apps/desktop/src/electron-vite-config.spec.ts`
  通过。
- `git diff --check` 通过。
- 已只 stage Desktop config 2 个文件，并提交 `aaea412`
  `fix(desktop): 修正 preload 构建输出 / fix preload build output`。

2026-05-21 16:56 CST 追加验证：

- `pnpm --filter @cairn/desktop test -- --run src/main/index.spec.ts src/main/workspace-core-client.spec.ts src/main/workspace-core-sidecar.spec.ts src/main/workspace-core-bootstrap.spec.ts`
  通过：4 files / 55 tests。
- `pnpm --filter @cairn/desktop typecheck` 通过。
- `pnpm --filter @cairn/desktop lint` 通过。
- `pnpm exec prettier --check apps/desktop/src/main/index.ts apps/desktop/src/main/index.spec.ts apps/desktop/src/main/workspace-core-client.ts apps/desktop/src/main/workspace-core-client.spec.ts apps/desktop/src/main/workspace-core-sidecar.ts apps/desktop/src/main/workspace-core-sidecar.spec.ts apps/desktop/src/main/workspace-core-bootstrap.ts apps/desktop/src/main/workspace-core-bootstrap.spec.ts`
  通过。
- `git diff --check` 通过。
- 已只 stage Desktop main/client/sidecar/bootstrap 8 个文件，并提交 `09120c1`
  `feat(desktop): 收紧 Core 桥接边界 / harden core bridge boundary`。

### 5.1 本轮验证结果摘要

- `apps/desktop/src/renderer/src/run-replay-loader.ts` 已拆出并接入 `DesktopApp`，latest-request-wins 的 replay 载入逻辑现在有独立单测覆盖。
- `apps/desktop/src/renderer/src/run-replay-loader.spec.ts` 通过：2 tests。
- `pnpm --filter @cairn/desktop test -- --run src/renderer/src/run-replay-loader.spec.ts src/main/workspace-core-client.spec.ts` 通过：2 files / 13 tests。
- `pnpm --filter @cairn/desktop typecheck` 通过。
- `pnpm exec prettier --check apps/desktop/src/renderer/src/desktop-app.tsx apps/desktop/src/renderer/src/run-replay-loader.ts apps/desktop/src/renderer/src/run-replay-loader.spec.ts docs/superpowers/plans/2026-05-21-nightly-cleanup-handoff.md` 通过。
- `git diff --check` 通过。
- 这轮仍没有扩到 Desktop 全量或 workspace-core 全量 gate；当前验证只覆盖本轮变更面与既有 desktop main client 回归。
- `apps/desktop/src/main/workspace-core-sidecar.ts` 的 sidecar diagnostic redaction 已补齐 spawn error
  路径 / token-like 小写 key 场景；stderr tail 现在缓存净化后的文本，降低后续误暴露到 renderer /
  diagnostic snapshot 的风险。
- `README.md` 与 `apps/desktop/src/renderer/src/desktop-app.tsx` 已对齐当前事实：Desktop 是
  internal-trial allowlist / dev sidecar bridge，不再写成 sidecar/preload/live actions 完全未接。
- 本轮 targeted verification 通过；仍未重跑全量 `pnpm run check` / `pnpm test`。
- `apps/desktop/src/main/index.ts` 的 mutating IPC allowlist 已补一条边界：`workspace-core:rerun`
  若收到空白 `operatorNote`，会在 main 进程内拒绝，不再触发 sidecar health / Core HTTP request。
- `apps/desktop/src/main/index.spec.ts` 新增对应回归测试；本轮 Desktop targeted gate 覆盖
  main IPC、Workspace Core client、sidecar manager 与 replay loader，共 38 tests。
- `apps/desktop/src/main/index.ts` 的 mutating IPC allowlist 继续对齐 shared contracts：
  cancel/retry reason 超过 1000 字符、rerun/operator note 超过 4000 字符时，均在 main
  process 内拒绝，不触发 sidecar health 或 Core HTTP。
- `apps/desktop/src/main/index.spec.ts` 新增 4 个长度边界回归测试；本轮未重跑全量
  `pnpm run check` / `pnpm test`。
- `apps/desktop/src/main/index.ts` 的 mutating IPC allowlist 现在会校验 Workspace Core action
  success response：cancel/rerun 使用 `OrchestrationRun` schema，retry task 使用 `{ taskId,
newAttempt }` schema，operator note 使用 `{ messageId, traceEventId }` schema。
- `apps/desktop/src/main/index.spec.ts` 新增 8 个 action bridge 测试，覆盖 valid payload 转发与
  malformed success response 拦截；本轮 Desktop targeted gate 覆盖 main IPC、Workspace Core
  client、sidecar manager 与 replay loader，共 46 tests。
- `apps/desktop/src/main/index.ts` 的 mutating IPC action error path 现在会在返回 renderer 前净化
  Workspace Core non-2xx 错误文案，覆盖 bearer/token-like 片段、loopback URL 与真实本机路径；
  稳定错误 code 会保留，异常 code 会降级为 `WORKSPACE_CORE_ERROR`。
- `apps/desktop/src/main/index.spec.ts` 新增 non-2xx action error redaction 回归测试；本轮
  Desktop targeted gate 覆盖 main IPC、Workspace Core client、sidecar manager 与 replay loader，
  共 47 tests。
- `apps/desktop/src/main/index.ts` 的 mutating IPC action transport error path 现在会在 `fetch()`
  reject 时返回 renderer-safe 错误文案，并复用同一套 redaction helper 净化 token-like 片段、
  loopback URL 与真实本机路径。
- `apps/desktop/src/main/index.spec.ts` 新增 transport error redaction 回归测试；本轮 Desktop
  targeted gate 覆盖 main IPC、Workspace Core client、sidecar manager 与 replay loader，共 48 tests。
- `apps/desktop/src/main/index.ts` 的 sidecar health error path 现在会在 `getHealthyWorkspaceCoreStatus()`
  返回非 healthy 状态时净化 `status.lastError`，避免不可信诊断文本从 main process 直接穿过 renderer。
- `apps/desktop/src/main/index.spec.ts` 新增 unhealthy sidecar error redaction 回归测试，并拓宽测试
  harness 的 sidecar status fixture 类型；本轮 Desktop targeted gate 覆盖 main IPC、Workspace Core
  client、sidecar manager 与 replay loader，共 49 tests。
- `apps/desktop/src/main/index.ts` 的 `workspace-core:get-status` return path 现在会净化
  `status.lastError` 后再返回 renderer，避免 Settings / status UI 显示 token-like 片段、真实本机路径
  或 loopback URL。
- `apps/desktop/src/main/index.spec.ts` 新增 status diagnostics redaction 回归测试；本轮 Desktop
  targeted gate 覆盖 main IPC、Workspace Core client、sidecar manager 与 replay loader，共 50 tests。
- `apps/desktop/src/main/index.ts` 现在导出 renderer-facing `DesktopWorkspaceCoreStatus`，让
  `workspace-core:get-status` 不再把 internal sidecar `baseUrl` 返回 renderer；preload / renderer
  改用 display-safe `connectionLabel`。
- `apps/desktop/src/main/index.spec.ts` 更新 status bridge 回归测试，明确断言 status DTO 不含
  `baseUrl`；`apps/desktop/src/renderer/src/desktop-app.tsx` 的 Connection 展示改为
  `connectionLabel`。
- 同步 `apps/desktop/README.md` 与 `docs/design/security-model.md`，说明 renderer-facing Core
  status 不返回 token 或 loopback base URL。
- `apps/desktop/src/main/index.spec.ts` 新增 non-JSON action error body 回归测试，确认
  Workspace Core 返回 `text/plain` / 非 JSON 失败 body 时，renderer 只收到稳定 fallback
  `Workspace Core request failed with 502.`，不会看到 raw token、本地路径或 loopback URL；现有实现无需
  生产代码改动。
- 本轮 Desktop targeted gate 覆盖 main IPC、Workspace Core client、sidecar manager 与 replay
  loader，共 51 tests；仍未重跑全量 `pnpm run check` / `pnpm test`。
- 2026-05-21 14:38 CST 已在后续轮次补跑全量 gate：`pnpm run check`、`pnpm test`、
  `pnpm --filter @cairn/ui-preview build` 与 `pnpm --filter @cairn/desktop build` 均通过。

---

## 6. 本轮即时任务

1. 更新自动化 prompt，让后续轮次先读并最后更新本 handoff。
2. 并行审计 Desktop、Workspace Core/Runtime/Application、Docs 三条线。
3. 清理当前状态文档中的 stale wording 与明显不一致。
4. 跑 stale-current-state scan：

```bash
rg -n "runMockSmoke|run-mock-smoke|workspaceCore\\.runMockSmoke|Run Mock Smoke|bounded mock smoke|Desktop observer smoke" README.md CHANGELOG.md docs/STATUS.md docs/ops/internal-trial-runbook.md docs/engineering/local-dev-setup.md docs/design/security-model.md apps/desktop/src -g '*.{md,ts,tsx}'
```

1. 跑 targeted verification，并在本文件更新结果。

---

## 7. 已完成事项

- 建立跨轮交接文档，并把自动化 prompt 改成 handoff-first。
- 完成 Desktop / Core / Runtime / Docs 三线审计，确认没有阻塞问题。
- 收口 `apps/desktop` sidecar diagnostics，避免 raw stderr 与敏感片段直接进入 UI/诊断。
- 对齐 Desktop 当前 internal-trial 文案，去掉“disabled”这类过时说法。
- 修正 `docs/STATUS.md`、`docs/ops/internal-trial-runbook.md`、`docs/engineering/local-dev-setup.md`、`docs/engineering/testing-strategy.md` 与内部试用实现计划中的若干 current-state 冲突。
- 修正 `packages/runtime_gateway` 的 Codex 相关回归测试，使其与当前实现一致。
- 修正 `apps/workspace-core` artifact 边界与错误码回归测试。
- 修正 `apps/workspace-core/src/runtime/runtime-gateway-factory.spec.ts` 中
  `query` 测试使用普通字符串调用 branded `AgentRunId` 的 typecheck 阻塞，改为
  `AgentRunId.parse(...)` 生成合法测试 id。
- 修正 `apps/workspace-core` lint 问题：调整 runtime gateway factory type import 顺序，并把
  `app.spec.ts` 的 fake artifact store async 方法改为显式 `Promise` 返回，避免无 `await`
  的测试 helper。
- 对 Prettier 点名的 13 个已有 dirty 文件做纯格式化，使 `format:check` 纳入全量 gate。
- 这轮做了 stale-current-state scan，未在目标范围内找到新的 `runMockSmoke` / `bounded mock smoke`
  代码残留；仅将 `CHANGELOG.md` 中 2 处历史措辞收口为当前 `internal-trial` 口径。
- 追加审计发现 `apps/desktop/README.md` 仍描述旧的 `runMockSmoke()` / bounded mock smoke；
  已改成当前 `runInternalTrial()`、只读 replay-source 与最小 internal-trial operator action
  allowlist 口径，同时保持“完整 operator workflow 仍未完成”的边界。
- 复核当前 `*.spec.ts` 文件数，发现 `docs/STATUS.md` 测试覆盖分布表落后于实际文件：
  `packages/shared_contracts` 已是 16 个 spec，`apps/desktop` 已是 5 个 spec；已同步表格与
  Desktop 覆盖重点。
- 复核 current-state 文档，发现 `docs/STATUS.md` 协作提醒仍把 `apps/desktop/src` 描述为
  “不能假设已接入 Workspace Core 或 sidecar”；已改为当前事实：Desktop 已有最小 Workspace Core
  dev sidecar bridge 与 internal-trial allowlist，但仍不能假设完整产品数据面或完整 operator UI。
- 复核 `docs/engineering/local-dev-setup.md` 调试章节，发现仍提到待写
  `apps/desktop/src/dev/loopback-inspector.ts`；已改为当前已存在的
  `<userData>/diagnostics/workspace-core-sidecar.json` 诊断快照口径，并明确该输出不得包含
  bearer token、真实业务 payload 或凭据。
- 只读审计了 Desktop bridge / Workspace Core replay-source / local artifact store /
  runtime gateway factory / Codex adapter / application orchestration 的当前关键路径，未发现
  适合本轮低风险插入的代码修复；旧 `runMockSmoke` 命名未出现在当前目标代码/文档范围。
- 补齐 Desktop artifact payload 最小只读查看能力：
  - main/client 新增 `getWorkspaceCoreArtifactPayload()` 与 `parseWorkspaceCoreArtifactId()`，
    只接受 branded ArtifactId，并调用 Workspace Core 既有 `GET /v1/artifacts/:artifactId/payload`。
  - preload 新增 `workspaceCore.getArtifactPayload(artifactId)` allowlist，不暴露任意 URL、文件路径或 token。
  - renderer Run Detail 的 artifact summary 可按需加载 bounded payload text，仍隐藏本地路径，不做导出、
    reveal 或完整 Artifact workspace。
- 本轮继续收敛 Desktop renderer 交互：
  - replay 载入从组件内抽成 `run-replay-loader.ts`，避免 `latest request wins` 逻辑和 UI 状态更新纠缠在一起。
  - 新增 `run-replay-loader.spec.ts`，验证替换 run 时先清空 stale replay，以及 out-of-order resolve 不会覆盖较新的 replay source。
  - `DesktopApp` 继续保留 bounded operator actions、artifact payload preview 与 observed run 持久化，但当前仍是 internal-trial 观察壳，不是完整产品 UI。
- 收紧 Desktop sidecar diagnostics：
  - `WorkspaceCoreSidecarManager` 的 `stderrTail` 改为缓存净化后的文本，避免 raw stderr 后续误进
    renderer status 或 `<userData>/diagnostics/workspace-core-sidecar.json`。
  - 新增 spawn error redaction 回归测试，覆盖绝对路径与小写 `token=...` 片段。
  - README 与 renderer Settings copy 同步为 current-state 口径：internal-trial allowlist、dev bridge、
    bounded operator actions。
- 补齐 Desktop mutating IPC allowlist 的一个低风险 guard：
  - `workspace-core:rerun` 对空白 `operatorNote` 现在与 operator note 入口保持一致，直接在 main
    process 抛出 `Rerun operator note must be a non-empty string.`。
  - 新增回归测试确认该非法入参不会触发 sidecar `getStatus()` / `start()`，也不会进入 Core HTTP。
- 补齐 Desktop mutating IPC allowlist 的长度边界：
  - `workspace-core:cancel-run` / `workspace-core:retry-task` 的 reason 上限按 shared contract 保持
    1000 字符。
  - `workspace-core:rerun` 的 `operatorNote` 与 `workspace-core:add-operator-note` 的 note 上限按
    shared contract 保持 4000 字符。
  - 新增回归测试确认这些非法入参不会触发 sidecar `getStatus()` / `start()`，也不会进入 Core HTTP。
- 补齐 Desktop mutating IPC allowlist 的成功响应边界：
  - cancel / rerun 的成功 payload 必须满足 shared `OrchestrationRun` schema。
  - retry task 的成功 payload 必须包含 branded `taskId` 与 non-negative integer `newAttempt`。
  - operator note 的成功 payload 必须包含非空 `messageId` 与 `traceEventId`。
  - 新增回归测试确认合法 payload 按 contract body 转发，malformed success response 不会返回给 renderer。
- 同步 `CHANGELOG.md`、`docs/STATUS.md`、`apps/desktop/README.md` 与
  `docs/ops/internal-trial-runbook.md`，把该能力写成“bounded payload preview”，避免夸大为完整
  Artifact UI。
- 执行真实 Codex API smoke 并补充手动证据：
  - 先按 runbook 旧示例复现到 API `400`，根因是 `taskKind: "analysis"` 已不在当前
    `TaskKind` 契约中；已把 `docs/ops/internal-trial-runbook.md` 与
    `docs/engineering/local-dev-setup.md` 的 smoke 示例改为 `taskKind: "custom"`。
  - 再用相对 `CAIRN_WORKSPACE_CORE_RUNTIME_WORKDIR=.cairn/...` 复现 Codex CLI
    `os error 2`，根因是 `pnpm --filter @cairn/workspace-core start/dev` 会在
    `apps/workspace-core` 包目录执行脚本，导致相对 runtime workdir 与仓库根预期不一致；
    已把文档示例改为 `$PWD/.cairn/...` 绝对路径，并解释该边界。
  - 用绝对 runtime workdir 完成一次 Workspace Core + Codex API smoke：run / task /
    agent-run 均 `succeeded`，replay-source 可读，artifact 数量 2，trace event 数量 12，
    error / warning 数量均为 0。
  - 对同一 run 调用 operator note，replay-source 可读回 `operator.note`，trace event 数量
    增至 13。
  - 已同步 `docs/ops/internal-trial-runbook.md`、`docs/engineering/local-dev-setup.md`、
    `docs/STATUS.md` 与 `CHANGELOG.md`。已完成一次 Desktop 同一真实 run 的 window-level
    观察路径并成功读取 replay evidence、bounded payload text 与 operator note，但自动化 E2E
    仍未补齐，因此仍不能把这写成“完整自动化端到端已覆盖”。
- 已跑并通过：
  - `pnpm run docs:lint`
  - `pnpm --filter @cairn/workspace-core test -- local-artifact-store.spec.ts app.spec.ts runtime-gateway-factory.spec.ts sqlite-application-repository.spec.ts`
  - `pnpm --filter @cairn/runtime-gateway test -- codex-process.spec.ts codex-adapter.spec.ts codex-protocol.spec.ts`
  - `pnpm --filter @cairn/desktop lint`
  - `pnpm --filter @cairn/desktop typecheck`
  - `pnpm --filter @cairn/desktop test -- --run src/main/index.spec.ts src/main/workspace-core-client.spec.ts src/main/workspace-core-sidecar.spec.ts src/main/workspace-core-bootstrap.spec.ts src/electron-vite-config.spec.ts`
  - `pnpm --filter @cairn/desktop build`
  - `pnpm run check`
  - `pnpm test`
  - `pnpm --filter @cairn/ui-preview build`
  - `git diff --check`
  - `pnpm exec prettier --check CHANGELOG.md`
  - `pnpm exec prettier --check apps/desktop/README.md`
- `pnpm --filter @cairn/desktop test -- --run src/renderer/src/run-replay-loader.spec.ts src/main/workspace-core-client.spec.ts`
- `pnpm --filter @cairn/desktop typecheck`
- `pnpm exec prettier --check apps/desktop/src/renderer/src/desktop-app.tsx apps/desktop/src/renderer/src/run-replay-loader.ts apps/desktop/src/renderer/src/run-replay-loader.spec.ts docs/superpowers/plans/2026-05-21-nightly-cleanup-handoff.md`
  - `pnpm exec markdownlint-cli2 apps/desktop/README.md`
  - `pnpm exec prettier --check docs/STATUS.md`
  - `pnpm exec markdownlint-cli2 docs/STATUS.md`
  - `pnpm exec prettier --check docs/STATUS.md docs/engineering/local-dev-setup.md`
  - `pnpm exec markdownlint-cli2 docs/STATUS.md docs/engineering/local-dev-setup.md`
  - `pnpm run docs:lint`
  - `pnpm --filter @cairn/desktop lint`
  - `pnpm --filter @cairn/desktop typecheck`
  - `pnpm --filter @cairn/desktop test -- --run src/main/index.spec.ts src/main/workspace-core-client.spec.ts src/main/workspace-core-sidecar.spec.ts src/main/workspace-core-bootstrap.spec.ts src/electron-vite-config.spec.ts`
  - `pnpm --filter @cairn/desktop build`
  - `pnpm exec prettier --check CHANGELOG.md docs/STATUS.md apps/desktop/README.md docs/ops/internal-trial-runbook.md apps/desktop/src/main/index.ts apps/desktop/src/main/index.spec.ts apps/desktop/src/main/workspace-core-client.ts apps/desktop/src/main/workspace-core-client.spec.ts apps/desktop/src/preload/index.ts apps/desktop/src/renderer/src/desktop-app.tsx apps/desktop/src/renderer/src/styles.css`
  - `pnpm exec markdownlint-cli2 CHANGELOG.md docs/STATUS.md apps/desktop/README.md docs/ops/internal-trial-runbook.md`
  - `pnpm --filter @cairn/workspace-core test -- app.spec.ts runtime-gateway-factory.spec.ts sqlite-application-repository.spec.ts`
  - `pnpm --filter @cairn/runtime-gateway test -- codex-process.spec.ts codex-adapter.spec.ts codex-protocol.spec.ts`
  - `pnpm exec prettier --check CHANGELOG.md docs/STATUS.md docs/ops/internal-trial-runbook.md docs/engineering/local-dev-setup.md docs/superpowers/plans/2026-05-21-nightly-cleanup-handoff.md`
  - `pnpm exec markdownlint-cli2 CHANGELOG.md docs/STATUS.md docs/ops/internal-trial-runbook.md docs/engineering/local-dev-setup.md docs/superpowers/plans/2026-05-21-nightly-cleanup-handoff.md`
  - `pnpm run docs:lint`
  - `git diff --check`

---

## 8. 当前剩余事项

- 仍有大量历史/主线改动处于 dirty worktree，需要后续按短分支或 PR 继续收口。
- 当前宽 diff 已经进入更适合拆 review chunk 的阶段；除非发现明确 blocker，下一轮优先按 §4.4
  拆分提交/PR，而不是继续在 Desktop bridge 或 docs 上追加零散小改。
- Desktop artifact payload 最小只读查看能力已补；后续只做小 polish、手动 smoke 截图/记录或更完整
  Artifact workspace 设计，不要在当前 internal trial 里扩成路径 reveal / 导出 / 文件系统操作。
- 真实 Workspace Core + Codex API smoke 已有一条成功手动证据，且 Desktop window-level 观察也已
  成功补齐一次；下一轮优先补更长的真实 Codex smoke、自动化 E2E 与更完整的 payload / long-run
  证据，不要把“自动化未补齐”误写成“真实 trial 未完成”。
- `docs/ops/internal-trial-runbook.md` 的最终 gate 已有一次手动成功证据；后续若继续推进，优先
  收集重复性、长任务与自动化覆盖，而不是再回头补同一条最小 window-level 证据。
- 2026-05-21 14:38 CST 已补跑全量 `pnpm run check`、`pnpm test`、UI preview build 与
  Desktop build；后续若继续改代码，仍需重新跑与改动范围匹配的 targeted verification，并在收口前
  至少重跑 `pnpm run check` 或说明未跑原因。
- stale-current-state scan 没发现新的代码残留，当前可优先继续做文档/dirty worktree 收口，
  不必为 `runMockSmoke` 类历史词汇再开额外修复。
- 当前状态文档范围内的旧 smoke 命名已清理；剩余旧词主要在历史 spec/plan 里作为实现记录存在，
  暂不机械改写。
- `docs/STATUS.md` 的测试覆盖表已对齐当前 spec 文件数；后续新增 spec 时继续同步该表，
  否则短分支/PR 说明里容易出现测试基线漂移。
- `docs/STATUS.md` 与 `docs/engineering/local-dev-setup.md` 的 current-state 口径已对齐：
  Desktop 已有最小 bridge / internal-trial allowlist / sidecar diagnostic snapshot，但仍不是完整
  Desktop 产品数据面、完整 operator UI 或安装器验证。
- Replay source 当前返回的是 sanitized artifact metadata 与 opaque `payloadRef`；Desktop payload
  preview 已改为按 artifact id 懒加载 bounded payload API，不把 payload 全量塞进 replay-source，
  也不暴露本地路径。
- Desktop `workspace-core:get-status` 已切到 renderer-facing status DTO：`lastError` 会净化，
  connection 只返回 display-safe label，不再把 internal sidecar `baseUrl` 暴露给 renderer。
- Desktop mutating IPC 的 non-JSON Workspace Core action error body 已有回归覆盖；当前实现只尝试
  JSON error envelope，无法解析时返回稳定 HTTP status fallback，不读取 raw text body。

---

## 9. 禁止事项

- 不创建 `apps/web`。
- 不把 Desktop sidecar 默认 runtime 改成 Codex；默认必须保持 mock，真实 Codex 只能 env opt-in。
- 不宣称 public alpha、installer、signing、notarization 已完成。
- 不引入 enterprise governance、marketplace、workflow builder。
- 不回滚用户或其他 agent 的改动。
- 不把 token、真实本地路径、业务 payload 或凭据写进文档、诊断或 UI。

---

## 10. 下一轮建议任务

- 继续审计 broad dirty worktree，按“内部试用主线 / 文档同步 / 纯格式化 / 疑似无关”
  进一步拆分，准备短分支或 PR。
- 优先记录 Desktop 读取同一条真实 Codex run 的 window-level 观察证据，或用
  `CAIRN_DESKTOP_SIDECAR_RUNTIME=codex` 记录 Desktop 自拉起 sidecar 的真实 run evidence。
- 继续审计 broad dirty worktree，准备把 Desktop/Core/Runtime/docs 主线拆成短分支或 PR；优先避免把
  纯格式化、文档同步和行为改动混在同一个 review chunk。
- 复核 `apps/desktop` renderer 当前 internal-trial UI 文案与状态摘要，优先保持“能跑通”
  而不是提前做大 UI 升级。
- 若继续 polish Desktop artifact payload preview，仅限可验证小改：错误态文案、payload truncation
  提示、或内部试用截图记录；不要新增本地路径 reveal 或文件导出。
- Desktop main IPC mutating allowlist 的基础非法入参、长度边界、valid payload 转发、malformed
  success response 拦截、Workspace Core non-2xx 错误文案净化、fetch transport error 净化与 sidecar
  unhealthy `lastError` 净化、non-JSON Core error body fallback 已覆盖；下一轮若继续补 Desktop
  bridge，优先抽出 main IPC action helper 降低重复逻辑，或开始拆分 Desktop/Core/Runtime/docs
  review chunk。
- Desktop status bridge 已覆盖 `lastError` 净化与 `baseUrl` 隐藏；下一轮若继续 Desktop bridge
  hardening，可优先进一步抽出 action request helper，或补自动化 window-level smoke，而不是重复
  覆盖已完成的 non-JSON error body 边界。
- 下一轮也可以继续做一次 docs consistency pass，重点复核 `README.md`、`docs/STATUS.md`、
  `docs/ops/internal-trial-runbook.md` 对 Desktop 自拉起 sidecar 与外部手动 Workspace Core smoke
  的区别是否保持清楚。
- 当前更适合进入“拆 review chunk / 准备短分支或 PR”的阶段；除非发现明确 blocker，下一轮不要继续
  在 Desktop bridge 上重复加安全边界测试。
- 推荐下一轮继续拆 **Desktop preload + renderer replay-loader chunk**；**Contracts/schema chunk**
  已在 `54c31f4` 收口，**Runtime Gateway + Application chunk** 已在 `7ae1498` 收口，
  **Workspace Core evidence/storage chunk** 已在 `b1a98ba` 收口，**Desktop config chunk** 已在
  `aaea412` 收口，**Desktop main/client/sidecar bridge chunk** 已在 `09120c1` 收口。剩余建议按
  preload、renderer/replay-loader、preview-data、docs/runbook 分子提交。

---

## 11. 本轮日志

### 2026-05-21 01:52 CST

- 创建本 handoff 文件。
- 当前分支：`develop`。
- 当前基线提交：`56aa3894db1cd99d023c80595d087f5cbaf968a7`。
- 当前 dirty worktree 包含 Desktop、Workspace Core、Runtime Gateway、Application、shared contracts 与内部试用文档改动。

### 2026-05-21 02:53 CST

- 完成本轮 nightly cleanup 的代码、文档与验证收口。
- 当前 worktree 仍未清空，但已确认本轮新增/修改均围绕 internal trial、runtime gateway、artifact/store 与 docs 对齐。

### 2026-05-21 03:50 CST

- 接上上一轮 `pnpm run check` 暴露的唯一 blocker：
  `runtime-gateway-factory.spec.ts` 用普通字符串调用 branded `AgentRunId`。
- 修复 branded id 测试输入、workspace-core lint import/order 与 fake artifact store
  `require-await` 问题。
- 对 Prettier 点名的 13 个文件做纯格式化。
- 重新跑并通过 `pnpm run check`、`pnpm test`、`pnpm --filter @cairn/ui-preview build`、
  `pnpm --filter @cairn/desktop build` 与 `git diff --check`。
- 当前 worktree 仍有大量 internal trial / docs 主线改动，未 stage、未 commit；没有发现明确无关改动，但后续仍需拆分收口。

### 2026-05-21 03:59 CST

- 执行 stale-current-state scan，目标范围内未发现新的 `runMockSmoke` / `bounded mock smoke`
  代码残留。
- 仅收口 `CHANGELOG.md` 中 2 处历史措辞，改成当前 `internal-trial` / `runInternalTrial`
  口径。
- 追加验证 `pnpm exec prettier --check CHANGELOG.md`、`git diff --check`，二者均通过。
- 当前 dirty worktree 仍以 internal trial 主线与文档同步改动为主，没有新增 blocker；可继续按
  “内部试用主线 / 文档同步 / 纯格式化 / 疑似无关” 拆分推进。

### 2026-05-21 04:29 CST

- 发现并收口 `apps/desktop/README.md` 的过时 Desktop bridge 描述：
  `runMockSmoke()` / bounded mock smoke 改为当前 `runInternalTrial()`、只读 replay-source 与最小
  internal-trial operator action allowlist。
- 重新强调 Desktop 仍没有完整 runtime action coverage 与 full operator workflows，避免文档夸大。
- 通过 `pnpm exec prettier --check apps/desktop/README.md`、
  `pnpm exec markdownlint-cli2 apps/desktop/README.md` 与 `git diff --check`。
- 当前状态文档和 `apps/desktop/src` 范围已不再命中旧 smoke 命名；历史 spec/plan 中保留旧词作为历史记录。

### 2026-05-21 04:56 CST

- 复核当前 spec 文件数，并同步 `docs/STATUS.md` 测试覆盖分布表：
  `packages/shared_contracts` 从 12 调整为 16，`apps/desktop` 从 4 调整为 5，并补充
  Electron Vite config 覆盖说明。
- 通过 `pnpm exec prettier --check docs/STATUS.md`、
  `pnpm exec markdownlint-cli2 docs/STATUS.md` 与 `git diff --check`。
- 本轮未做代码行为改动；dirty worktree 仍以 internal trial 主线与文档同步为主。

### 2026-05-21 05:29 CST

- 开始时重新读取本 handoff、AGENTS 必读上下文，并运行 `git status --short` /
  `git diff --name-only` 复核 dirty worktree；当前仍在 `develop`，dirty 面仍集中于
  internal trial 主线、Desktop/Core/Runtime 代码、文档同步与新建 runbook/handoff。
- 收口 `docs/STATUS.md` 协作提醒，避免后续 agent 被旧“Desktop 尚未接入 sidecar”口径误导；
  当前事实是已有最小 Workspace Core dev sidecar bridge，但不能假设完整产品数据面。
- 收口 `docs/engineering/local-dev-setup.md` 的待写 `loopback-inspector` 调试说明，改为当前
  sidecar diagnostic snapshot，并明确不写入 token、真实业务 payload 或凭据。
- 只读审计 Desktop bridge、Workspace Core replay/evidence、Local Artifact Store、runtime
  gateway factory、Codex adapter 与 application orchestration 当前关键路径；没有发现本轮应插入的
  低风险代码修复，未做代码行为改动。
- 通过 `pnpm exec prettier --check docs/STATUS.md docs/engineering/local-dev-setup.md`、
  `pnpm exec markdownlint-cli2 docs/STATUS.md docs/engineering/local-dev-setup.md`、
  stale-current-state scan、`git diff --check` 与 `pnpm run docs:lint`。

### 2026-05-21 09:55 CST

- 开始时重新读取本 handoff、AGENTS 必读上下文，并运行 `git status --short` /
  `git diff --name-only` 复核 dirty worktree；当前仍是 broad internal-trial/docs 主线改动。
- 审计 Desktop renderer replay/task-tree、runtime gateway 与 application orchestration，未发现
  blocking issue；发现 Desktop sidecar diagnostics 对 spawn error 的净化覆盖不完整。
- 按 TDD 新增 `workspace-core-sidecar.spec.ts` 回归测试，先确认小写 `token=...` 与绝对路径
  会泄到 `lastError`，再修复 `formatDiagnosticMessage` 的 token-like key 规则，并让 stderr tail
  缓存净化文本。
- 同步 `README.md` 与 Desktop Settings 的 current-state copy，避免继续描述为
  sidecar/preload/live actions 完全未接。
- 通过 targeted verification：Desktop sidecar/replay loader tests、Desktop typecheck、Prettier、
  markdownlint、stale-current-state scan 与 `git diff --check`。

### 2026-05-21 10:10 CST

- 开始时重新读取 handoff、AGENTS 必读上下文，并运行 `git status --short` /
  `git diff --name-only` 复核 dirty worktree；当前仍是 broad internal-trial/docs 主线改动。
- 按上一轮建议检查 Desktop mutating IPC allowlist，选择最小可验证切片：
  `workspace-core:rerun` 的 blank `operatorNote`。
- 按 TDD 新增失败测试，确认 blank `operatorNote` 会继续走到 `fetch failed`；随后在
  `apps/desktop/src/main/index.ts` 增加 main-process guard，使该输入在触碰 sidecar/HTTP 前失败。
- 通过 `src/main/index.spec.ts`、Desktop typecheck、Desktop main/client/sidecar/replay loader
  targeted tests、Prettier、stale-current-state scan 与 `git diff --check`。

### 2026-05-21 10:39 CST

- 开始时重新读取 handoff、AGENTS 必读上下文，并运行 `git status --short` /
  `git diff --name-only` 复核 dirty worktree；当前仍是 broad internal-trial/docs 主线改动，
  未发现需要停下确认的疑似无关改动。
- 按 TDD 继续收紧 Desktop mutating IPC allowlist：新增 4 个失败测试，确认超长 cancel
  reason、retry reason、rerun operator note 与 operator note 会越过 main process 并走到
  `fetch failed`。
- 在 `apps/desktop/src/main/index.ts` 增加 main-process length guard，使 reason 上限保持
  1000 字符、operator note 上限保持 4000 字符，并在触碰 sidecar/HTTP 前失败。
- 通过 Desktop main test、Desktop typecheck、Desktop main/client/sidecar/replay loader
  targeted tests 与 stale-current-state scan；本轮尚未重跑全量 `pnpm run check` / `pnpm test`。

### 2026-05-21 11:09 CST

- 开始时重新读取 handoff、AGENTS 必读上下文，并运行 `git status --short` /
  `git diff --name-only` 复核 dirty worktree；当前仍是 broad internal-trial/docs 主线改动，
  未发现需要停下确认的疑似无关改动。
- 按上一轮建议转向 Desktop main IPC action 成功路径：先新增 valid payload 转发与 malformed
  success response 回归测试，确认 malformed cancel / retry / rerun / operator note response
  会原样穿过 Desktop bridge。
- 在 `apps/desktop/src/main/index.ts` 为 `requestWorkspaceCoreJson()` 增加可选 response schema，
  并给 cancel / retry / rerun / operator note action 接上 shared-contract 或本地最小 schema。
- 通过 Desktop main test、Desktop typecheck、Desktop main/client/sidecar/replay loader
  targeted tests、Prettier 与 stale-current-state scan；本轮尚未重跑全量
  `pnpm run check` / `pnpm test`。

### 2026-05-21 11:42 CST

- 开始时重新读取 handoff、AGENTS 必读上下文，并运行 `git status --short` /
  `git diff --name-only` 复核 dirty worktree；当前仍是 broad internal-trial/docs 主线改动，
  未发现需要停下确认的疑似无关改动。
- 接上上一轮建议检查 Desktop mutating IPC non-2xx action error path：按 TDD 新增失败测试，
  复现 Core error body 中的 `token=...`、`/Users/...` 与 `http://127.0.0.1:...` 会原样穿过
  Desktop bridge。
- 在 `apps/desktop/src/main/index.ts` 为 `requestWorkspaceCoreJson()` 的非 2xx 分支增加
  renderer-safe error formatter：保留稳定错误 code，净化 bearer/token-like 片段、HTTP URL 与真实
  本机路径，并把异常 error code 降级为 `WORKSPACE_CORE_ERROR`。
- 通过 Desktop main test、Desktop typecheck、Desktop main/client/sidecar/replay loader targeted
  tests、Prettier、handoff markdownlint、stale-current-state scan 与 `git diff --check`；本轮尚未重跑
  全量 `pnpm run check` / `pnpm test`。

### 2026-05-21 12:08 CST

- 开始时重新读取 handoff、AGENTS 必读上下文，并运行 `git status --short` /
  `git diff --name-only` 复核 dirty worktree；当前仍是 broad internal-trial/docs 主线改动，
  未发现需要停下确认的疑似无关改动。
- 接上上一轮建议检查 Desktop mutating IPC fetch/network transport error path：按 TDD 新增失败测试，
  复现 `fetch()` reject message 中的 `token=...`、`/Users/...` 与 `http://127.0.0.1:...` 会原样穿过
  Desktop bridge。
- 在 `apps/desktop/src/main/index.ts` 为 `requestWorkspaceCoreJson()` 增加 transport error formatter；
  transport error 现在统一为 `Workspace Core request failed before receiving a response: ...`，并复用
  renderer-safe redaction helper 净化敏感片段。
- 通过 Desktop main test、Desktop typecheck、Desktop main/client/sidecar/replay loader targeted
  tests、Prettier、handoff markdownlint、stale-current-state scan 与 `git diff --check`；本轮尚未重跑
  全量 `pnpm run check` / `pnpm test`。

### 2026-05-21 12:39 CST

- 开始时重新读取 handoff、AGENTS 必读上下文，并运行 `git status --short` /
  `git diff --name-only` 复核 dirty worktree；当前仍是 broad internal-trial/docs 主线改动，
  未发现需要停下确认的疑似无关改动。
- 接上 Desktop bridge error hardening，按 TDD 新增失败测试，复现 sidecar unhealthy
  `status.lastError` 中的 `token=...`、`/Users/...` 与 `http://127.0.0.1:...` 会原样穿过 Desktop
  bridge。
- 在 `apps/desktop/src/main/index.ts` 为 `getHealthyWorkspaceCoreStatus()` 增加 sidecar health error
  formatter；非 healthy sidecar 的 `lastError` 现在也复用 renderer-safe redaction helper。
- 补一个测试 harness 类型整理：`workspaceCoreSidecarStatus` 显式拓宽为
  `WorkspaceCoreSidecarStatus`，避免默认 fixture 的 `"healthy"` 字面量状态阻塞新增 unhealthy fixture。
- 通过 Desktop main test、Desktop typecheck、Desktop main/client/sidecar/replay loader targeted
  tests、Prettier、handoff markdownlint、stale-current-state scan 与 `git diff --check`；本轮尚未重跑
  全量 `pnpm run check` / `pnpm test`。

### 2026-05-21 06:05 CST

- 选择一个低风险、直接服务 internal trial 的代码切片：Desktop artifact payload 最小只读查看。
- 按 TDD 先补红灯测试：
  `workspace-core-client.spec.ts` 覆盖固定 payload endpoint、无效 ArtifactId 拦截与 malformed payload；
  `index.spec.ts` 覆盖 main-process IPC allowlist 与无效 ArtifactId 不触碰 sidecar。
- 实现最小桥接：
  `getWorkspaceCoreArtifactPayload()` 使用 shared contract 的 `artifactPayloadResponseSchema` 校验响应；
  main/preload 新增 `workspace-core:get-artifact-payload` / `workspaceCore.getArtifactPayload()`。
- Renderer 在 Run Detail artifact summary 中为有 `payloadRef` 的 artifact 提供按需 payload 文本预览；
  只显示 bounded text，不显示本地路径，不开放文件系统操作、导出或完整 Artifact workspace。
- 同步 `CHANGELOG.md`、`docs/STATUS.md`、`apps/desktop/README.md`、
  `docs/ops/internal-trial-runbook.md`。
- 通过 Desktop targeted lint / typecheck / tests / build、相关 Prettier / markdownlint、
  `git diff --check` 与 `pnpm run docs:lint`。
- 本轮未执行真实 Codex sidecar 手动 smoke；下一轮仍应优先记录一次 manual evidence。

### 2026-05-21 06:55 CST

- 先用前台 Electron + CDP 跑通一次真实 Desktop window-level Codex-backed internal-trial smoke。
- Electron / CDP 读回同一条 run 的 replay evidence、bounded payload text 与 operator note 均成功。
- 修复了 sidecar 启动时的 in-flight 复用竞态，并把回归写进 `workspace-core-sidecar.spec.ts`。
- 更新 `README.md`、`docs/STATUS.md`、`docs/ops/internal-trial-runbook.md`、
  `docs/engineering/testing-strategy.md`、`CHANGELOG.md` 与本 handoff，避免继续使用旧的
  “window-level 观察路径尚未执行” 口径。
- 当前 worktree 仍然很宽，但新旧事实已分开：真实 window-level desktop smoke 已有证据，
  下一轮应优先补自动化 E2E、长任务 smoke 与继续拆分 dirty worktree，而不是再追同一条最小路径。

### 2026-05-21 07:19 CST

- 复核当前 dirty worktree，确认 Desktop / Workspace Core / runtime / application 的关键路径
  里，前一轮遗留的部分担忧已被现有实现或测试覆盖，当前未发现新的 blocker。
- 通过 `pnpm --filter @cairn/desktop typecheck`、`pnpm --filter @cairn/workspace-core typecheck`、
  `pnpm --filter @cairn/runtime-gateway test -- codex-process.spec.ts codex-adapter.spec.ts codex-protocol.spec.ts`、
  `pnpm --filter @cairn/application test -- orchestration-run-service.spec.ts`、
  `pnpm run docs:lint` 与 `git diff --check`。
- 发现并收口的纯文案漂移：`docs/STATUS.md` 里对 Desktop window-level smoke 的未完成口径过时，
  以及 handoff / runbook 对“已完成一次手动 window-level smoke、但自动 e2e 仍待补齐”的边界描述
  需要继续保持同步。
- 下一轮优先级：继续补自动化 E2E 和更长任务的真实 Codex evidence；如果继续拆 dirty worktree，
  先把 docs / code 的 review chunk 切得更细，再考虑是否需要新的低风险代码修正。

### 2026-05-21 07:42 CST

- 重新复核当前 dirty worktree，确认本轮仍以 internal trial 主线 + 文档同步改动为主，
  没有新增疑似无关改动。
- 复查 Desktop / Workspace Core / runtime / application 关键路径后，未发现必须立即修复的代码
  blocker；这轮只收口了文档语义，避免继续扩大实现面。
- 文档对齐：
  - `docs/contracts/runtime-adapter.md`
  - `docs/adr/0017-codex-cli-runtime-adapter.md`
  - `docs/design/r1-codex-e2e-artifact-trace.md`
  - `docs/ops/internal-trial-runbook.md`
  - `docs/STATUS.md`
    主要收口 `SERVICE_UNAVAILABLE` / `MODEL_UNAVAILABLE` 语义、Codex adapter 当前采用
    `child_process.spawn` + stdout/stderr pipes 的事实，以及 Desktop 观察路径的边界口径。
- 验证通过：
  - `pnpm run docs:lint`
  - `pnpm exec prettier --check docs/STATUS.md docs/ops/internal-trial-runbook.md docs/contracts/runtime-adapter.md docs/adr/0017-codex-cli-runtime-adapter.md docs/design/r1-codex-e2e-artifact-trace.md`
  - `git diff --check`
- 残余风险：
  - 当前 dirty worktree 仍然很宽，下一轮如果要继续拆分，最好优先按 Desktop / Workspace Core /
    runtime / docs 再切更细的 review chunk。
  - 真实 Codex 长任务、自动化 window-level smoke 与更长 payload 证据仍未补齐。
- 下一轮任务：
  - 继续补自动化 E2E / window-level smoke 的自动化覆盖。
  - 如果再做代码改动，优先处理真正有实现意义的尾巴，不再重复文档口径收口。

### 2026-05-21 08:18 CST

- 收口静态预览数据中的旧协作角色名：
  `apps/desktop/src/renderer/src/desktop-model.ts`、
  `apps/ui-preview/src/preview-data/home-inbox-data.ts`、
  `apps/ui-preview/src/preview-models/components-gallery-view-model.ts`。
- 该修复仅影响静态展示数据，不改变 runtime、API、IPC allowlist、Workspace Core 行为或文档契约。
- 新增验证：
  - `pnpm exec prettier --check apps/desktop/src/renderer/src/desktop-model.ts apps/ui-preview/src/preview-data/home-inbox-data.ts apps/ui-preview/src/preview-models/components-gallery-view-model.ts`
  - `pnpm --filter @cairn/desktop typecheck`
  - `pnpm --filter @cairn/desktop test -- --run src/main/index.spec.ts src/main/workspace-core-client.spec.ts src/main/workspace-core-sidecar.spec.ts src/main/workspace-core-bootstrap.spec.ts src/electron-vite-config.spec.ts`
  - `pnpm --filter @cairn/ui-preview build`
- 注意：曾误用 `pnpm --filter @cairn/desktop test -- --run src/renderer/src/desktop-model.ts`，Vitest 正常返回 `No test files found`；已改用实际 desktop main spec suite 重新验证。

### 2026-05-21 08:41 CST

- 继续收口 Desktop Run Detail 的 replay 加载边界，避免切换或重复观察同一 run 时残留旧 evidence：
  - `apps/desktop/src/renderer/src/desktop-app.tsx`
- 具体行为：
  - replay load 改成“最新请求 wins”，避免并发或快速切换时旧请求覆盖新请求
  - `observeRunId()` 在重复观察同一 run id 时会强制重新加载 replay evidence
  - `runInternalTrial()` / `observeRunId()` 会先清空旧 replay state，避免短暂残影
- 新增验证：
  - `pnpm exec prettier --check apps/desktop/src/renderer/src/desktop-app.tsx`
  - `pnpm --filter @cairn/desktop typecheck`
  - `pnpm --filter @cairn/desktop test -- --run src/main/index.spec.ts src/main/workspace-core-client.spec.ts src/main/workspace-core-sidecar.spec.ts src/main/workspace-core-bootstrap.spec.ts src/electron-vite-config.spec.ts`
  - `git diff --check`
- 残余风险：
  - 这仍然只是 Desktop 观察层的局部修补，自动化 E2E 还没补上；若后续要验证重复 load race，需要在 renderer 侧再加专门测试。

### 2026-05-21 13:40 CST

- 开始时重新读取 handoff、AGENTS 必读上下文，并运行 `git status --short` /
  `git diff --name-only` 复核 dirty worktree；当前仍是 broad internal-trial/docs 主线改动，
  未发现需要停下确认的疑似无关改动。
- 接上上一轮遗留风险，按 TDD 更新 Desktop status bridge 测试，先复现
  `workspace-core:get-status` 仍把 internal sidecar `baseUrl` 返回 renderer。
- 在 `apps/desktop/src/main/index.ts` 增加 renderer-facing `DesktopWorkspaceCoreStatus`，让
  `workspace-core:get-status` 只返回 `connectionLabel: "local sidecar"`、state/runtime/pid/service
  与已净化 `lastError`；preload 类型与 renderer Connection 展示同步改用该 DTO。
- 同步 `apps/desktop/README.md` 与 `docs/design/security-model.md`，明确 renderer-facing Core
  status 不返回 token 或 loopback base URL。
- 运行 Desktop lint 时发现既有测试 helper 的 `require-await` 与一次 unnecessary type assertion；
  已做纯测试整理，不改变产品行为。
- 通过 Desktop main test、Desktop lint、Desktop typecheck、Desktop main/client/sidecar/replay loader
  targeted tests、Prettier、markdownlint、stale-current-state scan 与 `git diff --check`；本轮仍未重跑
  全量 `pnpm run check` / `pnpm test`。

### 2026-05-21 14:11 CST

- 开始时重新读取 handoff、AGENTS 必读上下文，并运行 `git status --short` /
  `git diff --name-only` 复核 dirty worktree；当前仍是 broad internal-trial/docs 主线改动，
  未发现需要停下确认的疑似无关改动。
- 接上上一轮建议覆盖 Desktop mutating IPC non-JSON Core error body：新增
  `workspace-core:cancel-run` text/plain 502 回归测试，断言 renderer 只看到稳定 fallback，不看到
  raw `token=...`、`/Users/...` 或 loopback URL。
- 该测试在当前实现上直接通过；随后临时把实现改成读取 raw text body，测试按预期失败，再恢复原实现
  并通过，确认测试能防止未来回归。本轮没有生产代码改动。
- 通过 Desktop main test、Desktop lint、Desktop typecheck、Desktop main/client/sidecar/replay loader
  targeted tests、Prettier、handoff markdownlint、stale-current-state scan 与 `git diff --check`；本轮仍未
  重跑全量 `pnpm run check` / `pnpm test`。

### 2026-05-21 14:38 CST

- 开始时重新读取 handoff、AGENTS 必读上下文，并运行 `git status --short` /
  `git diff --name-only` 复核 dirty worktree；当前仍是 broad internal-trial/docs 主线改动，
  未发现需要停下确认的疑似无关改动。
- 本轮不继续叠加行为改动，重点补跑前面 Desktop bridge hardening 后尚未重跑的全量 gate。
- 通过 `pnpm run check`、`pnpm test`、`pnpm --filter @cairn/ui-preview build`、
  `pnpm --filter @cairn/desktop build`、stale-current-state scan 与 `git diff --check`。
- 更新本 handoff，记录全量 gate 已恢复为新鲜通过状态；本轮无源码或正式产品文档改动。

### 2026-05-21 15:05 CST

- 开始时重新读取 handoff、AGENTS 必读上下文，并运行 `git status --short` /
  `git diff --name-only` 复核 dirty worktree；当前仍是 broad internal-trial/docs 主线改动，
  未发现需要停下确认的疑似无关改动。
- 本轮只读统计 dirty worktree：43 个已跟踪文件、6 个未跟踪文件，约 3924 additions /
  493 deletions。
- 未继续叠加源码行为改动；更新 §4.4，把当前宽 diff 拆成 Desktop、Workspace Core、
  Runtime/Application、Contracts、Docs 五个建议 review chunk，并记录 6 个未跟踪文件。
- 本轮目标是让下一轮能直接进入拆分提交/PR，而不是重复探索同一批文件。

### 2026-05-21 15:16 CST

- 开始时重新读取 handoff，并运行 `git status --short` / `git diff --name-only` 复核 dirty
  worktree；当前仍是 broad internal-trial/docs 主线改动，且无 staged 文件。
- 优先收口最小底层 **Contracts/schema chunk**：只涉及
  `packages/shared_contracts/src/contracts/index.spec.ts` 与
  `packages/shared_contracts/src/schemas/run-replay-source.spec.ts`。
- 通过 shared contracts targeted tests、typecheck、lint、Prettier check 与 `git diff --check`。
- 只 stage 这两个 shared contracts 测试文件，并提交 `54c31f4`
  `test(contracts): 补齐回放契约覆盖 / cover replay contracts`。
- 提交后当前 dirty worktree 降为 41 个 tracked files、6 个 untracked files；下一步建议继续拆
  **Runtime Gateway + Application chunk**。

### 2026-05-21 15:29 CST

- 继续按 handoff 推荐拆第二个底层 chunk；开始时重新读取 handoff、AGENTS 必读上下文，并运行
  `git status --short` / `git diff --name-only` 复核 dirty worktree；当前无 staged 文件。
- 审阅 Runtime/Application diff，确认范围只包含 8 个 tracked 文件：
  `packages/application/src/orchestration/orchestration-run-service.{ts,spec.ts}` 与
  `packages/runtime_gateway/src/adapters/codex/codex-{adapter,errors,process,protocol}.ts`
  相关测试。
- 通过 runtime gateway targeted tests、application orchestration test、两个包的 typecheck / lint、
  Prettier check 与 `git diff --check`。
- 只 stage 这 8 个 Runtime/Application 文件，并提交 `7ae1498`
  `fix(runtime): 收紧 Codex 终态证据 / harden codex terminal evidence`。
- 提交后 `packages/application/**` 与 `packages/runtime_gateway/**` 不再有 dirty diff；当前剩余
  dirty worktree 降为 33 个 tracked files、6 个 untracked files，建议下一步拆
  **Workspace Core evidence/storage chunk**。

### 2026-05-21 15:39 CST

- 接上用户“检修/继续”要求，按 systematic debugging 原则先验证再决定是否修：重新读取 handoff，
  运行 `git status --short` / `git diff --name-only`，确认当前无 staged 文件。
- 审阅 Workspace Core diff，范围为 8 个 tracked 文件，覆盖 cursor pagination、replay-source 隐私边界、
  artifact payload storage error mapping、runtime query exposure、local artifact store 与 SQLite opaque
  payloadRef 回归。
- 运行 Workspace Core targeted tests、typecheck、lint、Prettier check 与 `git diff --check`，均通过；
  未发现需额外修复的 blocker。
- 只 stage 这 8 个 Workspace Core 文件，并提交 `b1a98ba`
  `fix(core): 收紧回放证据读取 / harden replay evidence reads`。
- 提交后 `apps/workspace-core/**` 不再有 dirty diff；当前剩余 dirty worktree 降为 25 个 tracked
  files、6 个 untracked files，主要集中在 Desktop、ui-preview 静态数据与文档/runbook。

### 2026-05-21 16:43 CST

- 开始拆最大的 Desktop chunk，但先选最小独立子块：Electron Vite config。
- 审阅 `apps/desktop/electron.vite.config.ts` 与新测试
  `apps/desktop/src/electron-vite-config.spec.ts`，确认范围只覆盖 shared-contracts bundling 与
  sandboxed Electron preload 的 CJS 输出。
- 通过 Desktop config spec、Desktop typecheck、Desktop lint、Prettier check 与 `git diff --check`。
- 只 stage 这 2 个 Desktop config 文件，并提交 `aaea412`
  `fix(desktop): 修正 preload 构建输出 / fix preload build output`。
- 提交后 Desktop config 子块不再有 dirty diff；当前剩余 dirty worktree 降为 24 个 tracked files、
  5 个 untracked files。下一步建议拆 Desktop main/client/sidecar bridge 子块。

### 2026-05-21 16:57 CST

- 继续拆 Desktop 大块，选择 main/client/sidecar/bootstrap 子块，不带 preload、renderer、README 或 docs。
- 审阅 8 个 `apps/desktop/src/main/**` 文件，确认范围覆盖 sidecar runtime/env/diagnostic、client
  response schema 与 bounded artifact payload、main IPC allowlist / action guards / redaction。
- 通过 Desktop main/client/sidecar/bootstrap targeted tests、Desktop typecheck、Desktop lint、
  Prettier check 与 `git diff --check`。
- 只 stage 这 8 个 Desktop main 文件，并提交 `09120c1`
  `feat(desktop): 收紧 Core 桥接边界 / harden core bridge boundary`。
- 提交后 `apps/desktop/src/main/**` 不再有 dirty diff；当前剩余 dirty worktree 降为 16 个 tracked
  files、5 个 untracked files，主要集中在 preload、renderer/replay-loader、ui-preview 静态数据与
  docs/runbook。
