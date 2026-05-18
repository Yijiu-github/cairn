# 分发、签名与更新 / Distribution, Signing & Updates

> 状态：🟡 Draft
> 最后更新：2026-05-18
> 来源：[`设计文档V0.1.0.md §15`](设计文档V0.1.0.md) 扩展
> 关联：ADR-0003、`engineering/ci-cd.md`、`engineering/release-playbook.md`、`engineering/macos-packaging.md`

---

## 1. 总则

桌面端的签名与更新**不是发布前补一下的事**，而是会反向影响：

- 桌面壳选型
- CI/CD 设计与构建矩阵
- 发布节奏
- 证书与账号准备

## 2. macOS

### 2.1 必备

- **Apple Developer 账号**（$99/年）
- **Developer ID Application 证书**（用于分发）
- **Code Signing**（codesign）
- **Notarization**（notarytool）
- **Stapling**（将公证票据嵌入 .app）

### 2.2 entitlements

按最小权限原则，仅启用必要 entitlements：

```xml
<!-- 候选清单（待确认） -->
<key>com.apple.security.app-sandbox</key><false/>
<key>com.apple.security.cs.allow-jit</key><true/>
<key>com.apple.security.cs.allow-unsigned-executable-memory</key><true/>
<key>com.apple.security.network.client</key><true/>
<key>com.apple.security.files.user-selected.read-write</key><true/>
```

> ⚠️ 是否启用 sandbox 影响 sidecar 启动方式，需在 spike 中验证。

### 2.3 首发架构

- **仅 Apple Silicon**（arm64）
- 不做 universal2，避免 CI 与签名时间翻倍
- Intel Mac 用户建议升级或使用 Web Shell（远程模式）

### 2.4 公证流程

本仓库把 macOS 路径拆成两个显式命令：

```bash
# 本地验证用，ad-hoc signing，输出 unpacked directory package
pnpm --filter @cairn/desktop package:mac:dir

# 发布安装器用，Developer ID + notarization，输出 DMG
pnpm --filter @cairn/desktop package:mac:dmg
```

electron-builder 的 macOS notarization 变量约定以官方文档为准：

- `APPLE_API_KEY` + `APPLE_API_KEY_ID` + `APPLE_API_ISSUER`
- `APPLE_ID` + `APPLE_APP_SPECIFIC_PASSWORD` + `APPLE_TEAM_ID`
- `APPLE_KEYCHAIN` + `APPLE_KEYCHAIN_PROFILE`

`APPLE_APP_PASSWORD` 不是这里的正式名字，不要在仓库文档里继续使用。

完整操作手册见 [`../engineering/macos-packaging.md`](../engineering/macos-packaging.md)，CI / release 细节见 [`../engineering/release-playbook.md`](../engineering/release-playbook.md)。

## 3. Windows

### 3.1 必备

- **Code Signing Certificate**
- 推荐 **Azure Trusted Signing** 或 **DigiCert KeyLocker** 等云签名服务（避免 USB HSM 物理 token）
- EV 证书可加速 SmartScreen 信誉积累

### 3.2 首发范围

- **Windows 11 x64 优先**
- Win 10 best-effort，不阻发
- ARM64 暂不做

### 3.3 签名流程

```text
build installer (.exe / .msi)
  ↓
signtool sign /tr <RFC3161 timestamp> /td sha256 /fd sha256 /n "<cert subject>"
  ↓
SmartScreen 信誉冷启动（前 2 周可能触发警告）
  ↓
分发
```

## 4. 更新策略

> 桌面端必须有正式更新策略，但**不要求第一天就做全自动静默升级**。

### Release 1（手动更新）

- 内置"检查新版本"按钮
- 发现新版本 → 显示 changelog → 引导用户下载安装
- 升级 manifest 通过 HTTPS 提供，包含版本号、下载 URL、签名 hash

Manifest 示例：

```json
{
  "version": "0.1.1",
  "released_at": "2026-XX-XX",
  "changelog_url": "https://.../CHANGELOG.md",
  "platforms": {
    "darwin-arm64": {
      "url": "https://.../Cairn-0.1.1-arm64.dmg",
      "sha256": "...",
      "size": 12345678
    },
    "win32-x64": {
      "url": "https://.../Cairn-0.1.1-x64.exe",
      "sha256": "...",
      "size": 12345678
    }
  }
}
```

### Release 2（受控自动更新）

- 后台静默下载新版本
- 用户在合适时机点击"重启升级"
- 推荐使用 `electron-updater`（differential download 可选）

### Release 3（多通道）

- `stable` / `beta` / `nightly`
- 用户在设置中选择通道

## 5. 版本号规则

采用 Semantic Versioning：`MAJOR.MINOR.PATCH[-prerelease][+build]`

| 场景               | 示例              |
| ------------------ | ----------------- |
| 首发               | `0.1.0`           |
| Bug 修复           | `0.1.1`           |
| 新功能（向后兼容） | `0.2.0`           |
| 破坏性变更         | `1.0.0` / `2.0.0` |
| Beta 测试          | `0.2.0-beta.1`    |

## 6. 渠道分发

| 渠道                   | Release 1               | Release 2 |
| ---------------------- | ----------------------- | --------- |
| 官网下载               | ✅                      | ✅        |
| GitHub Releases        | ✅                      | ✅        |
| Homebrew Cask（macOS） | ⚪ 计划                 | ✅        |
| winget / Chocolatey    | ⚪ 计划                 | ✅        |
| Mac App Store          | ❌ 暂不（sandbox 限制） | 重新评估  |
| Microsoft Store        | ❌ 暂不                 | 重新评估  |

## 7. 回滚

每个 release **必须保留至少前 2 个版本**的下载入口，便于用户回退。

破坏性 schema 变更必须配合**前向兼容窗口**（详见 `../engineering/db-migrations.md`）。

## 8. 待办

- [ ] 申请 Apple Developer 账号
- [ ] 评估 Azure Trusted Signing vs DigiCert KeyLocker
- [ ] 起草签名 CI job（GitHub Actions 矩阵）
- [ ] 起草 update manifest 服务端实现
- [ ] Spike：macOS 公证完整流程（含 entitlements）

## 变更历史

| 日期       | 变更                                                     |
| ---------- | -------------------------------------------------------- |
| 2026-05-14 | 初版，从 V0.1.0 §15 扩展，补充云签名建议与 manifest 格式 |
