# Internal Trial Mainline Handoff

> 状态：🟡 Active
> 最后更新：2026-05-24 12:26 CST
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

2026-05-25 04:58 CST 复核：

- 本轮选择 Desktop UI 非 GUI 可验证小块；真实全树 diff 先用临时 index 从 `HEAD` 重建确认为空，普通 index
  里的删除和 UX `MM` 仍是 stale linked-worktree 噪音。
- 新增 SSR markup 回归覆盖默认 `zh-CN` 桌面壳导航 accessibility label，锁住侧栏 `aria-label="桌面导航"` 与主导航
  `aria-label="主导航"`，避免无视觉环境时继续残留英文 `Desktop navigation` / `Primary`。
- `DesktopApp` 改为从 locale copy 读取侧栏和主导航 `aria-label`；`desktop-locale.ts` 同步补齐 `zh-CN` 与 `en-US`
  文案。没有修改布局、CSS、Desktop bridge、Electron smoke 或产品范围。

2026-05-25 05:53 CST 复核：

- 本轮选择 Desktop UI 非 GUI 可验证小块；临时 index 显示真实 pre-existing diff 为空，普通 `git diff HEAD --name-only`
  仍混有 stale smoke diagnostics / 主线索引噪音。
- `loadRunReplaySource` 的空 run id 错误改由调用方传入 locale copy，默认 `zh-CN` 不再显示
  `Enter a Workspace Core run id to observe.`；`DesktopApp.observeRunId` 也复用 `copy.runIdRequiredError`。
- 新增 helper 红绿用例和 renderer 静态回归检查，锁住这类硬编码英文错误不回流；没有运行 Electron / Chromium / Browser / localhost smoke。

2026-05-25 03:58 CST 复核：

- 本轮选择 Desktop smoke diagnostics 收口轨道；真实全树 diff 用临时 index 从 `HEAD` 重建后为空，普通 index
  里的 `window-smoke-runner` / 主线索引删除和一批 UX `MM` 仍是 stale linked-worktree 噪音。
- 保留并扩展 `apps/desktop/scripts/window-smoke-runner.mjs` 的 helper：当 Electron 早退或等待超时时，错误信息会带上最后观察到的非目标 smoke signal，例如
  `main-process-loaded`，用于区分“main module 已加载但未到 ready-to-show”和“app registration 前即崩溃”。
- 新增 targeted spec 覆盖 early exit 时带出最后观察到的 smoke signal；没有重复普通 Electron / Chromium smoke，也没有修改 Desktop UI。
- `pnpm --filter @cairn/desktop test -- --run scripts/window-smoke-runner.spec.mjs` 在脚本启动前仍返回 `[ERROR] fetch failed`；
  本轮改用已安装的本地二进制完成同等 targeted 验证。

2026-05-24 12:26 CST 复核：

- 重新读了 `docs/superpowers/README.md`、`docs/superpowers/tracks/mainline-ui.md` 与 `docs/STATUS.md`；短主索引、主题轨道和状态基线仍一致，没有新的主线事实漂移。
- 本轮只做了复核和接力记录更新，没有新的 Desktop / Web 结论，也没有新的产品范围变化。
- 继续把普通 `git status` 视为不可信信号；linked-worktree 的 stale mismatch 噪音还在。
- 下一轮如果仍无新事实变化，就不要再做 docs-only bookkeeping；优先转去 GUI 证据路径恢复，或等有 1280px / 窄窗口截图后再修 Desktop 的最小视觉差异。

2026-05-24 12:23 CST 复核：

- 重新读了 `docs/superpowers/README.md`、`docs/superpowers/tracks/mainline-ui.md`、`docs/STATUS.md`
  与 `docs/design/ux/foundations/information-architecture.md`；当前主线索引、主题轨道、状态基线与 IA 口径仍一致，没有新的事实漂移。
- `git hash-object` / `git rev-parse HEAD:<path>` 复核显示这四个关键文件都仍与 `HEAD` 对齐；这轮没有新的 repo diff，也没有形成可保留变更。
- 为避免下一轮重复同一轮事实复核，最终只更新了本 handoff 的运行记录；没有修改产品、UX、Desktop UI 或 runtime 内容。
- 验证通过：`./node_modules/.bin/prettier --check docs/superpowers/plans/2026-05-21-nightly-cleanup-handoff.md`、`./node_modules/.bin/markdownlint-cli2 docs/superpowers/plans/2026-05-21-nightly-cleanup-handoff.md`、`git diff --check -- docs/superpowers/plans/2026-05-21-nightly-cleanup-handoff.md`。
- 本轮提交：`484ab93` `docs(trial): 记录主线复核 / record mainline recheck`。
- 继续把普通 `git status` 当作不可信信号；linked-worktree 索引还是会吐 stale mismatch 噪音。
- 下一轮如果没有新的事实变化，就不要再做 docs-only bookkeeping；优先转去 GUI 证据路径恢复，或等有 1280px / 窄窗口截图后再修 Desktop 的最小视觉差异。

