# 安装指南 / Install Guide

> 状态：🟡 Draft —— Release 1 前必须更新为最终版  
> 最后更新：2026-05-14  
> 目标读者：第一次安装 Cairn 的用户

---

## 0. 前置说明

Cairn 当前仍在开发中，**尚未发布稳定版本**。本指南为发布后的目标体验占位。

---

## 1. 系统要求

### Windows

- **Windows 11 x64**（推荐）
- Windows 10 x64（best-effort，不保证）
- ~500 MB 可用磁盘空间（不含 workspace 数据）
- 4 GB RAM 起步，8 GB 推荐

### macOS

- **macOS 14 Sonoma 或更新版本**
- **Apple Silicon（M1 / M2 / M3 / 后续）**
- Intel Mac：**首发不支持**，建议使用 Web Shell 远程模式
- ~500 MB 可用磁盘空间
- 4 GB RAM 起步，8 GB 推荐

---

## 2. 下载

> ⚠️ 占位：Release 1 后填写实际下载链接

- **官网**：[下载页](https://cairn.example/download)（待定）
- **GitHub Releases**：[Releases](https://github.com/OWNER/REPO/releases)（待定）

请校验下载文件的 SHA-256（在 Release 页面提供）。

---

## 3. Windows 安装

### 3.1 安装步骤

1. 下载 `Cairn-Setup-<version>.exe`
2. 双击运行
3. 若出现 SmartScreen 警告，点击「更多信息」→「仍要运行」
   > 我们已对安装程序进行代码签名，但 SmartScreen 信誉积累需要时间，新版本初期可能出现警告。
4. 按向导完成安装
5. 默认安装位置：`%LOCALAPPDATA%\Programs\Cairn\`

### 3.2 首次启动

- 启动时 Windows Defender 可能扫描，需要几秒
- 默认监听 loopback 端口（不开放外部访问）
- 创建用户数据目录：`%APPDATA%\Cairn\`

---

## 4. macOS 安装

### 4.1 安装步骤

1. 下载 `Cairn-<version>-arm64.dmg`
2. 双击挂载 `.dmg`
3. 把 `Cairn.app` 拖入「应用程序」
4. 启动时若提示「打开来自互联网的应用」，点击「打开」
   > 我们已对应用进行 Apple 公证，首次启动需要联网验证。

### 4.2 首次启动

- 系统弹窗请求授予以下权限（按需）：
  - 网络访问（必需，用于调用第三方 provider）
  - 通知（推荐，用于任务完成提醒）
- 创建用户数据目录：`~/Library/Application Support/Cairn/`

### 4.3 如果遇到「文件已损坏」

理论上不会出现（我们已签名 + 公证）。万一出现：

```bash
xattr -cr /Applications/Cairn.app
```

但请先**确认下载来源合法**（从官网 / GitHub Releases）。

---

## 5. 首次配置

### 5.1 创建第一个 Workspace

启动后会自动创建一个默认 Personal Workspace：

- 类型：`personal`
- 部署模式：`local_desktop`
- 数据位置：`<userData>/Cairn/workspaces/<id>/`

### 5.2 配置 Provider

进入设置 → Providers，添加你的 AI provider：

| Provider           | 需要的内容                              |
| ------------------ | --------------------------------------- |
| Codex（待澄清）    | 待定                                    |
| OpenAI（R2 起）    | API key                                 |
| Anthropic（R2 起） | API key                                 |
| Ollama（R2 起）    | Base URL（如 `http://localhost:11434`） |

API key 通过系统安全存储（Keychain / DPAPI）保存，不会明文落盘。

### 5.3 第一次试运行

在主界面输入一个任务，例如：

> "帮我看看 `package.json` 里都有哪些 dev 依赖"

点击发送，看 OrchestrationRun 跑起来。

---

## 6. 卸载

### Windows

- 控制面板 → 程序与功能 → Cairn → 卸载
- **默认不删除** `%APPDATA%\Cairn\`（用户数据）
- 想完全清理：手动删除该目录

### macOS

- 把 `Cairn.app` 拖到废纸篓
- **默认不删除** `~/Library/Application Support/Cairn/`
- 想完全清理：手动删除该目录

### 清理 Keychain / DPAPI

卸载不会自动清理系统安全存储中的 secret 条目（避免误删）。

- macOS：打开「钥匙串访问」，搜索「Cairn」，删除相关条目
- Windows：打开「凭据管理器」，找到「Cairn」相关条目并删除

---

## 7. 更新

### Release 1（手动）

- 应用内：设置 → 关于 → 检查更新
- 发现新版本：显示 changelog → 引导下载安装

### Release 2（受控自动）

- 后台静默下载，用户在合适时机点击「重启升级」

---

## 8. 数据备份

虽然 Cairn 会在升级时自动备份当前 schema 版本的数据库，**强烈建议**你定期手动备份：

- Windows：复制 `%APPDATA%\Cairn\workspaces\` 整个目录
- macOS：复制 `~/Library/Application Support/Cairn/workspaces/` 整个目录

或使用应用内"导出 Workspace"功能（R1 计划提供）。

---

## 9. 常见问题

> 详细排错见 [`troubleshooting.md`](troubleshooting.md)。

| 问题                          | 解决                                                   |
| ----------------------------- | ------------------------------------------------------ |
| SmartScreen / Gatekeeper 警告 | 见 §3.1 / §4.2                                         |
| 启动后白屏                    | 检查防火墙是否阻止 loopback；查看日志                  |
| sidecar 启动失败              | 检查端口冲突；查看 `<userData>/Cairn/logs/sidecar.log` |
| API key 不生效                | 检查是否在系统 Keychain 中正确保存                     |

---

## 10. 反馈

- Bug：GitHub Issues（使用 bug 模板）
- 安全问题：见仓库根目录 `SECURITY.md`
- 隐私问题：见 [`../legal/privacy-statement.md`](../legal/privacy-statement.md)

## 变更历史

| 日期       | 变更                           |
| ---------- | ------------------------------ |
| 2026-05-14 | 初版（占位，Release 1 前更新） |
