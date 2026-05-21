# Internal Trial Mainline Handoff

> 状态：🟡 Active
> 最后更新：2026-05-22 04:06 CST
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

2026-05-22 04:06 CST 复核：

- `git status --short`：本轮 Desktop renderer payload loader、STATUS、CHANGELOG 与 handoff 待提交。
- `git diff --name-only`：本轮只覆盖 Desktop renderer payload loader 与直接文档同步。
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
- `794eac0` `docs(ops): 复核真实 Codex smoke / record real Codex smoke`

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

2026-05-22 03:36 CST 真实 Codex API 手动 smoke 复核通过：

- 环境：macOS 15.7.4，Node v26.0.0，pnpm 9.15.0，`codex-cli 0.131.0-alpha.9`。
- `CAIRN_WORKSPACE_CORE_RUNTIME=codex`、`CAIRN_WORKSPACE_CORE_CODEX_SANDBOX_MODE=read-only`、合成 prompt。
- `runId=01KS60FG1PCSXKCQKSX09WVZZF`，`taskId=01KS60FG1P4JFHD5JMEHZVR4Q4`，
  `agentRunId=01KS60GA1SNCKD6ANYQC917NGM`。
- run / task / agent-run 均到达 `succeeded`；replay-source 返回 2 个 artifact、13 条
  trace event；operator note 产生 1 条 `operator.note` trace event；bounded payload API 可读。

2026-05-22 03:47 CST 本轮文档验证通过：

- `pnpm exec prettier --check docs/ops/internal-trial-runbook.md`
- `pnpm exec markdownlint-cli2 docs/ops/internal-trial-runbook.md`
- `pnpm run docs:lint`
- `git diff --check -- docs/ops/internal-trial-runbook.md`

2026-05-22 04:06 CST Desktop renderer payload loader 验证通过：

- 红灯：新增 `apps/desktop/src/renderer/src/artifact-payload-loader.spec.ts` 后，
  `pnpm --filter @cairn/desktop test -- --run src/renderer/src/artifact-payload-loader.spec.ts`
  因 helper 尚不存在失败。
- 绿灯：接入 `artifact-payload-loader.ts` 后，
  `pnpm --filter @cairn/desktop test -- --run src/renderer/src/artifact-payload-loader.spec.ts src/renderer/src/run-replay-loader.spec.ts`
  通过，2 个文件 5 个测试。
- `pnpm --filter @cairn/desktop typecheck`
- `pnpm --filter @cairn/desktop lint`
- `pnpm exec prettier --check apps/desktop/src/renderer/src/artifact-payload-loader.ts apps/desktop/src/renderer/src/artifact-payload-loader.spec.ts apps/desktop/src/renderer/src/desktop-app.tsx CHANGELOG.md docs/STATUS.md`
- `pnpm exec markdownlint-cli2 CHANGELOG.md docs/STATUS.md`
- `pnpm run docs:lint`
- `git diff --check`

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

本轮提交：`eb43e0e` `test(desktop): 补窗口级 smoke / add window smoke`。

2026-05-22 03:47 CST 本轮完成：

- 按 runbook 重新执行 Workspace Core + Codex API 手动 smoke，确认真实短任务、replay evidence、
  bounded payload 与最小 operator note 链路仍可跑通。
- 发现 runbook 中历史 `01H...` workspace/event 示例会在当前默认 bootstrap ID 下触发 SQLite
  外键失败；根因为请求 ID 与服务启动 bootstrap workspace/event 不一致，不是 Codex runtime 失败。
- 修正 runbook 的 smoke 示例，改为显式导出 `CAIRN_WORKSPACE_ID` / `CAIRN_EVENT_ID`，默认跟随
  `apps/workspace-core/src/config.ts` 的 `01J...` bootstrap ID，也允许随启动环境变量覆盖。
- 在 runbook 记录本轮手动证据和边界：仅外部手动启动 Codex-backed Workspace Core API smoke，
  未执行 Desktop Codex sidecar 观察路径，不代表真实 Codex 自动化 e2e 覆盖。

本轮提交：`794eac0` `docs(ops): 复核真实 Codex smoke / record real Codex smoke`。

2026-05-22 04:06 CST 本轮完成：

- 新增 renderer 端 `artifact-payload-loader` helper，为 bounded artifact payload 读取增加
  request sequence guard。
- `DesktopApp` 的 payload 加载改为通过 helper 更新 loading/error/payload state，避免旧 payload
  请求乱序返回时覆盖最新加载状态或错误提示。
- 新增 renderer targeted tests 覆盖“旧请求先返回不写 payload/不清 loading”与“旧请求失败不覆盖最新错误态”。
- 同步 `docs/STATUS.md` 的 Desktop spec 数量与覆盖重点，并在 `CHANGELOG.md` 记录修复项。

本轮提交：待提交。

---

## 7. 下一轮任务

优先级从高到低：

1. **真实 Codex 手动 smoke 复核**：按 runbook 再跑一条短任务，记录当前 Codex CLI / Node / OS 证据，只使用合成 prompt。
   2026-05-22 03:36 CST 已复核通过；下一轮除非 Codex/Node/OS 变化或需要复测，不要重复刷同一手动证据。
2. **Desktop renderer 主线小补强**：payload loader 已补 request sequence guard；下一轮优先补
   operator note/action error-state 或 replay-loader 空态测试，不要重复做同一 payload race。
3. **Runbook 结果记录模板**：如手动 smoke 仍频繁执行，可把记录模板单独压成短表格，避免 runbook 再次膨胀。
4. **真实 Codex window-level e2e 方案**：只做设计/风险评估，不默认纳入 CI，避免凭据、CLI 版本和平台差异导致 flaky gate。

---

## 8. 风险与阻塞

- 自动化 e2e 仅覆盖默认 mock sidecar window-level smoke；当前已有 Codex-backed 手动成功证据，但不能宣称真实 Codex 自动化端到端完成。
- 本轮真实 Codex 复核仅覆盖外部手动启动 Workspace Core API smoke；未覆盖 Desktop 自拉起
  Codex sidecar 的观察路径。
- Renderer payload loader 仅防止同一 renderer 会话内的 payload 请求乱序污染状态；完整 Artifact
  workspace、导出、retention 与本地路径 reveal 仍不在本轮范围。
- 真实 Codex CLI 行为可能随本机版本变化；默认测试仍必须依赖 mock / fixture。
- Accepted ADR 不直接修改；Codex transport refinement 优先使用 Proposed ADR-0018 或新 ADR。
- 文档中凡提到 `apps/web`、installer、signing、notarization、公测/公开 alpha，都要明确为未完成或非本轮目标。