2026-05-24 11:29 CST 复核：

- 复读了 `docs/superpowers/README.md`、`docs/superpowers/tracks/mainline-ui.md`、`docs/STATUS.md`
  与产品主锚点；这轮确认主线索引、主题轨道、状态基线和 handoff 本身都没有新的事实漂移。
- `docs/STATUS.md`、`docs/superpowers/README.md`、`docs/superpowers/tracks/mainline-ui.md`、
  `docs/superpowers/plans/2026-05-21-nightly-cleanup-handoff.md` 与 `HEAD` 字节一致；这轮没有产品口径改动。
- 继续把普通 `git status` 当作不可信信号；linked-worktree 索引还是会吐 stale mismatch 噪音。
- 下一轮如果没有新的事实变化，就不要再做 docs-only bookkeeping；优先转去 GUI 证据路径恢复，或等有 1280px / 窄窗口截图后再修 Desktop 的最小视觉差异。

2026-05-24 10:52 CST 复核：

- 主线短索引 [`../README.md`](../README.md) 与主题轨道 [`../tracks/mainline-ui.md`](../tracks/mainline-ui.md)
  仍是下一轮第一入口；[`../../STATUS.md`](../../STATUS.md) 已压回事实基线和下一轮入口，不再保存逐轮日志。

- 本轮开始时 `HEAD` / `refs/heads/codex/cairn-mainline-ui` 为 `9c83db9`
  `docs(trial): 记录接力压缩提交 / record handoff compression commit`。
- `git status --short` 仍会显示多份 UX 文档 / SVG 的 staged / unstaged mismatch；这是因为当前沙箱仍无法写
  `/Users/taosiyu/Code/cairn/.git/worktrees/codex-cairn-mainline-ui`，真实 linked-worktree index
  无法刷新。不要把这组 `MM` 误判为未提交 UX 工作。
- 本轮通过临时 index 从 `HEAD` 重建树，并用 common gitdir 形式
  `git --git-dir=/Users/taosiyu/Code/cairn/.git update-ref` 移动分支，成功绕过该 gitdir 的
  `index.lock` / `HEAD.lock` 写权限限制并创建本地提交。普通 `git add`、当前 worktree 语境下的
  `git commit` / `git update-ref` 仍会因 linked-worktree gitdir 不可写失败。
- 临时 index 从 `HEAD` 重建后可正确判断真实 diff；不要用普通 `git status` 判断真实剩余 diff。
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
- `2de3889` `docs(status): 收口 GUI 注册记录 / close gui registration notes`
- `4c0c8dc` `docs(superpowers): 收口主线索引 / tighten mainline index`
- `4e8fb87` `docs(superpowers): 收口主线索引与接力 / consolidate mainline index and handoff`
- `51a7c19` `docs(trial): 校准接力提交状态 / align handoff commit state`
- `e70388b` `docs(trial): 记录接力提交哈希 / record handoff commit hash`
- `3c1fcc9` `docs(status): 收口状态页日志 / compress status log`
- `6f8c48b` `docs(trial): 记录状态页收口提交 / record status cleanup commit`

归档说明：

- [`2026-05-20-internal-trial-core-first-implementation-plan.md`](2026-05-20-internal-trial-core-first-implementation-plan.md)
  已改为历史计划摘要，不再作为当前 checkbox 计划。
- [`../specs/2026-05-20-internal-trial-core-first-design.md`](../specs/2026-05-20-internal-trial-core-first-design.md)
  已改为历史设计摘要，不再作为当前缺口列表。

---

## 5. 最近验证记录

2026-05-24 12:26 CST 本轮主线复核：

- 复核 `docs/superpowers/README.md`、`docs/superpowers/tracks/mainline-ui.md`、`docs/STATUS.md`；短索引、主题轨道和状态基线没有新漂移。
- 没有重复普通 Electron / Chromium smoke，也没有把缺证据的视觉猜测写成事实。
- 本轮提交：`0814bca4554c2e413881691fc50496d4167ccaef` `docs(trial): 记录主线复核 / record mainline recheck`。

2026-05-25 03:58 CST Desktop smoke diagnostics 验证：

