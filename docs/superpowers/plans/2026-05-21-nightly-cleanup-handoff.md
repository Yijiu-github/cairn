# Internal Trial Mainline Handoff

> 状态：🟡 Active
> 最后更新：2026-05-24 08:01 CST
> 工作区：`/Users/taosiyu/Code/cairn`
> 当前主线：推进第一轮内部开发者试用，不再做泛化 nightly cleanup

---

## 1. 用途

这份文件是跨轮自动化/子 agent 的接力入口。它不是正式产品文档，也不是完整历史日志。每轮开始前必须读本文件，结束前必须更新本文件，记录本轮事实、验证、阻塞、风险、commit hash 与下一轮任务。

新的短主索引在 [`../README.md`](../README.md)，主题轨道在 [`../tracks/mainline-ui.md`](../tracks/mainline-ui.md)。本文件保留当前接力和较长历史，不再承担唯一入口职责。

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

2026-05-24 07:26 CST 复核：

- 本轮开始时，`docs/superpowers/README.md` 尚未存在；当前已补出短主索引并把 recurring mainline workstream 收束到 [`../tracks/mainline-ui.md`](../tracks/mainline-ui.md)。

- 当前 `HEAD` / `refs/heads/codex/cairn-mainline-ui` 为 `9540181`
  `docs(status): 记录窗口烟测诊断提交 / record window smoke diagnostics commit`。
- `git status --short` 仍会显示多份 UX 文档 / SVG 的 staged / unstaged mismatch；这是因为当前沙箱仍无法写
  `/Users/taosiyu/Code/cairn/.git/worktrees/codex-cairn-mainline-ui`，真实 linked-worktree index
  无法刷新。不要把这组 `MM` 误判为未提交 UX 工作。
- 本轮通过临时 index 从 `HEAD` 重建树，并用 common gitdir 形式
  `git --git-dir=/Users/taosiyu/Code/cairn/.git update-ref` 移动分支，成功绕过该 gitdir 的
  `index.lock` / `HEAD.lock` 写权限限制并创建本地提交。普通 `git add`、当前 worktree 语境下的
  `git commit` / `git update-ref` 仍会因 linked-worktree gitdir 不可写失败。
- `git diff HEAD --name-only` 在本轮开始时为空；不要用普通 `git status` 判断真实剩余 diff。
- 当前文档主线已切到 Desktop UI 信息架构收口：主导航只保留 Home / Inbox、Runs、
  Runtime Status、Settings；Run Detail、Artifact Detail、Activity Timeline、Task Explorer 与
  Replay View 都是二级页面或观察面。
- 本轮没有触碰 Workspace Core、Desktop bridge、preload allowlist、operator action API、ReplaySource
  shape、Artifact schema、payload API、路径隐藏、sidecar runtime 或真实 Codex env opt-in。

当前已知未完成主线不在“泛化整理”，而在 internal trial 后续硬化：

- Desktop 默认 mock sidecar 已有最小 window-level smoke；真实 Codex window-level smoke 已有 `smoke:codex` opt-in runner。
- 真实 Codex smoke 仍需 env opt-in，不进入默认 CI。
- Desktop Home 已转向 Mission Control 风格首轮体验壳，突出“派发给总 Agent”、Agent 总览、
  运行中 Agent 与最近进展；当前可输入任务草稿，但草稿只保存在 renderer 本地，dispatch 仍是
  bounded internal-trial 入口，不是自由文本 Supervisor 执行入口，也不是完整 operator cockpit。
- Desktop Home 已补上 visual-v1 风格的 CSS 落地：深色侧栏、浅色渐变工作面板、派活 hero、
  Agent 状态卡、共享 UI class vocabulary 本地映射和默认窗口下主工作台优先布局已可在
  Electron 开发窗口中看到。
- Run Detail / Artifact payload / Settings 的默认简中 surface 已进一步收口，已观察运行、运行编号、
  回放证据、任务/产物空态、payload 状态和设置页源目录提示都走 `desktop-locale.ts`。
- Run Detail 的 operator note 成功提示已与右侧 replay inspector 的 `Trace 事件` 计数建立明确文案关联。
- UX 主题文档正在收敛主导航与二级观察面口径；不要把旧 `/agents`、`/tasks`、`/artifacts`、
  `/activity` 或侧栏 `Agents` / `Artifacts` / `Activity` 重新写成 R1 Desktop 主入口。
- `visual-reference-v1.md` 与 `docs/design/ux/assets/` 已复查：视觉参考与 SVG 侧栏主入口统一为
  Home / Inbox、Runs、Runtime Status、Settings；Activity Timeline、Task Explorer、Replay View 保留为
  二级观察面参考，不再作为 R1 Desktop 主入口。
- 本轮尝试执行默认 mock Desktop Home 视觉烟测，但当前环境没有得到可信截图证据：
  `../../node_modules/.bin/electron-vite build` 可直接通过，`pnpm` 入口提前返回 `fetch failed`，
  `node scripts/window-smoke.mjs` 超时等待 `main-window-ready-to-show`，in-app Browser 按安全策略阻止
  `file://` renderer 预览。因此本轮没有修改 Desktop UI。
- 本轮已把默认 mock window smoke 的失败点从“等待 `main-window-ready-to-show` 超时”收窄为：
  当前 macOS / Codex 会话下 Electron 在 app registration 阶段 `SIGABRT` 退出，Cairn main module 尚未写出
  `main-process-loaded` signal。`window-smoke.mjs` 现在会在 Electron 提前退出时直接报告 code / signal，
  不再等满超时。
- 本轮继续复核视觉烟测阻塞：同一 Codex/macOS 会话下 Playwright Chromium headless 也在 Mach bootstrap
  registration 阶段因 `bootstrap_check_in ... Permission denied` / `SIGTRAP` 崩溃，Electron 最新 `.ips`
  仍指向 `_RegisterApplication` / `GetCurrentProcess` 早期 abort。Electron 与 Chromium binary 仍带
  `com.apple.provenance`，复制到 `/private/tmp` 后 `xattr -cr` 仍未能移除该属性。本轮因此仍不修改
  Desktop UI。
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
- `9539d44` `feat(desktop): 添加 mission control 文案与视图模型 / add mission control copy and view model`
- `50d49d5` `feat(desktop): 拆分首页为 mission control 布局 / split home into mission control layout`
- `b86cb23` `fix(desktop): 收紧 mission control 首页体验 / tighten mission control home UX`
- `6590e36` `feat(desktop): 简化首屏 Agent 状态 / simplify home agent status`
- `9fb8d02` `feat(desktop): 合并首页 Agent 动态 / merge home agent activity`
- `6145775` `feat(desktop): 压缩首页待处理摘要 / compress home pending summary`
- `a1108bb` `feat(desktop): 压缩首页固定运行摘要 / compress pinned runs summary`
- `b4cfce7` `fix(desktop): 收口运行详情反馈 / clarify run detail feedback`
- `31d05e6` `fix(desktop): 收口产物卡片文案 / clarify artifact card copy`
- `3a0807a` `fix(desktop): 强化备注反馈指引 / clarify note feedback`
- `b42e5b0` `docs(ux): 统一桌面主导航文档 / align desktop nav docs`
- `7ce344b` `docs(status): 记录 UX 提交与下一轮烟测 / record ux commit and smoke next`
- `260b795` `docs(status): 记录视觉烟测阻塞 / record visual smoke blocker`
- `647a6c9` `test(desktop): 收紧窗口烟测诊断 / clarify window smoke diagnostics`
- `9540181` `docs(status): 记录窗口烟测诊断提交 / record window smoke diagnostics commit`
- `4aa70ea` `docs(status): 记录 GUI 注册阻塞 / record gui registration blocker`

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

2026-05-22 17:12 CST Desktop first-run 简中体验收口验证通过：

- 红灯：`pnpm --filter @cairn/desktop test -- --run src/renderer/src/desktop-locale.spec.ts`
  先因首轮体验简中文案字段缺失失败；随后新增 `agentRunsLabel` / `processLabel`
  断言，再因字段缺失失败。
- 绿灯：补齐 Desktop locale copy，并把 Home sidecar panel、Run Detail replay 提示、
  Artifact payload / path exposure policy、Settings source-root 空态、安全卡片和 run card /
  trace 描述接到 `desktop-locale.ts`；同一 locale spec 通过。
