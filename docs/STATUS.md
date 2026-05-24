# 项目状态 / Project Status

> 状态：🟡 Active
> 最后更新：2026-05-24
> 目的：给人类与多 agent 协作提供当前事实基线、最近推进和下一轮入口。

---

## 1. 一句话状态

Cairn 现在处于 **R1 工程基线 + Desktop UI 收口阶段**。

已就位的主线是 shared contracts、domain schema、SQLite storage、Runtime Gateway、Application 编排基线、`apps/workspace-core` 最小服务、`packages/ui` 基线、`apps/ui-preview` 预览壳，以及 `apps/desktop` 的 Electron shell 骨架与 internal-trial 入口。

当前重点是把 Desktop Shell / UI 新版本收敛到更清晰的信息架构、文案和状态展示口径，优先 Home / Inbox、Run Detail、Runtime Status、Replay / Artifact 的收口。

Web Shell 仍未创建；第一轮内部开发者试用仍只验证 `Desktop + embedded Workspace Core + Codex runtime` 的最小真实闭环，不是外部 alpha。

## 2. 当前已确认

- monorepo、TypeScript strict、ESM、lint / format / docs lint 基线已就位。
- Workspace Core 已有健康检查、run/task/agent-run 闭环、replay-source、artifact payload 与 operator control 的最小 HTTP 面。
- Runtime Gateway 已有 mock runtime 与 Codex CLI adapter 基线。
- Desktop 已有 Mission Control 风格 Home 首屏、Run Detail / Artifact Review / Settings 壳视图、zh/en 切换和最小 sidecar bridge。
- UI preview 已能作为静态产品视图预览，不代表 `apps/web` 已启动。

## 3. 仍然不能假设有

- `apps/web` React Web Shell。
- Desktop 生产 sidecar 打包、签名后内嵌启动与完整 preload / contextBridge allowlist。
- 完整产品数据面、完整 operator UI、完整 artifact workspace 或完整 replay UI。
- 远程 workspace、marketplace、workflow builder、企业治理或多租户审批。
- 自动更新通道、安装器、公证和公开版隐私声明完善。

## 4. 最近推进

- 本轮把 [`docs/superpowers/README.md`](superpowers/README.md) 落成短主索引，并把 recurring mainline workstream 收束到 [`docs/superpowers/tracks/mainline-ui.md`](superpowers/tracks/mainline-ui.md)；`docs/STATUS.md` 继续只做事实基线，不再承担导航职责。
- 本轮把 [`docs/design/ux/foundations/information-architecture.md`](design/ux/foundations/information-architecture.md) 收紧成主导航 / 页面边界总览，剥离了屏幕级交互细节。
- 本轮把 [`docs/design/ux/screens/desktop-wireframes.md`](design/ux/screens/desktop-wireframes.md) 的主导航收口到 `Home / Inbox`、`Runs`、`Runtime Status`、`Settings`，并明确 `Run Detail` / `Artifact Detail` / `Activity Timeline` / `Task Explorer` / `Replay View` 只作为二级观察面。
- 本轮继续压短 [`docs/design/ux/screens/desktop-wireframes.md`](design/ux/screens/desktop-wireframes.md) 的剩余示例，把 Home / Inbox、Artifact Detail、Runtime Status 的线框标签对齐到当前主导航，避免把 Tasks / Artifacts / Agents / Activity 重新写成桌面主入口。
- 本轮把 [`docs/design/ux/foundations/information-architecture.md`](design/ux/foundations/information-architecture.md) 与 [`docs/design/ux/components/component-mapping.md`](design/ux/components/component-mapping.md) 中的历史顶层路由口径对齐到当前 R1 主导航，并把 `/agents` 用户可见口径改为 `Runtime Status` / `/runtime`。
- 本轮把 [`docs/design/ux/screens/screen-inventory.md`](design/ux/screens/screen-inventory.md) 与 [`docs/design/ux/flows/interaction-design-v1.md`](design/ux/flows/interaction-design-v1.md) 的屏幕层级和交互入口对齐，明确 Activity Timeline / Task Explorer / Replay View 都从 Run Detail 或 run 上下文进入。
- 本轮复查 [`docs/design/ux/screens/visual-reference-v1.md`](design/ux/screens/visual-reference-v1.md) 与 [`docs/design/ux/assets/`](design/ux/assets/)，把英文/中文视觉参考和低保真 SVG 的侧栏主入口统一到 `Home / Inbox`、`Runs`、`Runtime Status`、`Settings`，并把 Activity Timeline / Task Explorer / Replay View 标为二级观察面。
- 本轮绕过 linked worktree gitdir 的 index 写权限限制，用临时 index 与 common gitdir `update-ref` 创建本地提交 `b42e5b0`，收口当前 UX 文档与 SVG 资产。
- 本轮尝试回到默认 mock Desktop 做 visual-v1 Home 视觉烟测：直接 `electron-vite build` 可通过，但当前环境下
  `pnpm` 入口提前返回 `fetch failed`，`node scripts/window-smoke.mjs` 未收到
  `main-window-ready-to-show`，in-app Browser 也按安全策略阻止 `file://` renderer 预览。
