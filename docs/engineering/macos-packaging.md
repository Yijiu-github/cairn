# macOS Packaging, Signing, and Installer Guide

> 状态：🟡 Draft
> 最后更新：2026-05-18
> 关联：`README.md`、`local-dev-setup.md`、`ci-cd.md`、`release-playbook.md`、`../design/distribution-and-signing.md`

---

## 1. 前置条件

本指南只覆盖 macOS Desktop 的打包、签名、公证和安装器验证。

需要准备的东西：

- Node.js 22+
- pnpm 9+
- Xcode Command Line Tools
- Apple Developer 账号
- Developer ID Application 证书
- 本机可用的 `codesign`、`spctl`、`xcrun notarytool`、`xcrun stapler`

本地目录包不需要发布凭据。DMG 发布包需要签名与 notarization 凭据。

## 2. 本地包

本地开发验证只跑目录包，不跑正式安装器：

```bash
pnpm --filter @cairn/desktop package:mac:dir
```

这个命令会产出未分发的 macOS 目录包，适合本机 smoke、调试和 Gatekeeper 快速检查。

如果本机对生成物加了 quarantine，可以对输出目录做一次清理：

```bash
xattr -cr apps/desktop/release
```

## 3. 发布安装器

发布形态用 DMG：

```bash
pnpm --filter @cairn/desktop package:mac:dmg
```

这条路径由 `electron-builder` 驱动，目标是生成可分发的 `.dmg`，并在具备凭据时完成签名和 notarization。

## 4. 签名与公证变量

`electron-builder` 支持的 macOS notarization 变量组如下：

```text
CSC_LINK + CSC_KEY_PASSWORD
CSC_NAME
APPLE_API_KEY + APPLE_API_KEY_ID + APPLE_API_ISSUER
APPLE_ID + APPLE_APP_SPECIFIC_PASSWORD + APPLE_TEAM_ID
```

建议优先用 `APPLE_API_KEY` 这一组。若使用 Apple ID flow，请使用 `APPLE_APP_SPECIFIC_PASSWORD`，不要再用旧写法 `APPLE_APP_PASSWORD`。

## 5. 验证命令

打包后按这个顺序检查：

```bash
codesign -dv --verbose=4 "apps/desktop/release/Cairn.app"
spctl -a -vv --type execute "apps/desktop/release/Cairn.app"
xcrun notarytool log <submission-id>
xcrun stapler validate "apps/desktop/release/Cairn.dmg"
```

如果只做本地目录包，至少确认：

```bash
pnpm --filter @cairn/desktop package:mac:dir
```

## 6. 失败排查顺序

1. 先看 `electron-builder` 输出里是否已经失败在打包阶段。
2. 再看签名是否使用了正确的 identity 和证书。
3. 然后看 notarization submission 是否成功，以及 `notarytool log` 的拒绝原因。
4. 接着看 `stapler validate` 是否能通过。
5. 最后再做本机 Gatekeeper 验证。

典型问题：

- `package:mac:dir` 失败：优先检查本机 Electron / Xcode / macOS 环境。
- `package:mac:dmg` 失败：优先检查 Apple credential 变量和证书是否可用。
- `spctl` 拒绝：通常是签名或 stapling 没做好。
