# 多 Agent 协作工作台统一设计文档 v0.4

> 状态：内部主稿 / 正式产品重设计版  
> 日期：2026-05-13  
> 用途：作为当前唯一设计主稿，统一产品定位、双端形态、系统边界、核心对象、运行架构、技术选型、发布路线与关键 ADR。  
> 替代：`unified-design-v0.3.md` 中所有以 **Web-only / Desktop 后置 / MVP 收缩优先** 为前提的约束。  
> 主要输入来源：`product-positioning-and-boundaries-v0.1-20260513.md`、`multi-agent-v0.2-scope-plan-20260513.md`、`unified-design-v0.3.md`。  
> 额外技术依据：LangGraph JavaScript 官方文档；Electron 官方 code signing 文档；Tauri 官方 updater / distribute 文档。

---

## 1. 这份文档现在要解决什么问题

之前几版文档的主问题不是方向完全错，而是**默认前提已经过期**：

- 把产品当成“先做 Web 工作台，桌面端以后再说”
- 把 Desktop 视为展示层外壳，而不是技术选型硬约束
- 把“先收成 MVP”放在第一优先级，导致很多长期必须提前钉住的东西被推迟
- 在后端语言、数据落地、运行方式、分发更新、权限模型上，仍按 B/S 产品思维在写

现在这些前提都不成立了。

你已经明确：

> **这是一个长期认真做的正式产品，而且近期就要上 Windows 桌面版和 mac mini 桌面版。**

所以这份 v0.4 只做一件事：

> **把项目从“Web 优先的多 Agent 工作台设想”升级为“共享核心 + 双外壳 + 可本地运行 + 可远程扩展”的正式产品设计主稿。**

---

## 2. 一句话定义

我们现在要做的，不是“又一个通用 multi-agent 平台”，也不是“只有 Web 控制台的 agent orchestration demo”，而是：

> **一个面向个人开发者与小技术团队的、自托管且本地优先的 Agent 协作工作台：以桌面端和 Web 端双外壳承载同一套协作核心，由主 Agent 统筹、worker 角色分工、人类可接管，支持复杂工程任务的拆分、执行、回传、回放与长期沉淀。**

这句话里有 5 个不能再退回去的关键词：

- **自托管**
- **本地优先**
- **双外壳**
- **协作核心**
- **人类可接管**

---

## 3. 产品定义与边界

### 3.1 当前版本的真实身份

当前阶段，这个项目更准确的身份是：

- 一个 **agent collaboration workspace**
- 一个 **local-first + self-hosted mission control system**
- 一个 **桌面端与 Web 端共享同一运行语义的多 Agent 协作工作台**
- 一个 **以 task / run / artifact / trace / operator intervention 为核心的产品系统**

它不是：

- 通用企业 AI 治理平台
- 面向所有模型、所有入口、所有组织的“大宽平台”
- 单一聊天 bot
- 单一 IDE 内补全型 copilot
- 只会 delegation demo 的浅层 agent 样机

### 3.2 本轮明确废止的旧假设

以下假设在 v0.4 中正式废止：

1. **“Web（B/S）是唯一前端壳”**  
   改为：**Desktop 与 Web 是一等外壳，必须共享核心契约。**

2. **“Desktop 放到 Phase 3 再说”**  
   改为：**Windows / macOS 桌面版是近期主线约束，不是演示增强项。**

3. **“先按 MVP 收缩，再考虑长期结构”**  
   改为：**按正式产品设计，但交付上分 Release 演进。**

4. **“后端默认可以按 Python/FastAPI + Web-only 心智来定”**  
   改为：**技术栈必须优先服从桌面本地运行、子进程、文件系统、PTY、更新分发与双端复用。**

### 3.3 当前明确不做什么

虽然不再按“MVP 缩到最小”的方式思考，但仍要保留边界感。当前不做：

- 企业级多租户审批治理平台
- 开放外部 worker marketplace
- 一开始就支持所有模型、所有 provider、所有入口
- 一开始就支持复杂流程编排器 / 拖拽 workflow builder
- 一开始就把会商、投票、仲裁、审批流全部做厚
- 一开始就把桌面端做成全权限无边界本地自动化工具

**产品可以认真做，但边界不能失控。**

---

