# Internal Trial Mainline Handoff

> 状态：🟡 Active
> 最后更新：2026-05-25
> 工作区：`/Users/taosiyu/Code/cairn`
> 当前主线：推进第一轮内部开发者试用，不再做泛化 nightly cleanup

---

## 1. 用途

这份文件是自动化/子 agent 的压缩接力摘要，不再承担唯一入口职责。下一轮优先读取：

1. [`../README.md`](../README.md)
2. [`../tracks/mainline-ui.md`](../tracks/mainline-ui.md)
3. [`../../STATUS.md`](../../STATUS.md)
4. [`../../product/positioning-and-boundaries.md`](../../product/positioning-and-boundaries.md)

当前正式事实口径仍以这些文件为准：

- [`../../STATUS.md`](../../STATUS.md)
- [`../../ops/internal-trial-runbook.md`](../../ops/internal-trial-runbook.md)
- [`../../product/positioning-and-boundaries.md`](../../product/positioning-and-boundaries.md)
- [`../../reference/glossary.md`](../../reference/glossary.md)

历史逐轮细节以 git 提交和旧版本本文档为准，不再在本文件继续展开。

---

## 2. 每轮固定流程

1. 读取 `AGENTS.md`、短主索引、活动 track、`docs/STATUS.md`、产品边界、术语表、主设计文档和本 handoff。
2. 执行 `git status --short` 与 `git diff --name-only`，确认 dirty worktree，不回滚用户或其他 agent 的改动。
3. 每轮只选择一个清晰子块，优先 internal trial 主线；先审阅相邻代码/文档和 diff，再修改。
4. 保持产品边界：不创建 `apps/web`，不宣称 public alpha / installer / signing / notarization。
5. 保持 runtime 边界：Desktop sidecar 默认 mock，真实 Codex 需 env opt-in。
6. 跑与本轮改动匹配的 targeted verification；文档改动至少跑 Prettier、markdownlint、`docs:lint`、`git diff --check`。
7. 若本轮有可保留改动，结束前只 stage 本轮相关文件并创建本地 commit；不要 push。
8. 结束时只更新短索引、相关 track 和本摘要中会影响下一轮判断的事实，不追加逐轮流水账。

### Run selection 硬规则

- 同一 track 连续两轮如果只是文案、边界收窄、a11y label、密度微调或无事实变化复核，下一轮必须切换到别的 track。
- 如果没有更高价值的小任务，不要制造 tiny patch；在接力中写 `no commit: no valuable next step this round` 后停更。
- 若以后要回到同一页面继续 polish，必须有明确触发条件：失败测试、用户可见 bug、可信截图证据或新批准的产品文案。

---

## 3. 当前工作区状态

当前主线不在“泛化整理”，而在 internal trial 后续硬化：

- Desktop 默认 mock sidecar 已有最小 window-level smoke；真实 Codex window-level smoke 已有 `smoke:codex` opt-in runner。
- 真实 Codex smoke 仍需 env opt-in，不进入默认 CI。
- Desktop Home 已转向 Mission Control 风格首轮体验壳，突出“派发给总 Agent”、Agent 状态、Agent 动态和下一步区域；任务草稿只保存在 renderer 本地，dispatch 仍是 bounded internal-trial 入口，不是自由文本 Supervisor 执行入口。
- Desktop Home 已补上 visual-v1 风格 CSS：深色侧栏、浅色渐变工作面板、派活 hero、Agent 状态卡、共享 UI class vocabulary 本地映射和默认窗口下主工作台优先布局。
- Run Detail / Artifact payload / Settings 的默认简中 surface 已进一步收口，已观察运行、运行编号、回放证据、任务/产物空态、payload 状态和设置页源目录提示都走 `desktop-locale.ts`。
- Run Detail 的 artifact card、payload 状态、operator note 成功反馈、cancel / rerun / retry 成功反馈已经改为用户可读 locale copy；底层 Artifact schema、payload API、operator action API、Desktop bridge 和路径隐藏边界未改变。
- UX 主题文档正在收敛主导航与二级观察面口径；不要把旧 `/agents`、`/tasks`、`/artifacts`、`/activity` 或侧栏 `Agents` / `Artifacts` / `Activity` 重新写成 R1 Desktop 主入口。
- 长任务、复杂 payload、跨平台取消链路、完整 Artifact workspace、完整 operator cockpit、自由文本 Supervisor dispatch、真实 planner 仍未完成。

