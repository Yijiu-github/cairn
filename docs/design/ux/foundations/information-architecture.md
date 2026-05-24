# 信息架构 / Information Architecture

> 状态：🟡 Draft
> 最后更新：2026-05-24
> 范围：Release 1 Personal Desktop Edition；未来 Web Shell 复用同一套页面语义，不在本文件展开屏幕级交互细节。

---

## 1. 设计目标

Cairn 的界面不是聊天工具，也不是任务看板，更不是单一 runtime 的复刻 UI。它是一个 **run-driven AI engineering workbench**：连接外部或本地 runtime，并把执行过程组织成可观察、可接管、可验证的 run / artifact / trace。

这个文档只回答三件事：

1. 顶层页面怎么分层。
2. 哪些页面是 R1 的主入口。
3. 哪些语义必须跨 Desktop / Web 保持一致。

屏幕级结构、关键流程、组件状态与视觉稿，分别放在 [`../screens/`](../screens/)、[`../flows/`](../flows/) 和 [`../components/`](../components/)。

## 2. 顶层导航模型

R1 Desktop Shell 当前只保留四个主入口；未来 Web Shell 复用同一套对象语义，但不改变这些入口的领域含义：

```text
App Chrome
├─ Workspace Switcher / Connection Status / Command Center
├─ Primary Navigation
│  ├─ Home / Inbox
│  ├─ Runs
│  ├─ Runtime Status
│  └─ Settings
└─ Content Region
   ├─ Run Detail
   │  ├─ Task Tree / Task Explorer
   │  ├─ Artifact Rail / Artifact Detail
   │  ├─ Activity Timeline / Trace Timeline
   │  └─ Replay View
   ├─ Runtime diagnostics
   └─ Settings panes
```

### 2.1 顶层职责

| 区域               | 责任                                      | 备注                                 |
| ------------------ | ----------------------------------------- | ------------------------------------ |
| Workspace Switcher | 切换 workspace；R2 后也可切远程 workspace | 桌面优先，本地连接状态更显眼         |
| Command Center     | 全局搜索、快捷操作、新建 run              | 作为统一入口，不再单独展开交互细节   |
| Runtime Status     | 展示 core / runtime 健康、队列与权限状态  | 用户侧页面名；当前实现映射可保留路由 |
| Operator Actions   | 暂停、查看失败、打开日志                  | 具体动作与约束见流程文档             |

## 3. Release 1 页面地图

R1 按页面语义组织；只有 Home / Inbox、Runs、Runtime Status、Settings 是主导航入口。其余页面是从 run、handoff、artifact 或诊断上下文进入的二级观察面。

| 入口 / 路由              | 页面名            | 层级     | 主要对象                   | 一句话职责                          |
| ------------------------ | ----------------- | -------- | -------------------------- | ----------------------------------- |
| `/`                      | Home / Inbox      | 主入口   | Conversation / Run         | 新请求入口、待处理事项、最近活动    |
| `/runs`                  | Run List          | 主入口   | OrchestrationRun           | run 列表、过滤、状态总览            |
| `/runtime`               | Runtime Status    | 主入口   | Runtime / Core             | 健康检查、能力边界、诊断与权限提示  |
| `/settings/*`            | Settings          | 主入口   | Workspace / App / Security | 工作区、运行时、安全、更新、隐私    |
| `/runs/:runId`           | Run Detail        | 二级页面 | OrchestrationRun           | 单个 run 的主工作面                 |
| `/runs/:runId/replay`    | Replay View       | 二级页面 | TraceEvent                 | 只读回放 run 的关键事件             |
| `/artifacts/:artifactId` | Artifact Detail   | 二级页面 | Artifact                   | 产物预览、来源与审阅                |
| Run Detail panel         | Task Explorer     | 二级面板 | Task                       | 单个 run 内的任务树、依赖与关联对象 |
| Run Detail panel         | Activity Timeline | 二级面板 | TraceEvent                 | 当前 run 的事件流、失败与接管记录   |

`/agents`、`/tasks`、`/artifacts`、`/activity` 这类历史路由名不再作为 R1 Desktop 主导航口径；若实现中仍有旧命名，应在进入对应页面时映射到上表的用户可见名称。

## 4. 关键不变量

- Run Detail 是主工作面；Activity / Replay / Runtime Status 只解释或辅助，不替代它。
- Home / Inbox 必须暴露待处理交接队列，让用户知道“现在该处理什么”。
- Runtime Status 只回答“系统能不能跑、当前连接了什么、权限边界是什么”。
- Replay 只重建视图，不重新执行。
- Desktop 与 Web 共享同一套对象语义；差异只来自运行环境和系统能力。

## 5. 文档分工

| 主题               | 放在这里 | 放到别处                            |
| ------------------ | -------- | ----------------------------------- |
| 顶层导航与页面分层 | ✅       |                                     |
| 屏幕布局与状态     |          | `../screens/`                       |
| 关键流程           |          | `../flows/`                         |
| 组件契约           |          | `../components/`                    |
| 视觉参考           |          | `../screens/visual-reference-v1.md` |

## 6. 变更历史

| 日期       | 变更                        |
| ---------- | --------------------------- |
| 2026-05-24 | 对齐 R1 主导航与二级观察面  |
| 2026-05-24 | 收紧为主导航 / 页面边界总览 |
| 2026-05-15 | 初版                        |
