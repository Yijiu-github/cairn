# 故障排查 / Troubleshooting

> 状态：🟡 Draft —— 随版本不断补充  
> 最后更新：2026-05-14

---

## 0. 求助前请先收集

报 bug 时附上以下信息能让排查快 10 倍：

1. **Cairn 版本**：设置 → 关于
2. **操作系统**：Windows 11 / macOS 14 Sonoma (Apple Silicon) 等
3. **部署模式**：Local Desktop / Remote Workspace
4. **复现步骤**（最小化）
5. **日志片段**（位置见下）
6. **截图 / 录屏**（如适用）

### 日志位置

- **Windows**：`%APPDATA%\Cairn\logs\`
- **macOS**：`~/Library/Application Support/Cairn/logs/`

主要日志文件：

- `desktop.log`：Electron Main / Renderer
- `sidecar.log`：Workspace Core
- `runtime.log`：Runtime Adapter

---

## 1. 启动与安装

### 1.1 Windows：SmartScreen 警告

**现象**：双击安装包出现「Windows 已保护你的电脑」。

**原因**：我们的证书 SmartScreen 信誉尚未积累足够下载量。这是正常现象。

**解决**：

1. 确认下载来源是官网 / GitHub Releases
2. 点击「更多信息」→「仍要运行」

### 1.2 macOS：「文件已损坏，无法打开」

**现象**：双击 `.app` 提示文件损坏。

**原因**：通常是下载来源问题或公证票据未生效。

**解决**：

1. 确认从官网 / GitHub Releases 下载
2. 重新下载（可能是网络问题导致文件损坏）
3. 如确认下载完整，临时清除隔离属性：
   ```bash
   xattr -cr /Applications/Cairn.app
   ```

### 1.3 macOS：「无法验证开发者」

**现象**：弹窗提示无法验证。

**解决**：系统设置 → 隐私与安全性 → 滚动到底部「仍要打开」。

### 1.4 启动后白屏

**可能原因**：

- 防火墙阻止 loopback
- 显卡驱动问题
- WebGL / 硬件加速被禁

**排查**：

1. 查看 `desktop.log` 最后 100 行
2. 临时禁用硬件加速：启动时附加 `--disable-gpu`
3. 检查防火墙是否允许 Cairn 访问 `127.0.0.1`

---

## 2. Sidecar 相关

### 2.1 「Workspace Core 启动失败」

**现象**：UI 提示无法连接 Workspace Core。

**排查顺序**：

1. 查看 `sidecar.log`，找最后的错误
2. 端口冲突：默认端口被占用
   - macOS：`lsof -i :<port>`
   - Windows：`netstat -ano | findstr :<port>`
3. 数据库损坏：尝试启动时指定 `--reset-db-flag`（不会删数据，会重建索引）
4. 资源不足：内存 < 4 GB 时可能 OOM

### 2.2 「Sidecar 不断重启」

**可能原因**：

- 业务代码 panic 导致进程退出
- LangGraph checkpoint 损坏
- Drizzle migration 卡住

**排查**：

1. 查看 `sidecar.log` 退出码
2. 临时备份数据库后重置：移走 `<userData>/Cairn/workspaces/<id>/workspace.sqlite`
3. 重启应用

---

## 3. Provider / Runtime 相关

### 3.1 「API key 无效」

**排查**：

1. 设置 → Providers → 删除并重新添加
2. 确认 key 没有多余空格 / 换行
3. 确认 key 仍在 provider 后台有效
4. 检查是否触及 provider 的 rate limit

### 3.2 「请求超时」

**可能原因**：

- 网络代理 / VPN
- Provider 服务降级
- 你的本机时间不准（影响 TLS）

**排查**：

1. 命令行测试：`curl https://api.openai.com`（或对应 provider）
2. 设置 → 网络 → 配置代理
3. 同步本机时间

### 3.3 「Codex runtime 启动失败」

详细形态见 [ADR-0017](../adr/0017-codex-cli-runtime-adapter.md)。常见原因：

| 现象 | 解决 |
|---|---|
| 提示「未检测到 codex」 | 安装 OpenAI Codex CLI；确认其在 PATH 中 |
| 提示 `AUTH_INVALID` | 在 Cairn 设置中重新填入凭据；或在 codex CLI 中重新登录 |
| 提示 `RATE_LIMITED` | 等待几分钟；或在 OpenAI 控制台检查计费状态 |
| 子进程立刻退出 | 检查 `<userData>/Cairn/logs/runtime.log`；常见是 PATH / 环境变量缺失 |
| Windows 下 PTY 输出乱码 | 确认 ConPTY 已启用；尝试更新 Windows 终端组件 |

