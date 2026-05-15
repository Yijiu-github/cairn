# 关键流程 / Key Flows

> 状态：🟡 Draft
> 最后更新：2026-05-15
> 范围：Release 1 Personal Desktop Edition。

---

## 1. 首次启动流程

```text
Open App
  → Welcome
  → Choose Workspace Directory
  → Initialize SQLite + Artifact Store
  → Start Embedded Workspace Core
  → Detect Codex CLI Runtime
  → Optional: Run Health Check
  → Create First Run / Enter Home
```

### 成功标准

- 用户 5 分钟内能完成配置并看到 Home。
- 如果 Codex CLI 未配置，用户仍能进入应用，但 Home 顶部显示 runtime 未就绪。
- 所有失败都必须给出本地日志入口。

### 接口/状态需求

- `workspace.status`：数据目录、初始化阶段、是否可写
- `workspace.initialize`：创建 SQLite、artifact store、日志目录
- `core.health`：starting / healthy / unhealthy / stopped + 最近错误
- `runtime.detect`：Codex CLI 路径、版本、auth 状态
- `runtime.healthCheck`：最小可执行检查，失败时返回可操作修复建议

### First Launch 失败降级

| 失败点        | UI 反馈                     | 可继续吗          | 主操作                 |
| ------------- | --------------------------- | ----------------- | ---------------------- |
| 目录不可写    | 标出路径与权限原因          | 否                | Choose another folder  |
| Core 启动失败 | 显示最近 20 行 core log     | 否                | Open logs / retry      |
| Codex 未安装  | Runtime card 显示 Not found | 是                | Browse / install later |
| Codex 未登录  | 显示 Auth required          | 是，只读/草稿模式 | Open setup guide       |
| 健康检查超时  | 标为 Degraded               | 是                | Run diagnostics again  |

## 2. 新建 Run 流程

```text
Home / Inbox
  → User writes request
  → Add context / working directory / acceptance criteria
  → Preview run plan constraints
  → Create OrchestrationRun
  → Run Detail opens
  → Planning starts
```

### 输入结构

| 字段                | 必填 | 说明                            |
| ------------------- | ---- | ------------------------------- |
| Request             | 是   | 用户自然语言目标                |
| Working directory   | 否   | 桌面端可选本地目录              |
| Context files       | 否   | 附加文件/文本                   |
| Acceptance criteria | 否   | 验收标准                        |
| Runtime             | 否   | 默认 runtime，可覆盖            |
| Risk level          | 否   | 低/中/高，影响 protected action |

### UX 原则

- 不把“新建 run”做成纯聊天发送按钮。
- 创建前允许用户补充验收条件，降低 agent 做偏的概率。
- 创建后自动进入 Run Detail，让用户看到 planning 阶段。

## 3. 观察运行中 Run

```text
Run Detail
  → Watch Run Header status
  → Inspect Task Tree
  → Select active AgentRun
  → Read live output / trace
  → Open generated artifacts
```

### 必须实时更新

- run status
- active task
- active agent run output
- trace events
- artifact list
- intervention requests

### 降级策略

WebSocket 断开时：

1. 顶部显示 reconnecting
2. 保留最后快照
3. 自动回退轮询
4. 重连后补齐缺失事件

## 4. 人类接管流程

```text
Run Detail
  → System marks blocked / user chooses Add instruction
  → Intervention Composer opens
  → User writes instruction or approval
  → Core records OperatorNote / OperatorAction
  → Scheduler resumes or retries target
```

### 接管入口与表单

Intervention Composer 根据目标对象变化，但保持同一套提交语义：

| 目标对象       | 默认标题                          | 必填内容                         | 立即影响                          | 记录                            |
| -------------- | --------------------------------- | -------------------------------- | --------------------------------- | ------------------------------- |
| Run            | Add note to run                   | note body                        | 不改变调度；下一轮 summary 可读取 | `OperatorNote` + `TraceEvent`   |
| Task           | Add instruction to task           | instruction body                 | 追加到 task context；可选择 retry | `OperatorAction` + `TraceEvent` |
| AgentRun       | Stop / retry agent run            | reason 或 instruction            | best-effort cancel 或新 attempt   | `OperatorAction` + `TraceEvent` |
| Protected step | Approve / reject protected action | approve/reject + optional reason | 放行或阻断该 step                 | `OperatorAction` + `TraceEvent` |