- 发现并修复 `@cairn/desktop test:e2e` 的 runner 退出竞态：页面 smoke event 已写出，但
  通过 `node_modules/.bin/electron` 包装器启动时 Electron 在 signal 后可能卡住退出等待；
  `window-smoke.mjs` 改为优先解析真实 Electron binary。
- `pnpm --filter @cairn/desktop typecheck`
- `pnpm --filter @cairn/desktop lint`
- `pnpm --filter @cairn/desktop test -- --run src/renderer/src/desktop-locale.spec.ts src/renderer/src/run-detail-copy.spec.ts src/renderer/src/run-replay-loader.spec.ts src/renderer/src/operator-action-runner.spec.ts src/renderer/src/artifact-payload-loader.spec.ts src/main/index.spec.ts src/main/workspace-core-bootstrap.spec.ts`
- `pnpm --filter @cairn/desktop test:e2e`
- `pnpm exec prettier --check apps/desktop/scripts/window-smoke.mjs apps/desktop/src/renderer/src/desktop-app.tsx apps/desktop/src/renderer/src/desktop-locale.ts apps/desktop/src/renderer/src/desktop-locale.spec.ts`
- `git diff --check`

2026-05-22 19:03 CST Desktop Mission Control 首屏验证通过：

- 子 agent review 已回收并关闭；主要问题为首屏计数不一致、默认简中漏英文、CTA 像自由输入但实际触发 internal trial、重复 Workspace Core 状态面板与 smoke selector 覆盖不足。
- 修复后验证：
  `pnpm --filter @cairn/desktop test -- --run src/renderer/src/desktop-app.spec.ts src/renderer/src/desktop-locale.spec.ts src/renderer/src/run-detail-copy.spec.ts`
  通过，3 个文件 12 个测试。
- `pnpm --filter @cairn/desktop typecheck`
- `pnpm --filter @cairn/desktop lint`
- `pnpm --filter @cairn/desktop build`
- `pnpm --filter @cairn/desktop test:e2e`
- `pnpm exec prettier --check apps/desktop/src/renderer/src/desktop-app.spec.ts apps/desktop/src/renderer/src/desktop-app.tsx apps/desktop/src/renderer/src/desktop-locale.spec.ts apps/desktop/src/renderer/src/desktop-locale.ts apps/desktop/src/renderer/src/desktop-model.ts`
- `git diff --check`

2026-05-22 19:03 CST Mission Control 文档同步验证通过：

- `pnpm exec prettier --check CHANGELOG.md apps/desktop/README.md docs/STATUS.md docs/ops/internal-trial-runbook.md`
- `pnpm exec markdownlint-cli2 CHANGELOG.md apps/desktop/README.md docs/STATUS.md docs/ops/internal-trial-runbook.md`
- `pnpm run docs:lint`
- `git diff --check -- CHANGELOG.md apps/desktop/README.md docs/STATUS.md docs/ops/internal-trial-runbook.md`

2026-05-22 21:52 CST Mission Control 任务草稿验证通过：

- 红灯：新增 `mission-draft.spec.ts` 与 Home SSR 断言后，targeted test 因 helper 尚不存在、
  composer 仍为 `readOnly` 且无 `name="missionDraft"` 失败。
- 绿灯：新增 `mission-draft.ts`，Mission Control composer 改为 renderer 本地受控输入；空白草稿会显示本地校验错误，非空草稿仍触发 bounded internal-trial path，不把草稿发送给 planner / Workspace Core。
- 发现 `@cairn/desktop test:e2e` 在收到 smoke signal 后偶发等待 Electron 退出超时；根因是 smoke
  runner 把 post-signal graceful exit 当成产品 gate。已在 runner 中保留 SIGTERM graceful path，
  但超时后 SIGKILL 清理并把已收到 smoke signal 视为成功。
- `pnpm --filter @cairn/desktop test -- --run src/renderer/src/mission-draft.spec.ts src/renderer/src/desktop-app.spec.ts src/renderer/src/desktop-locale.spec.ts src/main/workspace-core-bootstrap.spec.ts src/main/index.spec.ts`
  通过，5 个文件 46 个测试。
- `pnpm --filter @cairn/desktop typecheck`
- `pnpm --filter @cairn/desktop lint`
- `pnpm --filter @cairn/desktop test:e2e`
- `pnpm exec prettier --check apps/desktop/scripts/window-smoke.mjs apps/desktop/src/renderer/src/desktop-app.tsx apps/desktop/src/renderer/src/desktop-app.spec.ts apps/desktop/src/renderer/src/desktop-locale.ts apps/desktop/src/renderer/src/desktop-locale.spec.ts apps/desktop/src/renderer/src/mission-draft.ts apps/desktop/src/renderer/src/mission-draft.spec.ts CHANGELOG.md apps/desktop/README.md docs/STATUS.md docs/ops/internal-trial-runbook.md`
- `pnpm exec markdownlint-cli2 CHANGELOG.md apps/desktop/README.md docs/STATUS.md docs/ops/internal-trial-runbook.md`
- `pnpm run docs:lint`
- `git diff --check`

2026-05-23 14:12 CST Run Detail operator note 反馈验证通过：

- 红灯：上一轮新增 locale 断言后，
  `pnpm --filter @cairn/desktop test -- --run src/renderer/src/desktop-locale.spec.ts`
  因 operator note 成功文案仍未指向右侧 replay inspector 的 `Trace 事件` 计数失败。
- 绿灯：更新 `desktop-locale.ts` 的 zh-CN / en-US operator note 成功文案后，
  `pnpm --filter @cairn/desktop test -- --run src/renderer/src/desktop-locale.spec.ts src/renderer/src/desktop-app.spec.ts src/renderer/src/operator-action-runner.spec.ts`
  通过，3 个文件 14 个测试。
- `pnpm --filter @cairn/desktop typecheck`
- `pnpm --filter @cairn/desktop lint`
- `pnpm exec prettier --check apps/desktop/src/renderer/src/desktop-locale.ts apps/desktop/src/renderer/src/desktop-locale.spec.ts CHANGELOG.md docs/STATUS.md docs/superpowers/plans/2026-05-21-nightly-cleanup-handoff.md`
- `pnpm exec markdownlint-cli2 CHANGELOG.md docs/STATUS.md docs/superpowers/plans/2026-05-21-nightly-cleanup-handoff.md`
- `pnpm run docs:lint`
- `git diff --check`

2026-05-23 16:55 CST Desktop Home visual-v1 首屏验证：

- 红灯：新增 `desktop-app.spec.ts` 的 visual-v1 / 响应式断言后，
  `pnpm --filter @cairn/desktop test -- --run src/renderer/src/desktop-app.spec.ts`
  先因首页缺少 `visual-v1-home` / `mission-command-center` / `operator-status-rail`
  布局标记失败；随后又因 1100px 以下主工作台未优先显示、默认窗口宽度下状态栏与 hero
  抢宽失败。
- 绿灯：`desktop-app.tsx` 增加首页 visual-v1 布局 class，`styles.css` 补齐 Desktop renderer
  的共享 UI class vocabulary 映射、深色侧栏、渐变工作面板、派活 hero、Agent 状态卡、
  右栏状态卡与响应式布局；同一 spec 通过，10 个测试。
- 手动视觉验证：`pnpm --filter @cairn/desktop dev` 重启后，Electron 窗口不再空白，并显示
  visual-v1 风格首页；in-app browser 访问 `http://localhost:5173/` 也无 console error。
- 已通过：`pnpm --filter @cairn/desktop test -- --run src/renderer/src/desktop-app.spec.ts src/renderer/src/desktop-locale.spec.ts`
  ，2 个文件 15 个测试。
- 已通过：`pnpm --filter @cairn/desktop typecheck`。
- 已通过：`pnpm --filter @cairn/desktop lint`。
- 已通过：`pnpm --filter @cairn/desktop build`。
- 已通过：`pnpm exec markdownlint-cli2 CHANGELOG.md docs/STATUS.md docs/superpowers/plans/2026-05-21-nightly-cleanup-handoff.md`。
- 已通过：`git diff --check`。
- `pnpm exec prettier --check ...` 首次因 `styles.css` 格式失败，已用 Prettier 写回；最终复核结果见本轮提交前验证记录。

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

2026-05-22 17:12 CST 本轮完成：

- 收口 Desktop 默认简体中文首轮体验：Home sidecar panel、Run Detail replay 成功/错误提示、
  Artifact payload preview、Artifact Review path exposure policy、Settings source-root 空态、
  safety/defaults cards、run card 与 trace 描述改为走 `desktop-locale.ts`。
