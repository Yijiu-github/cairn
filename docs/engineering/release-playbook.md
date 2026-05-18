# 发布手册 / Release Playbook

> 状态：🟡 Draft
> 最后更新：2026-05-18
> 关联：`ci-cd.md`、`../design/distribution-and-signing.md`

---

## 0. 适用对象

本手册面向**有权限发布版本**的协作者。每次发版前**通读一遍**。

## 1. 发版前检查（Release Blocking）

| 检查项                                              | 必须          |
| --------------------------------------------------- | ------------- |
| `main` 分支 CI 全绿                                 | ✅            |
| E2E 全平台跑过                                      | ✅            |
| CHANGELOG 已更新（含本次变更）                      | ✅            |
| 版本号已在 `package.json` 中 bump                   | ✅            |
| 涉及 schema 变更已写迁移并双方言测试                | ✅            |
| 涉及破坏性变更已在 CHANGELOG 标记 `BREAKING CHANGE` | ✅            |
| 第三方依赖审计无 critical 漏洞                      | ✅            |
| `docs/legal/third-party-notices.md` 已更新          | ✅            |
| 签名证书未过期                                      | ✅            |
| Apple Developer 账号会籍有效                        | ✅            |
| 升级 manifest 服务可访问                            | ✅            |
| 备份当前生产环境（如适用）                          | ⚠️ Release 2+ |

## 2. 发版步骤

### 2.1 准备 release branch（可选）

对于大版本（minor / major），建议从 `main` 切出 `release/v0.X` 分支冻结代码，便于补丁。

```bash
git checkout -b release/v0.1 main
git push -u origin release/v0.1
```

补丁版（patch）可以直接在 `main` 上打 tag。

### 2.2 Bump 版本

```bash
# 修改 package.json 与各包的 version 字段
# 推荐用 changeset / 手动同步

# 更新 CHANGELOG.md（从 [Unreleased] 移到 [0.X.Y]）
# 提交
git commit -am "chore(release): v0.X.Y"
```

### 2.3 打 tag

```bash
git tag v0.X.Y -m "Release v0.X.Y"
git push origin v0.X.Y
```

### 2.4 CI 自动构建

`release.yml` 自动触发：

1. 运行 `pnpm --filter @cairn/desktop package:mac:dmg`
2. 由 electron-builder 按配置完成签名与 notarization
3. 如 notarization 失败，用 `xcrun notarytool log <submission-id>` 排查
4. 用 `xcrun stapler validate apps/desktop/release/mac-arm64/Cairn.app` 验证最终安装器
5. 构建 Windows x64 → 云签名
6. 构建 Linux server tarball（如启用）
7. 生成 update manifest
8. 上传到 GitHub Releases（draft）

### 2.5 检查并发布

1. 在 GitHub Releases 找到 draft
2. 检查附件齐全（macOS .dmg / Windows .exe / manifest.json）
3. 检查 release notes（CHANGELOG 摘录）
4. **手动确认**：下载一份 macOS 安装包，本地装一下能正常打开
5. **手动确认**：下载一份 Windows 安装包，在 VM 里装一下能正常打开
6. 点击 "Publish release"

### 2.6 部署 update manifest

GitHub Releases 自动暴露下载 URL。

将 `manifest.json` 部署到稳定 URL（如 `https://cairn.example/updates/manifest.json`）。

> Release 2 之前可以用 GitHub Pages / Cloudflare R2 / S3 等静态托管。

### 2.7 通知

- GitHub Discussions / 邮件列表 / Discord（如有）
- 更新官网下载页（如有）

## 3. 回滚

### 3.1 紧急回滚

发现严重问题时：

1. 立即把官网下载链接指向上一稳定版本
2. 修改 update manifest，让 `latest` 指向上一版本
3. 在 GitHub Releases 把问题版本标记为 `pre-release` 或加显眼警告
4. 不删除版本（破坏可重现性）

### 3.2 数据回滚

涉及 DB schema 变更时：

- 用户数据自动备份在 `<userData>/backups/<version>/workspace.sqlite`
- 提供"回退到上一版本"的官方步骤（在 troubleshooting.md）

### 3.3 撰写 postmortem

24 小时内起草，模板见 `../reference/postmortem-template.md`（待写）。

## 4. 跨版本数据迁移测试

每次发版前必须跑：

1. 从**前一个稳定版本**的数据库快照
2. 升级到新版本
3. 启动并验证：
   - 数据库迁移成功
   - UI 能加载已有 OrchestrationRun
   - 关键操作（new run / retry / cancel）可用

测试集应在 CI 中维护（数据快照存仓库或 LFS）。

## 5. 签名材料管理

| 材料                          | 位置                            | 续期       |
| ----------------------------- | ------------------------------- | ---------- |
| Apple Developer 账号          | 个人 Apple ID                   | 每年       |
| Developer ID Application 证书 | macOS Keychain + GitHub Secrets | 每 5 年    |
| Windows 云签名订阅            | Azure / DigiCert 控制台         | 按订阅周期 |

**至少在到期 30 天前提醒续期**。在团队日历 / GitHub Issue 设置提醒。

## 6. 发版节奏建议

| 类型                     | 节奏           |
| ------------------------ | -------------- |
| Patch（0.X.Y → 0.X.Y+1） | 按需，1–2 周内 |
| Minor（0.X → 0.X+1）     | 4–6 周         |
| Major（0.X → 1.0）       | 重大里程碑     |

避免：

- 周五发布
- 重大节假日前一天发布
- 没有 hotfix 准备的情况下发布

## 7. 待办

- [ ] 写 `scripts/release.sh`（封装常用步骤）
- [ ] 写跨版本迁移测试脚本
- [ ] 整理签名材料 inventory + 续期提醒系统

## 变更历史

| 日期       | 变更 |
| ---------- | ---- |
| 2026-05-14 | 初版 |