## 4. 这个产品现在必须坚持的五个承诺

### 4.1 Desktop 不是包装层，而是产品本体之一

Windows 与 macOS（Apple Silicon，含 mac mini）桌面版不是“以后加一个壳”，而是会直接决定：

- 主后端语言生态
- 进程模型
- 本地数据落地方式
- runtime 封装方式
- 更新分发体系
- 权限隔离策略

### 4.2 Web 与 Desktop 必须共享同一套协作语义

两个外壳不能成为两条产品线。

共享的必须包括：

- task tree
- orchestration run
- agent run
- artifact
- trace
- human-in-the-loop 动作语义
- retry / rerun / cancel / pause 等操作语义

### 4.3 本地优先，但不等于只做离线单机

“本地优先”表示：

- 单用户场景下，产品应能在桌面本机完成安装、运行、存储与恢复
- 数据默认优先落本地或用户自控存储
- 不以外部 SaaS 作为核心运行前提

但这不等于：

- 永远不支持远程 server
- 永远不支持团队共享工作区
- 永远不支持 Web 远程控制

### 4.4 产品核心是 run-driven 协作，不是聊天皮肤

这个系统的核心价值仍然是：

- 复杂任务可拆分
- 执行过程可见
- 失败层级可归因
- 中途可以接管
- 结果可以回放与沉淀

所以它的核心对象，仍然不是“消息列表”，而是：

- Workspace
- Conversation
- OrchestrationRun
- Task
- AgentRun
- Artifact
- Trace

### 4.5 人类必须有明确而有限的接管能力

不是全自动放飞，也不是重做一个企业审批平台。

产品必须明确支持：

- 观察
- 暂停
- 取消
- 重试
- 重开一轮
- 注入补充说明
- 在受保护步骤上做确认/放行

---

## 5. 目标用户与使用场景

### 5.1 第一批核心用户

最值得服务的用户仍然是：

> **经常和 AI 协作做工程工作的个人开发者，以及 2~10 人的小技术团队。**

但 v0.4 要进一步区分他们的运行环境：

1. **重度 AI 编程的个人开发者**  
   希望在自己的 Windows / macOS 桌面机上直接运行，少依赖外部平台。

2. **拥有固定工作站 + 远程节点的小团队技术负责人**  
   希望桌面端作为主控制面，同时可接入家里服务器或团队自建 server。

3. **本地优先 / 自托管偏执用户**  
   在意数据位置、模型接入自由、长期可迁移性与不被某个 SaaS 绑死。

### 5.2 优先支持的任务类型

第一批高价值任务仍应聚焦：

- 中等复杂代码改动
- 需要并行收集上下文的工程任务
- 改 + 验 + 总结这类带 review 性质的任务
- 需要跨多个 artifact 回看和继续执行的长任务

### 5.3 当前不作为主验证样本的任务

- 普通闲聊
- 轻量一次性问答
- 大企业审批流
- 高度标准化的客服流程
- 为了展示而展示的多 agent 辩论秀

---

## 6. 产品形态：共享核心 + 双外壳 + 双运行模式

## 6.1 统一原则

v0.4 的总形态不是“Web 产品加桌面版”，而是：

> **一个共享协作核心，挂两类一等外壳（Desktop / Web），支持两类一等运行模式（本地工作区 / 远程工作区）。**

### 6.2 两类外壳

#### A. Desktop Shell

职责：

- 作为个人用户的主入口
- 承载本地工作区运行
- 提供本地文件、终端、系统通知、自动启动、更新安装等能力
- 在需要时连接远程工作区

#### B. Web Shell

职责：

- 作为远程工作区的浏览器控制台
- 提供跨设备查看、追踪、接管与团队共享观察面
- 在没有桌面端的场景下，仍可作为管理入口

### 6.3 两类运行模式

#### A. Local Workspace Mode

适合个人开发者。

特征：

- 桌面端安装后即可启动本地工作区
- 本地嵌入 workspace core
- 数据库默认 SQLite
- artifact 默认写入本地目录
- 无需先部署远程 server

#### B. Remote Workspace Mode

适合团队或长运行场景。

特征：

- workspace core 部署在用户自控服务器上
- Web 端直接接入远程 server
- 桌面端也可作为远程控制台
- 数据库优先 PostgreSQL
- artifact 可落本地磁盘或 S3 兼容存储