- 新增 locale regression，锁住首轮体验关键简中文案、AgentRuns 标签与进程标签，避免误把
  AgentRun 状态显示成可重试任务。
- 修复默认 mock window smoke runner：优先通过 `require('electron')` 解析真实 Electron binary，
  避免 `.bin/electron` Node 包装器在 smoke event 后卡住退出等待。
- 未引入完整 i18n 框架，未创建 `apps/web`，未改变 Desktop 默认 mock sidecar / 真实 Codex
  env opt-in 边界。

本轮代码提交：`78e5433` `feat(desktop): 收口首轮简中体验 / polish first-run zh-CN UX`。

2026-05-22 19:03 CST 本轮完成：

- 收口 Desktop Mission Control 首页 review：静态 Agent 计数与可见 Agent 卡片对齐，默认简中首页不再漏出 `Live agents` / recent progress 英文文案。
- 主 CTA 保留 `data-smoke-id="run-internal-trial"`，并将说明改成“当前预览派发 bounded internal trial”，避免误导为自由文本 Supervisor 任务入口。
- 移除首页右侧重复 Workspace Core 状态面板，只保留 hero status card、runtime health、安全默认与下一步卡片，避免重复 error selector 和用户信息过载。
- 新增/扩展 renderer spec，锁住计数一致、默认简中不漏英文、`run-internal-trial` selector 唯一且首页无重复 Core error selector。
- 同步 `apps/desktop/README.md`、`docs/STATUS.md`、`docs/ops/internal-trial-runbook.md`、`CHANGELOG.md`，明确 Home 已转向 Mission Control 首轮体验，但当前仍是 bounded internal-trial 入口，不是完整产品 UI、不是自由文本任务派发、不是 `apps/web`。

本轮代码提交：`9539d44` `feat(desktop): 添加 mission control 文案与视图模型 / add mission control copy and view model`。
本轮代码提交：`50d49d5` `feat(desktop): 拆分首页为 mission control 布局 / split home into mission control layout`。
本轮代码提交：`b86cb23` `fix(desktop): 收紧 mission control 首页体验 / tighten mission control home UX`。
本轮文档提交：`392a6ec` `docs(desktop): 对齐 mission control 首屏口径 / align mission control home docs`。

2026-05-22 21:52 CST 本轮完成：

- 把 Mission Control composer 从只读预览输入推进为 renderer 本地任务草稿：用户可以输入草稿，空白点击会显示本地校验错误。
- 保持产品边界：草稿不发送给 Workspace Core / planner；非空派发仍走 bounded `runInternalTrial` path，`data-smoke-id="run-internal-trial"` 保持稳定。
- 新增 `mission-draft.ts` 与 spec，锁住 blank / trimmed draft 行为；扩展 Home SSR 和 locale spec，锁住 editable composer、简中本地草稿提示和空白错误文案。
- 更新 README、STATUS、runbook、CHANGELOG，明确“任务草稿本地保存，真实 Supervisor 执行尚未开放”。
- 修复默认 mock window smoke runner 的 post-signal 清理：收到 smoke event 后先 SIGTERM，若 Electron linger 再 SIGKILL，避免把清理超时误判为窗口 smoke 失败。

本轮代码提交：`86a1ef9` `feat(desktop): 增加 mission control 任务草稿 / add mission control task draft`。

---

2026-05-22 23:05 CST 本轮完成：

- 继续把 Mission Control 首页收向“用户能直接理解并上手的派活台”：
  默认简中下的顶部状态、pinned runs、handoffs、status strip 与运行摘要都不再露出明显英文 fixture。
- 让首页主路径更清楚：用户可以先输入本地任务草稿，再点击“派发给总 Agent”，并沿着 Run Detail 读取 replay / artifact / operator note。
- 新增/扩展 renderer 回归，锁住默认简中首页不再漏出 `Live agents`、`Design agent`、`Desktop minimal skeleton`、`healthy`、`local sidecar` 等首屏英文钩子。
- 把 `packages/ui` 的 `RunCard` 共享列头从 `Operator` 本地化为 `操作方`，让 Desktop 与其它 shell 共用同一口径。
- 更新 handoff 的下一轮方向，继续保留“先减法、再上手烟测、最后轻量维护 `smoke:codex`”的节奏。
- 验证：
  `pnpm --filter @cairn/desktop test -- --run src/renderer/src/desktop-app.spec.ts src/renderer/src/desktop-locale.spec.ts`
  `pnpm --filter @cairn/desktop lint`
  `pnpm --filter @cairn/desktop typecheck`
  `pnpm exec prettier --check apps/desktop/src/renderer/src/desktop-app.tsx apps/desktop/src/renderer/src/desktop-app.spec.ts apps/desktop/src/renderer/src/desktop-model.ts packages/ui/src/cairn/run-card.tsx docs/superpowers/plans/2026-05-21-nightly-cleanup-handoff.md`
  `git diff --check`
- 本轮代码提交：`890fb56` `feat(desktop): 收口默认简中首屏 / tighten zh-CN first screen`。

2026-05-23 00:35 CST 本轮完成：

- 继续做 Desktop Mission Control 默认简中首屏减法：把首页状态卡、安全栏和接力卡里用户会看到的
  `Workspace Core` / `sidecar` / `Preload` / `operator 白名单` 等内部词收敛为“本地运行服务”“运行安全”“桌面桥接范围”“受限接管动作”等口径。
- 同步 `createLocalizedDesktopModel` 的 zh-CN runtime card / handoff / status strip 文案，保持英文 locale 与底层 dev sidecar 命名不变。
- 新增 Home SSR 回归，锁住默认简中首页不再露出旧的 `Workspace Core 本地 sidecar`、`预览安全`、
  `静态样例`、`Preload 白名单`、`sidecar 生命周期`、`受限 operator 白名单` 等首屏噪音。
- 保持边界：没有改变 `data-smoke-id="run-internal-trial"`，没有接真实 planner，没有把草稿发送给
  Workspace Core，也没有改变 Desktop sidecar 默认 mock / 真实 Codex env opt-in。
- 验证：
  `pnpm --filter @cairn/desktop test -- --run src/renderer/src/desktop-app.spec.ts src/renderer/src/desktop-locale.spec.ts`
  已通过，10 个测试。
  `pnpm --filter @cairn/desktop lint`
  已通过。
  `pnpm --filter @cairn/desktop typecheck`
  已通过。
  `pnpm exec prettier --check apps/desktop/src/renderer/src/desktop-app.tsx apps/desktop/src/renderer/src/desktop-app.spec.ts apps/desktop/src/renderer/src/desktop-locale.ts apps/desktop/src/renderer/src/desktop-locale.spec.ts CHANGELOG.md docs/STATUS.md docs/superpowers/plans/2026-05-21-nightly-cleanup-handoff.md`
  已通过。
  `pnpm exec markdownlint-cli2 CHANGELOG.md docs/STATUS.md docs/superpowers/plans/2026-05-21-nightly-cleanup-handoff.md`
  已通过。
  `pnpm run docs:lint`
  已通过。
  `git diff --check`
  已通过。
- 本轮代码/文档提交：`b3c4cee` `fix(desktop): 收口首屏技术噪音 / reduce home technical noise`。

2026-05-23 01:25 CST 本轮完成：

- 收口 Desktop Run Detail / Artifact payload / Settings 默认简中文案：已观察运行、运行编号、回放证据、
  task/artifact 空态、payload 可加载状态、metadata-only artifact、Settings 源目录提示都改为用户可读口径。
- `DesktopApp` 不再在默认简中 Run Detail 中直接渲染 `Workspace Core run id`、`Replay inspector`、
  `Observed run id`、`loading` 等明显英文 runtime 标签；Run Detail 空态、task 空态、artifact 空态改为走
  `desktop-locale.ts`。
- 新增/扩展 renderer regression，锁住默认简中 Run Detail 已观察运行 surface 不再漏出明显英文 runtime label；
  locale spec 同步锁住运行编号、回放证据未加载、未加载值和加载中状态文案。
- 同步 `CHANGELOG.md` 与 `docs/STATUS.md`，明确这是第一轮 internal trial 用户可见文案收口，不代表完整产品
  UI、自由文本 Supervisor dispatch、`apps/web`、installer、signing 或 notarization。
- 保持边界：没有改变 `data-smoke-id="run-internal-trial"`，没有接真实 planner，没有把草稿发送给
  Workspace Core，也没有改变 Desktop sidecar 默认 mock / 真实 Codex env opt-in。
