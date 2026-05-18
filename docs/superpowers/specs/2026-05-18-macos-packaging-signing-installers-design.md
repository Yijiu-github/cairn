# macOS Packaging, Signing, and Installer Baseline

> 状态：Proposed
> 最后更新：2026-05-18

## 背景

`apps/desktop` 现在已经有可运行的 macOS 本机开发闭环，但打包、签名和安装器路径仍分散在草案文档里，没有一条明确的工程入口。

当前问题是：

- 本地开发者不知道什么时候该用 unpacked build，什么时候该用 `.dmg`。
- release 侧的 Apple Developer ID、notarytool、stapler 和 electron-builder 的环境变量约定还没有被写成可执行手册，CI / release 文档里的命名也还没有统一到官方术语。
- `electron-builder.yml` 已存在，但没有配套的 macOS packaging 操作说明。

## 目标

为 macOS Desktop 建立一条清晰的分层路径：

1. 本地开发验证用的 macOS package。
2. 面向发布的 Developer ID 签名 + notarized `.dmg` installer。
3. 清楚说明哪些步骤依赖 Apple credentials，哪些不依赖。

## 非目标

- 不做 Mac App Store 分发。
- 不做 universal2。
- 不做 Windows signing。
- 不做自动更新系统。
- 不引入新的 sidecar、IPC 或 filesystem 能力。
- 不在这个 slice 里实现正式 GitHub Actions release workflow。

## 方案

### 方案 A: 仅补文档

优点：最轻。  
缺点：用户仍然只有一份“看起来对、但不够可执行”的说明。

### 方案 B: 文档 + 显式 mac packaging 脚本

在 `apps/desktop/package.json` 里增加明确的 mac scripts，把 unpacked dev package 和 `.dmg` installer 分开命名，再配一份 mac packaging guide 讲 signing / notarization / validation。  
这是推荐方案，因为它最小、最直白，也不会破坏现有桌面骨架的预览安全边界。

### 方案 C: 拆出 dev / release 两套 builder 配置

优点：对“是否签名”表达更绝对。  
缺点：多维护一套 builder 文件，当前阶段偏重，且还没必要。

## 设计

### 构建模型

保持 `apps/desktop/electron-builder.yml` 作为唯一的桌面打包配置来源。macOS 相关行为通过脚本和环境变量区分：

- `package:mac:dir`：本地验证用 unpacked package，使用 ad-hoc signing 以保持可运行但不依赖发布证书。
- `package:mac:dmg`：发布形态用 `.dmg` installer，在 Developer ID + notarization 凭据存在时生成可分发产物。

这两条命令都以 Apple Silicon `arm64` 为默认目标，并保留当前单平台首发策略。

### 签名与 notarization

签名和 notarization 由 electron-builder 的标准机制驱动，不做自定义签名脚本。

release 侧使用以下凭据之一：

- `CSC_LINK` + `CSC_KEY_PASSWORD`
- `CSC_NAME`
- `APPLE_API_KEY` + `APPLE_API_KEY_ID` + `APPLE_API_ISSUER`
- `APPLE_ID` + `APPLE_APP_SPECIFIC_PASSWORD` + `APPLE_TEAM_ID`

Apple 的 notarization 流程以 `notarytool` 和 `stapler` 为准，不再依赖已废弃的 `altool`。[Apple docs](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution)  
electron-builder 的 macOS 签名配置和环境变量约定以官方文档为准。[electron-builder docs](https://www.electron.build/code-signing-mac)

### 文档结构

新增 `docs/engineering/macos-packaging.md` 作为 macOS packaging 的操作手册，内容包括：

- 前置依赖
- 本地 package 命令
- release installer 命令
- 签名与 notarization 环境变量
- `codesign` / `spctl` / `notarytool` / `stapler` 验证命令
- 失败时的日志检查顺序

同时在以下文档中补链路：

- `docs/engineering/README.md`
- `docs/engineering/local-dev-setup.md`
- `apps/desktop/README.md`
- `docs/design/distribution-and-signing.md`
- `docs/engineering/ci-cd.md`
- `docs/engineering/release-playbook.md`
- `docs/STATUS.md`
- `CHANGELOG.md`

## 验证

文档与脚本更新后，至少跑：

- `pnpm --filter @cairn/desktop run`
- `pnpm --filter @cairn/desktop build`
- `pnpm --filter @cairn/desktop package:mac:dir`
- `pnpm run docs:lint`
- `pnpm run format:check`
- `git diff --check`

如果本机具备 Apple Developer 凭据，再补充执行：

- `pnpm --filter @cairn/desktop package:mac:dmg`
- `xcrun notarytool log <submission-id>`
- `xcrun stapler validate <Cairn.dmg 或 .app>`

## 风险

- 如果 release signing 凭据缺失，`package:mac:dmg` 只能证明打包路径通了，不能证明正式 notarization 已经准备好。
- 如果未来要引入 entitlement 或 hardened runtime 调整，应单独开桌面安全 slice，不和本次 packaging 工作混在一起。
- 如果后续需要 CI 自动发布，再把 release workflow 和 secrets 管理纳入 `ci-cd.md` / `release-playbook.md`。
