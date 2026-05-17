# 数据本地化承诺 / Data Locality Statement

> 状态：🟡 Draft  
> 最后更新：2026-05-18

---

## 1. 一句话承诺

> **Cairn 默认把你的业务数据保留在你的本机或你自己掌控的服务器上。**

## 2. 数据流向矩阵

| 数据类别                           | Local Workspace 模式        | Remote Workspace 模式         | 上报到我们    |
| ---------------------------------- | --------------------------- | ----------------------------- | ------------- |
| Workspace 配置                     | ✅ 本机                     | ✅ 你的 server                | ❌            |
| Conversation / Message 内容        | ✅ 本机                     | ✅ 你的 server                | ❌            |
| OrchestrationRun / Task / AgentRun | ✅ 本机                     | ✅ 你的 server                | ❌            |
| Artifact 内容                      | ✅ 本机 / S3（你配置）      | ✅ 你的 server / S3           | ❌            |
| TraceEvent                         | ✅ 本机                     | ✅ 你的 server                | ❌            |
| Provider API key / token           | ✅ OS 安全存储              | ✅ 你的 server                | ❌            |
| 匿名启动 / 崩溃 / 使用计数         | ⚠️ 默认上报，可关闭         | ⚠️ 默认上报（桌面端），可关闭 | ⚠️ 是         |
| Provider 调用内容                  | 直达你配置的第三方 provider | 直达你配置的第三方 provider   | ❌ 不经过我们 |

## 3. 默认存储位置

### 本机（Local Workspace 模式）

