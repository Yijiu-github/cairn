# 回放与崩溃恢复 / Replay & Recovery

> 状态：🟡 Draft  
> 最后更新：2026-05-14  
> 关联：[`state-machines.md`](state-machines.md)、[`domain-model.md`](domain-model.md)、ADR-0006

---

## 1. 为什么单独一篇

v0.4 中"回放"被反复提到，但**没有明确定义**。本文先把语义钉死，再展开。

桌面端常见崩溃来源（系统重启、电源中断、进程被强杀、sidecar OOM），必须有**确定的恢复行为**，否则 OrchestrationRun 会停留在"看起来在跑但其实没动"的不可见状态。

## 2. Replay 的明确定义

**在本项目中，"replay" 仅指：基于 `TraceEvent` 重建一次 OrchestrationRun 的 UI 视图、时间线与状态。**

它不是：

- ❌ 重新执行 task
- ❌ 重新调用 runtime
- ❌ 触发副作用

如果你想"重新执行"，请用 `retry`（task 级）、`rerun`（新 run）或 `replan`（新 run 含重新规划）。三者区别见 [`state-machines.md`](state-machines.md#4-retry--rerun--replan-语义极其重要不可混用)。

### 2.1 Replay 的输入

- `OrchestrationRun.orchestration_run_id`
- 关联的全部 `TraceEvent`（按 `created_at` 排序）
- 关联的全部 `Artifact`（按需懒加载）

### 2.2 Replay 的输出

- 时间线视图（每个 TraceEvent 一行）
- 任务树视图（基于 Task / AgentRun 的快照重建）
- 关键产物预览
- 失败归因高亮（从 TraceEvent 的 `level=error` 推导）

### 2.3 Replay 与实时观察的关系

实时观察 = 接 WebSocket 流，看 TraceEvent 实时到达  
Replay = 不接流，从 DB 读历史 TraceEvent 渲染

两者**共享同一渲染层**——前端组件接收的输入是 TraceEvent 序列，不关心来源是实时还是历史。

## 3. 崩溃恢复

### 3.1 我们要恢复什么

| 对象 | 恢复目标 |
|---|---|
| `OrchestrationRun` 处于运行中状态 | 重新启动 scheduler tick，按状态机推进 |
| `Task` 处于 `dispatched` / `running` | 检查关联 AgentRun 是否仍在跑 |
| `AgentRun` 处于 `running` | 通过 heartbeat / lease 判断是否丢失 |
| Artifact 写入未完成 | 通过 `format_version` + 元数据校验 |

### 3.2 Heartbeat / Lease 机制

| 字段 | 用途 | 默认值 |
|---|---|---|
| `heartbeat_at` | AgentRun 最近一次心跳 | 每 15s 更新 |
| `lease_owner` | 当前持有者（进程 id / 节点 id） | 启动时分配 |
| `lease_expires_at` | lease 超时时间 | `heartbeat_at + 60s` |

### 3.3 恢复流程

**Workspace Core 启动时**：

1. 扫描 `AgentRun.status = running`
2. 对每条记录：
   - 若 `lease_owner = 自己` 且 `lease_expires_at < now`：转为 `lost`
   - 若 `lease_owner ≠ 自己` 且 `lease_expires_at < now`：转为 `lost`
   - 若 `lease_expires_at >= now`：等 lease 自然过期（其他进程仍可能在跑）
3. 对转为 `lost` 的 AgentRun：
   - 在 TraceEvent 记录 `run.lost { reason: "lease_expired" }`
   - 通知所属 Task：依配置进入 retry 或 failed
4. 对处于 `running / planning / synthesizing` 的 OrchestrationRun：
   - 不强制干预；scheduler tick 自动按状态机推进
5. 启动 scheduler tick 主循环

### 3.4 部分失败处理

OrchestrationRun 完成时：

- 全部 Task 成功 → `succeeded`
- 部分 Task 失败但非关键路径 → `succeeded`，`has_partial_failures = true`，`result_completeness = partial`
- 关键路径 Task 失败 → `failed`，`completion_level = degraded` 或 `failed`

判定关键路径的规则由 planner 输出标注（待 spike）。

## 4. 幂等性要求

为支持 retry / 崩溃恢复，所有"对外提交"操作必须**幂等**：

- `Task.idempotency_key`：每个 Task 唯一
- AgentRun 提交时携带 idempotency key
- Runtime Adapter 在重复 key 时应当返回前一次结果而非创建新执行
- 若 runtime 不支持幂等，由 Runtime Gateway 在本端做去重缓存

## 5. 数据一致性

### 5.1 事务边界

DB-driven scheduler（ADR-0006）下，所有状态转移必须在**单个事务内**完成：

- 写 TraceEvent
- 更新对象状态
- 更新关联对象（如 task → ready 同时 dispatched 的 agent_run 提交）

### 5.2 SQLite 与 Postgres 差异

- SQLite：使用 `BEGIN IMMEDIATE` 防止 writer 饥饿；启用 WAL
- Postgres：使用 `SELECT ... FOR UPDATE SKIP LOCKED` 拾取任务
- 两者均必须有**唯一约束**保证不会双重 dispatch（如 `(task_id, attempt)` unique）

## 6. 桌面端电源中断 / 系统休眠

- 系统休眠：Electron `powerMonitor` 监听 `suspend` / `resume`
- 休眠时：scheduler tick 暂停；运行中的 AgentRun 视情况标记
- 恢复时：触发上面的恢复流程
- 用户主动退出：scheduler tick 完成当前 tick 后退出；保留所有 DB 状态

## 7. 卸载与数据迁移

- 卸载时**默认不删除用户数据**（保留 `<userData>/workspaces/`）
- 提供"完全卸载（含数据）"选项
- 升级时自动备份当前 schema 版本的数据库文件（保留 N 个版本）
- 数据库迁移失败时回滚到备份

## 8. 待办

- [ ] Spike：LangGraph JS 中断后能否从 checkpoint 恢复
- [ ] 决定关键路径判定规则
- [ ] 起草数据库自动备份保留策略
- [ ] 在 `engineering/release-playbook.md` 描述跨版本数据迁移测试

## 变更历史

| 日期 | 变更 |
|---|---|
| 2026-05-14 | 初版，明确 replay 语义并补充崩溃恢复机制 |
