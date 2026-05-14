# 信息架构 / Information Architecture

> 状态：🟡 Draft
> 最后更新：2026-05-15
> 范围：Release 1 Personal Desktop Edition；兼容 Release 2 Web Shell 远程工作区扩展。

---

## 1. 设计目标

Cairn 的界面不是聊天工具，也不是任务看板。它是一个 **run-driven agent collaboration workspace**，所以信息架构必须让用户始终回答四个问题：

1. 我现在在哪个 workspace？
2. 哪些 run 正在发生、卡在哪里？
3. 某个 run 的 task / agent / artifact / trace 之间是什么关系？
4. 我能在哪里观察、暂停、取消、重试、补充说明或接管？

Release 1 优先服务桌面端本地工作区；Web Shell 的页面层级保持同构，避免双端语义分叉。

## 2. 顶层导航模型

桌面端采用三层结构：

```text
App Chrome
├─ Workspace Switcher / Connection Status / Command Center
├─ Primary Navigation
│  ├─ Inbox
│  ├─ Runs
│  ├─ Tasks
│  ├─ Artifacts
│  ├─ Agents
│  ├─ Activity
│  └─ Settings
└─ Content Region
   ├─ List / Tree Pane
   ├─ Detail Pane
   └─ Inspector / Timeline Pane
```

### 2.1 App Chrome

| 区域               | 责任                                        | 桌面端特性                        | Web 端差异                 |
| ------------------ | ------------------------------------------- | --------------------------------- | -------------------------- |
| Workspace Switcher | 切换本地 workspace；R2 后切换远程 workspace | 显示 embedded core 状态           | 显示远程连接状态           |
| Command Center     | 全局搜索、快捷操作、新建 run                | 支持系统快捷键                    | 浏览器快捷键冲突时降级     |
| Runtime Indicator  | 当前 runtime、队列、权限状态                | 显示本机 sidecar / Codex CLI 状态 | 显示远程 core runtime 状态 |
| Operator Actions   | 暂停全部、查看失败、打开日志                | 可打开本地 artifact 目录          | Web 端只下载或预览         |

### 2.2 Primary Navigation

| 导航      | 主要对象                     | 一句话职责                          |
| --------- | ---------------------------- | ----------------------------------- |
| Inbox     | Conversation / draft request | 新请求入口与人类消息上下文          |
| Runs      | OrchestrationRun             | 所有 run 的列表、过滤、状态总览     |
| Tasks     | Task                         | 横跨 run 的任务树/队列视角          |
| Artifacts | Artifact                     | 产物库、补丁、报告、日志、文件引用  |
| Agents    | Runtime / Agent profile      | runtime 配置、worker 能力、健康状态 |
| Activity  | TraceEvent                   | 全局事件流、失败、接管、系统日志    |
| Settings  | Workspace / App / Security   | 本地路径、模型、权限、更新、隐私    |

## 3. Release 1 路由 / 页面

R1 虽然是桌面应用，但仍按路由组织页面，便于 Web Shell 复用。

| 路由                     | 页面                   | Release | 说明                                                    |
| ------------------------ | ---------------------- | ------- | ------------------------------------------------------- |
| `/`                      | Home / Inbox           | R1      | 默认入口，新建 run、继续草稿、查看近期活动              |
| `/runs`                  | Run List               | R1      | 状态、runtime、耗时、失败原因、收藏/归档                |
| `/runs/:runId`           | Run Detail             | R1      | R1 核心页面：task tree + agent runs + trace + artifacts |
| `/runs/:runId/replay`    | Replay                 | R1      | 按时间轴回放 run；R1 可先做只读                         |
| `/tasks`                 | Task Explorer          | R1      | 跨 run 查看任务；支持状态过滤                           |
| `/tasks/:taskId`         | Task Detail            | R1      | task 输入、依赖、关联 agent run、artifact               |
| `/artifacts`             | Artifact Library       | R1      | 产物列表、类型过滤、打开位置                            |
| `/artifacts/:artifactId` | Artifact Detail        | R1      | 文本/patch/log/文件预览                                 |
| `/agents`                | Agent & Runtime        | R1      | Codex runtime 状态、能力、健康检查                      |
| `/activity`              | Activity Timeline      | R1      | 全局 trace / operator action / system event             |
| `/settings`              | Settings Index         | R1      | 设置首页                                                |
| `/settings/workspace`    | Workspace Settings     | R1      | 数据目录、artifact store、备份导出                      |
| `/settings/runtime`      | Runtime Settings       | R1      | Codex CLI 路径、模型、权限策略                          |
| `/settings/security`     | Security & Permissions | R1      | protected action、secret、loopback token 说明           |
| `/settings/updates`      | Updates                | R1      | 手动检查更新、下载安装引导                              |
| `/settings/privacy`      | Privacy                | R1      | 本地优先、遥测开关、数据导出                            |

