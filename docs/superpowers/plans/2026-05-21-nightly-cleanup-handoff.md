# Internal Trial Mainline Handoff

> 状态：🟡 Active
> 最后更新：2026-05-22 16:03 CST
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

2026-05-22 16:03 CST 复核：

- `git status --short`：本轮有未提交变更，集中在 Desktop `smoke:codex` runner、Desktop 语言切换和相关文档。
- `git diff --name-only`：当前变更包括 `apps/desktop`、`docs/STATUS.md`、testing strategy、runbook、CHANGELOG、pnpm lock/workspace、`2026-05-22-codex-window-e2e-runner.md` 与本 handoff。
- 之前的 Desktop/Core/Runtime/UI-preview 主线改动已拆分为小提交。

当前已知未完成主线不在“泛化整理”，而在 internal trial 后续硬化：

- Desktop 默认 mock sidecar 已有最小 window-level smoke；真实 Codex window-level smoke 已有 `smoke:codex` opt-in runner。
- 真实 Codex smoke 仍需 env opt-in，不进入默认 CI。
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

2026-05-22 04:37 CST UI preview artifact review static data 验证通过：

- 红灯：新增 `apps/ui-preview/src/preview-models/artifact-review-view-model.spec.ts` 后，
  `pnpm exec vitest run apps/ui-preview/src/preview-models/artifact-review-view-model.spec.ts`
  因 hero title 仍残留 `Run Detail preview page` 失败。
- 绿灯：将 `artifactReviewViewModel.hero.title` 改为 `Artifact Review preview page` 后，
  同一 spec 通过。
- `pnpm --filter @cairn/ui-preview typecheck`
- `pnpm --filter @cairn/ui-preview lint`
- `pnpm exec prettier --check apps/ui-preview/src/preview-models/artifact-review-view-model.ts apps/ui-preview/src/preview-models/artifact-review-view-model.spec.ts CHANGELOG.md docs/STATUS.md`
- `pnpm exec markdownlint-cli2 CHANGELOG.md docs/STATUS.md`
- `pnpm run docs:lint`
- `git diff --check`

2026-05-22 05:32 CST Desktop renderer replay-loader guard 验证：

- 红灯：新增 `apps/desktop/src/renderer/src/run-replay-loader.spec.ts` 空白 run id 用例后，
  `pnpm --filter @cairn/desktop test -- --run src/renderer/src/run-replay-loader.spec.ts`
  因 `getRunReplaySource('   ')` 被调用而失败。
- 绿灯：`run-replay-loader.ts` 在空白 run id 时本地设置错误态并跳过 Desktop bridge 后，同一 spec 通过，4 个测试。
- 相邻验证：`pnpm --filter @cairn/desktop test -- --run src/renderer/src/artifact-payload-loader.spec.ts` 通过，2 个测试。

2026-05-22 05:40 CST Desktop renderer operator action guard 验证：

- 红灯：新增 `apps/desktop/src/renderer/src/operator-action-runner.spec.ts` 后，
  `pnpm --filter @cairn/desktop test -- --run src/renderer/src/operator-action-runner.spec.ts`
  因 `operator-action-runner` helper 尚不存在失败。
- 绿灯：接入 `operator-action-runner.ts` 并让 `DesktopApp` 的 note / cancel / retry / rerun
  状态更新通过 request sequence guard 后，
  `pnpm --filter @cairn/desktop test -- --run src/renderer/src/operator-action-runner.spec.ts src/renderer/src/run-replay-loader.spec.ts src/renderer/src/artifact-payload-loader.spec.ts`
  通过，3 个文件 8 个测试。

2026-05-22 06:03 CST Desktop Run Detail copy 验证：

- 红灯：新增 `apps/desktop/src/renderer/src/run-detail-copy.spec.ts` 后，
  `pnpm --filter @cairn/desktop test -- --run src/renderer/src/run-detail-copy.spec.ts`
  因 `run-detail-copy` helper 尚不存在失败。