- **Windows**：`%APPDATA%\Cairn\`
  - `workspaces/<id>/workspace.sqlite`
  - `artifacts/<id>/...`
  - `logs/`
- **macOS**：`~/Library/Application Support/Cairn/`
  - 同上结构

### 远程（Remote Workspace 模式）

- 你的 Linux server 上由你配置的目录
- 数据库可选 PostgreSQL
- Artifact 可选本地磁盘或 S3 兼容存储

## 4. 第三方 Provider 调用

Cairn 调用你**主动配置**的第三方 AI provider（如 OpenAI、Anthropic、自建 Ollama 等）时：

- 调用**直接**从你的机器（或你的 server）发出
- 我们的服务**不在调用路径上**
- 我们不接触你发送给第三方的内容
- 第三方对这些数据的处理受**第三方自己的隐私政策**约束

> 提示：选择第三方 provider 时，请阅读对方的隐私政策。

### 4.1 用户自配 Endpoint 的责任边界（重要）

Cairn 从 R2 起将提供 **Generic OpenAI-Compatible Adapter**，允许你填写**任意符合 OpenAI `chat/completions` 协议**的 base URL 与 API key。这一层的定位是：**作为通用 OpenAI-compatible 接入层，覆盖官方兼容接口、本地推理引擎与用户自配 endpoint；而不是为某个具体第三方转发项目做专属适配。** 这覆盖：

- ✅ OpenAI 兼容的官方或标准化 endpoint
- ✅ 本地推理引擎：Ollama、LM Studio、llama.cpp、vLLM、SGLang
- ✅ 自建网关 / 兼容层：LiteLLM、用户自建兼容网关、自配反代
- ⚠️ 任意第三方反代 / 转发服务（**风险由你自担**）

#### 你需要明白的事

| 维度       | 说明                                                                                                           |
| ---------- | -------------------------------------------------------------------------------------------------------------- |
| **路径**   | 请求从你的本机 / 自控 server 直发到你配置的 base URL，**不经过 Cairn 任何服务**                                |
| **隐私**   | base URL 背后的运营者可能记录你的输入；Cairn 无法、也不打算审计这一点                                          |
| **稳定性** | 第三方反代服务的可用性、限流策略、协议变更，Cairn 不做保证                                                     |
| **合规**   | 部分反代服务可能违反原始供应商（OpenAI / Anthropic / 等）的服务条款，由此产生的账号封禁、法律责任由你承担      |
| **安全**   | API key 通过 OS 安全存储（见 [ADR-0010](../adr/0010-secret-storage.md)）保护；但你仍要为提交给第三方的内容负责 |

#### Cairn 的官方立场

- ✅ **支持**：你填任意合法的 OpenAI 兼容 endpoint
- ❌ **不内置**任何具体的"订阅转 API"项目（sub2api / chat2api / gpt4free / copilot-api 等）
- ❌ **不背书**任何具体的第三方反代服务
- ❌ **不教学**如何搭建或使用此类服务
- ⚠️ **强制告知**：UI 在配置自定义 endpoint 时会显示警告

#### UI 提示文案（示意）

> ⚠️ **你正在配置一个非官方 endpoint。**
> Cairn 将通过这个 URL 调用 AI 服务。
> 请确保你信任这个 endpoint 的运营者，并理解：
>
> - 你的输入可能被该 endpoint 的运营者记录
> - 该 endpoint 可能违反原始 AI 供应商的服务条款
> - 该 endpoint 的稳定性 / 隐私 / 合规由你自行评估
>
> Cairn 对此类 endpoint 不做任何保证。

#### 我们为什么这么处理

- **本地优先承诺要保住**：数据流向必须对用户透明可见，自配 endpoint 是用户的选择，但需要明示告知
- **避免被卷入第三方合规问题**：不集成具体项目能让 Cairn 与具体反代项目的法律风险脱钩
- **保护用户**：清晰告知比"默默允许"更负责

## 5. 数据可迁移性

### 5.1 完整导出

任何时候，你都可以通过"导出 Workspace"功能获得：

- 完整的 SQLite 数据库文件
- 完整的 artifact 文件目录
- 配置文件（含 secret 引用，但不含 secret 内容）

导出格式为标准 SQLite + 文件目录，无锁定 schema。

### 5.2 从本地迁移到远程

我们提供工具（计划在 Release 2）：

- 把本地 SQLite workspace 导入到远程 PostgreSQL
- 把本地 artifact 同步到远程 artifact store
- 完成后可在两端共同存在或单独保留远程

### 5.3 从 Cairn 迁出

我们的数据 schema 在 [`../design/domain-model.md`](../design/domain-model.md) 中公开。

你可以：

- 直接读 SQLite / PG 数据库
- 用我们的导出工具
- 编写脚本批量解析 artifact

## 6. 卸载

### 6.1 默认卸载

不删除你的数据，保留 `<userData>/Cairn/` 整个目录。

### 6.2 完全卸载

通过应用设置"完全卸载（含数据）"，或手动删除 `<userData>/Cairn/`。

### 6.3 系统级 secret

卸载时**不自动清理**系统 keychain / DPAPI 中的 secret 条目。原因：避免误删。

你可以在系统的 Keychain Access（macOS）或 Credential Manager（Windows）中手动清理 "Cairn" 命名空间下的条目。

## 7. 边界情况

### 7.1 崩溃报告

崩溃报告默认包含**脱敏后的堆栈与上下文摘要**，可能间接反映你最近的操作（如某个函数被调用）。

- 不包含 task brief / message 内容
- 不包含文件路径中的用户内容
- 可一键关闭

### 7.2 日志

日志默认写入本机 `logs/`，不上报。

- 不包含 secret（脱敏中间件）
- 不包含完整 prompt 内容（仅元信息）
- 你可以随时查看与清理

### 7.3 第三方 OAuth / 登录

未来如果某些 provider 需要 OAuth（如 GitHub OAuth、Apple OAuth），登录跳转会通过浏览器，token 直接交付到你本机的 secret 存储，**不经过我们的服务**。

## 8. 远期承诺

即便未来 Cairn 商业化、引入官方托管服务：

- **Local Workspace 模式永远免费且数据归用户**
- **数据本地化承诺不会被合并到付费功能里**
- **如果引入官方托管，会单独发布托管服务的隐私政策**

## 9. 待办

- [ ] 与 [`privacy-statement.md`](privacy-statement.md) 与 [`../design/telemetry-and-privacy.md`](../design/telemetry-and-privacy.md) 同步
- [ ] 商业发布前请律师 review
- [ ] 起草英文版（如计划国际化）

## 变更历史

| 日期       | 变更                                           |
| ---------- | ---------------------------------------------- |
| 2026-05-18 | 补充用户自配 endpoint 的责任边界与 UI 告知口径 |
| 2026-05-14 | 初版                                           |