表单必须显示目标对象、当前状态、风险说明和提交后会发生什么；不能让用户误以为 note 一定会立刻中断正在执行的子进程。

### 接管类型

| 类型                     | 触发      | 目标对象              | 结果                     |
| ------------------------ | --------- | --------------------- | ------------------------ |
| Add note                 | 用户主动  | Run / Task / AgentRun | 记录说明，不一定改变状态 |
| Add instruction          | 用户主动  | Task / AgentRun       | 后续执行读取补充说明     |
| Approve protected action | 系统请求  | Protected step        | 放行继续                 |
| Reject protected action  | 系统请求  | Protected step        | 标记 blocked / failed    |
| Retry                    | 失败/超时 | Task / AgentRun       | 创建新 attempt           |
| Pause                    | 用户主动  | Run                   | 停止调度新工作           |
| Cancel                   | 用户主动  | Run / AgentRun        | best-effort 取消         |

### 状态机约束

- Pause 只暂停 scheduler 分发新工作；已经启动的 AgentRun 是否停止由 runtime capability 决定。
- Cancel 是 best-effort：UI 先进入 `cancelling` 反馈态，core 确认后显示 `cancelled` 或失败原因。
- Retry 只针对 retryable task / AgentRun；同一 run 内新增 attempt，不在线大规模改 task graph。
- Rerun 创建新的 OrchestrationRun；可复制原始 request、context 和用户选择的 artifacts。
- Approve / reject 只能作用于等待审批的 protected step，不提供全局“永久允许所有动作”的快捷入口。

## 5. 失败与重试流程

```text
AgentRun fails
  → Task status becomes failed / blocked
  → Run Header shows failure layer
  → User opens failure summary
  → User chooses Retry / Add instruction then retry / Cancel / Rerun
```

### 失败摘要必须包含

- 失败对象：run / task / agent run / tool
- 失败原因的人类可读摘要
- raw log / trace event 链接
- 是否可重试
- 当前 attempt / 最大 attempt
- 已生成 artifact 是否保留

### Retry 与 Rerun 区分

- **Retry**：同一个 run 内，对失败 task / agent run 新增 attempt。
- **Rerun**：基于原始请求创建新的 OrchestrationRun，可复用上下文和 artifact。

## 6. Artifact 审阅流程

```text
Run Detail / Artifact Library
  → Open artifact
  → Preview content
  → Inspect provenance
  → Copy / Open / Export
  → Optional: mark accepted / rejected
```

### Artifact 类型优先级

R1 优先支持：

1. text summary
2. patch / diff
3. log
4. file reference
5. command output

## 7. 回放流程

```text
Run Detail
  → Open Replay
  → Timeline starts at planning
  → User scrubs events
  → Task Tree and Artifact snapshot update
  → User opens event detail
```

R1 回放可以是只读事件播放器，不需要重建完整 UI 动画。

## 8. 手动更新流程

```text
Settings / Updates
  → Check for update
  → Show version / changelog / signature status
  → Open download page or download package
  → User installs manually
  → App restarts into new version
```

R1 不做自动后台更新，避免签名、权限、失败恢复复杂度过早膨胀。

## 9. Artifact 审阅与变更请求流程

```text
Artifact created
  → Artifact appears in Run Detail Evidence rail
  → User opens Artifact Detail
  → Inspect preview + provenance + verification refs
  → Accept / Reject / Request changes
  → Core records review decision
  → Optional: create follow-up task or rerun with selected artifacts
```

### 审阅状态

| 状态       | 含义                         | 可用操作                          |
| ---------- | ---------------------------- | --------------------------------- |
| unreviewed | agent 已生成，但人类尚未看过 | Accept / Reject / Request changes |
| accepted   | 人类认可，可作为后续上下文   | Reuse / Export                    |
| rejected   | 不应作为可信输出使用         | Request changes / Rerun           |
| superseded | 被更新版本替代               | Open newer artifact               |

## 10. On-the-loop 策略调整流程

```text
User notices repeated failure / drift
  → Open Run Detail / Settings Runtime Policy
  → Adjust acceptance criteria, risk level, retry policy, runtime profile or task template
  → Save as applies-next decision
  → Future retry / rerun reads updated policy
```

### 与 In-the-loop 的区别

- In-the-loop：批准、拒绝或审阅某个具体步骤。
- On-the-loop：调整系统下一轮如何计划、验证或接管。

## 11. 变更历史

| 日期       | 变更 |
| ---------- | ---- |
| 2026-05-15 | 初版 |
