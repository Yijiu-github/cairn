# 定位与边界 / Positioning & Boundaries

> 状态：🟡 Draft
> 最后更新：2026-05-18
> 来源：[`../design/设计文档V0.1.0.md §2-§4`](../design/设计文档V0.1.0.md) 抽出

---

## 1. 一句话定位

> **Cairn 是面向个人开发者与小技术团队的、本地优先且可自托管的 AI 工程工作台 / Agent 工程控制台：连接 Codex / Claude Code / 本地模型等 runtime，把复杂工程任务放大为可追踪、可回放、可接管、可复用的 run / artifact / trace 系统。**

## 2. 五个不能退回去的关键词

1. **自托管**
2. **本地优先**
3. **Runtime 控制面**（连接外部/本地执行能力）
4. **证据层**（run / artifact / trace 可追踪）
5. **人类可接管**

## 2.1 市场切入顺序

Cairn 的市场切入顺序是：**个人本地入口 → 远程 workspace → 小团队控制台**。

- R1 先把个人本地工作台做成可信闭环，验证 Workspace Core、Runtime Gateway、Artifact、Trace、PlanningOutput 与 Operator control。
- R2 通过 remote workspace 打开团队入口，但仍坚持用户自控 server 与共享核心语义。
- R3 聚焦 2–10 人小团队的 agent 工程控制台，而不是企业级多租户治理平台。

## 3. 我们是什么

- 一个 **AI engineering workbench**
- 一个 **local-first + self-hosted runtime control plane**
- 一个 **evidence layer**：以 task / run / artifact / trace / operator intervention 为核心的产品系统
- 一个 **operator workbench**：让人类能观察、暂停、接管、验证与复用外部 runtime 的执行结果

## 4. 我们不是什么

## 4.1 与官方 Agent 工具的关系

Codex、Claude Code、Cursor、Windsurf 等工具会持续增强 worktree、并行任务、后台执行与 PR 生成能力。Cairn 不把这些基础 agent runner 能力当成护城河。

Cairn 的定位是 runtime-neutral control plane：把 Codex / Claude / 本地模型 / OpenAI-compatible endpoint 作为 Runtime Adapter 接入，并在其上提供 durable memory、replay、audit、artifact registry、planning output 与 operator cockpit。

- ❌ 通用企业 AI 治理平台
- ❌ 面向所有模型、所有入口、所有组织的"大宽平台"
- ❌ 单一聊天 bot
- ❌ 单一 IDE 内补全型 copilot
- ❌ Codex / Claude Code / Cursor / Cline / Aider 的替代品或复刻版
- ❌ 模型托管平台、coding agent provider 或第三方 endpoint 背书方
- ❌ 只会 delegation demo 的浅层 agent 样机

## 5. 当前明确不做的事

虽然不再按"MVP 缩到最小"思考，但仍要保留边界感。**当前不做**：

- 企业级多租户审批治理平台
- 开放外部 worker marketplace
- 一开始支持所有模型、所有 provider、所有入口
- 一开始支持复杂流程编排器 / 拖拽 workflow builder
- 一开始把会商、投票、仲裁、审批流全部做厚
- 一开始把桌面端做成全权限无边界本地自动化工具
- 把 R1 Codex CLI 首发接入写成对 OpenAI/Codex 的绑定
- 把 R2 OpenAI-compatible adapter 写成对任何具体第三方转 API / 反代项目的官方支持

**产品可以认真做，但边界不能失控。**

## 6. 五个产品承诺

### 6.1 Desktop 不是包装层，而是产品本体之一

桌面端直接决定主后端语言、进程模型、本地数据落地、runtime 封装、更新分发、权限隔离。

### 6.2 Web 与 Desktop 必须共享同一套协作语义

两个外壳不能成为两条产品线。共享必须包括 task tree、orchestration run、agent run、artifact、trace、human-in-the-loop 动作语义、retry/rerun/cancel/pause 等。

### 6.3 本地优先，但不等于只做离线单机

本地优先表示：

- 单用户场景下可在桌面本机完成安装、运行、存储与恢复
- 数据默认优先落本地或用户自控存储
- 不以外部 SaaS 作为核心运行前提

但仍然支持远程 server、团队共享工作区、Web 远程控制。

### 6.4 产品核心是 run-driven 协作，不是聊天皮肤

核心价值是：

- 复杂任务可拆分
- 执行过程可见
- 失败层级可归因
- 中途可以接管
- 结果可以回放与沉淀

核心对象是 Workspace / Conversation / OrchestrationRun / Task / AgentRun / Artifact / Trace。

Runtime 负责生成与执行，Cairn 负责组织、观察、接管、验证、沉淀与复用。也就是说，Cairn 的主语不是"更强的 agent"，而是把 Codex / Claude Code / 本地模型等 runtime 的一次性执行变成可持续工程资产的控制面与证据层。

### 6.5 Runtime 是能力来源，Cairn 是能力放大器

R1 首发 Codex CLI 是为了打通第一条真实 runtime-control-plane 链路，不表示 Cairn 绑定 OpenAI、复刻 Codex 体验，或把 Codex 作为唯一长期方向。R2 的 Generic OpenAI-Compatible Adapter 是通用连接能力，用于覆盖官方兼容接口、本地推理引擎与用户自配 endpoint；它不是对任何特定转 API / 反代项目的内置集成、官方推荐或合规背书。

### 6.6 人类必须有明确而有限的接管能力

不是全自动放飞，也不是重做企业审批平台。

明确支持：观察 / 暂停 / 取消 / 重试 / 重开一轮 / 注入补充说明 / 受保护步骤确认或放行。

## 7. 边界的检查清单

提交新功能 / 新 issue / 新 ADR 时，先过以下问题：

- [ ] 这个功能与"本地优先 + 自托管"是否冲突？
- [ ] 这个功能是否假设用户必须有云账号？
- [ ] 这个功能是否在"明确不做"清单里？
- [ ] 这个功能是否会把双端语义引向分叉？
- [ ] 这个功能是否绕过了 operator 的接管能力？

任何一项答"是"，需要在 PR 中显式说明并升级到 ADR 讨论。

## 8. 变更历史

| 日期       | 变更                                                                       |
| ---------- | -------------------------------------------------------------------------- |
| 2026-05-18 | 收口 runtime 控制面 / 证据层定位，补充 Codex/Claude 与第三方 endpoint 边界 |
| 2026-05-14 | 初版，从 V0.1.0 §2-§4 抽出                                                 |