### 6.4 为什么不是三套产品

必须坚持：

- 本地桌面版不是独立产品
- 远程 Web 版不是独立产品
- 未来团队版也不是另起炉灶

三者的差异应主要体现在：

- 部署方式
- 存储后端
- 权限与协作能力
- 桌面专属系统能力

而不是协作核心语义分叉。

---

## 7. 平台策略

### 7.1 支持矩阵

当前建议的首发支持矩阵：

- **Windows**：Windows 11 x64 优先
- **macOS**：Apple Silicon 优先（含 mac mini）
- **Web**：现代 Chromium / Safari / Firefox 浏览器
- **Linux server**：作为远程工作区部署目标

### 7.2 为什么不继续坚持 Web-only

如果继续按 Web-only 设计，后面会在以下地方重构：

- 本地 runtime 生命周期
- 子进程 / PTY 管理
- 文件系统接入
- 更新分发
- 桌面权限模型
- 本地数据库与缓存策略
- 本地异常恢复

这会导致：

- 第一版越做越像临时脚手架
- 桌面端迟早成为“补洞式移植”
- 后端语言与框架选型被早期假设锁死

所以 v0.4 的原则不是“先 Web 再桌面”，而是：

> **先按双端产品设计，再决定每个 Release 先交付哪一端的哪一部分。**

### 7.3 双端共享规则

以下内容必须尽量共享：

- 领域模型
- API 契约
- 状态机定义
- 运行详情结构
- 前端页面语义
- UI 组件层的业务逻辑

以下内容允许分开：

- 桌面端系统能力桥接
- 自动更新与安装器逻辑
- 本地文件与系统菜单
- 浏览器登录与远程鉴权流程

---

## 8. 总体架构

### 8.1 推荐架构形态

当前推荐仍然是：**模块化单体（Modular Monolith）**。

不是因为要做小，而是因为现在最复杂的仍然是：

- 编排状态推进
- run / task / artifact / trace 的关系
- 桌面与 Web 共享同一套核心
- 本地运行与远程部署共用一套服务核

过早拆微服务，只会把复杂度搬到：

- RPC
- 队列
- 心跳
- 租约
- 网络故障
- 远程调试

### 8.2 逻辑分层

1. **Client Layer**
   - Desktop Shell
   - Web Shell

2. **Workspace Core Layer**
   - conversation service
   - orchestration service
   - task service
   - agent run service
   - intervention service
   - synthesis / response service

3. **Domain Layer**
   - Workspace
   - Event
   - Conversation
   - Message
   - OrchestrationRun
   - Task
   - AgentRun
   - Artifact
   - TraceEvent

4. **Runtime Gateway Layer**
   - provider adapters
   - run lifecycle
   - cancellation / retry bridge
   - runtime capability profile

5. **Infrastructure Layer**
   - DB / persistence
   - artifact store
   - local file snapshotting
   - logging / tracing / metrics
   - auth / secrets / config

### 8.3 进程拓扑

#### Desktop 本地模式

```text
Electron Desktop Shell
  ├─ Main Process
  │   ├─ updater
  │   ├─ window / tray / notification
  │   ├─ native capability bridge
  │   └─ launches embedded workspace-core
  ├─ Renderer (React UI)
  │   └─ talks to local workspace-core via HTTP/WebSocket
  └─ Embedded Workspace Core (Node service)
      ├─ orchestration
      ├─ runtime gateway
      ├─ SQLite
      └─ local artifact store
```

#### 远程工作区模式

```text
Desktop Shell or Web Shell
  └─ Remote Workspace Core
      ├─ orchestration
      ├─ runtime gateway
      ├─ PostgreSQL
      ├─ artifact store (disk / S3)
      └─ observability stack
```

### 8.4 为什么桌面端不直接把所有后端逻辑塞进 Electron Main

因为那样会把以下责任绑死在一起：

- 窗口与 OS 生命周期
- 编排执行生命周期
- 本地 runtime / PTY / 子进程管理
- API 对外契约
- 崩溃恢复

v0.4 明确建议：

> **桌面端负责壳与系统能力，workspace core 作为独立嵌入式服务进程存在。**

