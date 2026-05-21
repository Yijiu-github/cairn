# Internal Trial Mainline Handoff

> 状态：🟡 Active
> 最后更新：2026-05-22 03:13 CST
> 工作区：`/Users/taosiyu/Code/cairn`
> 当前主线：推进第一轮内部开发者试用，不再做泛化 nightly cleanup

---

## 1. 用途

这份文件是跨轮自动化/子 agent 的接力入口。它不是正式产品文档，也不是完整历史日志。每轮开始前必须读本文件，结束前必须更新本文件，记录本轮事实、验证、阻塞、风险、commit hash 与下一轮任务。

当前正式事实口径以这些文件为准：

- [`../../STATUS.md`](../../STATUS.md)
- [`../../ops/internal-trial-runbook.md`](../../ops/internal-trial-runbook.md)
- [`../../product/positioning-and-boundaries.md`](../../product/positioning-and-boundaries.md)
- [`../../reference/glossary.md`](../../reference/glossary.md)

---

## 2. 每轮固定流程

1. 读取 `AGENTS.md`、`docs/STATUS.md`、产品边界、术语表、主设计文档和本 handoff。
2. 执行 `git status --short` 与 `git diff --name-only`，确认 dirty worktree，不回滚用户或其他 agent 的改动。
3. 每轮只选择一个清晰子块，优先 internal trial 主线；先审阅相邻代码/文档和 diff，再修改。
4. 保持产品边界：不创建 `apps/web`，不宣称 public alpha / installer / signing / notarization。
5. 保持 runtime 边界：Desktop sidecar 默认 mock，真实 Codex 需 env opt-in。
6. 跑与本轮改动匹配的 targeted verification；文档改动至少跑 Prettier、markdownlint、`docs:lint`、`git diff --check`。
7. 若本轮有可保留改动，结束前只 stage 本轮相关文件并创建本地 commit；不要 push。
8. 更新本文件的“当前工作区状态”“验证记录”“最新完成”“下一轮任务”和“风险/阻塞”。

---

## 3. 当前工作区状态

2026-05-22 03:13 CST 复核：

- `git status --short`：本轮 Desktop window-level e2e smoke 代码、脚本与文档待提交。
- `git diff --name-only`：本轮只覆盖 Desktop smoke、相关测试脚本和直接文档同步。
- 之前的 Desktop/Core/Runtime/UI-preview 主线改动已拆分为小提交。

当前已知未完成主线不在“泛化整理”，而在 internal trial 后续硬化：

- Desktop 默认 mock sidecar 已有最小 window-level smoke；真实 Codex window-level e2e 仍未自动化。
- 真实 Codex CLI smoke 仍是 opt-in 手动步骤，不进入默认 CI。
- Desktop 仍是 internal-trial 最小观察壳，不是完整产品 UI 或完整 operator cockpit。
- 长任务、复杂 payload、跨平台取消链路仍需后续额外证据。

---

## 4. 已拆分提交

近期主线提交：

- `54c31f4` `test(contracts): 补齐回放契约覆盖 / cover replay contracts`
- `7ae1498` `fix(runtime): 收紧 Codex 终态证据 / harden codex terminal evidence`
- `b1a98ba` `fix(core): 收紧回放证据读取 / harden replay evidence reads`
- `aaea412` `fix(desktop): 修正 preload 构建输出 / fix preload build output`
- `09120c1` `feat(desktop): 收紧 Core 桥接边界 / harden core bridge boundary`
- `477c9ba` `feat(desktop): 接入回放观察台 / wire replay observer`
- `0cef705` `chore(ui-preview): 清理预览角色名 / clean preview role labels`
- `72299cc` `docs(trial): 精简内部试用文档 / simplify trial docs`

归档说明：

- [`2026-05-20-internal-trial-core-first-implementation-plan.md`](2026-05-20-internal-trial-core-first-implementation-plan.md)
  已改为历史计划摘要，不再作为当前 checkbox 计划。
- [`../specs/2026-05-20-internal-trial-core-first-design.md`](../specs/2026-05-20-internal-trial-core-first-design.md)
  已改为历史设计摘要，不再作为当前缺口列表。

---

## 5. 最近验证记录

2026-05-22 02:35 CST 本轮文档整理验证通过：