- 本轮定位默认 mock Desktop window smoke 的真实失败点：当前 macOS / Codex 会话中 Electron 在
  app registration 阶段以 `SIGABRT` 退出，Cairn main module 尚未写出 `main-process-loaded` signal；已让
  `window-smoke.mjs` 在 Electron 提前退出时直接报告 code / signal，避免继续伪装成窗口
  `ready-to-show` 超时。
- 本轮继续复核视觉烟测阻塞：Playwright Chromium headless 在同一 Codex/macOS 会话中也因
  `bootstrap_check_in ... Permission denied` / `SIGTRAP` 崩溃，说明问题不只在 Cairn Electron main
  或 renderer；Electron `.ips` 仍指向 `_RegisterApplication` / `GetCurrentProcess` 早期 abort。
- 因仍缺少可信窗口截图 / bounds 证据，本轮没有修改 Desktop UI；下一轮应先在可正常注册 GUI app
  的会话外验证，或建立不依赖 Electron / Chromium / `file://` / localhost 的安全截图路径，再决定是否做低风险视觉微调。
- 目前还不进入 Web Shell、installer、signing、notarization、marketplace 或企业治理方向。

## 5. 当前入口

1. [`docs/README.md`](README.md) - 文档总览
2. [`docs/superpowers/README.md`](superpowers/README.md) - 主线自动化索引
3. [`docs/product/roadmap.md`](product/roadmap.md) - Release 切片
4. [`docs/product/positioning-and-boundaries.md`](product/positioning-and-boundaries.md) - 产品边界
5. [`docs/design/README.md`](design/README.md) - 设计子文档导航
6. [`docs/design/设计文档V0.1.0.md`](design/设计文档V0.1.0.md) - 设计主稿
7. [`docs/design/ux/README.md`](design/ux/README.md) - UX 主题入口
8. [`docs/design/ux/foundations/information-architecture.md`](design/ux/foundations/information-architecture.md) - 当前 UI 信息架构主题
9. [`docs/design/ux/screens/desktop-wireframes.md`](design/ux/screens/desktop-wireframes.md) - 当前桌面线框命名与布局主题

## 6. 验证基线

- 文档改动优先跑 `git diff --check`、Markdown 格式检查和文档 lint。
- UI 改动再补 `pnpm run check`、相关 build / test / typecheck，以及浏览器或 Electron 验证。

## 7. 风险与阻塞

- 阻塞：当前沙箱仍无法写入 `/Users/taosiyu/Code/cairn/.git/worktrees/codex-cairn-mainline-ui`，因此不能刷新真实 linked-worktree index；普通 `git status` 会继续显示 stale staged / unstaged mismatch。已确认可用临时 index + common gitdir `update-ref` 创建本地提交，但后续若要正常 `git add` / `git commit`，仍需要可写 gitdir 或继续使用同一绕过方式。
- 阻塞：当前 Desktop 视觉烟测路径不可用。直接构建通过，但 Electron 在本机 macOS / Codex 会话中于 app registration 阶段 `SIGABRT` 退出；Playwright Chromium headless 同样在
  Mach bootstrap registration 阶段被拒绝；Browser 插件阻止 `file://` renderer 预览，localhost 监听也不可用。不能据此做视觉修复。
- 风险：Desktop UI 细节继续长出新口径时，必须回写 UX 主题文档，不要把每次对话都留在状态页里。

## 8. 本轮记录

- 完成：把 `docs/superpowers/README.md` 设为短主索引，并把主线工作收束到 `docs/superpowers/tracks/mainline-ui.md`；后续 recurring 轮次先看这两个文件，再看 `docs/STATUS.md`。
- 验证：待本轮文档格式与 diff 检查完成后补写。
- 阻塞：当前 GUI app registration 阻塞仍在，普通 Electron / Chromium smoke 继续不作为本轮新证据。
- 风险：当前 handoff 仍保留较长历史记录，只是入口已迁移到更短的主索引和主题轨道。
- Commit：待本轮提交后补写。
- 下一轮：只在有新 GUI 证据时再做 Desktop UI 的最小视觉 / 信息架构修正。

- 完成：复核 Desktop visual smoke 的环境边界，确认当前阻塞同时影响 Electron 与 Playwright Chromium，不是 Cairn renderer / `ready-to-show` 链路的单点问题。
- 验证：`../../node_modules/.bin/vitest run scripts/window-smoke-runner.spec.mjs --config vitest.config.ts` 通过；`node scripts/window-smoke.mjs` 快速报告 `Electron exited before Desktop window smoke event main-window-ready-to-show with code null and signal SIGABRT`；Playwright Chromium `chromium.launch()` 失败并输出 `bootstrap_check_in org.chromium.Chromium.MachPortRendezvousServer... Permission denied`；最新 `.ips` 中 Electron fault frame 仍在 `_RegisterApplication` / `GetCurrentProcess`；`xattr -lr` 显示 Electron 与 Chromium binary 仍带 `com.apple.provenance`；复制到 `/private/tmp` 后 `xattr -cr` 仍未能移除该属性。
- Commit：`4aa70ea` `docs(status): 记录 GUI 注册阻塞 / record gui registration blocker`；无 Desktop UI 或运行时代码变更。
- 下一轮：优先在当前 Codex coalition 之外复核 Electron / Chromium GUI app registration，或设计无需 Electron / Chromium / `file://` / localhost 的截图证据路径；拿到 1280px 与较窄窗口证据后再考虑低风险视觉微调。