这样可以得到：

- 更清晰的崩溃边界
- 更一致的本地 / 远程运行方式
- 更容易复用同一后端核心到 Linux server
- 更容易做本地重启恢复和日志归因

---

## 9. 技术选型

## 9.1 主语言：TypeScript / Node.js

### 结论

v0.4 建议把 **TypeScript / Node.js** 作为主产品语言与默认工程语言。

### 主要原因

1. **桌面端约束更友好**  
   文件系统、子进程、PTY、WebSocket、打包整合、桌面壳集成更顺。

2. **双端共享成本更低**  
   Web、Desktop、server、shared contracts 能放在同一 monorepo 语言生态中。

3. **LangGraph 有 JavaScript 官方文档与能力说明**  
   不需要为了长运行 agent 编排被迫押 Python。

4. **本地嵌入式 workspace core 更自然**  
   Electron + Node sidecar 的组合比 Python sidecar 的开发闭环更顺。

### 放弃了什么

- 放弃了 Python 在 AI 框架整合上的一部分现成生态优势
- 放弃了 FastAPI 这类熟悉路径可能带来的启动速度

### 换来的东西

- 更统一的产品工程栈
- 更低的双端分裂风险
- 更自然的桌面本地能力集成

## 9.2 Desktop Shell：Electron

### 结论

当前默认选 **Electron** 作为桌面壳。

### 原因

- 对本地文件、命令、终端、进程、长运行任务的支持路径成熟
- 与 Node sidecar / 本地 service 的整合更直接
- 官方文档明确覆盖 Windows/macOS code signing；macOS 需要 notarization
- 对 serious desktop product 来说，调试、打包、系统集成与现成经验都更稳

### Tauri 的地位

Tauri 不是被否定，而是作为**备选方案**保留。

Tauri 官方文档同样提供：

- updater
- distribute
- Windows/macOS signing 指南

但当前不作为默认方案，原因是：

- 我们的产品不是薄壳浏览器，而是需要较强本地 runtime / process / terminal / file integration 的桌面工作台
- 在这种场景下，Electron 的路径更成熟、心智负担更低

### ADR 结论

> 当桌面端需要承载本地工作区、终端/命令、子进程、运行状态桥接与升级分发时，优先选择 Electron；除非后续将桌面端收缩为薄壳远程控制台，才重新评估 Tauri。

## 9.3 Web Shell：React + Vite

建议：

- React
- Vite
- TanStack Router / TanStack Query（或同级方案）
- 共享 UI 组件层与业务状态层

不建议把 Next.js 当作这套产品的核心壳。原因不是不能做，而是：

- Desktop 共用时，SSR / server actions / framework 魔法会增加复杂度
- 我们真正要共享的是控制台式前端，而不是内容型站点框架优势

## 9.4 Workspace Core：Fastify-first

建议：

- Fastify 作为 HTTP / WebSocket / plugin 基础
- 严格模块化，不做大泥球 Express
- 用 schema / typed contracts 约束 API

原因：

- 轻量
- 可组合
- 适合嵌入式服务与远程 server 共用
- 不会像重框架那样过早锁进大量结构成本

## 9.5 编排层：LangGraph JS + 自有 run/task 状态模型

原则：

- LangGraph 负责图式编排与长运行 agent workflow 支撑
- 产品级 run / task / artifact / trace 状态不直接等同于 LangGraph 内部结构
- 产品数据模型必须由我们自己定义和持久化

### 不能做的事

- 不能把 UI 直接绑定到某个 LangGraph 内部对象结构
- 不能把“图能跑”误当作“产品状态模型已经成立”

## 9.6 数据库：SQLite first + PostgreSQL ready

### Desktop / 本地模式

默认：**SQLite**

原因：

- 安装成本低
- 本地单用户最合适
- 适合 embedded workspace core
- 更利于桌面首发体验

### Remote / 团队模式

默认：**PostgreSQL**

原因：

- 并发和共享场景更稳
- 更适合远程工作区
- 后续权限、审计、共享查询空间更大

### 设计原则

- 领域层不直接依赖具体数据库
- 存储端口统一
- 本地与远程共享 schema 语义

## 9.7 ORM / Query Layer

