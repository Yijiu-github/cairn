# 项目状态 / Project Status

> 状态：🟡 Active
> 最后更新：2026-05-27
> 目的：给人类与多 agent 协作提供当前事实基线、最近推进和下一轮入口。

---

## 1. 一句话状态

Cairn 现在处于 **R1 工程基线 + Desktop 内部试用演示收口阶段**。

已就位的主线是 shared contracts、domain schema、SQLite storage、Runtime Gateway、Application 编排基线、`apps/workspace-core` 最小服务、`packages/ui` 基线、`apps/ui-preview` 预览壳，以及 `apps/desktop` 的 Electron shell 骨架与 internal-trial 入口。

当前重点是把 Desktop 内部试用演示链路收敛到可解释、可验证的一条最小路径：Home / Inbox 启动内部试用，Run Detail 观察回放、Trace 与接管入口，Artifact Review 读取回放证据中的真实产物。

Web Shell 仍未创建；第一轮内部开发者试用仍只验证 `Desktop + embedded Workspace Core + Codex runtime` 的最小真实闭环，不是外部 alpha。

## 2. 当前已确认

- monorepo、TypeScript strict、ESM、lint / format / docs lint 基线已就位。
- Workspace Core 已有健康检查、run/task/agent-run 闭环、replay-source、artifact payload 与 operator control 的最小 HTTP 面。
- Runtime Gateway 已有 mock runtime 与 Codex CLI adapter 基线。
- Desktop 已有 Mission Control 风格 Home 首屏、Run Detail / Artifact Review / Settings 壳视图、zh/en 切换和最小 sidecar bridge。
- Desktop 内部试用演示链路已能用 SSR / 单元测试证明 Home 右栏、Run Detail 演示状态条、Artifact Review 回放产物入口的基本信息层级。
- UI preview 已能作为静态产品视图预览，不代表 `apps/web` 已启动。

## 3. 仍然不能假设有

- `apps/web` React Web Shell。
- Desktop 生产 sidecar 打包、签名后内嵌启动与完整 preload / contextBridge allowlist。
- 完整产品数据面、完整 operator UI、完整 artifact workspace 或完整 replay UI。
- 远程 workspace、marketplace、workflow builder、企业治理或多租户审批。
- 自动更新通道、安装器、公证和公开版隐私声明完善。

## 4. 最近推进

- 主线入口已收束为短索引 [`docs/superpowers/README.md`](superpowers/README.md) 与活动主题 [`docs/superpowers/tracks/mainline-ui.md`](superpowers/tracks/mainline-ui.md)；本文件只保留事实基线和下一轮入口，不再承载逐轮日志。
- UX 主导航已统一到 `Home / Inbox`、`Runs`、`Runtime Status`、`Settings`。`Run Detail`、`Artifact Detail`、`Activity Timeline`、`Task Explorer`、`Replay View` 只作为二级页面或 run 上下文观察面。
- [`docs/design/ux/`](design/ux/) 的信息架构、线框、屏幕清单、视觉参考和 SVG 资产已按当前 R1 主导航收口；不要把旧 `/agents`、`/tasks`、`/artifacts`、`/activity` 再写回桌面主入口。
- Desktop Home 已把首屏待处理、固定运行和运行安全信息收进右栏，避免派活主区与摘要信息互相挤压。
- Run Detail 已增加演示状态条，加载 replay source 后集中显示回放证据、任务、产物、Trace 事件和接管入口状态。
- Artifact Review 已能在已有 replay source 时显示真实 artifact id、用户可读产物标题/摘要和只读来源提示；没有 replay source 时仍保留静态占位。
- Desktop visual-v1 Home 的可信截图 / bounds 证据仍缺失：直接 `electron-vite build` 可通过，但当前 macOS / Codex 会话中 Electron 在 app registration 阶段 `SIGABRT`，Playwright Chromium headless 也在 Mach bootstrap registration 阶段失败；Browser 阻止 `file://`，localhost 监听也可能被拒绝。
- 因 GUI 证据路径不可用，当前不据此做视觉猜测。下一步先恢复可信 GUI / screenshot / bounds 证据路径，或继续只做可由 SSR、locale、CSS regression 证明的小块。
- 当前仍不进入 Web Shell、installer、signing、notarization、marketplace、workflow builder 或企业治理方向。

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

- 阻塞：当前 Desktop 视觉烟测路径不可用。直接构建通过，但 Electron 在本机 macOS / Codex 会话中于 app registration 阶段 `SIGABRT` 退出；Playwright Chromium headless 同样在
  Mach bootstrap registration 阶段被拒绝；Browser 插件阻止 `file://` renderer 预览，localhost 监听也不可用。不能据此做视觉修复。
- 风险：Desktop UI 细节继续长出新口径时，必须回写 UX 主题文档，不要把每次对话都留在状态页里。

## 8. 下一轮入口

1. 先读 [`docs/superpowers/README.md`](superpowers/README.md) 与 [`docs/superpowers/tracks/mainline-ui.md`](superpowers/tracks/mainline-ui.md)，再读本文件。
2. 下一阶段优先恢复可信 GUI 证据路径，并补一条内部试用验收清单：Home 启动内部试用 → Run Detail 观察 replay / Trace / operator note → Artifact Review 查看真实产物。
3. 若 GUI 证据仍不可用，只做非 GUI 可验证的小块；不要连续多轮只磨同一页面文案、a11y label 或边界说明。
4. 继续保持 R1 边界：不进入 Web Shell、installer、signing、公证、marketplace、workflow builder 或企业治理。