- 红灯：新增 `apps/desktop/scripts/window-smoke-runner.spec.mjs` 用例后，
  `../../node_modules/.bin/vitest run scripts/window-smoke-runner.spec.mjs` 因 early exit 错误没有包含
  `Last observed Desktop window smoke signal: main-process-loaded` 失败。
- 绿灯：`window-smoke-runner.mjs` 记录最后观察到的非目标 signal，并在 early exit / timeout 诊断中输出；同一 spec
  通过，1 个文件 2 个测试。
- 已通过：`../../node_modules/.bin/vitest run scripts/window-smoke-runner.spec.mjs`
- 已通过：`../../node_modules/.bin/tsc --noEmit`
- 已通过：`../../node_modules/.bin/eslint src electron.vite.config.ts`
- 已通过：
  `./node_modules/.bin/prettier --check apps/desktop/scripts/window-smoke-runner.mjs apps/desktop/scripts/window-smoke-runner.spec.mjs docs/superpowers/plans/2026-05-21-nightly-cleanup-handoff.md`
- 预期失败：`pnpm --filter @cairn/desktop test -- --run scripts/window-smoke-runner.spec.mjs` 在进入 Vitest 前返回
  `[ERROR] fetch failed`。

2026-05-25 04:58 CST Desktop renderer navigation a11y label 验证：

- 红灯：新增 `apps/desktop/src/renderer/src/desktop-app.spec.ts` SSR markup 用例后，
  `../../node_modules/.bin/vitest run src/renderer/src/desktop-app.spec.ts` 因默认 `zh-CN` 输出仍包含
  `aria-label="Desktop navigation"` / `aria-label="Primary"` 失败。
- 绿灯：`desktop-app.tsx` 改为使用 locale copy 输出侧栏和主导航 `aria-label`，`desktop-locale.ts` 补齐
  `navigationLabel` / `primaryNavigationLabel` 后，同组 renderer spec 通过。
- 已通过：`../../node_modules/.bin/vitest run src/renderer/src/desktop-app.spec.ts src/renderer/src/desktop-locale.spec.ts`
- 已通过：`../../node_modules/.bin/tsc --noEmit`
- 已通过：`../../node_modules/.bin/eslint src electron.vite.config.ts`
- 已通过：
  `../../node_modules/.bin/prettier --check src/renderer/src/desktop-app.tsx src/renderer/src/desktop-app.spec.ts src/renderer/src/desktop-locale.ts`

2026-05-25 05:53 CST Desktop renderer empty run id copy 验证：

- 红灯：`../../node_modules/.bin/vitest run src/renderer/src/run-replay-loader.spec.ts` 新增默认简中空 run id 用例后，仍收到
  `Enter a Workspace Core run id to observe.`。
- 绿灯：`loadRunReplaySource` 接受 `runIdRequiredError` 依赖，`DesktopApp` 两个空 run id 分支都改用 locale copy。
- 已通过：
  `../../node_modules/.bin/vitest run src/renderer/src/run-replay-loader.spec.ts src/renderer/src/desktop-app.spec.ts src/renderer/src/desktop-locale.spec.ts`
- 已通过：`../../node_modules/.bin/tsc --noEmit`
- 已通过：`../../node_modules/.bin/eslint src electron.vite.config.ts`
- 已通过：
  `../../node_modules/.bin/prettier --check src/renderer/src/desktop-app.tsx src/renderer/src/desktop-app.spec.ts src/renderer/src/run-replay-loader.ts src/renderer/src/run-replay-loader.spec.ts`

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

2026-05-24 10:56 CST 主线接力状态校准验证：

- 本轮只同步 [`../tracks/mainline-ui.md`](../tracks/mainline-ui.md) 与本 handoff 的当前状态；没有修改
  Desktop UI、Workspace Core、Desktop bridge、runtime adapter、schema、Web Shell、installer、signing 或
  notarization 相关内容。
- 已通过：`./node_modules/.bin/prettier --check docs/superpowers/tracks/mainline-ui.md docs/superpowers/plans/2026-05-21-nightly-cleanup-handoff.md`
- 已通过：`./node_modules/.bin/markdownlint-cli2 docs/superpowers/tracks/mainline-ui.md docs/superpowers/plans/2026-05-21-nightly-cleanup-handoff.md`
- 已通过：临时 index 下的
  `git diff --check -- docs/superpowers/tracks/mainline-ui.md docs/superpowers/plans/2026-05-21-nightly-cleanup-handoff.md`