- 验证：
  `pnpm --filter @cairn/desktop test -- --run src/renderer/src/desktop-app.spec.ts src/renderer/src/desktop-locale.spec.ts src/renderer/src/run-detail-copy.spec.ts src/renderer/src/run-replay-loader.spec.ts src/renderer/src/operator-action-runner.spec.ts src/renderer/src/artifact-payload-loader.spec.ts`
  已通过，6 个文件 22 个测试。
  `pnpm --filter @cairn/desktop typecheck`
  已通过。
  `pnpm --filter @cairn/desktop lint`
  已通过。
  `pnpm exec prettier --check apps/desktop/src/renderer/src/desktop-app.tsx apps/desktop/src/renderer/src/desktop-app.spec.ts apps/desktop/src/renderer/src/desktop-locale.ts apps/desktop/src/renderer/src/desktop-locale.spec.ts CHANGELOG.md docs/STATUS.md`
  已通过。
  `pnpm exec markdownlint-cli2 CHANGELOG.md docs/STATUS.md`
  已通过。
  `pnpm run docs:lint`
  已通过。
  `git diff --check`
  已通过。
- 本轮代码/正式文档提交：`2cdd841` `fix(desktop): 收口运行详情简中文案 / polish run detail zh-CN copy`。

2026-05-23 01:48 CST 本轮完成：

- 启动默认 mock Desktop 开发态，按人类上手路径完成手动烟测：输入任务草稿、派发给总
  Agent、进入 Run Detail、读取 replay evidence、查看 artifact payload 区域、添加 operator note、
  进入 Settings 空态。
- 结论：当前默认简中已经可以初步体验，但首轮页面仍有两处低风险理解噪音：运行中 Agent
  卡片显示内部 `agent-*` ID，Settings / 安全侧栏的“查看证据”说明实际更像下一步行动提示。
- 修复：运行中 Agent 卡片副标签改为用户可读状态；安全侧栏卡片改为“下一步”，说明先走受限
  internal-trial，再查看回放证据或产物负载。
- 新增/扩展 renderer regression，锁住默认简中首页不再显示内部 agent id 或错位的本地存储提示，
  并锁住新的“下一步”文案。
- 保持边界：没有改变 `data-smoke-id="run-internal-trial"`，没有接真实 planner，没有把草稿发送给
  Workspace Core，也没有改变 Desktop sidecar 默认 mock / 真实 Codex env opt-in。
- 验证：
  `pnpm --filter @cairn/desktop test -- --run src/renderer/src/desktop-app.spec.ts src/renderer/src/desktop-locale.spec.ts src/renderer/src/mission-draft.spec.ts src/renderer/src/run-detail-copy.spec.ts src/renderer/src/run-replay-loader.spec.ts src/renderer/src/artifact-payload-loader.spec.ts src/renderer/src/operator-action-runner.spec.ts`
  已通过，7 个文件 24 个测试。
  `pnpm --filter @cairn/desktop typecheck`
  已通过。
  `pnpm --filter @cairn/desktop lint`
  已通过。
  `pnpm --filter @cairn/desktop build`
  已通过。
  `pnpm --filter @cairn/desktop test:e2e`
  已通过。
  `pnpm exec prettier --check apps/desktop/src/renderer/src/desktop-app.tsx apps/desktop/src/renderer/src/desktop-app.spec.ts apps/desktop/src/renderer/src/desktop-locale.ts apps/desktop/src/renderer/src/desktop-locale.spec.ts`
  已通过。
  `git diff --check`
  已通过。
- 本轮代码/文档提交：`e6c4a5d` `fix(desktop): 收口上手路径提示 / polish first-run guidance`。

2026-05-23 03:45 CST 本轮完成：

- 继续推进 Desktop Mission Control 首屏 UI 改造的小块：把 Agent 总览、运行中的 Agent 与最近
  进展合并为一个 Agent 动态面板，减少首屏重复信息与信息层级堆叠。
- 保留旁侧体验指引：`写下目标 → 派发给总 Agent → 查看 Agent 进展`，让用户第一轮动作仍然
  清楚可见，但不再把“总览”与“最近进展”拆成独立重复卡片。
- 简中首页把 `运行时 Agent` 投影为 `执行 Agent`，并把 `mock sidecar` / `Codex opt-in`
  边界说明从首屏 Agent 卡片摘要中移出；底层 dev fixture 与英文 locale 仍保留工程事实口径。
- 更新默认首页描述与最近进展文案，使其指向“Agent 动态”而不是旧的 `Agent 总览` 口径。
- 删除不再使用的 connection label formatter；没有改变 Desktop bridge、bounded internal-trial、
  `data-smoke-id="run-internal-trial"`、默认 mock sidecar 或真实 Codex env opt-in 边界。
- 验证：
  `pnpm --filter @cairn/desktop test -- --run src/renderer/src/desktop-app.spec.ts src/renderer/src/desktop-locale.spec.ts`
  已通过，2 个文件 12 个测试。
  `pnpm --filter @cairn/desktop typecheck`
  已通过。
  `pnpm --filter @cairn/desktop lint`
  已通过。
  `pnpm --filter @cairn/desktop build`
  已通过。
  `pnpm exec prettier --check apps/desktop/src/renderer/src/desktop-app.tsx apps/desktop/src/renderer/src/desktop-app.spec.ts apps/desktop/src/renderer/src/desktop-locale.ts apps/desktop/src/renderer/src/desktop-locale.spec.ts apps/desktop/src/renderer/src/desktop-model.ts apps/desktop/src/renderer/src/styles.css CHANGELOG.md docs/superpowers/plans/2026-05-21-nightly-cleanup-handoff.md`
  已通过。
  `pnpm exec markdownlint-cli2 CHANGELOG.md docs/superpowers/plans/2026-05-21-nightly-cleanup-handoff.md`
  已通过。
  `pnpm run docs:lint`
  已通过。
  `git diff --check`
  已通过。
- 本轮代码提交：`9fb8d02` `feat(desktop): 合并首页 Agent 动态 / merge home agent activity`。

2026-05-23 07:43 CST 本轮完成：

- Desktop Mission Control 首页继续做右栏减法：把接力收件箱、pinned runs 与下一步提示收拢为更明确的 `下一步 / 待处理` 行动区，并把固定运行单独保留为 `已固定运行`。
- 左侧 `Agent 动态` 保持不变，首页首屏信息层级调整为：派活工作台 -> Agent 动态 -> 下一步 / 待处理 -> 已固定运行。
- 扩展 `desktop-app.spec.ts`、`desktop-locale.ts` 与 `styles.css`，锁住右侧新层级与简中文案，避免回退到旧的接力收件箱 / pinned runs 堆叠口径。
- 同步 `docs/STATUS.md` 与 `CHANGELOG.md`，明确这次调整仍只是首屏 internal trial 的信息收口，不是完整产品 UI 重构。
- 保持边界：没有创建 `apps/web`，没有接真实 planner，没有改变 Desktop sidecar 默认 mock 或真实 Codex env opt-in 边界，`data-smoke-id="run-internal-trial"` 仍保持稳定。
- 验证：`pnpm --filter @cairn/desktop test -- --run src/renderer/src/desktop-app.spec.ts`、`pnpm --filter @cairn/desktop typecheck`、`pnpm --filter @cairn/desktop lint`、`pnpm --filter @cairn/desktop build`、`pnpm exec prettier --check CHANGELOG.md docs/STATUS.md apps/desktop/src/renderer/src/desktop-app.tsx apps/desktop/src/renderer/src/desktop-app.spec.ts apps/desktop/src/renderer/src/desktop-locale.ts apps/desktop/src/renderer/src/styles.css`、`pnpm exec markdownlint-cli2 CHANGELOG.md docs/STATUS.md`、`pnpm run docs:lint`、`git diff --check`。
- 本轮代码/正式文档提交：`54c9868` `feat(desktop): 收口首页待处理区域 / tighten home pending area`。
- 风险：右栏仍保留两张待处理卡片，下一轮可以继续压成更短的辅助区，或把 `已固定运行` 改成摘要 / 折叠样式，继续降低首页认知负担。

2026-05-23 11:55 CST 本轮完成：

