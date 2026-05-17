# 桌面端线框稿 / Desktop Wireframes

> 状态：🟡 Draft
> 最后更新：2026-05-18
> 范围：Release 1 Personal Desktop Edition。本文是工程可落地的低保真设计稿；后续 Figma/高保真稿应以此为信息结构基线。

---

## 1. 视觉方向

Cairn 的桌面端应像“工程任务控制台”和 runtime 控制面，而不是传统聊天应用，也不是 Codex / Claude Code 的复刻 UI。

关键词：

- Calm control：信息密度高但不焦虑
- Run-first：一切围绕 run 的状态推进
- Traceable：每个结果都能追到来源
- Local-first：本地路径、core 状态、权限边界可见
- Human-in-the-loop：人的接管动作永远明确、有限、可撤回或可追踪

## 2. 桌面窗口框架

建议默认窗口：`1280 × 820`，最小支持 `1024 × 720`。

```text
┌────────────────────────────────────────────────────────────────────────────┐
│ Cairn  ▾ Personal Workspace        ⌘K Search / Command      Core: Healthy │
├──────────────┬─────────────────────────────────────────────────────────────┤
│ Inbox        │                                                             │
│ Runs         │  Content Region                                             │
│ Tasks        │                                                             │
│ Artifacts    │                                                             │
│ Agents       │                                                             │
│ Activity     │                                                             │
│ Settings     │                                                             │
│              │                                                             │
│              │                                                             │
│ Local Core   │  Queue 0 · Codex Ready · Artifacts ~/Cairn/artifacts        │
└──────────────┴─────────────────────────────────────────────────────────────┘
```

### 2.1 左侧导航

宽度：`220px`。内容：

- Workspace name
- primary navigation
- 当前运行摘要：running / blocked / failed
- runtime/core health mini status

### 2.2 顶部栏

高度：`48px`。内容：

- 当前 workspace
- command center
- core health
- notification / intervention badge

## 3. First Launch Wizard

```text
┌────────────────────────────────────────────────────────────────────┐
│ Cairn                                                              │
│ Local-first AI engineering workbench                               │
│                                                                    │
│ Step 1 of 4 · Choose workspace                                     │
│ ┌────────────────────────────────────────────────────────────────┐ │
│ │ Workspace data directory                                      │ │
│ │ /Users/you/Cairn Workspace                         [Choose…]  │ │
│ │                                                                │ │
│ │ This stores SQLite database, artifacts, logs and local config. │ │
│ └────────────────────────────────────────────────────────────────┘ │
│                                                                    │
│ [Back]                                             [Continue]      │
└────────────────────────────────────────────────────────────────────┘
```

### 3.1 四步

1. Choose workspace
2. Initialize local core
3. Configure runtime
4. Start first run

### 3.2 Runtime 检测页

```text
┌────────────────────────────────────────────────────────────────────┐
│ Step 3 of 4 · Configure runtime                                    │
│                                                                    │
│ Codex CLI                                                          │
│ ┌────────────────────────────────────────────────────────────────┐ │
│ │ Status: Not found                                              │ │
│ │ Path:   —                                            [Browse]  │ │
│ │                                                                │ │
│ │ Cairn uses Codex CLI as the first runtime adapter in R1.       │ │
│ │ This validates the runtime control-plane path, not Codex lock-in.│ │
│ └────────────────────────────────────────────────────────────────┘ │
│                                                                    │
│ [Skip for now]                         [Run diagnostics] [Continue]│
└────────────────────────────────────────────────────────────────────┘
```

## 4. Home / Inbox

```text
┌──────────────┬─────────────────────────────────────────────────────────────┐
│ Inbox        │ Good evening. What should Cairn work on?                   │
│ Runs         │ ┌─────────────────────────────────────────────────────────┐ │
│ Tasks        │ │ Describe the engineering task…                          │ │
│ Artifacts    │ │                                                         │ │
│ Agents       │ └─────────────────────────────────────────────────────────┘ │
│ Activity     │ Context: [Working dir] [Attach files] [Acceptance criteria]│
│ Settings     │ Runtime: Codex default                       [Create Run] │
│              │                                                             │
│              │ Handoff queue                                              │
│              │ ┌──────────────────────┐ ┌──────────────────────┐          │
│              │ │ Approve file write   │ │ Review patch         │          │
│              │ │ Run blocked · 8m     │ │ 3 checks passed      │          │
│              │ │ [Approve once]       │ │ [Accept] [Changes]   │          │
│              │ └──────────────────────┘ └──────────────────────┘          │
│              │                                                             │
│              │ Recent runs                                                 │
│              │ ┌─────────────────────────────────────────────────────────┐ │
│              │ │ Refactor scheduler · running · 4/9 tasks · 12m          │ │
│              │ │ Add contract tests · completed · 7 artifacts            │ │
│              │ └─────────────────────────────────────────────────────────┘ │
└──────────────┴─────────────────────────────────────────────────────────────┘
```