当前自动化环境注意事项：

- 普通 `git status` 可能夹带 stale linked-worktree index 噪音；必要时用 `git diff HEAD --name-only` 或临时 index 复核真实剩余 diff。
- 当前 GUI 视觉证据路径仍不稳定：Electron / Playwright Chromium 在当前 Codex/macOS 会话里可能受 app registration / Mach bootstrap / browser sandbox 影响。不要反复运行普通 GUI smoke 来制造日志。
- 若 `pnpm` 入口提前返回 `fetch failed`，优先使用已安装的本地二进制做同等 targeted 验证，并在记录中明确这是 fallback。

---

## 4. 最近关键提交

近期主线提交只保留会影响下一轮判断的节点：

- `d808fb7` `feat(desktop): 落地首页视觉基线 / land home visual baseline`
- `b42e5b0` `docs(ux): 统一桌面主导航文档 / align desktop nav docs`
- `7ce344b` `docs(status): 记录 UX 提交与下一轮烟测 / record ux commit and smoke next`
- `260b795` `docs(status): 记录视觉烟测阻塞 / record visual smoke blocker`
- `647a6c9` `test(desktop): 收紧窗口烟测诊断 / clarify window smoke diagnostics`
- `9540181` `docs(status): 记录窗口烟测诊断提交 / record window smoke diagnostics commit`
- `4aa70ea` `docs(status): 记录 GUI 注册阻塞 / record gui registration blocker`
- `2de3889` `docs(status): 收口 GUI 注册记录 / close gui registration notes`
- `4c0c8dc` `docs(superpowers): 收口主线索引 / tighten mainline index`
- `4e8fb87` `docs(superpowers): 收口主线索引与接力 / consolidate mainline index and handoff`
- `3c1fcc9` `docs(status): 收口状态页日志 / compress status log`
- `a80c712` `docs(trial): 压缩接力记录 / compress handoff log`
- `1d8e42e` `test(desktop): 增强窗口烟测诊断 / improve window smoke diagnostics`
- `aa59d21` `fix(desktop): 本地化导航可访问标签 / localize navigation a11y labels`
- `0b37fa5` `fix(desktop): 本地化空运行编号错误 / localize empty run id error`
- `16e08cd` `fix(desktop): 本地化侧栏元数据标签 / localize sidebar metadata label`
- `8cd2bbf` `fix(desktop): 本地化接管反馈 / localize operator feedback`

归档说明：

- [`2026-05-20-internal-trial-core-first-implementation-plan.md`](2026-05-20-internal-trial-core-first-implementation-plan.md)
  已改为历史计划摘要，不再作为当前 checkbox 计划。
- [`../specs/2026-05-20-internal-trial-core-first-design.md`](../specs/2026-05-20-internal-trial-core-first-design.md)
  已改为历史设计摘要，不再作为当前缺口列表。

---

## 5. 最近验证基线

不能沿用旧结果声称当前通过；下一轮必须重新跑与改动范围匹配的命令。保留以下最近证据用于选择验证范围：

- Desktop renderer 文案/a11y 小块最近使用：
  `../../node_modules/.bin/vitest run src/renderer/src/desktop-locale.spec.ts src/renderer/src/desktop-app.spec.ts`
- Desktop renderer replay 空 run id 最近使用：
  `../../node_modules/.bin/vitest run src/renderer/src/run-replay-loader.spec.ts src/renderer/src/desktop-app.spec.ts src/renderer/src/desktop-locale.spec.ts`
- Desktop smoke diagnostics 最近使用：
  `../../node_modules/.bin/vitest run scripts/window-smoke-runner.spec.mjs`
- Desktop renderer 常规门禁：
  `../../node_modules/.bin/tsc --noEmit`
  `../../node_modules/.bin/eslint src electron.vite.config.ts`