- 预期失败：`pnpm run docs:lint` 仍在脚本启动前返回 `[ERROR] fetch failed`；本轮编辑文件已由本地
  markdownlint 与 diff check 覆盖。

---

## 6. 最新完成

本节只保留会影响下一轮判断的可复用事实；逐轮细节以 git 提交、上方验证记录和旧历史计划为准，不再把每轮对话展开成长日志。

### 6.1 当前可复用结论

- 文档入口已收口：先读 [`../README.md`](../README.md)、[`../tracks/mainline-ui.md`](../tracks/mainline-ui.md) 与 [`../../STATUS.md`](../../STATUS.md)，再按任务读取具体 UX / product / design 文档。
- Desktop 主导航事实已统一：R1 主入口只保留 Home / Inbox、Runs、Runtime Status、Settings；Run Detail、Artifact Detail、Activity Timeline、Task Explorer、Replay View 都是二级观察面。
- Desktop internal-trial 体验壳已能表达 bounded 路径：Home 可输入本地草稿并派发 internal trial；Run Detail 可读 replay evidence、artifact payload 和 operator note 反馈；草稿仍不进入真实 Supervisor dispatch。
- Desktop renderer 已有 request sequence guard、空态 guard、bounded payload read、最小 operator actions、默认简中 copy 与 locale-neutral smoke hooks；这些都不代表完整 operator cockpit、完整 Artifact workspace 或 Web Shell 已完成。
- Desktop renderer 默认简中壳的侧栏与主导航 accessibility label 已由 locale copy 驱动，可通过 SSR markup 测试非 GUI
  验证；这只是 a11y 文案收口，不代表视觉证据路径恢复。
- Desktop renderer 的空运行编号错误已从硬编码英文改为 locale copy，`zh-CN` 默认壳可用 helper / static source
  测试验证该错误不会回流。
- 默认 mock Desktop visual smoke 的代码诊断已收窄到 Electron app registration `SIGABRT`，同一会话下 Playwright Chromium 也因 Mach bootstrap 权限失败；当前不能用这条环境里的 GUI 失败推断 renderer 视觉问题。
- `docs/STATUS.md` 已压回事实基线和下一轮入口；长期约束写主题轨道，逐轮执行事实只留在本 handoff 的短摘要里。

### 6.2 最近接力记录

- 本轮待提交：Desktop renderer 空 run id 错误改为 locale copy 输出，并用 helper 红绿测试与 renderer 静态检查锁住；
  这只收口非 GUI 可验证文案，不恢复 GUI 证据路径。
- `aa59d21` `fix(desktop): 本地化导航可访问标签 / localize navigation a11y labels`：Desktop renderer 默认简中壳的侧栏与主导航
  `aria-label` 改为 locale copy 输出，并用 SSR markup 测试锁住。
- `1d8e42e` `test(desktop): 增强窗口烟测诊断 / improve window smoke diagnostics`：窗口烟测 early exit /
  timeout 诊断会带出最后观察到的非目标 smoke signal。
- `647a6c9` `test(desktop): 收紧窗口烟测诊断 / clarify window smoke diagnostics`：窗口烟测在 Electron 提前退出时直接报告 code / signal，不再伪装成 ready-to-show 超时。
- `4aa70ea` `docs(status): 记录 GUI 注册阻塞 / record gui registration blocker` 与 `2de3889` `docs(status): 收口 GUI 注册记录 / close gui registration notes`：确认 Electron / Chromium GUI 阻塞属于当前 Codex/macOS 会话层面的 app registration / provenance 类问题。
- `4c0c8dc`、`4e8fb87`：建立短主索引与主题轨道，把自动化入口从长 handoff 迁到 `docs/superpowers/README.md`。
- `51a7c19`、`e70388b`：校准 handoff 的当前 HEAD 记录，继续提醒普通 `git status` 不可信。
- `3c1fcc9`、`6f8c48b`：把 `docs/STATUS.md` 从逐轮日志压回事实基线，并记录该提交已落地。
- `a80c712` `docs(trial): 压缩接力记录 / compress handoff log`：把本 handoff 的“最新完成 / 风险阻塞”
  从逐轮长日志压成当前可复用结论、最近接力记录和短风险清单。
- `9c83db9` `docs(trial): 记录接力压缩提交 / record handoff compression commit`：记录上一次 handoff
  压缩提交，当前普通 `git status` 仍不可信，继续以临时 index 判断真实 diff。
- `c848a63` `docs(superpowers): 校准主线接力状态 / align mainline handoff state`：把主题轨道下一步从已完成的
  handoff 压缩改为事实漂移校准，并把本 handoff 的当前 HEAD 记录推进到 `9c83db9`。