### 4.1 新建 Run 输入区

字段顺序：

1. Request
2. Working directory
3. Context attachments
4. Acceptance criteria
5. Runtime / risk level
6. Expected evidence：tests、diff、screenshot、summary 等期望产物

### 4.2 Handoff Queue 卡片

每张卡片至少显示：

- 来源 run / task / artifact
- 阻塞或待审阅原因
- 等待时长
- 推荐主操作
- 次操作：Open run、View trace、Dismiss（仅非阻塞提醒）

## 5. Run List

```text
┌──────────────┬─────────────────────────────────────────────────────────────┐
│ Runs         │ Runs                                      [New Run]        │
│              │ [All] [Running] [Blocked] [Failed] [Completed]             │
│              │                                                             │
│              │ ┌─────────────────────────────────────────────────────────┐ │
│              │ │ ● Running  Refactor scheduler port                      │ │
│              │ │ 4/9 tasks · Codex · 18m · 2 artifacts                   │ │
│              │ │ Current: running contract tests                         │ │
│              │ └─────────────────────────────────────────────────────────┘ │
│              │ ┌─────────────────────────────────────────────────────────┐ │
│              │ │ ▲ Blocked  Add desktop first-launch flow                │ │
│              │ │ Waiting for protected action: write app config          │ │
│              │ │ [Review] [Cancel]                                       │ │
│              │ └─────────────────────────────────────────────────────────┘ │
└──────────────┴─────────────────────────────────────────────────────────────┘
```

## 6. Run Detail

```text
┌────────┬────────────────────┬──────────────────────────────┬───────────────┐
│ Runs   │ Task Tree          │ Refactor scheduler port       │ Inspector     │
│        │                    │ Running · 18m · Codex         │               │
│        │ ▼ Plan             │ [Pause] [Cancel] [Add note]   │ Trace         │
│        │  ✓ Read docs       │                              │ 12:04 planned │
│        │  ✓ Inspect code    │ Selected task                 │ 12:07 started │
│        │  ● Add port        │ ┌──────────────────────────┐ │ 12:12 tool…  │
│        │  ◌ Tests           │ │ Live output / summary     │ │               │
│        │  ◌ Docs            │ │                          │ │ Artifacts     │
│        │                    │ │ npm test …                │ │ patch.diff    │
│        │                    │ └──────────────────────────┘ │ notes.md      │
│        │                    │                              │               │
│        │                    │ Evidence                      │ Metadata      │
│        │                    │ tests.log · patch.diff      │ run_01…       │
│        │                    │                              │               │
│        │                    │ Intervention                 │               │
│        │                    │ ┌──────────────────────────┐ │               │
│        │                    │ │ Effect: applies next      │ │               │
│        │                    │ │ Add instruction…          │ │               │
│        │                    │ └──────────────────────────┘ │               │
└────────┴────────────────────┴──────────────────────────────┴───────────────┘
```

### 6.1 Run Header 状态色

| 状态      | 色彩语义   | 操作优先级                      |
| --------- | ---------- | ------------------------------- |
| Queued    | neutral    | cancel                          |
| Planning  | blue       | cancel                          |
| Running   | green/blue | pause, cancel                   |
| Blocked   | amber      | review, add instruction, cancel |
| Failed    | red        | retry, rerun, inspect logs      |
| Completed | green      | review artifacts, replay, rerun |
| Cancelled | gray       | rerun, inspect                  |

### 6.2 Task Tree 节点

```text
● active task
✓ completed task
▲ blocked task
× failed task
◌ queued task
↻ retrying / attempt > 1
```

### 6.3 Intervention Composer 的 Effect 标识

| Effect       | 含义                               | 示例                            |
| ------------ | ---------------------------------- | ------------------------------- |
| Applies now  | 提交后立即影响调度                 | approve once、cancel、retry now |
| Applies next | 进入下一次 planning / retry 上下文 | add instruction then retry      |
| Records only | 仅记录 decision/note               | 备注观察结果                    |

## 7. Artifact Detail

```text
┌──────────────┬──────────────────────────────────────────────┬──────────────┐
│ Artifacts    │ patch.diff                                   │ Provenance   │
│              │ Kind: patch · From run Refactor scheduler     │              │
│              │ [Copy] [Open external] [Reveal in Finder]     │ AgentRun     │
│              │                                              │ ag_01…       │
│              │ ┌──────────────────────────────────────────┐ │              │
│              │ │ diff --git a/src/scheduler.ts            │ │ Task         │
│              │ │ + export interface SchedulerPort …       │ │ Add port     │
│              │ │ - old implementation                     │ │              │
│              │ └──────────────────────────────────────────┘ │ Trace        │
│              │                                              │ 8 events     │
└──────────────┴──────────────────────────────────────────────┴──────────────┘
```