建议优先选：**Drizzle ORM**（或同级偏轻量、对 SQLite/Postgres 双支持良好的方案）。

标准：

- SQLite / PostgreSQL 双支持稳定
- schema 演进清晰
- 不牺牲类型可读性
- 不引入过厚运行时魔法

## 9.8 Artifact Store

建议：

- 本地模式：本地文件系统目录
- 远程模式：本地磁盘目录起步，可选 S3 兼容对象存储

关键原则：

- artifact 必须有稳定 id 与元数据记录
- 数据库存元数据，文件系统 / 对象存储存内容
- 允许 summary / patch / log / file snapshot 等多种产物角色

## 9.9 队列与调度

当前不建议一开始引入 Redis / BullMQ / Temporal 作为硬依赖。

v0.4 默认建议：

> **采用 DB-driven orchestration + in-process scheduler。**

也就是：

- OrchestrationRun / Task / AgentRun 的状态以数据库为真相源
- scheduler 在 workspace core 内推进状态机
- runtime gateway 提交执行并回写结果

这样更适合：

- 桌面本地运行
- 远程单服务部署
- 后续再按需拆 scheduler / execution service

## 9.10 日志与观测

建议：

- structured logging（如 Pino）
- trace_id 贯穿 run / task / agent run
- OpenTelemetry 兼容设计
- 桌面本地和远程 server 都保留可导出日志能力

---

## 10. 目录与模块建议

```text
project-root/
├─ apps/
│  ├─ desktop/                    # Electron shell
│  ├─ web/                        # Browser shell
│  └─ workspace-core/             # 唯一服务核心（可本地嵌入、可远程部署）
├─ docs/
│  ├─ design/
│  │  └─ unified-design-v0.4.md
│  ├─ adr/
│  ├─ contracts/
│  └─ product/
├─ packages/
│  ├─ domain/
│  │  ├─ workspaces/
│  │  ├─ conversations/
│  │  ├─ messages/
│  │  ├─ orchestration_runs/
│  │  ├─ tasks/
│  │  ├─ agent_runs/
│  │  ├─ artifacts/
│  │  └─ trace_events/
│  ├─ application/
│  │  ├─ orchestration/
│  │  ├─ dispatch/
│  │  ├─ interventions/
│  │  ├─ context/
│  │  └─ responses/
│  ├─ runtime_gateway/
│  │  ├─ adapters/
│  │  │  └─ codex/
│  │  ├─ runs/
│  │  ├─ capabilities/
│  │  └─ contracts/
│  ├─ storage/
│  │  ├─ sqlite/
│  │  ├─ postgres/
│  │  ├─ artifact_store/
│  │  └─ migrations/
│  ├─ ui/
│  │  ├─ components/
│  │  ├─ run_views/
│  │  └─ task_views/
│  ├─ desktop_bridge/
│  ├─ shared_contracts/
│  └─ observability/
└─ tests/
```

命名约束：

- 不再使用 `controlplane` 作为额外平台层
- `workspace-core` 是唯一服务核
- `runtime_gateway` 保留，但只代表执行总线，不代表开放生态平台
- `desktop_bridge` 只承载桌面专属能力桥接，不承载业务领域逻辑

---

## 11. 执行模型：对外异步、对内 run-driven

### 11.1 核心语义

v0.4 继续坚持：

> **对外语义是异步 run-driven 状态推进；对内可以用 LangGraph 编排，但产品的一等对象必须是显式的 OrchestrationRun。**

系统必须天然支持：

- queued / running / succeeded / failed / cancelled / timeout
- 部分完成
- 中断恢复
- 取消与重试
- 长耗时任务观察
- 本地进程崩溃后的状态恢复

### 11.2 首发执行模式

首发建议仍收敛为：

- `direct_answer`
- `single_worker`
- `multi_worker`

### 11.3 未来保留但不首发的执行模式

- `deliberation`
- `meeting`
- `committee`

原因不是这些不重要，而是：

- 它们应建立在稳定的 run / task / artifact / trace 基础之上
- 不应在首发阶段把状态机与 UI 复杂度一起撑爆

### 11.4 Supervisor 的职责阶段

1. Mode Decision
2. Task Planning
3. Dispatch Coordination
4. Result Synthesis / Recovery
5. Operator Mediation（需要人类确认时）

