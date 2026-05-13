# ADR-0006: 调度采用 DB-driven orchestration，不引入 Redis/Temporal

- **状态**：🟢 Accepted
- **日期**：2026-05-13
- **决策者**：项目主理
- **关联**：ADR-0001, ADR-0005, [`../design/unified-design-v0.4.md#99-队列与调度`](../design/unified-design-v0.4.md)

---

## 背景

OrchestrationRun / Task / AgentRun 的执行推进需要某种调度机制。候选：

- **DB-driven + in-process scheduler**（轮询 / NOTIFY / advisory lock）
- **Redis + BullMQ**（消息队列）
- **Temporal / Cadence**（工作流引擎）
- **Kafka + 自研消费者**

Cairn 的实际运行场景：

- 本地模式：单进程嵌入式
- 远程模式：单服务部署起步，未来可拆

引入 Redis / Temporal 意味着：

- 用户本地必须安装额外依赖（破坏 SQLite 零依赖体验）
- 远程部署多一层运维
- 复杂度上升但首发并不需要

## 决策

**采用 DB-driven orchestration + in-process scheduler。**

具体地：

1. OrchestrationRun / Task / AgentRun 的状态以**数据库为唯一真相源**
2. Scheduler 内嵌在 Workspace Core 进程中
3. Runtime Gateway 提交执行并回写结果到 DB
4. 不引入 Redis / BullMQ / Temporal / Kafka 作为硬依赖
5. 通过状态机 + heartbeat + lease 实现并发安全与崩溃恢复（见 [`../design/replay-and-recovery.md`](../design/replay-and-recovery.md)）

## 后果

### 好的

- 单进程即可工作，桌面本地与远程单服务都自然
- 用户安装依赖最少（仅 SQLite 或 PG）
- 状态与业务数据共在一处，事务一致性容易保证
- 调试与排错链路简单

### 坏的

- 高并发写场景受数据库限制（SQLite 更明显）
- 复杂工作流模式（如 saga、长事务编排）需自行实现，没有 Temporal 那样的现成抽象
- 跨进程 / 跨节点扩展需要额外设计

### 中性的

- 后续可在不破坏契约的前提下，拆出独立 scheduler / execution service
- 当远程模式压力上升时再评估引入 Redis 或迁移到 Temporal

## 备选方案

- **Redis + BullMQ**：放弃为首选。增加依赖、复杂度，桌面体验受损。保留为"远程模式高负载场景的扩展项"。
- **Temporal**：放弃。重型工作流引擎，对当前规模过大；学习与运维成本高。
- **Kafka**：放弃。完全不在当前场景的考虑范围。

## 实施提示

- 状态轮询使用**带抖动的退避算法**，避免空轮询打满 CPU
- SQLite 下使用 `BEGIN IMMEDIATE` + WAL，PostgreSQL 下使用 `SELECT ... FOR UPDATE SKIP LOCKED`
- AgentRun 表加 `heartbeat_at` / `lease_owner` / `lease_expires_at` 字段，scheduler 周期性扫描"过期 lease"做恢复
- Trace 写入需高频，启用 batch insert，避免每条都触发 fsync

## 后续

- [ ] `design/state-machines.md` 写出 scheduler 推进逻辑伪代码
- [ ] `design/replay-and-recovery.md` 明确 heartbeat 间隔、lease 超时阈值
- [ ] 当远程模式上线后，性能 spike 评估是否需要引入 Redis

## 变更历史

| 日期 | 变更 |
|---|---|
| 2026-05-13 | 初次提议（来自 v0.4） |
| 2026-05-14 | 拆出独立 ADR 文件，补充 heartbeat/lease 实施提示 |
