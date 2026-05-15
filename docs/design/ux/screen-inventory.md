# 屏幕清单 / Screen Inventory

> 状态：🟡 Draft
> 最后更新：2026-05-15
> 范围：Release 1 Personal Desktop Edition；标注 Web Shell 复用差异。

---

## 1. 屏幕分组

| 分组       | 屏幕                   | 优先级 | Release |
| ---------- | ---------------------- | ------ | ------- |
| Onboarding | First Launch Wizard    | P0     | R1      |
| Core Work  | Home / Inbox           | P0     | R1      |
| Core Work  | Run List               | P0     | R1      |
| Core Work  | Run Detail             | P0     | R1      |
| Core Work  | Artifact Detail        | P0     | R1      |
| Core Work  | Runtime Status         | P0     | R1      |
| Observe    | Activity Timeline      | P1     | R1      |
| Observe    | Task Explorer          | P1     | R1      |
| Observe    | Replay View            | P1     | R1      |
| Settings   | Workspace Settings     | P0     | R1      |
| Settings   | Runtime Settings       | P0     | R1      |
| Settings   | Security & Permissions | P1     | R1      |
| Settings   | Updates                | P1     | R1      |
| Settings   | Privacy & Data         | P1     | R1      |

## 2. P0 屏幕详述

### 2.1 First Launch Wizard

**用户问题**：我怎么让 Cairn 在本机跑起来？

**主要内容**：

- 产品一句话说明
- workspace 数据目录选择
- embedded workspace core 检测
- runtime 检测：Codex CLI path / auth / version
- 创建示例 run / 跳过进入空 workspace

**主要操作**：

- Choose folder
- Run diagnostics
- Configure runtime
- Start first run

**空/错状态**：

- 无写入权限
- Codex CLI 未安装
- core 启动失败
- 数据库初始化失败

**桌面特有**：文件夹选择器、系统权限提示、本地日志路径。

### 2.2 Home / Inbox

**用户问题**：我接下来可以让 agent 做什么？有什么需要我处理？

**主要内容**：

- 新建 run 输入框
- 最近 run
- 需要 operator 处理的事项
- 本地 runtime 健康摘要
- 最近 artifact

**主要操作**：

- New run
- Resume run
- Review intervention request
- Open runtime status

**设计原则**：输入入口要足够明显，但不能把产品退化成聊天框。输入框下方要露出 run-driven 的结构：模板、上下文、目标、验收条件。

### 2.3 Run List

**用户问题**：所有任务现在是什么状态？哪个需要我看？

**主要内容**：

- run cards / table
- 状态过滤：running / blocked / failed / completed / cancelled
- runtime / workspace / date filter
- 每个 run 的摘要、进度、失败层级、artifact 数量

**主要操作**：

- Open run
- Retry failed
- Rerun
- Archive
- Export summary

### 2.4 Run Detail

**用户问题**：这个 run 正在做什么，为什么卡住，我能怎么接管？

**主要内容**：

- Run Header
- Task Tree
- Active Work Surface
- Inspector: trace / artifacts / metadata
- Intervention Composer

**主要操作**：

- Pause / Resume
- Cancel
- Retry failed task / agent run
- Rerun from run
- Add operator note
- Add instruction to selected task
- Open artifact

**关键状态**：

- Planning
- Running
- Waiting for protected action
- Failed with retry available
- Cancelled
- Completed with artifacts

### 2.5 Artifact Detail

**用户问题**：agent 产出了什么？我能信任、复制、打开或导出吗？

**主要内容**：

- artifact title / kind / source run / source task
- preview：text / patch / log / file reference
- provenance：由哪个 agent run 生成、何时生成、输入摘要
- related trace events

**主要操作**：

- Copy
- Open in external editor
- Reveal in Finder / Explorer
- Download / export
- Mark accepted / rejected（可 R1 暂不实现，只保留设计位）

### 2.6 Runtime Status