### 11.5 planner / synthesizer 最小输出

planner 至少输出：

- `plan_summary`
- `task_list`
- `mode_decision_reason`
- `planning_rationale`

synthesizer 至少输出：

- `final_answer`
- `used_task_refs`
- `omitted_or_failed_task_refs`
- `result_completeness_hint`

### 11.6 retry / rerun / replan 的区别

- **retry**：同一轮 run 内，重试失败节点
- **rerun**：基于同一请求，新建一轮 run
- **replan**：在新一轮 run 中重做规划，不在当前 run 内中途强改 task graph

v0.4 不建议承诺“在同一轮执行中大规模在线重写图后继续跑”。

---

## 12. 核心领域对象

### 12.1 Workspace

v0.4 正式把 `workspace` 抬为一等对象。

建议最小字段：

- `workspace_id`
- `workspace_type` (`personal` / `shared`)
- `deployment_mode` (`local_desktop` / `remote_server`)
- `display_name`
- `status`
- `default_runtime_profile`
- `created_at`
- `updated_at`

设计原因：

- 即使单用户本地版，也不应再把系统默认为“无工作区边界”
- 后续团队共享与多工作区演进时，`workspace_id` 是必须提前埋下的主键

### 12.2 Event

建议最小字段：

- `event_id`
- `workspace_id`
- `source_type`
- `conversation_id`
- `actor_id`
- `actor_role`
- `text`
- `attachments`
- `created_at`
- `metadata`

### 12.3 Conversation

建议最小字段：

- `conversation_id`
- `workspace_id`
- `channel_type`
- `title`
- `status`
- `summary_ref`
- `latest_message_at`

### 12.4 Message

建议最小字段：

- `message_id`
- `workspace_id`
- `conversation_id`
- `orchestration_run_id`
- `sender_type`
- `sender_id`
- `visibility`
- `content_ref`
- `created_at`
- `metadata`

### 12.5 OrchestrationRun

建议最小字段：

- `orchestration_run_id`
- `workspace_id`
- `conversation_id`
- `origin_event_id`
- `status`
- `execution_mode`
- `planner_output_ref`
- `synthesis_output_ref`
- `final_response_ref`
- `has_partial_failures`
- `result_completeness`
- `completion_level`
- `started_at`
- `finished_at`
- `error_code`
- `error_message`
- `trace_id`

### 12.6 Task

建议最小字段：

- `task_id`
- `workspace_id`
- `parent_task_id`
- `orchestration_run_id`
- `task_kind`
- `title`
- `brief`
- `execution_profile`
- `status`
- `priority`
- `attempt`
- `idempotency_key`
- `depends_on_task_ids`
- `context_refs`
- `artifact_refs`
- `budget_hint`
- `failure_reason`
- `created_at`
- `updated_at`

### 12.7 AgentRun

建议最小字段：

- `run_id`
- `workspace_id`
- `task_id`
- `orchestration_run_id`
- `runtime_type`
- `runtime_model`
- `status`
- `attempt`
- `provider_run_id`
- `submitted_at`
- `queued_at`
- `started_at`
- `finished_at`
- `timeout_at`
- `retryable`
- `cancelable`
- `input_ref`
- `output_ref`
- `error_code`
- `error_message`
- `trace_id`

### 12.8 Artifact

建议最小字段：

- `artifact_id`
- `workspace_id`
- `orchestration_run_id`
- `task_id`
- `run_id`
- `artifact_role`
- `kind`
- `format_version`
- `uri_or_path`
- `content_type`
- `producer_type`
- `producer_id`
- `visibility`
- `created_at`

### 12.9 TraceEvent

v0.4 建议把 trace 进一步对象化。

建议最小字段：

- `trace_event_id`
- `workspace_id`
- `orchestration_run_id`
- `task_id`
- `run_id`
- `event_type`
- `level`
- `payload_ref`
- `created_at`
- `trace_id`

### 12.10 对象总原则

- 所有 UI 可见对象必须有 stable id
- 所有执行对象必须有状态枚举
- 所有可重试执行必须记录 `attempt`
- 错误归因必须能分层到：编排 / 任务 / 执行 / 产物
- `workspace_id` 作为所有核心对象的一级边界字段提前存在

---

