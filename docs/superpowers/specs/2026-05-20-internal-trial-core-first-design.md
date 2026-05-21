# Internal Trial Core-First Design

> 状态：🗄️ Archived
> 日期：2026-05-20
> 归档更新：2026-05-22
> 目标版本：第一试用版（内部开发者试用）

---

## 1. 归档说明

这份文档是 2026-05-20 为第一轮内部试用拆主线任务时使用的临时设计草稿。它不再是当前执行入口；当前事实基线以
[`../../STATUS.md`](../../STATUS.md)、[`../../ops/internal-trial-runbook.md`](../../ops/internal-trial-runbook.md)
和 [`../plans/2026-05-21-nightly-cleanup-handoff.md`](../plans/2026-05-21-nightly-cleanup-handoff.md)
为准。

保留本文件只用于回看当时的切分思路，避免后续 agent 把旧的缺口描述误读为仍未启动的主线。

---

## 2. 原始目标

第一轮内部试用采用 Core-first 路线，目标是把开发者环境里的
`Desktop + embedded Workspace Core + Codex runtime` 最小真实闭环跑通，并形成可重复验证、可诊断、可接力的工程基线。

该版本从一开始就不是外部 alpha，也不包含：

- `apps/web`
- 安装器、签名、公证、自动更新
- 面向外部用户的发布包装
- 完整 UI 视觉升级
- 企业/团队能力
- 复杂 Goal Planner 与多 Task DAG 生成
- 多 runtime 广覆盖
- 完整 operator cockpit

---

## 3. 原始工作流拆分

当时按以下 6 条线拆分：

- **A. 试用版基线与运行手册**：收口 scope、环境前提、smoke path、验收标准与排障入口。
- **B. Workspace Core 真实主链路**：稳定 run/read model、replay-source、artifact payload、trace timeline 与 SQLite 读取面。
- **C. Codex Runtime 真实执行闭环**：加固 Codex adapter、真实 smoke、取消/失败证据与 runtime artifact 规范。
- **D. Desktop 观察台最小接入**：打通 preload/main/renderer 到真实 Workspace Core 的最小观察路径。
- **E. 最小接管与失败恢复**：只保留 cancel、retry task、rerun、operator note 的内部试用动作集。
- **F. 质量门禁与试用前收口**：固化自动化 gate、手动 smoke checklist、已知限制与风险登记。

---

## 4. 原始子 Agent 边界

后续如需要复盘任务拆分，可参考当时的 5 条并行边界：

- **Agent-Docs**：只改文档，负责 A + F。
- **Agent-Core-ReadModel**：集中改 Workspace Core 与只读 contracts，负责 B1 + B2 + B4。
- **Agent-Core-Runtime**：集中改 runtime gateway 和 Workspace Core evidence 接入，负责 C1 + C2 + C3 + C4。
- **Agent-Desktop-Bridge**：只改 `apps/desktop/src/main` 与 `apps/desktop/src/preload`，负责 D1 + D2 + E3。
- **Agent-Desktop-Renderer**：只改 `apps/desktop/src/renderer`，负责 D3 + D4 + D5 + E4。

当时特别要求主线保留以下决策，避免并行修改造成契约冲突：

- `packages/shared_contracts` 的核心 schema 命名和字段语义
- `retry / rerun / cancel` 的最终状态语义
- 第一试用版 smoke 通过标准
- `replay-source` 的最终 shape

---

## 5. 当前执行口径

截至 2026-05-22，主线已拆成多轮小提交推进。当前后续任务不要照抄本归档草稿里的“当前缺口”，而应先读：

1. [`../../STATUS.md`](../../STATUS.md)
2. [`../../ops/internal-trial-runbook.md`](../../ops/internal-trial-runbook.md)
3. [`../plans/2026-05-21-nightly-cleanup-handoff.md`](../plans/2026-05-21-nightly-cleanup-handoff.md)
4. 当前 `git status --short` 与 `git log --oneline -12`

仍然有效的裁剪原则是：先确保“能真实跑、能看证据、能重复验证”，再做“更完整、更漂亮、更广覆盖”。