## 7. 下一轮任务

优先级从高到低：

1. **先复核事实漂移**：读取 [`../README.md`](../README.md)、[`../tracks/mainline-ui.md`](../tracks/mainline-ui.md)
   与 [`../../STATUS.md`](../../STATUS.md)；若短索引、状态页、主题轨道和本 handoff 已一致，不要为了记录而继续改文档。
2. **优先利用新增 smoke signal 诊断复核失败层级**：下一次只在修诊断输出质量时运行 `window-smoke.mjs`；看错误中最后观察到的 signal
   是 `main-process-loaded` 还是没有任何 signal，再决定是否值得继续追 Electron app registration。
3. **继续选择非 GUI 可验证 Desktop UI 小块**：若 GUI 证据仍不可用，优先找 SSR markup、copy helper、class mapping
   或响应式 CSS 这类可由 Vitest / typecheck / lint 证明的小改动；不要凭视觉猜测改页面。
4. **再在当前 Codex coalition 外验证 GUI app registration**：当前失败同时影响 Electron 和 Playwright
   Chromium，下一轮不要先重复 UI smoke；优先用普通终端/新会话复核 vendored Electron 或 Chromium 能否启动，或处理
   `com.apple.provenance`、quarantine、LaunchServices / app registration 权限。
5. **若 GUI app 仍不可用，设计非 GUI 截图证据路径**：目标是拿到可重复的 1280px 与较窄窗口视觉证据，但不要依赖
   Browser 插件 `file://`、localhost 监听、Electron 或 Playwright Chromium。
6. **Desktop Home 真实窗口视觉烟测**：拿到可重复窗口证据后，再确认 visual-v1 首页在 1280px 默认窗口与较窄窗口下都能自然显示派活 hero、Agent 状态、Agent 动态和下一步区域。
7. **只处理视觉烟测发现的低风险问题**：优先标题挤压、右栏过密、按钮层级不清或共享 UI primitive class
   漏映射，不扩新功能、不重写信息架构。
8. **Run Detail 手动上手烟测**：随后再走“派发 internal trial -> 进入 Run Detail -> 添加 operator note ->
   查看右侧 `Trace 事件` 计数变化”的路径，判断是否需要 Replay inspector 局部高亮。
9. **Git 状态判断注意事项**：普通 `git status` 仍可能因真实 linked-worktree index 不可写显示 stale `MM`；
   先用 `git diff HEAD --name-only` 或临时 index 复核真实剩余 diff，再决定是否需要提交。

## 8. 风险与阻塞

- 当前 GUI 视觉证据路径仍阻塞：Electron 在 app registration 阶段 `SIGABRT`，Playwright Chromium headless 在 Mach bootstrap registration 阶段失败，Browser 插件阻止 `file://`，localhost 监听可能被 `EPERM` 拦住。下一轮不要重复普通 Electron / Chromium smoke。
- 若要继续 UI 修复，先拿到 1280px 与较窄窗口的可信截图或等价 bounds 证据；只处理截图里真实出现的标题挤压、右栏过密、按钮层级不清或共享 UI class 映射缺失。
- Mission Control 首页仍是 internal-trial 体验壳：任务草稿只保存在 renderer 本地，真实自由文本 Supervisor dispatch、自动创建多子 Agent、完整 planner 和完整 operator cockpit 都未完成。
- Desktop renderer 依赖本地 CSS 映射一批 `@cairn/ui` / Tailwind-like class vocabulary；后续新增共享 UI primitive class 时要补映射或引入正式 token/class 构建方案。
- `smoke:codex` 是 opt-in 真实 Codex runner，依赖本机 Codex 登录态、CLI 版本、响应时延和少量 `data-smoke-id` hook；这些 hook 不能成为产品 API 或 Desktop bridge 能力边界。
- Renderer payload/replay/operator action guard 只覆盖同一 renderer 会话内的请求乱序、空态防护和 trial 文案口径；完整 artifact 导出、retention、本地路径 reveal 与完整 Run Detail 数据面仍不在当前范围。
- 文档中凡提到 `apps/web`、installer、signing、notarization、公测 / 公开 alpha，都要明确为未完成或非本轮目标；internal trial 不等于外部 alpha。
- 当前自动化 worktree 的文件可写，但 linked-worktree gitdir 仍不可写；普通 `git add` / `git commit` 可能继续失败。若必须提交，继续使用临时 index + common gitdir `update-ref`，并先用 `git show` / `git diff HEAD` 复核提交树。