## 13. 人类接管模型

### 13.1 v0.4 必须支持的动作

1. 查看单次 `OrchestrationRun` 的整体状态与失败层级
2. 查看 task tree、AgentRun、artifact 与 trace
3. 暂停 / 恢复当前 run（至少设计上承认）
4. 取消当前 run
5. 对失败或超时的 AgentRun 执行 `retry`
6. 基于同一请求发起新的 `rerun`
7. 注入 operator note / 补充上下文
8. 对受保护步骤做 approve / reject

### 13.2 当前明确不做的厚治理能力

- 多人审批流引擎
- 复杂组织策略后台
- 在线拖拽式改图
- 任意中途改写 planner 策略后继续同一 run
- 企业审计大屏先行

### 13.3 产品目标

先把“可观察 + 可暂停 + 可取消 + 可补跑 + 可重开 + 可注释”的闭环做稳，再谈更复杂治理。

---

## 14. Desktop 安全与权限模型

桌面端一旦成为一等产品，就必须提前设计安全边界。

### 14.1 基本原则

- Renderer 不直接拿系统高权限
- 所有本地系统能力通过 allowlist bridge 暴露
- secrets 不明文散落在普通配置文件
- 运行日志、artifact、配置、凭据目录分层

### 14.2 进程边界

- Electron Renderer：UI 层
- Electron Main：窗口、托盘、通知、升级、受控桥接
- Embedded Workspace Core：业务编排与运行状态

### 14.3 Secret 管理

建议：

- 优先使用系统安全存储或专用 secret store
- provider key / token 不直接暴露给前端 renderer
- workspace core 通过受控配置接口读取凭据

### 14.4 桌面能力暴露规则

默认允许：

- 打开本地产物目录
- 打开日志目录
- 通知
- 自动启动
- 选择文件 / 文件夹

受限暴露：

- shell / process / pty
- 任意路径读写
- 凭据查看
- 系统命令执行

原则：

> **不是不能给，而是必须经过显式能力层与白名单约束。**

---

## 15. 分发、签名与更新策略

### 15.1 这不是发布后期问题，而是架构约束

Windows 与 macOS 桌面版一旦认真分发，签名与更新就不是“上线前补一下”，而是会反向影响：

- 桌面壳选择
- CI/CD 设计
- 构建矩阵
- 发布节奏
- 证书与账号准备

### 15.2 macOS

根据 Electron 官方文档：

- macOS 发布需要 **code signing**
- 还需要 **notarization**

v0.4 因此要求：

- macOS 发布链路从一开始就按签名/公证预留
- Apple Developer 账号准备不是后置杂项，而是 release blocking item

### 15.3 Windows

根据 Electron 官方文档：

- Windows 正式分发同样需要 code signing
- 新策略下，证书与签名方式应尽早规划，云签名方案更适合 CI

### 15.4 更新策略

桌面端必须有正式更新策略，但不要求第一天就做“静默全自动升级”。

建议顺序：

1. Release 1：可检查新版本 + 引导下载安装
2. Release 2：受控自动更新
3. Release 3：多通道（stable / beta）

### 15.5 备选方案说明

Tauri 官方文档也提供 updater 与 distribute/signing 能力，因此它是合格备选，不是技术死路。

但 v0.4 仍以 Electron 为默认，原因在于：

- 当前桌面需求重本地能力，不是轻壳分发
- Electron 的本地 runtime 集成经验更成熟

---

## 16. 发布路线

v0.4 不再使用“MVP”作为主叙事，但仍保留分 Release 的工程节奏。

### Release 1：Personal Desktop Edition

目标：

- Windows / macOS Apple Silicon 桌面版可安装运行
- 本地工作区可启动 embedded workspace core
- 能完成单用户复杂工程任务的拆分、执行、结果回传与回放

必须交付：

- Desktop shell
- Embedded workspace core
- SQLite + 本地 artifact store
- Chat / Runs / Tasks / Run Detail / Artifact / Trace 视图
- retry / rerun / cancel
- 基础 operator note
- Codex runtime 首发接入

### Release 2：Remote Workspace Edition

目标：

- 同一套 core 可部署到 Linux server
- Web shell 能独立接远程工作区
- 桌面端也可作为远程控制台

必须交付：