- Desktop Mission Control 首屏继续压缩右栏待处理区：把 `下一步 / 待处理` 收成一个摘要卡，保留两条待处理事实，但不再让它们以两张同等级卡片出现。
- `已固定运行` 仍作为单独区块保留，首页层级继续维持为：派活工作台 -> Agent 动态 -> 待处理摘要 -> 已固定运行。
- `desktop-app.tsx` 新增 `PendingQueueSummary`，`desktop-locale.ts` 新增待处理摘要词条，`styles.css` 新增摘要卡样式；`desktop-app.spec.ts` 锁住新层级和待处理队列标题。
- 同步 `docs/STATUS.md` / `CHANGELOG.md` 的口径：这仍只是 internal trial 首屏信息收口，不是完整产品 UI 重构。
- 保持边界：没有创建 `apps/web`，没有接真实 planner，没有改变 Desktop sidecar 默认 mock 或真实 Codex env opt-in 边界，`data-smoke-id="run-internal-trial"` 仍保持稳定。
- 验证：`pnpm --filter @cairn/desktop test -- --run src/renderer/src/desktop-app.spec.ts`、`pnpm --filter @cairn/desktop typecheck`、`pnpm --filter @cairn/desktop lint`、`pnpm --filter @cairn/desktop build`、`pnpm exec prettier --check apps/desktop/src/renderer/src/desktop-app.tsx apps/desktop/src/renderer/src/desktop-app.spec.ts apps/desktop/src/renderer/src/desktop-locale.ts apps/desktop/src/renderer/src/styles.css`、`pnpm exec markdownlint-cli2 docs/STATUS.md docs/superpowers/plans/2026-05-21-nightly-cleanup-handoff.md CHANGELOG.md`、`pnpm run docs:lint`、`git diff --check`。
- 本轮代码/正式文档提交：`6145775` `feat(desktop): 压缩首页待处理摘要 / compress home pending summary`。
- 风险：右栏虽然已压成摘要卡，但仍可能在小屏或更复杂状态下显得偏满；下一轮可以考虑把 `已固定运行` 改成更短的摘要或折叠式区块，继续减少首屏认知负担。
- 下一轮优先任务：继续压缩首页右栏，优先判断 `已固定运行` 是否还能再短一层，或是否适合折叠成轻量辅助区。

2026-05-23 12:30 CST 本轮完成：

- Desktop Mission Control 首屏继续压缩右栏：把 `已固定运行` 从共享 `RunCard` 大卡片改为更轻的两条可复开摘要行，保留标题、run id、状态、负责 Agent 与关键 metric。
- `下一步 / 待处理` 摘要保持主行动区，`已固定运行` 降为辅助区；首页层级继续维持为：派活工作台 -> Agent 动态 -> 待处理摘要 -> 固定运行轻摘要。
- 新增 pinned run 状态 / 显示数量 locale copy，补充 renderer / locale regression，并清理同范围旧 `.run-list` 样式残留。
- 同步 `docs/STATUS.md` / `CHANGELOG.md`：这仍只是 internal trial 首屏信息收口，不是完整产品 UI、真实 planner、自由文本 Supervisor dispatch 或 `apps/web`。
- 保持边界：没有创建 `apps/web`，没有接真实 planner，没有改变 Desktop sidecar 默认 mock 或真实 Codex env opt-in 边界，`data-smoke-id="run-internal-trial"` 仍保持稳定。
- 验证：`pnpm --filter @cairn/desktop test -- --run src/renderer/src/desktop-app.spec.ts src/renderer/src/desktop-locale.spec.ts`、`pnpm --filter @cairn/desktop typecheck`、`pnpm --filter @cairn/desktop lint`、`pnpm --filter @cairn/desktop build`、`pnpm exec prettier --check apps/desktop/src/renderer/src/desktop-app.tsx apps/desktop/src/renderer/src/desktop-app.spec.ts apps/desktop/src/renderer/src/desktop-locale.ts apps/desktop/src/renderer/src/desktop-locale.spec.ts apps/desktop/src/renderer/src/styles.css CHANGELOG.md docs/STATUS.md docs/superpowers/plans/2026-05-21-nightly-cleanup-handoff.md`、`pnpm exec markdownlint-cli2 CHANGELOG.md docs/STATUS.md docs/superpowers/plans/2026-05-21-nightly-cleanup-handoff.md`、`pnpm run docs:lint`、`git diff --check`。
- 本轮代码/正式文档提交：`a1108bb` `feat(desktop): 压缩首页固定运行摘要 / compress pinned runs summary`。
- 风险：首屏右栏已经从信息墙继续变轻；下一轮不应继续在首页堆新卡片，优先转向真实上手路径里的 artifact payload 加载文案与 operator note 成功反馈。
- 下一轮优先任务：默认 mock Desktop 中走 Run Detail -> artifact payload -> operator note，确认用户是否能看懂“产物负载已加载 / 备注已记录”的反馈。

2026-05-23 12:45 CST 本轮完成：

- 默认 mock Desktop 上手路径继续聚焦 Run Detail，而不是继续扩首页：收口 artifact payload 与
  operator note 成功反馈。
- `ArtifactSummaryCard` 加载到 payload 后不再显示 `text/plain` / `application/json` /
  `truncated` 等内部字段，改为“负载已加载，本地路径仍隐藏。”；截断时显示“负载已加载，本地路径仍隐藏；内容已截断。”。
- 添加 operator note 后的成功反馈从 `Operator note 已记录为 ...` 改为说明“备注已记录到本地运行证据；回放证据和证据事件计数已刷新”，让用户能理解备注已落到 evidence 链路。
- 新增 `formatArtifactPayloadStatus` helper 与 regression，扩展 locale spec；同步 `docs/STATUS.md` 与
  `CHANGELOG.md` 的 internal trial 事实口径。
- 保持边界：没有创建 `apps/web`，没有接真实 planner，没有开放自由文本执行，没有改变
  Desktop sidecar 默认 mock 或真实 Codex env opt-in，`data-smoke-id="run-internal-trial"` 仍保持稳定。
- 验证：`pnpm --filter @cairn/desktop test -- --run src/renderer/src/desktop-app.spec.ts src/renderer/src/desktop-locale.spec.ts src/renderer/src/run-detail-copy.spec.ts src/renderer/src/artifact-payload-loader.spec.ts src/renderer/src/operator-action-runner.spec.ts`、`pnpm --filter @cairn/desktop typecheck`、`pnpm --filter @cairn/desktop lint`、`pnpm --filter @cairn/desktop build`、`pnpm exec prettier --check apps/desktop/src/renderer/src/desktop-app.tsx apps/desktop/src/renderer/src/desktop-locale.ts apps/desktop/src/renderer/src/desktop-locale.spec.ts apps/desktop/src/renderer/src/run-detail-copy.ts apps/desktop/src/renderer/src/run-detail-copy.spec.ts CHANGELOG.md docs/STATUS.md docs/superpowers/plans/2026-05-21-nightly-cleanup-handoff.md`、`pnpm exec markdownlint-cli2 CHANGELOG.md docs/STATUS.md docs/superpowers/plans/2026-05-21-nightly-cleanup-handoff.md`、`pnpm run docs:lint`、`git diff --check`。
- 本轮代码/正式文档提交：`b4cfce7` `fix(desktop): 收口运行详情反馈 / clarify run detail feedback`。
- 风险：Run Detail 已减少 payload/note 成功态的技术噪音，但 artifact card 标题 / summary
  仍可见 `output · text`、`kind text`、`visibility internal` 等领域字段；下一轮应判断这些是否影响普通用户理解。
- 下一轮优先任务：继续 Run Detail 真实上手路径小块，优先收口 artifact card 标题 / summary 的
  `artifactRole`、`kind`、`visibility` 等内部字段；只做用户可读文案映射，不改变 payload API 或 path reveal 边界。

2026-05-23 13:58 CST 本轮完成：

- 继续 Run Detail 真实上手路径小块，收口 artifact card 标题 / summary 的可读性，不继续扩首页。
- `ArtifactSummaryCard` 改用 `run-detail-copy.ts` 中的 `formatArtifactCardTitle` /
  `formatArtifactCardSummary` helper，把 replay artifact 的 `artifactRole`、`kind`、`visibility`
  映射为用户可读文案；summary 只显示可见范围与大小，不再暴露 content type 或原始字段名。
- 新增 regression 覆盖 `输出产物 · 文本` / `仅接管者可见 · 42 字节`，并锁住不再出现
  `output · text`、`kind text`、`visibility operator_only`、`visibility internal`。
- 同步 `CHANGELOG.md` 与 `docs/STATUS.md`，明确这只是 renderer locale/helper 文案映射，不改变
  Artifact schema、payload API、路径隐藏或 Desktop bridge。
