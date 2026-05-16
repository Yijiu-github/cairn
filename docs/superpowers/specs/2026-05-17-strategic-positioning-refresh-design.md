# Strategic Positioning Refresh Design

> 状态：Draft  
> 日期：2026-05-17  
> 关联：`docs/product/positioning-and-boundaries.md`、`docs/product/roadmap.md`、`docs/product/vision.md`、`README.md`

## 1. 背景

Codex、Claude Code 等官方 agent 工具正在快速补齐并行任务、worktree 隔离、后台执行、PR 生成等能力。Cairn 不能把“能派多个 agent 干活”作为核心护城河，否则会与官方 agent runner 正面竞争。

Cairn 当前文档已经明确面向“个人开发者与小技术团队”，并强调 local-first、self-hosted、Desktop/Web 共享核心、人类可接管。需要补充的是更清晰的市场切入顺序与差异化表达：**个人本地工作台是入口，小团队 agent 工程控制台是更强市场与变现方向；Cairn 不替代 Codex / Claude，而把它们纳入可观察、可回放、可接管的控制面。**

## 2. 战略判断

### 2.1 更容易被官方取代的能力

以下能力应视为基础设施，不作为 Cairn 的主卖点：

- worktree 创建与隔离。
- 并行 agent session。
- 基础任务分派。
- 自动运行测试。
- 生成 commit / PR。
- 单一 runtime 的代码生成质量。

这些能力会被 Codex、Claude Code、Cursor、Windsurf 等快速商品化。

### 2.2 Cairn 应放大的能力

Cairn 的差异应集中在官方 agent runner 之上的“工程控制面”：

- **Runtime-neutral control plane**：Codex、Claude、本地模型、OpenAI-compatible endpoint 都只是 Runtime Adapter。
- **Local-first trust**：任务、trace、artifact、planning output 默认落本地或用户自控 server。
- **Durable engineering memory**：保存跨会话、跨 runtime 的 run / task / artifact / trace / planning 历史。
- **Replay and audit**：能回答“谁让 agent 做了什么、为什么这样规划、哪里失败、如何恢复”。
- **Operator cockpit**：人类可以暂停、取消、重试、rerun、replan、注入说明、处理受保护步骤。
- **Small-team continuity**：从个人本地使用自然延展到 2–10 人团队共享观察面与工作区。

## 3. 定位微调

### 3.1 推荐一句话定位

> Cairn 是本地优先、可自托管的 Agent 工程控制台：先服务重度 AI 编程个人开发者，同时为 2–10 人小团队保留共享工作区、可观察、可回放与可接管的协作核心。

### 3.2 推荐英文短语

- Agent engineering control room
- Local-first agent control plane
- Durable memory and replay layer for coding agents

这些短语用于文档、README、未来 landing page 的辅助表达，不替换已有中文主叙事。

## 4. 市场切入策略

### 4.1 R1：个人本地工作台作为入口

R1 仍保持 Personal Desktop Edition。原因：

- 单人本地体验最容易做出闭环。
- 可以快速验证 Runtime Gateway、Workspace Core、Artifact、Trace、PlanningOutput、Operator control。
- 不需要过早引入团队权限、远程部署、共享状态冲突等复杂度。

R1 的表达重点应从“多 agent 协作演示”转为：

- 本地可信。
- 复杂 agent run 可观察。
- 结果和过程可回放。
- 人类可以接管。
- 不绑定某一家官方 agent。

### 4.2 R2：远程 workspace 打开团队入口

R2 的 Remote Workspace Edition 是从个人到小团队的桥。重点不是企业治理，而是：

- 用户自控 server。
- Web / Desktop 共享同一 Workspace Core。
- 团队成员可以查看同一批 run / artifact / trace。
- 第二 runtime adapter 证明 Cairn 的 runtime-neutral 价值。

### 4.3 R3：小团队控制台成为主要差异化

R3 的 Collaborative Workspace Edition 应聚焦小团队协作成本，而不是企业审批平台：

- shared workspace。
- protected task approval。
- operator handoff。
- run review / incident-style replay。
- 团队级 artifact / trace / planning 历史。

不做：SSO-heavy enterprise governance、多租户审批平台、marketplace、拖拽 workflow builder。

## 5. 文档更新范围

本次实施只微调产品战略文档，不改代码。

### 5.1 必改

- `README.md`
  - 更新一句话简介。
  - 在“这是什么”中加入“Agent 工程控制台 / control room”的表达。
  - 明确 Cairn 不替代 Codex / Claude，而是把它们作为 runtime 纳入控制面。

- `docs/product/positioning-and-boundaries.md`
  - 更新一句话定位。
  - 新增“市场切入顺序”：个人入口 → 远程 workspace → 小团队控制台。
  - 新增“与官方 agent 工具的关系”：不竞争代码生成能力，聚焦控制面、记忆层、审计层。

- `docs/product/roadmap.md`
  - 保持 R1/R2/R3 大方向不变。
  - 调整 R2/R3 目标表述：R2 是团队入口，R3 是小团队控制台，而非企业治理。

### 5.2 可选

- 新增 `docs/product/competitive-positioning.md`
  - 说明 Cairn 相对 Codex / Claude Code / Cursor / Windsurf 的差异化。
  - 作为后续 landing page、pitch、PRD 的参考。

### 5.3 不改

- 不改变当前工程架构。
- 不新增 Desktop / Web app。
- 不提前引入团队权限模型。
- 不修改 ADR。
- 不改变 R1 必须先个人本地闭环的节奏。

## 6. 成功标准

文档微调后，读者应能清楚理解：

1. Cairn 的近期入口仍是个人本地工作台。
2. Cairn 的长期更大市场是小团队 agent 工程控制台。
3. Cairn 不与 Codex / Claude Code 正面竞争 agent 能力，而是接入它们。
4. Cairn 的护城河是 local-first、runtime-neutral、durable memory、replay、audit、operator control。
5. Cairn 不滑向企业级治理平台、worker marketplace 或 workflow builder。

## 7. 风险与约束

- 过度强调团队会让 R1 范围膨胀；因此 R1 文档必须继续写清“个人本地优先”。
- 过度强调个人会削弱未来商业化叙事；因此 roadmap 和 positioning 应显式保留小团队路径。
- 不能把“官方工具会被接入”写成依赖官方私有 API；runtime adapter 必须保持抽象。
- 不能承诺尚未实现的 Web Shell、Desktop Shell、远程 workspace 或团队权限。
