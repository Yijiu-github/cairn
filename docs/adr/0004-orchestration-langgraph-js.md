# ADR-0004: 编排底座采用 LangGraph JS，产品状态模型自持

- **状态**：🟢 Accepted
- **日期**：2026-05-13
- **决策者**：项目主理
- **关联**：ADR-0002, [`../design/设计文档V0.1.0.md#95-编排层langgraph-js--自有-runtask-状态模型`](../design/设计文档V0.1.0.md)

---

## 背景

多 agent 协作工作台需要一套**长运行 agent workflow** 的执行基座，覆盖：

- 图式编排（DAG / state machine）
- 节点级 checkpoint 与恢复
- 流式输出
- 工具调用循环

候选：

- **LangGraph JS**（LangChain 出品，JS 官方版）
- **自研编排引擎**
- **使用 Python LangGraph，跨语言 RPC**

## 决策

1. **编排底座采用 LangGraph JS**
2. **产品的 run / task / artifact / trace 状态模型由我们自己定义和持久化**
3. LangGraph 只作为 **orchestration substrate**——它"能跑"不等于"产品状态成立"
4. UI 与领域对象**不允许直接绑定**到 LangGraph 内部结构
5. 保留替换底座的可能：在 `application/orchestration/` 内做适配层，允许未来切换到自研或其他实现

## 后果

### 好的

- 借力 LangGraph 的图编排、checkpoint、工具调用生态
- 不必为长运行 agent 编排押 Python
- 产品语义不被框架绑死，长期可演进

### 坏的

- LangGraph JS 在功能完整度上长期落后 Python 版，部分能力需要自实现或等待
- 需要维护"产品状态模型 ↔ LangGraph 内部状态"的同步逻辑
- 学习成本：团队需要同时理解产品状态机和 LangGraph 概念

### 中性的

- 必须有一个**内置的简化 scheduler 退路**，避免 LangGraph 重大问题阻塞整个项目
- 编排相关代码必须有充分测试覆盖（见 `engineering/testing-strategy.md`）

## 备选方案

- **自研编排引擎**：放弃为首选。重新发明轮子，开发周期长，但保留为最终退路。
- **Python LangGraph + 跨语言 RPC**：放弃。违反 ADR-0002，且增加进程拓扑复杂度。

## 实施提示

- `packages/application/orchestration/` 定义产品级状态机
- `packages/runtime_gateway/` 提交执行并回写结果
- LangGraph 节点函数包一层适配，输入输出都是产品级 DTO，不直接暴露 LangGraph 内部对象到上层
- 持久化层不存 LangGraph 的内部状态对象，只存领域对象（OrchestrationRun / Task / AgentRun / Artifact / TraceEvent）

## 后续

- [x] 在 [ADR-0014](0014-orchestration-scheduler-port.md) 中将"保留替换可能"落到接口层（`OrchestrationScheduler` 端口 + naive 退路实现）
- [ ] Spike：验证 LangGraph JS 在长运行 + 桌面崩溃恢复 + 取消传播下的行为（见 ADR-0014 S3/S4）
- [ ] 在 `design/state-machines.md` 中清晰定义产品状态机与 LangGraph 状态的映射边界

## 变更历史

| 日期       | 变更                                            |
| ---------- | ----------------------------------------------- |
| 2026-05-13 | 初次提议（来自 V0.1.0）                         |
| 2026-05-14 | 拆出独立 ADR 文件，强化「保留替换底座可能」表述 |