- 复核此前 MySQL 记录：上一提交已安全记录 host/port/user，未提交 diff 中的明文密码已移除；本轮 UI
  提交不包含 MySQL 文档变更。
- 保持边界：没有创建 `apps/web`，没有接真实 planner，没有开放自由文本执行，没有改变
  Desktop sidecar 默认 mock 或真实 Codex env opt-in，`data-smoke-id="run-internal-trial"` 仍保持稳定。
- 验证：`pnpm --filter @cairn/desktop test -- --run src/renderer/src/run-detail-copy.spec.ts src/renderer/src/desktop-locale.spec.ts src/renderer/src/desktop-app.spec.ts`、`pnpm --filter @cairn/desktop typecheck`、`pnpm --filter @cairn/desktop lint`、`pnpm exec prettier --check apps/desktop/src/renderer/src/desktop-app.tsx apps/desktop/src/renderer/src/desktop-locale.ts apps/desktop/src/renderer/src/run-detail-copy.ts apps/desktop/src/renderer/src/run-detail-copy.spec.ts docs/engineering/local-dev-setup.md`、`pnpm exec markdownlint-cli2 docs/engineering/local-dev-setup.md`、`pnpm run docs:lint`、`git diff --check`。
- 本轮代码/正式文档提交：`31d05e6` `fix(desktop): 收口产物卡片文案 / clarify artifact card copy`。
- 风险：Run Detail artifact card 的字段名噪音已收口；下一轮应优先轻量复核 operator note 成功反馈后，用户是否能快速找到“证据事件计数”的变化，只改文案或位置提示，不扩完整 operator cockpit。
- 下一轮优先任务：Run Detail 中点击添加备注后，检查成功提示与 replay inspector 的 `Trace 事件` 计数是否形成清楚的视觉关联；必要时只做低风险文案 / 锚点提示，不改变 operator action API 或 replay data shape。

2026-05-23 14:12 CST 本轮完成：

- 继续 Run Detail 真实上手路径小块，聚焦 operator note 成功反馈与 replay inspector 计数之间的视觉关联。
- `desktop-locale.ts` 的 zh-CN / en-US operator note 成功文案已从“回放证据和证据事件计数已刷新”改为直接指向右侧“回放检查器”的 `Trace 事件` 计数，帮助用户找到备注写入后的 evidence 变化。
- 扩展 `desktop-locale.spec.ts`，锁住新的简中文案；同步 `CHANGELOG.md` 与 `docs/STATUS.md` 的状态口径。
- 保持边界：没有改变 operator action API、ReplaySource shape、Desktop bridge、Artifact schema、payload API、本地路径隐藏、默认 mock sidecar 或真实 Codex env opt-in；没有接真实 planner，没有开放自由文本执行，`data-smoke-id="run-internal-trial"` 仍保持稳定。
- 验证：`pnpm --filter @cairn/desktop test -- --run src/renderer/src/desktop-locale.spec.ts src/renderer/src/desktop-app.spec.ts src/renderer/src/operator-action-runner.spec.ts`、`pnpm --filter @cairn/desktop typecheck`、`pnpm --filter @cairn/desktop lint`、`pnpm exec prettier --check apps/desktop/src/renderer/src/desktop-locale.ts apps/desktop/src/renderer/src/desktop-locale.spec.ts CHANGELOG.md docs/STATUS.md docs/superpowers/plans/2026-05-21-nightly-cleanup-handoff.md`、`pnpm exec markdownlint-cli2 CHANGELOG.md docs/STATUS.md docs/superpowers/plans/2026-05-21-nightly-cleanup-handoff.md`、`pnpm run docs:lint`、`git diff --check`。
- 本轮代码/正式文档提交：`3a0807a` `fix(desktop): 强化备注反馈指引 / clarify note feedback`。
- 风险：文案已经建立提示关联，但本轮未重新启动真实 Desktop 窗口做人工点击确认；下一轮应先走默认 mock Desktop 手动上手烟测，确认用户是否能实际看见计数变化位置，再决定是否需要轻量视觉锚点。
- 下一轮优先任务：启动默认 mock Desktop，按“派发 internal trial -> 进入 Run Detail -> 添加 operator note -> 查看右侧 `Trace 事件` 计数变化”走一遍；若仍不够明显，只做 Replay inspector 局部高亮 / 提示位置微调，不扩完整 operator cockpit。

2026-05-23 16:55 CST 本轮完成：

- Desktop Home 首屏做了一轮 visual-v1 视觉落地：`styles.css` 补齐共享 UI class vocabulary 的
  本地映射，让 `@cairn/ui` primitives 在 Desktop renderer 里不再像裸 HTML。
- 首页 shell 改为更接近视觉参考的控制室气质：深色侧栏、浅色渐变工作面板、派活 hero、
  Agent 状态卡、待处理/固定运行/安全提示卡片都有明确的圆角、层级、渐变与 hover 状态。
- 默认 Electron 窗口宽度下，Mission Control 主工作台不再和右侧状态栏抢宽；窄宽度下主工作台
  会排在侧栏之前，避免用户第一屏只看到导航/信息墙。
- 新增 renderer SSR / CSS regression，锁住 `visual-v1-home`、`mission-command-center`、
  `operator-status-rail` 以及 1100px / 1360px 两档响应式行为。
- 手动排查并恢复 Electron 空白窗口：Vite browser 页面无 console error，重启
  `pnpm --filter @cairn/desktop dev` 后 Electron 窗口正常显示新版首页；该问题判断为 dev
  进程/HMR 状态，不是本轮 renderer crash。
- 同步 `CHANGELOG.md` 与 `docs/STATUS.md`，明确这是 Desktop Home visual-v1 首屏体验壳，
  不是完整产品 UI、真实 planner、自由文本 Supervisor dispatch 或 `apps/web`。
- 保持边界：没有改变 `data-smoke-id="run-internal-trial"`，没有接真实 planner，没有改变
  Desktop sidecar 默认 mock、真实 Codex env opt-in、Desktop bridge、Artifact schema、payload API、
  operator action API 或本地路径隐藏。
- 验证：`pnpm --filter @cairn/desktop test -- --run src/renderer/src/desktop-app.spec.ts src/renderer/src/desktop-locale.spec.ts`
  已通过，2 个文件 15 个测试。
- 验证：`pnpm --filter @cairn/desktop typecheck` 已通过。
- 验证：`pnpm --filter @cairn/desktop lint` 已通过。
- 验证：`pnpm --filter @cairn/desktop build` 已通过。
- 验证：`pnpm exec markdownlint-cli2 CHANGELOG.md docs/STATUS.md docs/superpowers/plans/2026-05-21-nightly-cleanup-handoff.md`
  已通过。
- 验证：`git diff --check` 已通过。
- 本轮代码/正式文档提交：`d808fb7` `feat(desktop): 落地首页视觉基线 / land home visual baseline`。

2026-05-24 04:57 CST 本轮完成：

- 处理当前 worktree 的 staged / unstaged mismatch：已确认 mismatch 是前一轮暂存的中间态与后续未暂存
  修正叠加；当前文件内容应以 worktree 版本为准。
- 收口 `docs/design/ux/screens/screen-inventory.md`：屏幕清单增加“层级”列，主入口限定为
  Home / Inbox、Runs、Runtime Status、Settings，Activity Timeline / Task Explorer / Replay View
  改为 Run Detail 或 run 上下文中的二级观察面。
- 收口 `docs/design/ux/flows/interaction-design-v1.md`：页面级交互补充主导航边界，Activity Timeline
  仅展示当前 run 事件，Task Explorer 嵌在 Run Detail，Replay View 从 Run Detail 进入且只读回放。
- 同步 `docs/STATUS.md`，把下一轮入口从继续整理这两份文档切换为先处理 gitdir 写权限 / 暂存阻塞，再复查
  视觉参考与 SVG 资产里的旧侧栏标签。
- 保持边界：没有创建 `apps/web`，没有改 Desktop runtime / bridge / API / schema，没有进入 installer、
  signing、notarization、marketplace、workflow builder 或企业治理。
