# 外部项目参考雷达 / External Project Radar

> 状态：🟡 Draft
> 最后更新：2026-05-15
> 目的：记录 Cairn 后续可阶段性参考的外部项目，等主线推进到对应能力时再吸取优点。

---

## 1. 使用原则

这份文档是“参考雷达”，不是依赖清单，也不是采纳承诺。

- **到阶段再打开**：只在进入对应功能 slice 时重新阅读上游项目，避免现在过早设计。
- **先过 Cairn 边界**：所有参考都必须符合本地优先、自托管、双外壳共享核心、人类可接管的产品边界。
- **借鉴模式，不搬代码**：默认只吸收交互、数据结构、质量门禁与工程流程；引入代码、包、文本或生成物前必须另做许可证、安全与维护成本评估。
- **保留轻量路线**：R1 优先做最小闭环，不引入 marketplace、复杂 workflow builder、企业治理、多租户或自学习自治体系。
- **记录取舍**：每次真正吸收某个外部项目的做法时，同步更新相关设计文档、ADR 或 `CHANGELOG.md`。

优先级含义：

| 等级 | 含义                                |
| ---- | ----------------------------------- |
| P0   | 已经影响当前设计，近期继续参考      |
| P1   | 主线很快会用到，应在对应 slice 复查 |
| P2   | 中期参考，先记录不推进              |
| P3   | 远期雷达，只保留方向感              |

---

## 2. 项目清单

| 项目                                                                  | 优先级 | 对应阶段                       | 可借鉴点                                                                                                                                            | 暂不采用 / 注意边界                                                                                                                                             |
| --------------------------------------------------------------------- | ------ | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [GitNexus](https://github.com/abhigyanpatwari/GitNexus)               | P0     | Code Context R1b / R2          | 本地代码知识图谱、Tree-sitter 解析、MCP 查询、影响面分析、索引新鲜度、代码 wiki、CLI + Web bridge 的双入口体验。                                    | 不引入其代码、包或数据格式作为依赖；不自动改写用户 agent 配置；不接入外部发布/registry；企业版和商业授权能力只作为远期观察。                                    |
| [Graphify](https://github.com/safishamsi/graphify)                    | P0     | Code Context R1b / ContextPack | `graph.json` / HTML / report 的产物组合、`query/path/explain` 查询体验、增量更新、ignore 规则、关系置信度标签、跨代码/文档/数据源的图谱思路。       | R1 不提交第三方输出目录，不默认做多媒体/PDF/视频摄取，不让索引依赖模型 API；图谱产物要映射为 Cairn 的 Workspace Core API、TraceEvent 与 Artifact。              |
| [Ruflo](https://github.com/ruvnet/ruflo)                              | P1     | Orchestration / Agent Ops      | 项目状态页、Goal Planner 可视化、action tree / preconditions / blocked reason / replan reason、diff 风险评分、迁移/成本/观测插件的质量门禁。        | 不照搬 100+ agents、插件市场、自学习 swarm、跨组织 federation、多 provider 智能路由；R1 不做厚 workflow builder 或自动后台自治。                                |
| [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) | P1     | Agent 协作 / Review Gate       | 按开发生命周期组织技能、spec/plan/build/test/review/ship 的入口、反跳步提示、质量检查清单、测试/安全/性能/可访问性参考、review persona 的分工思路。 | 不把外部 skill 原文设为 Cairn 权威规则；不把工具专属 slash command 写进产品概念；只把适合 Cairn 的 checklist 改写进 `docs/engineering/agent-collaboration.md`。 |
| [obra/superpowers](https://github.com/obra/superpowers)               | P1     | Agent 协作 / 执行流程          | 先设计再计划、TDD、证据优先、分支完成检查、子任务 review、verification-before-completion 等可执行工作流。                                           | 不机械采用与本项目“默认可执行就执行”冲突的硬门禁；不在用户未要求时强制多 agent 执行；只保留流程纪律和验证意识。                                                 |
| [openai/skills](https://github.com/openai/skills)                     | P2     | Agent Skill 管理 / 文档组织    | skill 目录结构、可分发能力包、系统/curated/experimental 分层、每个 skill 独立许可证与安装说明的管理方式。                                           | 这是 Codex 能力生态参考，不是 Cairn 产品运行时依赖；如未来做 Cairn 内置 agent playbook，应自定义格式并与 `AGENTS.md`、项目文档保持一致。                        |

---

## 3. 阶段触发点

### Code Context R1b

重新查看 GitNexus 与 Graphify，重点只看：

- 如何表达文件、符号、依赖边、调用链与置信度。
- 如何判断索引 stale，以及如何把“需要重建索引”暴露给 agent / UI。
- 如何做影响面查询与 ContextPack 选择解释。
- 如何避免把源码内容、密钥和本地路径泄露到诊断或远端服务。

对应 Cairn 文档：

- [`../design/code-context-index.md`](../design/code-context-index.md)
- [`../design/security-model.md`](../design/security-model.md)
- [`../design/telemetry-and-privacy.md`](../design/telemetry-and-privacy.md)

### Orchestration / Planning

重新查看 Ruflo 的 Goal Planner 与状态页，重点只看：

- 规划输出如何表示 action tree、preconditions、blocking reason、replan reason。
- 用户怎样看见“为什么停住、为什么重排、下一步要谁接管”。
- 风险评分如何帮助 review，而不是替代人的决策。

对应 Cairn 文档：

- [`../design/domain-model.md`](../design/domain-model.md)
- [`../design/state-machines.md`](../design/state-machines.md)
- [`../contracts/runtime-adapter.md`](../contracts/runtime-adapter.md)

### Agent 协作与工程质量

重新查看 agent-skills、Superpowers 与 openai/skills，重点只看：

- 哪些 checklist 能被 Cairn 本地化为协作说明。
- 哪些验证门禁适合放进 PR / review / release playbook。
- 哪些 skill 组织方式适合以后变成 Cairn 自己的 agent playbook。

对应 Cairn 文档：

- [`../engineering/agent-collaboration.md`](../engineering/agent-collaboration.md)
- [`../engineering/testing-strategy.md`](../engineering/testing-strategy.md)
- [`../engineering/release-playbook.md`](../engineering/release-playbook.md)

### Remote / Collaborative Workspace

进入 R2/R3 前再复查 Ruflo、GitNexus 的远程、多仓库、团队协作能力：

- 多 SourceRoot / 多 repo 的权限、索引新鲜度和影响面解释。
- 远程 Workspace 中源码与 artifact 的位置、保留策略和诊断导出边界。
- 小团队共享时，哪些信息应该共享，哪些必须留在本机或用户自控 server。

这部分在 R1 不实现。

---

## 4. 待补充观察

- Desktop UI 进入可运行阶段后，再单独整理同类工程控制台、任务时间线、artifact review 工具的 UI 参考。
- Codex CLI adapter 跑通真实任务后，再补充 runtime adapter / terminal orchestration 方向的外部项目。
- 远程部署进入 R2 前，再补充 self-hosted control plane、workspace server、artifact retention 方向的参考项目。

---

## 5. 变更历史

| 日期       | 变更                                                                           |
| ---------- | ------------------------------------------------------------------------------ |
| 2026-05-15 | 初版：记录 GitNexus、Graphify、Ruflo、agent-skills、Superpowers、OpenAI Skills |