- 文档门禁：
  `./node_modules/.bin/prettier --check <changed files>`
  `./node_modules/.bin/markdownlint-cli2 <changed markdown files>`
  `pnpm run docs:lint`
  `git diff --check`

2026-05-21 全量 gate 曾通过：

- `pnpm run check`
- `pnpm test`
- `pnpm --filter @cairn/ui-preview build`
- `pnpm --filter @cairn/desktop build`
- stale-current-state scan 无目标残留
- `git diff --check`

---

## 6. 最近完成摘要

- Handoff、状态页和 superpowers 短索引已经从逐轮长日志压回“当前事实 + 下一步入口”；短主索引在 [`../README.md`](../README.md)，活动主题轨道在 [`../tracks/mainline-ui.md`](../tracks/mainline-ui.md)。
- Desktop Home 已完成 visual-v1 首屏壳落地，但真实窗口证据仍受当前 GUI 环境影响；后续只处理可信截图或可测试回归暴露的问题。
- Desktop UI 最近几轮主要是非 GUI 可验证的文案/a11y/localization 小块：导航 aria label、空 run id 错误、侧栏 metadata label、operator cancel/rerun/retry feedback。
- Window smoke 诊断已增强到能报告最后观察到的 smoke signal，用于区分 main module 已加载、ready-to-show 超时和 app registration 早退。
- `docs/STATUS.md` 是事实基线；长期约束写主题轨道，逐轮执行事实只留在本 handoff 的短摘要里。

---

## 7. 下一轮任务

优先级从高到低：

1. **先判断 track 是否已经过度打磨**：如果上一轮仍只是 Desktop UI 文案/a11y 边界收窄，不要继续磨同一页面；切到 smoke 诊断、验证链路或记录 no-change。
2. **复核短入口是否一致**：读取 [`../README.md`](../README.md)、[`../tracks/mainline-ui.md`](../tracks/mainline-ui.md)、[`../../STATUS.md`](../../STATUS.md)。若三者一致，不要为了记录而继续改文档。
3. **GUI 证据路径**：不要重复普通 Electron / Chromium smoke；若要追，只复核失败层级或换到当前 Codex coalition 外的可信终端/新会话。
4. **非 GUI 可验证 Desktop 小块**：若 GUI 仍不可用，优先 SSR markup、copy helper、class mapping 或 CSS regression；必须有测试能证明价值。
5. **可信视觉证据后的最小修正**：拿到 1280px 与较窄窗口证据后，只处理标题挤压、右栏过密、按钮层级不清或共享 UI class 映射缺失。
6. **Run Detail 手动上手烟测**：后续再走“派发 internal trial -> 进入 Run Detail -> 添加 operator note -> 查看右侧 `Trace 事件` 计数变化”，判断是否需要 Replay inspector 局部高亮。

---

## 8. 风险与阻塞

- 当前 GUI 视觉证据路径仍阻塞或不稳定；下一轮不要重复普通 Electron / Chromium smoke。
- Mission Control 首页仍是 internal-trial 体验壳：任务草稿只在 renderer 本地保存，真实自由文本 Supervisor dispatch、自动创建多子 Agent、完整 planner 和完整 operator cockpit 都未完成。
- Desktop renderer 依赖本地 CSS 映射一批 `@cairn/ui` / Tailwind-like class vocabulary；后续新增共享 UI primitive class 时要补映射或引入正式 token/class 构建方案。
- `smoke:codex` 是 opt-in 真实 Codex runner，依赖本机 Codex 登录态、CLI 版本、响应时延和少量 `data-smoke-id` hook；这些 hook 不能成为产品 API 或 Desktop bridge 能力边界。
- Renderer payload/replay/operator action guard 只覆盖同一 renderer 会话内的请求乱序、空态防护和 trial 文案口径；完整 artifact 导出、retention、本地路径 reveal 与完整 Run Detail 数据面仍不在当前范围。
- 文档中凡提到 `apps/web`、installer、signing、notarization、公测 / 公开 alpha，都要明确为未完成或非本轮目标；internal trial 不等于外部 alpha。