- PostgreSQL 支持
- 远程部署形态
- 基础鉴权
- 远程 artifact store 选项
- 更稳的观测与日志导出

### Release 3：Collaborative Workspace Edition

目标：

- 支持小团队共享观察面与工作区
- 增强 operator 介入能力
- 为会议 / 争议收敛 / 决策沉淀做正式入口

可能交付：

- workspace sharing
- 更强 intervention 机制
- protected task approval
- deliberation / meeting 的受控引入

---

## 17. 关键 ADR 摘要

### ADR-001：产品采用“共享核心 + 双外壳”而不是 Web-only

- **状态**：提议接受
- **决策**：Desktop 与 Web 都是一等外壳
- **原因**：桌面近期即将上线，已是技术选型硬约束

### ADR-002：主产品语言采用 TypeScript / Node.js

- **状态**：提议接受
- **决策**：统一 Desktop / Web / Core / Contracts 语言生态
- **原因**：双端共享与桌面本地能力整合更优

### ADR-003：桌面壳默认采用 Electron

- **状态**：提议接受
- **决策**：Electron 为默认桌面壳，Tauri 保留备选
- **原因**：本地 runtime、终端、进程、更新与集成路径更稳

### ADR-004：编排层采用 LangGraph JS，但产品状态模型自持

- **状态**：提议接受
- **决策**：LangGraph 只做 orchestration substrate，不直接代表产品领域对象
- **原因**：避免 UI 与产品语义绑死框架内部结构

### ADR-005：首发采用 SQLite first / PostgreSQL ready

- **状态**：提议接受
- **决策**：桌面本地优先 SQLite，远程工作区优先 PostgreSQL
- **原因**：兼顾个人桌面首发与后续团队部署

### ADR-006：调度采用 DB-driven orchestration，不先引入 Redis/Temporal

- **状态**：提议接受
- **决策**：状态以数据库为真相源，scheduler 内嵌在 workspace core
- **原因**：更适合桌面本地与单服务远程部署

---

## 18. 当前仍需你拍板的事项

虽然 v0.4 已经能作为新主稿，但还有 5 个需要你尽快拍板的点：

1. **macOS 首发范围**  
   只做 Apple Silicon，还是首发同时兼容 Intel？

2. **Windows 首发范围**  
   只做 Windows 11，还是兼容 Windows 10？

3. **桌面首发的更新方式**  
   手动下载升级，还是首发就带自动更新通道？

4. **远程工作区是否进入 Release 1 计划**  
   还是先把 Personal Desktop Edition 做稳，再上 Remote Workspace？

5. **首发只接 Codex，还是同时把第二 runtime 留到 Release 2 明确承诺里**

---

## 19. 和 v0.3 相比，这版真正改了什么

不是改文案，而是改了 6 个根前提：

1. 从 **Web 单端壳** 改成 **Desktop + Web 双外壳**
2. 从 **Desktop 后置** 改成 **Desktop 一等约束**
3. 从 **MVP 收缩优先** 改成 **正式产品设计优先，交付分 Release**
4. 从 **默认 Web 服务心智** 改成 **本地优先 + 可远程扩展**
5. 从 **无 workspace 一级边界** 改成 **workspace 成为核心对象**
6. 从 **桌面只是 UI 问题** 改成 **桌面反向决定语言、进程、存储、分发与权限模型**

---

## 20. 结论

### 一句话结论

> **这不是一个“先做 Web demo、以后补桌面端”的项目，而是一个以共享协作核心为中心、同时面向 Desktop 与 Web、同时兼顾本地工作区与远程工作区的正式产品。**

### 当前主线

- 认真按正式产品设计
- 明确把 Windows / macOS Desktop 纳入主线
- 用 TypeScript / Node.js 统一双端与核心
- 用 Electron 承载桌面端
- 用 LangGraph JS 做编排底座
- 用 SQLite first / PostgreSQL ready 承接本地与远程两种运行模式

### 当前原则

- 愿景可以大，但对象和边界要清楚
- 桌面不是壳，是产品本体之一
- 双端可以分批交付，但不能两套语义
- 运行框架可以借力，但产品状态模型必须自己掌握
- serious product 不代表一开始做重平台，而是该提前钉住的基础不能再拖