- 绿灯：接入 `run-detail-copy.ts` 并让 Run Detail 的空 replay / 空 task / 空 artifact /
  metadata-only artifact 文案使用明确的 read-only evidence 口径后，
  `pnpm --filter @cairn/desktop test -- --run src/renderer/src/run-detail-copy.spec.ts src/renderer/src/operator-action-runner.spec.ts src/renderer/src/run-replay-loader.spec.ts src/renderer/src/artifact-payload-loader.spec.ts`
  通过，4 个文件 11 个测试。

2026-05-22 06:32 CST Desktop allowlist docs 验证：

- 审阅 `apps/desktop/src/preload/index.ts`、`apps/desktop/src/main/index.ts`、renderer 调用点、`apps/desktop/README.md` 与 `docs/STATUS.md`。
- 发现运行时代码与 README 已对齐：preload 暴露 status / internal trial / replay / bounded payload / cancel / retry / rerun / operator note；STATUS 与 changelog 中仍有旧口径或遗漏。
- 本轮仅同步文档事实，不改运行时代码。

2026-05-22 08:04 CST Desktop bridge malformed error payload 验证：

- 红灯：新增 `apps/desktop/src/main/index.spec.ts` 用例后，
  `pnpm --filter @cairn/desktop test -- --run src/main/index.spec.ts`
  因畸形 error payload 触发 `code?.trim is not a function` 失败。
- 绿灯：`apps/desktop/src/main/index.ts` 在格式化 Workspace Core action error 前先把 error payload 从
  `unknown` 收窄，只接受字符串 `code` / `message`；同一 spec 通过，28 个测试。

2026-05-22 08:37 CST UI preview static title 验证：

- 红灯：新增 `apps/ui-preview/src/preview-models/run-detail-view-model.spec.ts` 后，
  `pnpm exec vitest run apps/ui-preview/src/preview-models/run-detail-view-model.spec.ts`
  因 `runDetailViewModel.run.artifacts[0].title` / `artifactReviewViewModel.relatedArtifacts[0].title`
  仍为 `Run Detail preview page` 失败。
- 绿灯：`apps/ui-preview/src/preview-data/run-detail-data.ts` 与
  `apps/ui-preview/src/preview-data/artifact-review-data.ts` 将两处标题统一为
  `Run Detail 页面 prototype`；同一 spec 通过，2 个测试。

2026-05-22 10:56 CST Desktop Workspace Core client transport error 验证：

- 红灯：新增 `apps/desktop/src/main/workspace-core-client.spec.ts` replay transport error 用例后，
  `pnpm --filter @cairn/desktop test -- --run src/main/workspace-core-client.spec.ts`
  因 `fetch` reject 原样暴露 URL / token / 本地路径失败。
- 绿灯：`apps/desktop/src/main/workspace-core-client.ts` 在 `requestJson` transport 边界捕获
  `fetch` reject，并脱敏 URL、Bearer/token 字段和本地路径；同一 spec 通过，12 个测试。

2026-05-22 12:09 CST Desktop Workspace Core client non-2xx replay response 验证：

- 结论：非 2xx 响应分支只返回 `request.method` / `request.path` / `response.status`，不读取
  response body，因此不会把 Workspace Core 响应体里的 URL、token 或本地路径带过 Desktop bridge。
- 新增 characterization spec 锁住 replay-source 非 2xx 响应只暴露状态码，不回传 JSON body。
- 这一轮没有修改运行时代码，只把边界写成可重复验证的测试。

2026-05-22 15:34 CST Desktop `smoke:codex` opt-in runner 验证通过：

- `CAIRN_DESKTOP_SIDECAR_RUNTIME=codex CAIRN_DESKTOP_SIDECAR_CODEX_EXECUTABLE="$(command -v codex)" CAIRN_DESKTOP_SIDECAR_RUNTIME_WORKDIR="$PWD/.cairn/runtime/internal-trial" pnpm --filter @cairn/desktop smoke:codex`
- 输出：`runId=01KS79CPRQYXC9WJGA3MGHZ6SE`，`taskId=01KS79CPRRD04NFM2D7ZB88KY6`，`agentRunId=01KS79CPS4AW7X4VZ9DS9SQ8G2`，`traceEventsAfterNote=13`。
- runner 已处理两个真实边界：启动后先回 Home / Inbox，避免 localStorage 停留在 Run Detail；Core 初始 `fetch failed` 时通过 `Refresh Core` 轮询等到 Run 按钮可用。

