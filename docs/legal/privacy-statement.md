# 隐私声明 / Privacy Statement

> 状态：🟡 Draft  
> 最后更新：2026-05-14  
> 注意：本声明不构成正式法律建议。商业发布前请咨询律师。

---

## 1. 我们的承诺

Cairn 是 **本地优先 + 自托管** 的多 Agent 协作工作台。我们承诺：

- **业务内容（task、message、artifact）默认只存储在你的本机**
- **凭据（API key / token）由系统级安全存储管理**，不上报
- **遥测默认最小化**，可一键关闭
- **数据归你所有**，可以完整导出与迁移

## 2. 我们收集的信息

### 2.1 本机存储的信息（不离开本机）

- 你创建的 Workspace、Conversation、Message
- 你发起的 OrchestrationRun、Task、AgentRun
- 执行产生的 Artifact、TraceEvent
- 你的配置（除 secret 外）

存储位置：

- **Windows**：`%APPDATA%\Cairn\`
- **macOS**：`~/Library/Application Support/Cairn/`

### 2.2 系统级安全存储的信息（不上报）

- Provider API key（OpenAI / Anthropic / 其他）
- 远程 server 鉴权 token
- 其他敏感凭据

存储位置：

- Windows：DPAPI
- macOS：Keychain
- 通过 Electron `safeStorage` 接入

### 2.3 我们可能上报的信息（**默认开启，可关闭**）

| 类别         | 内容                                                 | 用途       |
| ------------ | ---------------------------------------------------- | ---------- |
| 启动事件     | OS 版本 / 架构 / 应用版本 / **匿名设备 id**          | 兼容性统计 |
| 崩溃报告     | 堆栈 / 进程类型 / 脱敏后的上下文摘要                 | 修 bug     |
| 性能指标     | 启动耗时 / DB 大小桶位 / artifact 数量桶位           | 优化       |
| 功能使用计数 | "新建 run"、"retry"、"取消" 等动作计数（**无内容**） | 排优先级   |

### 2.4 我们**永远不**收集的信息

- ❌ Task brief / Message 内容 / Artifact 内容
- ❌ 文件路径中的真实文件名（脱敏到 `<userData>` 类占位）
- ❌ API key / token / 任何凭据
- ❌ 用户名、邮箱、IP 地址
- ❌ 你输入的任何文本

## 3. 如何关闭遥测

打开设置 → 隐私 → 关闭「发送匿名使用数据」。

关闭后：

- 不再上报上面 2.3 中的任何内容
- 仅保留崩溃报告（且崩溃报告可单独关闭）

## 4. 数据保留

- 你本机的数据：你自己控制
- 上报到我们服务的数据：**保留 90 天**
- 聚合统计数据：可长期保留（已无法关联到设备）

## 5. 你的权利

- **访问**：在设置中查看本机数据存储位置与上报记录
- **导出**：通过"导出 Workspace"功能完整导出所有本机数据
- **删除**：在设置中"完全卸载（含数据）"
- **遗忘**：联系我们删除你的匿名设备 id 关联的上报数据

## 6. 远程模式特殊说明

如果你使用 Cairn 的 **Remote Workspace 模式**（连接到自建 Linux server）：

- 数据存储在你自己的 server 上
- 我们对你的数据没有访问权
- 遥测仍可在桌面端开关
- 远程 server 的隐私策略由你自己制定

如果未来我们提供官方托管服务，会单独提供托管服务的隐私政策。

## 7. 第三方服务

Cairn 会调用你**主动配置**的第三方 AI provider（如 OpenAI、Anthropic）。这些调用：

- 直接从你的机器或自建 server 发出（不经过我们）
- 受第三方 provider 的隐私政策约束
- 我们不接触你发送给第三方的内容

## 8. 联系我们

- 安全漏洞：见 [`../../SECURITY.md`](../../SECURITY.md)
- 隐私问题：通过 GitHub Discussions 或邮件（待定）
- 数据删除申请：通过邮件（待定）

## 9. 变更

本声明的重大变更会：

- 提前 30 天通过应用内通知告知
- 在 [`CHANGELOG.md`](../../CHANGELOG.md) 记录

## 10. 待办

- [ ] 与 [`../design/telemetry-and-privacy.md`](../design/telemetry-and-privacy.md) 同步技术细节
- [ ] 起草英文版（如计划国际化）
- [ ] 商业发布前请律师 review

## 变更历史

| 日期       | 变更 |
| ---------- | ---- |
| 2026-05-14 | 初版 |