- `pnpm exec prettier --check docs/engineering/local-dev-setup.md docs/superpowers/plans/2026-05-21-nightly-cleanup-handoff.md docs/superpowers/plans/2026-05-20-internal-trial-core-first-implementation-plan.md docs/superpowers/specs/2026-05-20-internal-trial-core-first-design.md`
- `pnpm exec markdownlint-cli2 docs/engineering/local-dev-setup.md docs/superpowers/plans/2026-05-21-nightly-cleanup-handoff.md docs/superpowers/plans/2026-05-20-internal-trial-core-first-implementation-plan.md docs/superpowers/specs/2026-05-20-internal-trial-core-first-design.md`
- `pnpm run docs:lint`
- `git diff --check`

2026-05-21 14:38 CST 全量 gate 曾通过：

- `pnpm run check`
- `pnpm test`
- `pnpm --filter @cairn/ui-preview build`
- `pnpm --filter @cairn/desktop build`
- stale-current-state scan 无目标残留
- `git diff --check`

2026-05-21 后续拆分提交均已跑各自 targeted verification。若下一轮修改代码，不得沿用这些旧结果作为“当前通过”声明，必须重新跑本轮相关命令。

2026-05-22 03:13 CST Desktop window-level smoke 验证通过：

- `pnpm --filter @cairn/desktop test -- --run src/main/index.spec.ts src/main/workspace-core-bootstrap.spec.ts`
- `pnpm --filter @cairn/desktop typecheck`
- `pnpm --filter @cairn/desktop lint`
- `pnpm --filter @cairn/desktop test:e2e`

---

## 6. 最新完成

2026-05-22 02:35 CST 本轮完成：

- 精简过时 handoff，把 1000+ 行累积日志压缩成当前 mainline 接力板。
- 将两个未跟踪的 2026-05-20 internal-trial plan/spec 草稿归档为短摘要，避免后续 agent 误读旧缺口。
- 将 `docs/engineering/local-dev-setup.md` 中重复的 Codex smoke 长流程收敛为 runbook 链接，保留底层 runtime 选择口径。

本轮文档整理提交：`3104c72` `docs(trial): 精简试用接力文档 / simplify trial handoff docs`。

2026-05-22 03:13 CST 本轮完成：

- 新增 Desktop smoke-only 自动退出钩子：`CAIRN_DESKTOP_WINDOW_SMOKE_EXIT_AFTER_EVENT` 指定事件写入后自动 `app.quit()`。
- 新增 `apps/desktop/scripts/window-smoke.mjs` 与 `@cairn/desktop test:e2e`，build 后启动真实 Electron 进程，等待 `main-window-ready-to-show` signal，再由脚本终止进程收尾。
- 加固 Desktop smoke signal 写入为临时文件 + rename；reader 对写入瞬间的 JSON 解析窗口做重试。
- 同步 Desktop README、STATUS、CHANGELOG 与 testing strategy，明确这是默认 mock sidecar window-level smoke，不代表真实 Codex 自动化 e2e。

本轮提交 hash 将在提交后补写。

---

## 7. 下一轮任务

优先级从高到低：

1. **真实 Codex 手动 smoke 复核**：按 runbook 再跑一条短任务，记录当前 Codex CLI / Node / OS 证据，只使用合成 prompt。
2. **Desktop renderer 主线小补强**：继续围绕 replay-loader / bounded payload preview / operator note 的错误态和空态补 targeted tests。
3. **Runbook 结果记录模板**：如手动 smoke 仍频繁执行，可把记录模板单独压成短表格，避免 runbook 再次膨胀。
4. **真实 Codex window-level e2e 方案**：只做设计/风险评估，不默认纳入 CI，避免凭据、CLI 版本和平台差异导致 flaky gate。

---

## 8. 风险与阻塞

- 自动化 e2e 仅覆盖默认 mock sidecar window-level smoke；当前已有 Codex-backed 手动成功证据，但不能宣称真实 Codex 自动化端到端完成。
- 真实 Codex CLI 行为可能随本机版本变化；默认测试仍必须依赖 mock / fixture。
- Accepted ADR 不直接修改；Codex transport refinement 优先使用 Proposed ADR-0018 或新 ADR。
- 文档中凡提到 `apps/web`、installer、signing、notarization、公测/公开 alpha，都要明确为未完成或非本轮目标。