2026-05-22 15:44 CST Desktop 语言切换验证通过：

- 新增 `desktop-locale.ts` / `desktop-locale.spec.ts`，默认 `zh-CN`，`en-US` 可恢复，未知 stored locale 回退简中，切换只写入本地 `localStorage`。
- Desktop renderer 接入简体中文 / English segmented switch；当前覆盖壳导航、顶部状态、主要按钮、Run Detail / Artifact / Settings 的核心页面文案。
- 验证：`pnpm --filter @cairn/desktop typecheck`、`pnpm --filter @cairn/desktop lint`、targeted renderer tests、`pnpm --filter @cairn/desktop test:e2e` 均通过。

2026-05-22 16:03 CST Desktop locale-neutral `smoke:codex` 验证通过：

- 红灯：默认 `zh-CN` 后，
  `CAIRN_DESKTOP_SIDECAR_RUNTIME=codex CAIRN_DESKTOP_SIDECAR_CODEX_EXECUTABLE="$(command -v codex)" CAIRN_DESKTOP_SIDECAR_RUNTIME_WORKDIR="$PWD/.cairn/runtime/internal-trial" pnpm --filter @cairn/desktop smoke:codex`
  因 runner 仍等待英文 `Home / Inbox` button 超时失败。
- 绿灯：Desktop renderer 为 smoke 关键节点增加 locale-neutral `data-smoke-id` hook，runner 改用 hook 定位 Home、Refresh Core、Run Internal Trial、replay source、Replay inspector、observed run id、trace event count、Add note 与 operator feedback。
- 复测 `smoke:codex` 通过；提交前 lint 修正后最终证据为
  `runId=01KS7BR6150KYPE49RZ34G5JKD`，
  `taskId=01KS7BR616KR3V8Q7GXB58ZMGA`，
  `agentRunId=01KS7BR61JTW8628CP9M501YQY`，`traceEventsAfterNote=13`。
- `pnpm --filter @cairn/desktop typecheck`
- `pnpm --filter @cairn/desktop lint`
- `pnpm --filter @cairn/desktop test -- --run src/renderer/src/desktop-locale.spec.ts src/renderer/src/run-detail-copy.spec.ts src/renderer/src/run-replay-loader.spec.ts src/renderer/src/operator-action-runner.spec.ts src/renderer/src/artifact-payload-loader.spec.ts`
- `pnpm --filter @cairn/desktop test:e2e`
- `pnpm exec prettier --check CHANGELOG.md apps/desktop/README.md apps/desktop/package.json apps/desktop/scripts/codex-window-smoke.mjs apps/desktop/src/renderer/src/desktop-app.tsx apps/desktop/src/renderer/src/desktop-locale.ts apps/desktop/src/renderer/src/desktop-locale.spec.ts docs/STATUS.md docs/engineering/testing-strategy.md docs/ops/internal-trial-runbook.md docs/superpowers/plans/2026-05-21-nightly-cleanup-handoff.md docs/superpowers/plans/2026-05-22-codex-window-e2e-runner.md pnpm-workspace.yaml`
- `pnpm exec markdownlint-cli2 CHANGELOG.md apps/desktop/README.md docs/STATUS.md docs/engineering/testing-strategy.md docs/ops/internal-trial-runbook.md docs/superpowers/plans/2026-05-21-nightly-cleanup-handoff.md docs/superpowers/plans/2026-05-22-codex-window-e2e-runner.md`
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

本轮提交：`cdb372c` `fix(desktop): 防止 payload 乱序污染 / guard payload races`。

2026-05-22 04:37 CST 本轮完成：

- 收口 `apps/ui-preview` 的 artifact review 静态数据，修正 hero title 残留的 Run Detail 文案。
- 新增 artifact review static data spec，确保页面身份与静态模型一致。
- 同步 `docs/STATUS.md` 的 `apps/ui-preview` 覆盖数量与 `CHANGELOG.md` 的静态数据修复项。

