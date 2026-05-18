# macOS Desktop Dev Loop Design

> 状态：Accepted
> 最后更新：2026-05-18

## 背景

Cairn 已有 `apps/desktop` Electron 静态 shell 骨架，但本地开发文档仍停留在占位状态：

- `local-dev-setup.md` 没有按 macOS 上手路径串起安装、启动、调试、smoke 和开发态打包。
- 文档提到 `pnpm --filter @cairn/desktop dev:debug`，但 desktop 包没有对应脚本。
- `apps/desktop/README.md` 说明了 preview-safe 边界，却没有给本地开发者一条可执行的 Mac 端检查路径。

本设计只补 Mac 端开发闭环，不改变 Desktop 当前的产品边界。

## 目标

为 macOS 开发者提供一条可跟随的 Desktop Shell 开发路径：

1. 准备本机依赖。
2. 启动 Workspace Core、Desktop Shell、UI Preview 的正确命令。
3. 调试 Electron main / renderer。
4. 完成 Desktop Shell preview-safe smoke。
5. 执行开发态构建和未签名本机打包。

## 非目标

- 不启动 Workspace Core sidecar。
- 不新增真实 IPC action。
- 不读取或写入本地文件系统业务数据。
- 不做签名、公证、正式 DMG 发布流程。
- 不创建 `apps/web`。

## 设计

### 脚本

`apps/desktop/package.json` 增加两个脚本：

- `dev:debug`：使用 `electron-vite dev --inspect 9229 --remoteDebuggingPort 9230`，让 main process 可以被 Node inspector 附加，renderer 可以通过 Chromium remote debugging 端口检查。
- `preview`：使用 `electron-vite preview --skipBuild`，用于在已构建产物上启动 Electron preview。

这些脚本只改变开发体验，不改变 app runtime 行为。

### 文档

`docs/engineering/local-dev-setup.md` 新增 macOS Desktop 本机闭环：

- macOS 前置检查。
- `pnpm dev` 当前真实含义：运行所有已有 workspace 的 `dev` task，不代表 Web 已存在，也不代表 Desktop 会接 sidecar。
- 推荐分开启动 Workspace Core 和 Desktop。
- Desktop Shell smoke 清单。
- Electron 调试方式。
- 未签名开发态打包说明和 macOS quarantine 处理建议。

`apps/desktop/README.md` 增加包内快速路径，方便只看 desktop 包的协作者也能启动和验证。

## 验证

本 slice 的验证以脚本和文档正确性为主：

- `pnpm --filter @cairn/desktop typecheck`
- `pnpm --filter @cairn/desktop lint`
- `pnpm --filter @cairn/desktop build`
- `pnpm run docs:lint`
- `pnpm run format:check`
- `git diff --check`

若本机窗口环境可用，再手动执行：

- `pnpm --filter @cairn/desktop dev`
- `pnpm --filter @cairn/desktop dev:debug`
- `pnpm --filter @cairn/desktop package`

## 风险与边界

- `dev:debug` 打开调试端口，只用于本机开发，不应进入发布态启动命令。
- `package` 生成的是未签名开发态目录，不代表 macOS 分发包已经可发布。
- Desktop 仍是静态 preview-safe shell；任何 sidecar / IPC / filesystem 能力必须另开设计。