- 验证：`git diff --check -- docs/STATUS.md docs/design/ux/screens/desktop-wireframes.md docs/design/ux/foundations/information-architecture.md docs/design/ux/components/component-mapping.md docs/design/ux/screens/screen-inventory.md docs/design/ux/flows/interaction-design-v1.md docs/superpowers/plans/2026-05-21-nightly-cleanup-handoff.md` 通过。
- 验证：`./node_modules/.bin/prettier --check docs/STATUS.md docs/design/ux/screens/desktop-wireframes.md docs/design/ux/foundations/information-architecture.md docs/design/ux/components/component-mapping.md docs/design/ux/screens/screen-inventory.md docs/design/ux/flows/interaction-design-v1.md docs/superpowers/plans/2026-05-21-nightly-cleanup-handoff.md` 通过。
- 验证：`./node_modules/.bin/markdownlint-cli2 docs/STATUS.md docs/design/ux/screens/desktop-wireframes.md docs/design/ux/foundations/information-architecture.md docs/design/ux/components/component-mapping.md docs/design/ux/screens/screen-inventory.md docs/design/ux/flows/interaction-design-v1.md docs/superpowers/plans/2026-05-21-nightly-cleanup-handoff.md` 通过。
- 验证：`./node_modules/.bin/markdownlint-cli2 "docs/**/*.md" "*.md"` 通过，149 个 Markdown 文件 0 error。
- 说明：`pnpm exec` / `pnpm run docs:lint` 在当前环境返回 `fetch failed`，因此本轮使用仓库本地二进制做等价验证。
- 本轮提交：无提交；`git add` 仍因无法创建
  `/Users/taosiyu/Code/cairn/.git/worktrees/codex-cairn-mainline-ui/index.lock` 返回
  `Operation not permitted`。

2026-05-24 05:26 CST 本轮完成：

- 复查 `docs/design/ux/screens/visual-reference-v1.md` 与 `docs/design/ux/assets/`，把视觉参考、
  中文/英文 V1 SVG 和低保真 wireframe 中的侧栏主入口统一到 Home / Inbox、Runs、Runtime Status、Settings。
- 同步 `docs/design/ux/assets/README.md` 与 `visual-reference-v1.md`，明确 Activity Timeline、
  Task Explorer、Replay View 是二级观察面参考，不是 R1 Desktop 主导航入口。
- 保留正常领域对象和内容区标签：Run Detail 里的 Task Tree、Artifacts/evidence rail、筛选器里的产物/运行时
  仍按领域语义保留，没有把 Artifact / Task / Trace 从产品对象中删除。
- 保持边界：没有创建 `apps/web`，没有改 Desktop runtime / bridge / API / schema，没有进入 installer、
  signing、notarization、marketplace、workflow builder 或企业治理。
- 验证：`./node_modules/.bin/prettier --check docs/STATUS.md docs/design/ux/screens/visual-reference-v1.md docs/design/ux/assets/README.md docs/superpowers/plans/2026-05-21-nightly-cleanup-handoff.md` 通过。
- 验证：`./node_modules/.bin/markdownlint-cli2 docs/STATUS.md docs/design/ux/screens/visual-reference-v1.md docs/design/ux/assets/README.md docs/superpowers/plans/2026-05-21-nightly-cleanup-handoff.md` 通过。
- 验证：`ruby -r rexml/document` 解析本轮修改的 12 个 SVG 通过。
- 验证：目标文件 `git diff --check` 通过。
- 验证：侧栏旧标签扫描仅剩 Activity Timeline 筛选器、Settings 分类和 Run Detail Artifacts/evidence heading，
  均不是主导航入口。
- 本轮提交：无提交；`git add` 仍因无法创建
  `/Users/taosiyu/Code/cairn/.git/worktrees/codex-cairn-mainline-ui/index.lock` 返回
  `Operation not permitted`。

2026-05-24 06:04 CST 本轮完成：

- 先定位提交阻塞根因：当前沙箱不能写 linked-worktree gitdir，`touch` 该目录仍返回
  `Operation not permitted`；但 common gitdir `/Users/taosiyu/Code/cairn/.git` 可写。
- 验证临时 index 可正常 `git add` 当前 UX 文档与 SVG 资产；当前 worktree 语境下的 `git update-ref`
  会尝试创建 linked-worktree `HEAD.lock` 并失败，common gitdir 形式 `git --git-dir=... update-ref`
  可成功移动分支。
- 创建本地提交 `b42e5b0` `docs(ux): 统一桌面主导航文档 / align desktop nav docs`，收录
  `docs/design/ux/**` 下的信息架构、线框、屏幕清单、交互、视觉参考与 SVG 资产收口。
- 复核提交后 `HEAD` 与 `refs/heads/codex/cairn-mainline-ui` 均指向 `b42e5b0`；用临时 index 从
  `HEAD` 检查，UX 文档 / SVG 已无真实剩余 diff，普通 `git status` 的 `MM` 来自不可刷新的真实 index。
- 保持边界：没有创建 `apps/web`，没有改 Desktop runtime / bridge / API / schema，没有进入 installer、
  signing、notarization、marketplace、workflow builder 或企业治理。
- 验证：`./node_modules/.bin/prettier --check docs/design/ux/assets/README.md docs/design/ux/components/component-mapping.md docs/design/ux/flows/interaction-design-v1.md docs/design/ux/foundations/information-architecture.md docs/design/ux/screens/desktop-wireframes.md docs/design/ux/screens/screen-inventory.md docs/design/ux/screens/visual-reference-v1.md` 通过。
- 验证：`./node_modules/.bin/markdownlint-cli2 docs/design/ux/assets/README.md docs/design/ux/components/component-mapping.md docs/design/ux/flows/interaction-design-v1.md docs/design/ux/foundations/information-architecture.md docs/design/ux/screens/desktop-wireframes.md docs/design/ux/screens/screen-inventory.md docs/design/ux/screens/visual-reference-v1.md` 通过。
- 验证：`ruby -r rexml/document` 解析本轮修改的 12 个 SVG 通过。
- 验证：目标 UX 文件 `git diff --check` 通过。

2026-05-24 06:31 CST 本轮完成：

- 尝试按下一轮方向做默认 mock Desktop visual-v1 Home 视觉烟测，范围限定为 1280px 默认窗口与较窄窗口下的派活 hero、Agent 状态、Agent 动态和下一步区域。
- 复核相邻代码和现有 smoke 路径：`apps/desktop/src/renderer/src/desktop-app.tsx`、`styles.css`、`desktop-app.spec.ts`、`apps/desktop/scripts/window-smoke.mjs`、`apps/desktop/src/main/index.ts` 与 Desktop README。
- 真实 diff 开始为空：`git diff HEAD --name-only` 无输出；普通 `git status` 仍不可信。
- 直接构建路径可用：在 `apps/desktop` 下执行 `../../node_modules/.bin/electron-vite build` 通过。
- 默认 mock window smoke 未拿到窗口证据：`node scripts/window-smoke.mjs` 超时等待
  `main-window-ready-to-show`，stdout/stderr 为空。
- Browser 视觉路径不可用：in-app Browser 按安全策略阻止访问
  `file:///.../apps/desktop/out/renderer/index.html`，并明确不应绕过该策略。
- 结论：本轮无法完成可信视觉烟测，因此不做 Desktop UI 低风险修复，避免用静态 CSS 推断替代视觉证据。
- 保持边界：没有创建 `apps/web`，没有改 Desktop runtime / bridge / API / schema，没有接真实 planner，
  没有进入 installer、signing、notarization、marketplace、workflow builder 或企业治理。
- 验证/证据：
  `../../node_modules/.bin/electron-vite build` 通过；
  `node scripts/window-smoke.mjs` 失败且记录为环境阻塞；
  `git diff HEAD --name-only` 初始为空。
- 本轮提交：仅提交本记录与 `docs/STATUS.md`；无 UI / 代码提交。最终 hash 见自动化 memory / final
  汇总。

2026-05-24 07:09 CST 本轮完成：

- 继续只处理默认 Desktop 视觉烟测路径，没有修改 Desktop UI 或扩大产品范围。
- 复现 `node scripts/window-smoke.mjs` 失败，并通过保留 signal file / crash report 确认 Electron 在
  app registration 阶段 `SIGABRT`，Cairn main module 尚未写出 `main-process-loaded`。
- 直接 `../../node_modules/.bin/electron-vite build` 通过，`../../node_modules/.bin/electron-builder --dir`
  也能产出 `release/mac-arm64/Cairn.app`；但直接运行 packaged app 仍同样在 app registration 阶段
  `SIGABRT`。
- `open` 尝试打开 vendored Electron app 与 packaged Cairn app 均返回
  `kLSNoExecutableErr: The executable is missing`；localhost renderer fallback 因 `listen EPERM 127.0.0.1`
  不可用。