### 3.4 「自定义 OpenAI 兼容 endpoint」相关（R2 起）

> 注意：Cairn 支持你填任意符合 OpenAI 协议的 endpoint，但**不对第三方反代服务的稳定性、隐私、合规做任何保证**。
> 详细责任边界见 [`../legal/data-locality.md` §4.1](../legal/data-locality.md)。

| 现象 | 通用排查方向（不针对具体项目） |
|---|---|
| 连不上 base URL | 浏览器 / `curl` 测试该 URL 是否可达；检查代理与防火墙；确认 URL 含 `/v1`（如适用） |
| 401 / 403 | 检查 API key 是否过期；确认 key 与该 endpoint 匹配（不要混用不同服务的 key） |
| 404 on `/chat/completions` | 该 endpoint 可能不完全兼容 OpenAI 协议；确认对方文档 |
| 流式返回中断 | 部分反代不支持 SSE keep-alive；切换到非流式模式（如可配置）或更换 endpoint |
| 模型不存在 | model 名称与该 endpoint 实际支持的不一致；查阅对方支持的模型清单 |
| 频繁超时 / 不稳定 | **正常**——非官方反代服务通常不保证 SLA；考虑使用官方 endpoint 或本地推理（Ollama / LM Studio） |
| 隐私 / 合规担忧 | 切换到本地推理（Ollama / LM Studio / llama.cpp）或官方 API |

**Cairn 不会**：

- 在 troubleshooting 中讨论或推荐任何具体的"订阅转 API"项目
- 帮助配置 sub2api / chat2api / gpt4free / copilot-api 等第三方反代
- 为这类服务提供官方支持渠道

如果你坚持使用此类服务，请到对应项目的社区寻求帮助。

---

## 4. 数据 / 数据库

### 4.1 「Workspace 找不到了」

**排查**：

1. 检查 `<userData>/Cairn/workspaces/` 下是否还有 SQLite 文件
2. 数据库文件是否被云同步工具（iCloud / OneDrive）误处理
3. 应用最近是否升级，是否触发了迁移失败回滚

**强烈建议**：定期手动备份 `workspaces/` 目录。

### 4.2 「升级后启动慢」

**原因**：数据库迁移在跑。

**排查**：

- 查看 `sidecar.log` 是否有 `migration` 关键字
- 大数据库（>1 GB）迁移可能需要 30 秒到几分钟

### 4.3 「Trace 越来越多，磁盘紧张」

**临时解决**：

- 设置 → 存储 → 清理旧 TraceEvent（保留最近 30 天）
- 设置 → 存储 → 清理 artifact（按规则）

**长期方案**：未来版本提供自动清理策略。

---

## 5. UI / 渲染

### 5.1 「主界面卡顿」

- 长任务的 TraceEvent 量大时，UI 可能延迟
- 临时缓解：折叠 Trace 视图，或筛选 `level >= info`

### 5.2 「窗口位置 / 大小记不住」

- 已知问题；状态保存在 `<userData>/Cairn/state.json`，可手动删除该文件重置

---

## 6. 更新

### 6.1 「检查更新失败」

**排查**：

- 网络代理：设置 → 网络 → 代理
- 更新 manifest URL 是否可访问

### 6.2 「升级后启动崩溃」

**回退方案**：

1. 卸载当前版本（**不删数据**）
2. 安装上一稳定版（从 GitHub Releases）
3. 启动 → 数据自动从备份恢复
4. 报 bug：附上 `desktop.log` 与 `sidecar.log`

---

## 7. 卸载 / 数据清理

### 7.1 想完全清理

- Windows：卸载后手动删除 `%APPDATA%\Cairn\`
- macOS：丢入废纸篓后手动删除 `~/Library/Application Support/Cairn/`
- Keychain / DPAPI：手动清理 `Cairn` 条目

### 7.2 不小心删了数据

- 检查 `<userData>/Cairn/backups/` 是否有自动备份
- 检查 OS 的回收站 / Time Machine

---

## 8. 性能调优

### 8.1 减少桌面端内存

- 限制并行 worker 数（设置 → 性能）
- 关闭未使用的 workspace
- 定期清理 Trace

### 8.2 加速 sidecar

- 升级到 Apple Silicon / x64 较快的机器
- 数据库定期 `VACUUM`（应用内提供按钮）

---

## 9. 仍然无法解决？

1. 在 [GitHub Discussions](https://github.com/OWNER/REPO/discussions) 提问
2. 提 Issue（附完整日志，请脱敏 secret）
3. 安全问题：见仓库 `SECURITY.md`

## 变更历史

| 日期 | 变更 |
|---|---|
| 2026-05-14 | 初版（占位，按版本补充） |