本轮提交：`58c88f3` `fix(ui-preview): 对齐 Artifact Review 静态标题 / align artifact review title`。

2026-05-22 05:18 CST 本轮完成：

- 把内部试用相关文档再做一轮简化：`docs/ops/internal-trial-runbook.md`、`docs/engineering/local-dev-setup.md`、`docs/engineering/testing-strategy.md`、`docs/STATUS.md`、`CHANGELOG.md` 都收成“一个 canonical runbook + 其余短引用”的口径。
- 没有改变任何运行时边界：Desktop 默认 mock sidecar，真实 Codex 仍需 env opt-in，`apps/web` 仍未创建。
- 将本轮说明同步进 handoff，方便下一轮继续接主线或继续做更细的文档收口。

本轮提交：`3b91a19` `docs(trial): 精简内部试用文档 / simplify internal trial docs`。

2026-05-22 05:32 CST 本轮完成：

- 补强 Desktop renderer `run-replay-loader` 空态防护：空白 run id 直接在 renderer 本地给出错误态，不再触发 Desktop bridge / Workspace Core 请求。
- 新增 targeted spec 锁住该行为，并保留既有 replay request sequence guard 覆盖。
- 同步 `docs/STATUS.md`、`CHANGELOG.md` 与本 handoff。

本轮提交：`bb794f5` `fix(desktop): 拦截空回放 run id / guard blank replay run ids`。

2026-05-22 05:40 CST 本轮完成：

- 补强 Desktop renderer operator action 序列防护：连续触发 note / cancel / retry / rerun 时，旧请求的错误、busy 清理和反馈不再覆盖最新动作。
- 新增 `operator-action-runner` helper 与 targeted spec，覆盖旧 operator action 失败不污染最新状态、旧动作 follow-up 副作用不落地。
- `DesktopApp` 的 internal-trial operator actions 改为通过 helper 返回反馈，保持现有 bounded allowlist，不扩大操作范围。
- 同步 `docs/STATUS.md` 的 Desktop spec 数量与 `CHANGELOG.md` 修复项。

本轮提交：`5f23e9d` `fix(desktop): 防止操作动作乱序污染 / guard operator action races`。

2026-05-22 06:03 CST 本轮完成：

- 新增 Desktop Run Detail copy helper，锁住空 replay、空 task、空 artifact 与 metadata-only artifact 的 internal-trial 文案口径。
- `DesktopApp` 改用 helper 文案，明确 Refresh Evidence 是只读读取 replay source，不会 rerun，不 reveal local files。
- metadata-only artifact 现在在 payload 区域说明“无 bounded payload ref 且路径仍隐藏”，避免被误读成 UI 故障。
- 同步 `docs/STATUS.md` 的 Desktop spec 数量与 `CHANGELOG.md` 修复项。

本轮提交：`643c8c8` `fix(desktop): 明确回放空态文案 / clarify replay empty copy`。

2026-05-22 06:32 CST 本轮完成：

- 复核 Desktop preload/main allowlist 与 renderer 文案一致性，确认当前 runtime 仍是 bounded internal-trial bridge，没有新增能力需求。
- 更新 `docs/STATUS.md`，明确 preload 已暴露 bounded artifact payload read 与最小 operator action allowlist（cancel / retry / rerun / operator note）。
- 修正 `CHANGELOG.md` 的旧口径：不再说 operator action / artifact payload 正文仍未开放，改为完整 operator cockpit、完整 Artifact workspace 与本地路径 reveal 仍未开放。

本轮提交：`8b3aefc` `docs(desktop): 对齐预加载桥接口径 / align preload bridge docs`。

2026-05-22 08:04 CST 本轮完成：

- 补强 Desktop main bridge 的 Workspace Core action error 解析：错误响应体先按 `unknown`
  收窄，只接受字符串 `code` / `message`，畸形错误体走通用安全错误。
- 新增 targeted regression，锁住畸形 error payload 不再把内部 TypeError 或原始 token/path/url 细节穿过 Desktop bridge。
- 同步 `CHANGELOG.md` 修复项；没有扩大 operator action allowlist，也没有改变成功响应 schema。