**用户问题**：本地 agent runtime 能不能正常工作？

**主要内容**：

- Workspace Core 状态：starting / healthy / degraded / stopped / unhealthy
- Codex CLI runtime 状态：not found / auth required / ready / degraded
- 队列深度、当前 active AgentRun、最近失败
- 本地日志入口：desktop.log、core.log、runtime adapter log
- 本地路径：DB、artifact store、diagnostic bundle 输出位置

**主要操作**：

- Run health check
- Restart embedded core（危险但可恢复，需确认）
- Open logs / Export diagnostic bundle
- Configure runtime
- Copy redacted status

**桌面特有状态**：

| 状态                  | 用户看到                        | 主操作                      |
| --------------------- | ------------------------------- | --------------------------- |
| Core starting         | 正在启动本地 core，显示启动阶段 | 等待 / Open logs            |
| Core unhealthy        | 最近错误 + 日志入口             | Restart core / diagnostics  |
| Runtime not found     | Codex CLI 未找到                | Browse path / setup guide   |
| Runtime auth required | Codex 需要登录                  | Open terminal guide         |
| Queue stuck           | 队列有任务但无推进              | Open Activity / diagnostics |

## 3. P1 屏幕简述

### 3.1 Activity Timeline

全局 trace 视图。用于排查系统级问题，而不是替代 Run Detail 的 trace。默认按时间倒序，支持对象过滤。

### 3.2 Task Explorer

跨 run 的 task 查询。适合用户回看“上次那个失败的迁移任务”。R1 可先做只读列表。

### 3.3 Replay View

按时间轴重播 run 的关键事件。R1 先做事件时间线 + artifact 快照；未来再做视觉化回放。

### 3.4 Settings

设置分组：Workspace、Runtime、Security、Updates、Privacy。设置页面必须明确哪些能力是本地桌面能力，哪些是未来远程工作区能力。

## 4. 关键空状态

| 场景           | 空状态文案方向                           | 主操作              |
| -------------- | ---------------------------------------- | ------------------- |
| 没有 run       | “创建第一个工程协作 run”                 | New run             |
| 没有 artifact  | “产物会在 run 执行后沉淀在这里”          | Open runs           |
| runtime 未配置 | “先连接一个 runtime，Cairn 才能执行任务” | Configure runtime   |
| core 不健康    | “本地 workspace core 没有正常响应”       | Run diagnostics     |
| trace 为空     | “这个对象还没有记录到事件”               | Refresh / open logs |

## 5. P0 验收检查清单

| 屏幕            | R1 设计验收点                                               |
| --------------- | ----------------------------------------------------------- |
| First Launch    | 用户能看懂本地目录、core、runtime 三件事分别是什么          |
| Home / Inbox    | 新建 run、待接管事项、runtime 健康三者同屏可见              |
| Run List        | blocked / failed run 在列表中比 completed 更突出            |
| Run Detail      | 不看 Activity 全局页也能完成观察、接管、重试、查看 artifact |
| Artifact Detail | 每个 artifact 都能追溯到 run / task / agent run / trace     |
| Runtime Status  | 用户能复制脱敏状态给维护者，不泄露 token / 完整敏感路径     |

## 6. 桌面/Web 差异清单

| 屏幕            | 桌面端                         | Web 端                             |
| --------------- | ------------------------------ | ---------------------------------- |
| First Launch    | 本地目录 + embedded core       | R2 不需要，改为连接远程 workspace  |
| Runtime Status  | 可重启本地 core                | 只能查看远程 core 状态，重启需权限 |
| Artifact Detail | 可 reveal in Finder / Explorer | 只可下载/预览                      |
| Updates         | 桌面安装包更新                 | Server / Web deploy 文档入口       |
| Security        | OS keychain + loopback token   | remote auth token / OIDC           |

## 7. 变更历史

| 日期       | 变更 |
| ---------- | ---- |
| 2026-05-15 | 初版 |