## 8. Runtime Status

```text
┌──────────────┬─────────────────────────────────────────────────────────────┐
│ Agents       │ Runtime & Local Core                                       │
│              │                                                             │
│              │ Workspace Core                                              │
│              │ ┌─────────────────────────────────────────────────────────┐ │
│              │ │ Status: Healthy                                          │ │
│              │ │ Endpoint: 127.0.0.1:••••                                 │ │
│              │ │ DB: ~/Cairn/workspace.sqlite                             │ │
│              │ │ Artifacts: ~/Cairn/artifacts                             │ │
│              │ │ [Restart core] [Open logs] [Run diagnostics]             │ │
│              │ └─────────────────────────────────────────────────────────┘ │
│              │                                                             │
│              │ Codex Runtime                                               │
│              │ ┌─────────────────────────────────────────────────────────┐ │
│              │ │ Status: Ready                                            │ │
│              │ │ Version: x.y.z                                           │ │
│              │ │ Capabilities: text, patch, log                           │ │
│              │ └─────────────────────────────────────────────────────────┘ │
└──────────────┴─────────────────────────────────────────────────────────────┘
```

## 9. Settings

```text
Settings
├─ Workspace
│  ├─ Data directory
│  ├─ Artifact store
│  ├─ Backup / export
│  └─ Reset local workspace
├─ Runtime
│  ├─ Codex CLI path
│  ├─ Default model / profile
│  └─ Protected action policy
├─ Security
│  ├─ Secret storage
│  ├─ Loopback access
│  └─ Permission history
├─ Updates
│  ├─ Current version
│  ├─ Check for updates
│  └─ Download instructions
└─ Privacy
   ├─ Telemetry toggle
   ├─ Data locality summary
   └─ Export diagnostic bundle
```

## 10. 响应式与密度

### 10.1 默认密度

- 桌面默认 comfortable density
- Run Detail 可切 compact density
- 日志/trace 默认 monospace 区块

### 10.2 窄宽降级

`< 1100px`：Inspector 默认折叠成右侧 drawer。
`< 900px`：Run List 与 Detail 不并排，左侧导航只显示图标。

## 11. Run Detail 接管态

```text
┌────────────────────────────────────────────────────────────────────┐
│ Approve protected action                                           │
│ Target: Task “Update config file” · Protected file write           │
│                                                                    │
│ Cairn wants to write: apps/desktop/cairn.config.json               │
│ Risk: modifies local app configuration                             │
│                                                                    │
│ Reason from agent                                                  │
│ ┌────────────────────────────────────────────────────────────────┐ │
│ │ Needed to persist the selected Codex CLI path.                 │ │
│ └────────────────────────────────────────────────────────────────┘ │
│                                                                    │
│ Optional note                                                      │
│ ┌────────────────────────────────────────────────────────────────┐ │
│ │ Approve only this file for this run…                           │ │
│ └────────────────────────────────────────────────────────────────┘ │
│                                                                    │
│ [Reject]                                      [Approve once]       │
└────────────────────────────────────────────────────────────────────┘
```

接管弹窗只处理当前目标对象；更宽的策略变更必须跳转 Settings / Security，避免用户在压力下给出过大的授权。

## 12. 组件清单

R1 需要的核心 UI 组件（工程映射见 [`component-mapping.md`](../components/component-mapping.md)）：

- AppShell
- SidebarNav
- WorkspaceSwitcher
- CommandCenter
- StatusBadge
- RunCard
- RunHeader
- TaskTree
- AgentRunLog
- TraceTimeline
- ArtifactPreview
- InterventionComposer
- RuntimeHealthCard
- EmptyState
- ErrorSummary
- SettingsSection

## 13. SVG 设计图

当前随文档提交 4 张可预览 SVG 低保真图：

- [Home / Inbox](../assets/wireframes/desktop-home.svg)
- [Run Detail](../assets/wireframes/desktop-run-detail.svg)
- [First Launch Wizard](../assets/wireframes/desktop-first-launch.svg)
- [Runtime Status](../assets/wireframes/desktop-runtime-status.svg)

这些图不是最终视觉稿，而是给工程实现和后续高保真设计使用的信息结构基线。

## 14. 变更历史

| 日期       | 变更 |
| ---------- | ---- |
| 2026-05-15 | 初版 |
