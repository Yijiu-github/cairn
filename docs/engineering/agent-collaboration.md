# Agent Collaboration

> 状态：🟡 Draft
> 最后更新：2026-05-15
> 目的：把外部 agent skill 的工程实践转译为 Cairn 自己的协作与评审清单。

---

## 1. 定位

本文件是 Cairn 的 AI 协作执行手册，服务于产品裁剪人与 Codex 的协作。Codex 可以在需要时使用临时子任务或 review
清单，但项目计划不再假设固定的 UI / QA 专职 agent 角色。它吸收外部 agent skill 的实践，但不引入外部 skill 仓库作为运行时依赖。

如本文件与 `AGENTS.md` 或更具体的 `docs/` 设计文档冲突，以项目内更具体文档为准。

## 2. 使用原则

- **项目规则优先**：先读 `AGENTS.md`、产品边界、术语表、主设计文档与任务相关文档。
- **改写而非照搬**：外部 skill 可作为参考，不直接复制成 Cairn 的权威规则。
- **小步可验证**：每次变更尽量形成独立可验证的 slice，并附测试或文档校验。
- **文档跟随决策**：重大功能、接口、状态机、安全边界、数据模型变化必须同步文档。
- **保留人工裁剪权**：agent 可以给建议和风险，但范围、优先级、边界由产品裁剪人决定。
- **两人协作默认值**：UI、QA、文档和验证都必须写进每个任务的完成定义，而不是留给独立角色兜底。

## 3. Context Engineering 清单

开始任务前，按任务风险选择最小必要上下文：

- 仓库状态：`git status --short --branch`，确认是否有他人未提交改动。
- 产品边界：涉及方向、范围、权限、云端能力时读 `docs/product/positioning-and-boundaries.md`。
- 术语与模型：涉及 Workspace / Run / Task / AgentRun / Artifact / ContextPack 时读
  `docs/reference/glossary.md` 与 `docs/design/domain-model.md`。
- 契约与调用链：涉及 API、schema、runtime adapter、storage 时，先读 shared contracts、
  application service、workspace-core route、repository adapter 的相邻代码。
- 错误与证据：排查问题先收集错误栈、失败命令、日志、输入输出，不先猜修复。
- 外部资料：只有框架/API/依赖可能已变化或用户要求调研时，才查官方或一手资料，并在结论中说明来源。

避免：

- 用旧记忆替代仓库现状。
- 只读测试不读实现，或只读实现不读契约。
- 在没有证据时把推断写成事实。

## 4. API 与契约设计清单

涉及接口、schema、adapter、事件时，默认 contract-first：

- 先更新 `packages/shared_contracts` 的 Zod schema / ts-rest contract / WS event schema。
- 再更新 application service 与 repository port。
- 最后更新 workspace-core route、storage adapter 与调用方。
- 错误必须有稳定 code，边界层统一转译，不把内部异常结构直接暴露给 API。
- 新字段默认向后兼容：优先 optional/default，破坏性变更必须写迁移说明或 ADR。
- API 不返回大 payload；源码、日志、artifact 内容应通过引用或 artifact store 管理。
- 每个契约变化至少覆盖 schema 测试；跨层行为补 application 或 workspace-core 测试。

检查问题：

- 这个字段属于领域模型、传输 DTO，还是 runtime adapter 能力？
- Desktop 与 Web 是否会共享同一语义？
- 失败场景返回什么错误码？调用方能否恢复？
- 是否引入了隐式云端依赖或上传业务内容？

## 5. 文档与 ADR 清单

以下变化必须更新文档：

- 重大功能进入或退出 R1/R2/R3 范围。
- 领域对象、状态机、retry/rerun/replan 语义变化。
- API、adapter、事件、schema 或迁移策略变化。
- 安全边界、权限、secret、文件系统访问、遥测策略变化。
- 本地开发、CI、发布、安装、排错方式变化。

更新位置：

| 变化类型           | 文档位置                                            |
| ------------------ | --------------------------------------------------- |
| 产品范围           | `docs/product/`                                     |
| 领域模型 / 状态机  | `docs/design/domain-model.md` / `state-machines.md` |
| API / adapter 契约 | `docs/contracts/`                                   |
| 工程流程           | `docs/engineering/`                                 |
| 用户安装 / 排错    | `docs/ops/`                                         |
| 隐私 / 数据本地化  | `docs/legal/`                                       |
| 术语               | `docs/reference/glossary.md`                        |
| 用户可见或重要变更 | `CHANGELOG.md` 的 `[Unreleased]`                    |

ADR 规则：

- 已 Accepted 的 ADR 不直接修改，只能新建 ADR Supersede 或 refinement。
- 引入新基础设施、持久化策略、运行时边界、许可证/第三方依赖策略时，优先写 ADR。
- 小的实现细节不强行 ADR，写到对应设计或工程文档即可。

## 6. Code Review Quality Gate

提交或请求 review 前，先按 [`review-gates.md`](./review-gates.md) 给 diff 做风险分级，并输出 risk、changed surfaces、required verification、docs updated、findings 与 residual risk。

## 7. Review Risk Gate

工程 review gate 的权威规则已迁移到 [`review-gates.md`](./review-gates.md)。本文件只保留 AI 协作入口与上下文工程提示，避免 gate 规则在多个文档中分叉。

## 8. Frontend Gate

Desktop / Web UI 主线稳定前，本节作为占位；一旦 UI 进入可运行状态，UI PR 至少满足：

- 真实浏览器或 Electron 预览验证关键路径。
- UI 变更附截图、GIF 或可复现本地 URL。
- 响应式检查覆盖桌面与移动窄屏，文字不溢出、不重叠。
- 复用 `packages/ui` 组件与设计规范，不在页面里重建一套组件语言。
- 可访问性基础：键盘可达、语义标签、焦点状态、颜色对比。
- 不把桌面桥接能力当业务捷径；所有协作语义仍走 Workspace Core。

## 9. 外部 Skill 参考边界

外部 skill 仓库可以用于调研和启发，但落地时遵守：

- 不自动安装为所有 agent 的强制规则，避免与 `AGENTS.md`、本地技能和工具规则冲突。
- 不引入外部仓库代码或文本作为产品依赖；如需 vendoring，必须确认许可证并保留声明。
- 只把适合 Cairn 的 checklist 改写进项目文档。
- 对涉及 OpenAI、Electron、Fastify、Drizzle、SQLite、React 等会变化的信息，优先查官方文档。
- 后续参考项目统一记录在 [`../reference/external-project-radar.md`](../reference/external-project-radar.md)，进入对应阶段时再复查。

## 10. 变更历史

| 日期       | 变更                                                         |
| ---------- | ------------------------------------------------------------ |
| 2026-05-15 | 新增 review risk gate：diff 风险分级、变更提示清单与 QA 模板 |
| 2026-05-15 | 补充外部项目参考雷达入口                                     |
| 2026-05-15 | 初版：整理 context、contract、docs、review 与 frontend gate  |
