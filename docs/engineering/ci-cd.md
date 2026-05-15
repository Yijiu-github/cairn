# CI / CD

> 状态：🟡 Draft  
> 最后更新：2026-05-14  
> 关联：`testing-strategy.md`、`release-playbook.md`、`../design/distribution-and-signing.md`

---

## 1. 平台

- **GitHub Actions**（首选）
- 构建产物 / 签名密钥通过 GitHub Encrypted Secrets 与 OIDC 联合身份

## 2. Workflow 总览

| Workflow      | 触发                                          | 目的                                             |
| ------------- | --------------------------------------------- | ------------------------------------------------ |
| `ci.yml`      | PR to `dev` / `develop`、release PR to `main` | lint + typecheck + unit + contract + integration |
| `e2e.yml`     | PR / 定时（每日）                             | Playwright + Electron / Web E2E                  |
| `release.yml` | git tag `v*`                                  | 构建 + 签名 + 公证 + 发布到 GitHub Releases      |
| `audit.yml`   | 每周 cron                                     | 依赖审计、license 检查、license-checker 输出     |
| `docs.yml`    | docs/\*\* 变更                                | 校验链接、构建静态站点（如启用）                 |

## 3. ci.yml 基线

普通开发分支必须先 PR 到 `dev` / `develop`；`main` 只接受发布晋级或 hotfix PR。CI 可以监听 `main` push/tag，但不应鼓励功能分支直接进入 `main`。

当前 `.github/workflows/ci.yml` 是最小质量门禁基线：先覆盖安装、类型、lint、文档、格式、测试与构建；E2E、发布签名、依赖审计留给后续独立 workflow。

```yaml
name: ci
on:
  pull_request:
    branches: [develop, dev, main]
  push:
    branches: [develop, dev, main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9.15.0, run_install: false }
      - uses: actions/setup-node@v4
        with:
          node-version-file: .node-version
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm run typecheck
      - run: pnpm run lint
      - run: pnpm run docs:lint
      - run: pnpm run format:check
      - run: pnpm run test
      - run: pnpm run build
```

## 4. e2e.yml 草案

需要矩阵：

```yaml
strategy:
  matrix:
    os: [macos-14, windows-latest, ubuntu-latest]
```

- macOS 用 `macos-14`（Apple Silicon runner）
- Windows 用 `windows-latest`
- Linux 跑 Web E2E

## 5. release.yml 草案

矩阵构建 + 签名 + 公证 + 上传 release。

```yaml
name: release
on:
  push:
    tags: ['v*']

jobs:
  build-macos:
    runs-on: macos-14
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter @cairn/desktop build:mac
      # 签名
      - name: Import signing identity
        uses: apple-actions/import-codesign-certs@v3
        with:
          p12-file-base64: ${{ secrets.MACOS_CERT_P12 }}
          p12-password: ${{ secrets.MACOS_CERT_PASSWORD }}
      - run: scripts/sign-macos.sh
      # 公证
      - run: scripts/notarize-macos.sh
        env:
          APPLE_ID: ${{ secrets.APPLE_ID }}
          APPLE_PASSWORD: ${{ secrets.APPLE_APP_PASSWORD }}
          APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
      - uses: actions/upload-artifact@v4

  build-windows:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter @cairn/desktop build:win
      # 云签名（Azure Trusted Signing 或 DigiCert KeyLocker）
      - run: scripts/sign-windows.ps1
        env:
          AZURE_TENANT_ID: ${{ secrets.AZURE_TENANT_ID }}
          AZURE_CLIENT_ID: ${{ secrets.AZURE_CLIENT_ID }}
          AZURE_CLIENT_SECRET: ${{ secrets.AZURE_CLIENT_SECRET }}
      - uses: actions/upload-artifact@v4

  publish:
    needs: [build-macos, build-windows]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4
      - uses: softprops/action-gh-release@v2
        with:
          generate_release_notes: true
          files: |
            dist/Cairn-*.dmg
            dist/Cairn-*.exe
            dist/manifest.json
```

## 6. Secrets

| Secret                                                        | 用途                             |
| ------------------------------------------------------------- | -------------------------------- |
| `MACOS_CERT_P12` / `MACOS_CERT_PASSWORD`                      | macOS Developer ID 证书          |
| `APPLE_ID` / `APPLE_APP_PASSWORD` / `APPLE_TEAM_ID`           | notarytool                       |
| `AZURE_TENANT_ID` / `AZURE_CLIENT_ID` / `AZURE_CLIENT_SECRET` | Windows 云签名                   |
| `RELEASE_GITHUB_TOKEN`                                        | 发布到 GitHub Releases（必要时） |

**绝不**：

- 在 PR workflow（含 fork PR）中暴露 release secrets
- 把 secrets 写入日志（CI 自动 mask，但仍要避免）

## 7. 缓存策略

- pnpm store：`actions/setup-node` 自带 cache
- Turborepo remote cache：可选（Vercel / 自建）
- Electron cache：`~/.cache/electron`

## 8. 构建产物

| 平台                     | 产物                                         |
| ------------------------ | -------------------------------------------- |
| macOS                    | `Cairn-<version>-arm64.dmg` + `.zip`（备用） |
| Windows                  | `Cairn-Setup-<version>.exe` + `.msi`（备用） |
| Linux（远程模式 server） | `cairn-workspace-core-<version>.tar.gz`      |
| 更新 manifest            | `manifest.json`                              |

## 9. 版本与 tag 流程

1. 在 `main` 上更新 `CHANGELOG.md`，bump `package.json` 版本
2. `git tag v0.X.Y`
3. `git push --tags`
4. `release.yml` 自动触发
5. 完成后在 GitHub Release 草稿中检查并发布

## 10. 安全合规 CI

- 每周 `pnpm audit` + `license-checker --excludePrivatePackages > docs/legal/third-party-notices.md`
- 检测到 critical 漏洞自动 open issue
- license-checker 输出变化时自动 PR

## 11. 待办

- [x] 提交 `.github/workflows/ci.yml` 最小质量门禁模板（2026-05-15）
- [ ] 提交 `.github/workflows/release.yml` 模板（含签名步骤占位）
- [ ] 起草 `scripts/sign-macos.sh` / `scripts/sign-windows.ps1`
- [ ] 评估 Turborepo remote cache 是否启用

## 变更历史

| 日期       | 变更 |
| ---------- | ---- |
| 2026-05-14 | 初版 |