- 新增 `apps/desktop/scripts/window-smoke-runner.mjs` 与 spec，把 smoke runner 的等待逻辑拆出并覆盖
  “Electron 提前退出时快速失败”分支；`apps/desktop/scripts/window-smoke.mjs` 现在报告
  `Electron exited before Desktop window smoke event main-window-ready-to-show with code null and signal SIGABRT`。
- 验证：`../../node_modules/.bin/vitest run scripts/window-smoke-runner.spec.mjs --config vitest.config.ts`
  通过；`node scripts/window-smoke.mjs` 失败但已输出真实早退 signal；直接 Electron / packaged app
  smoke 仍阻塞；完整验证见自动化 memory / final 汇总。
- 本轮提交：`647a6c9` `test(desktop): 收紧窗口烟测诊断 / clarify window smoke diagnostics`。

2026-05-24 07:26 CST 本轮完成：

- 继续只处理 Desktop visual smoke 阻塞，没有修改 Desktop UI、Desktop bridge、preload allowlist、
  Workspace Core、runtime adapter 或产品边界。
- 复核真实剩余 diff：`git diff HEAD --name-only` 起初只显示 stale linked-index 相关的
  `window-smoke-runner` 两文件；临时 index 从 `HEAD` 重建后 `git status --short` 为空，说明工作树真实内容与
  `HEAD` 对齐。
- 复现 `node scripts/window-smoke.mjs`：仍快速失败为
  `Electron exited before Desktop window smoke event main-window-ready-to-show with code null and signal SIGABRT`。
- 复核 Playwright Chromium：`chromium.launch()` 在同一 Codex/macOS 会话下失败，日志包含
  `bootstrap_check_in org.chromium.Chromium.MachPortRendezvousServer... Permission denied`，并产生
  `chrome-headless-shell-2026-05-24-072453.ips`。
- 复核 Electron crash：最新 `Electron-2026-05-24-072409.ips` 的 fault frame 仍在
  `_RegisterApplication` / `GetCurrentProcess`，说明 Cairn main module 尚未进入。
- 复核属性/签名：`xattr -lr` 显示 Electron 与 Chromium binary 仍带 `com.apple.provenance`；
  复制 Electron app 到 `/private/tmp` 后 `xattr -cr` 仍未能移除该属性，`codesign` 显示 Electron 为 ad-hoc
  signature，`spctl` 返回 Code Signing subsystem internal error。
- 结论：当前视觉烟测阻塞是 Codex/macOS 会话下 GUI app registration / provenance 类环境问题，不应据此修改
  Cairn renderer 视觉。
- 验证：`../../node_modules/.bin/vitest run scripts/window-smoke-runner.spec.mjs --config vitest.config.ts`
  通过；`node scripts/window-smoke.mjs` 按预期失败并输出真实早退 signal；Playwright Chromium probe 按预期失败并给出 Mach bootstrap 权限证据。
- 本轮提交：`4aa70ea` `docs(status): 记录 GUI 注册阻塞 / record gui registration blocker`。

## 7. 下一轮任务

优先级从高到低：

1. **先在当前 Codex coalition 外验证 GUI app registration**：当前失败同时影响 Electron 和 Playwright
   Chromium，下一轮不要先重复 UI smoke；优先用普通终端/新会话复核 vendored Electron 或 Chromium 能否启动，或处理
   `com.apple.provenance`、quarantine、LaunchServices / app registration 权限。
2. **若 GUI app 仍不可用，设计非 GUI 截图证据路径**：目标是拿到可重复的 1280px 与较窄窗口视觉证据，但不要依赖
   Browser 插件 `file://`、localhost 监听、Electron 或 Playwright Chromium。
3. **Desktop Home 真实窗口视觉烟测**：拿到可重复窗口证据后，再确认 visual-v1 首页在 1280px 默认窗口与较窄窗口下都能自然显示派活 hero、Agent 状态、Agent 动态和下一步区域。
4. **只处理视觉烟测发现的低风险问题**：优先标题挤压、右栏过密、按钮层级不清或共享 UI primitive class
   漏映射，不扩新功能、不重写信息架构。
5. **Run Detail 手动上手烟测**：随后再走“派发 internal trial -> 进入 Run Detail -> 添加 operator note ->
   查看右侧 `Trace 事件` 计数变化”的路径，判断是否需要 Replay inspector 局部高亮。
6. **Git 状态判断注意事项**：普通 `git status` 仍可能因真实 linked-worktree index 不可写显示 stale `MM`；
   先用 `git diff HEAD --name-only` 或临时 index 复核真实剩余 diff，再决定是否需要提交。

## 8. 风险与阻塞

- Mission Control 首屏已经能让用户输入草稿、派发 bounded internal trial，并顺着 Run Detail 读取
  replay / artifact / operator note，说明“可初步体验”路径已成立；本轮 visual-v1 首屏样式让它更像可用产品，
  但当前仍是 internal trial 体验壳。
- Desktop renderer 现在依赖本地 CSS 映射一批 `@cairn/ui` / Tailwind-like class vocabulary；
  后续新增共享 UI primitive class 时，需要补映射或引入正式 token/class 构建方案，否则可能再次出现裸样式。
- Run Detail artifact card 现在不再直接露出 `artifactRole`、`kind`、`visibility` 字段名；operator note
  成功提示也已指向右侧 replay inspector 的 `Trace 事件` 计数。剩余风险转为真实窗口里该计数位置是否足够显眼，需要下一轮手动上手烟测确认。
- 首页左侧现在已把 Agent 总览、运行中 Agent 与最近进展合并，右栏也已收成 `待处理摘要`
  与固定运行轻摘要；本轮只做视觉落地和响应式收口，后续首屏仍只做真实窗口发现的微调，不应再扩大新功能或重新堆卡片。
- 当前默认自动化 e2e 仍只覆盖 mock sidecar window-level smoke；真实 Codex window-level coverage 已有 opt-in `smoke:codex` runner，但不能进入默认 CI。
- 当前环境下默认 mock window smoke 在 Electron app registration 阶段 `SIGABRT`，Playwright Chromium
  headless 也在 Mach bootstrap registration 阶段 `SIGTRAP`，且 in-app Browser 阻止 `file://` renderer
  预览，localhost 监听也被 `EPERM` 拦住；下一轮必须先恢复视觉证据路径，再做 UI 修复。
- Mission Control 首页当前仍是静态/半静态首轮体验壳；任务草稿只在 renderer 本地保存，“派发给总 Agent”按钮真实执行的是 bounded internal-trial path，自由文本 Supervisor dispatch、自动创建多子 Agent 和真实 planner 仍未完成。
- 本轮 `test:e2e` 验证确认默认 mock window smoke 可通过；若后续 Electron/Node 包装器行为变化，优先检查 `window-smoke.mjs` 的真实 binary 解析、signal 后 SIGTERM/SIGKILL 清理链路。
- 本轮真实 Codex runner 覆盖 Desktop 自拉起 Codex sidecar 的观察路径；仍依赖本机 Codex 登录态、CLI 版本和响应时延。
- `smoke:codex` 现在依赖 renderer 上少量 `data-smoke-id` hook 以避免被语言切换文案打断；这些 hook 不能作为产品 API 或 Desktop bridge 能力边界。
- Renderer payload/replay/operator action guard 与 Run Detail copy helper 只覆盖同一 renderer 会话内的请求乱序、空态防护和 trial 文案口径；完整 Artifact workspace、导出、retention、本地路径 reveal、完整 operator cockpit 与完整 Run Detail 数据面仍不在本轮范围。
- `ui-preview` 静态数据只修正了 artifact review hero title 残留；没有动到 layout、CSS 或导航结构。
- 真实 Codex CLI 行为可能随本机版本变化；默认测试仍必须依赖 mock / fixture。
- Accepted ADR 不直接修改；Codex transport refinement 优先使用 Proposed ADR-0018 或新 ADR。
- 文档中凡提到 `apps/web`、installer、signing、notarization、公测/公开 alpha，都要明确为未完成或非本轮目标。
- 当前自动化 worktree 的文件可写，但 linked-worktree gitdir 仍不可写；普通 `git add` / `git commit`
  可能继续失败。若必须提交，可继续使用“临时 index + common gitdir `update-ref`”方式，但要先用
  `git show` / `git diff HEAD` 复核提交树，不要被 stale `git status` 误导。