本轮提交：`c32c622` `fix(desktop): 收紧桥接错误解析 / harden bridge error parsing`。

2026-05-22 08:37 CST 本轮完成：

- 收口 `ui-preview` 两处静态标题旧口径：`Run Detail` 相关 artifact 标题从 `Run Detail preview page`
  统一为 `Run Detail 页面 prototype`，与当前页面 / 产物 prototype 口径一致。
- 新增 `run-detail-view-model.spec.ts`，锁住 Run Detail 与 Artifact Review 两个视图模型的静态标题。
- 同步 `CHANGELOG.md` 的修复项；没有扩大布局、导航或外壳范围。

本轮提交：`a63abe0` `fix(ui-preview): 收口静态标题口径 / align static titles`。

2026-05-22 16:03 CST 本轮完成：

- 新增 Desktop `smoke:codex` opt-in runner，并通过真实 Codex window-level internal-trial / replay evidence / operator note 路径。
- 修正 runner readiness：先回 Home / Inbox，再通过 `Refresh Core` 等待非阻塞 sidecar startup 变 healthy，避免历史 view 和初始 `fetch failed` 让 smoke 误失败。
- 新增 Desktop 简体中文 / English 切换，默认简体中文，语言偏好只写本地 `localStorage`；未创建 `apps/web`，未扩大 Desktop sidecar runtime 默认值。
- 修正默认简中与 `smoke:codex` 的交叉问题：runner 不再依赖英文可见文案，改用 locale-neutral smoke hook。
- 同步 README、STATUS、CHANGELOG、testing strategy、runbook 与 `2026-05-22-codex-window-e2e-runner.md`。

本轮提交：`188fb00` `feat(desktop): 增加真实 Codex smoke 与语言切换 / add codex smoke and locale switch`。

---

---

## 7. 下一轮任务

优先级从高到低：

1. **Desktop 语言切换收口**：继续复查 `DesktopApp` 中仍未本地化的静态模型/组件文案，优先把 Home sidecar panel、Artifact Review policy、Settings / Source Roots、安全卡片和 replay metadata 常用路径继续搬到 `desktop-locale.ts`，不要引入完整 i18n 框架。
2. **`smoke:codex` 轻量维护**：仅在 Codex / Node / OS 变化或 runner 失败时复测；不要重复实现 runner。若改可见文案，保持 `data-smoke-id` hook 稳定。
3. **UI copy 与设计文档对齐**：必要时同步 `docs/design/ux/foundations/i18n-and-language-switching.md` 的实现状态，但不要创建 `apps/web` 或扩大产品边界。

---

## 8. 风险与阻塞

- 默认自动化 e2e 仅覆盖 mock sidecar window-level smoke；真实 Codex window-level coverage 已有 opt-in `smoke:codex` runner，但不能进入默认 CI。
- 本轮真实 Codex runner 覆盖 Desktop 自拉起 Codex sidecar 的观察路径；仍依赖本机 Codex 登录态、CLI 版本和响应时延。
- `smoke:codex` 现在依赖 renderer 上少量 `data-smoke-id` hook 以避免被语言切换文案打断；这些 hook 不能作为产品 API 或 Desktop bridge 能力边界。
- Renderer payload/replay/operator action guard 与 Run Detail copy helper 只覆盖同一 renderer 会话内的请求乱序、空态防护和 trial 文案口径；完整 Artifact
  workspace、导出、retention、本地路径 reveal、完整 operator cockpit 与完整 Run Detail 数据面仍不在本轮范围。
- `ui-preview` 静态数据只修正了 artifact review hero title 残留；没有动到 layout、CSS 或导航结构。
- 真实 Codex CLI 行为可能随本机版本变化；默认测试仍必须依赖 mock / fixture。
- Accepted ADR 不直接修改；Codex transport refinement 优先使用 Proposed ADR-0018 或新 ADR。
- 文档中凡提到 `apps/web`、installer、signing、notarization、公测/公开 alpha，都要明确为未完成或非本轮目标。