## 4. Run Detail 信息结构

Run Detail 是产品的主战场，采用四栏可折叠结构：

```text
┌────────────┬──────────────────────┬────────────────────────────┬──────────────────┐
│ Run List   │ Task Tree            │ Active Work Surface        │ Inspector        │
│ optional   │                      │                            │                  │
│            │ - plan               │ - selected task / agent    │ - trace timeline │
│            │ - tasks              │ - live output              │ - artifacts      │
│            │ - dependencies       │ - intervention composer    │ - metadata       │
└────────────┴──────────────────────┴────────────────────────────┴──────────────────┘
```

### 4.1 顶部 Run Header

必须持续可见：

- Run 标题 / 状态 / 耗时 / runtime
- 进度摘要：`3 running · 1 blocked · 8 done`
- Operator actions：Pause / Resume / Cancel / Retry failed / Rerun / Add note
- 风险提示：需要权限、失败、超时、本地文件改动等

### 4.2 Task Tree

Task tree 是 run 的结构骨架。每个节点至少显示：

- task title
- status
- assigned agent / runtime
- attempt
- blockers / dependencies
- artifact count
- last event time

### 4.3 Active Work Surface

根据选择对象切换：

| 选择对象   | 展示内容                           | 操作                                    |
| ---------- | ---------------------------------- | --------------------------------------- |
| Run        | 总计划、目标、当前摘要             | pause / cancel / rerun / add note       |
| Task       | task 输入、状态、子任务、失败原因  | retry / mark reviewed / add instruction |
| AgentRun   | live log、tool call、stdout/stderr | cancel agent run / retry                |
| Artifact   | 预览、diff、下载/打开位置          | open / copy / export                    |
| TraceEvent | 事件详情、payload 摘要             | copy event id                           |

### 4.4 Inspector

Inspector 永远用于解释“为什么现在是这样”：

- Trace timeline
- 关联 artifact
- 失败层级
- operator notes
- raw metadata（默认折叠）

## 5. 桌面端特有页面/状态

### 5.1 First Launch

首次启动不进入空 dashboard，而进入 4 步向导：

1. 选择 workspace 数据目录
2. 检测 Workspace Core / SQLite / artifact store
3. 检测 Codex CLI runtime
4. 创建第一个示例 run 或导入现有 workspace

### 5.2 Local Core Status

桌面端必须暴露 embedded core 状态，并把“应用壳正常”和“core 正常”区分开：

- running / starting / stopped / degraded / unhealthy
- local endpoint（默认隐藏端口，复制时需确认）
- database path（可显示，导出诊断包时默认脱敏 home 前缀）
- artifact store path
- queue depth / active run / scheduler heartbeat
- recent core logs
- restart core / run diagnostics / export redacted status

Runtime Status 页面不替代 Run Detail；它解释“系统能不能跑”，Run Detail 解释“这个 run 为什么这样”。

### 5.3 Native Integration

桌面端设置增加：

- 启动时自动打开
- 系统通知
- 打开 artifact 所在文件夹
- 更新检查
- 本地日志导出

## 6. Web Shell 差异

R2 Web Shell 不新增协作语义，只改变运行环境：

| 能力           | Desktop R1                     | Web R2                      |
| -------------- | ------------------------------ | --------------------------- |
| 本地文件打开   | 直接打开 Finder / Explorer     | 下载或浏览器预览            |
| Workspace Core | embedded local process         | remote endpoint             |
| Secret storage | OS keychain via desktop bridge | remote core secret store    |
| 更新           | desktop app update             | web deploy / server upgrade |
| 通知           | OS notification                | browser notification        |

## 7. 文档一致性检查

| 设计对象 | 信息架构位置 | 屏幕清单 | 关键流程 | 线框稿 |
| -------- | ------------ | -------- | -------- | ------ |
| First Launch | §5.1 | §2.1 | §1 | `desktop-first-launch.svg` |
| Home / Inbox | `/` | §2.2 | §2 | `desktop-home.svg` |
| Run Detail | `/runs/:runId` | §2.4 | §3–§5 | `desktop-run-detail.svg` |
| Runtime Status | `/agents` | §2.6 | §1 / diagnostics | `desktop-runtime-status.svg` |
| Artifact Detail | `/artifacts/:artifactId` | §2.5 | §6 | 文字线框待高保真补充 |
| Replay | `/runs/:runId/replay` | §3.3 | §7 | 文字线框待高保真补充 |

## 8. 导航优先级

Release 1 的实现顺序建议：

1. First Launch
2. Home / Inbox
3. Run List
4. Run Detail
5. Artifact Detail
6. Settings / Runtime
7. Activity Timeline
8. Task Explorer
9. Updates / Privacy

## 9. 变更历史

| 日期       | 变更 |
| ---------- | ---- |
| 2026-05-15 | 初版 |
