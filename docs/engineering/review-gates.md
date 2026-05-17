# Review Gates

> 状态：🟡 Draft
> 最后更新：2026-05-16
> 目的：定义 Cairn 变更的风险分级、必跑验证、文档同步和 review 输出格式。

---

## 1. 定位

本文是工程 review 的权威 gate。AI 协作流程见 [`agent-collaboration.md`](./agent-collaboration.md)，代码规则见 [`coding-standards.md`](./coding-standards.md)，模块边界见 [`module-boundaries.md`](./module-boundaries.md)。

## 2. 风险分级

| 等级    | 典型 diff                                                       | 最低验证要求                                                      |
| ------- | --------------------------------------------------------------- | ----------------------------------------------------------------- |
| Low     | 文档、注释、README 索引、非行为性说明                           | `pnpm run docs:lint`、`pnpm run format:check`、`git diff --check` |
| Medium  | 单包内部逻辑、局部 UI、局部工具配置                             | 相关包 `typecheck` / `lint` / `test` + `git diff --check`         |
| High    | schema、API、迁移、状态机、runtime、storage、安全边界、跨包流程 | `pnpm run check` + 相关包测试 + 设计/ADR/CHANGELOG                |
| Release | 签名、安装器、更新、数据迁移、隐私/遥测、远程部署               | High 要求 + release playbook / 回滚说明                           |

风险取最高项，不按文件数量平均。

## 3. Changed Surfaces

review 必须标出涉及面：

- schema / DB
- API / contract
- state machine
- runtime / adapter
- storage / artifact
- security / privacy
- desktop bridge
- UI
- docs / ADR
- tooling / dependency

## 4. 必须显式检查的问题

### Schema / DB

- 是否新增字段、枚举、索引或迁移？
- 是否说明旧数据兼容策略？
- 是否同步 shared contracts 或 domain docs？

### API / Contract

- 请求、响应、错误码、状态码是否稳定？
- Desktop 与 Web 是否共享同一语义？
- 是否需要 schema / contract 测试？

### State Machine

- 是否修改状态、转移或终态不变量？
- 是否混用 retry / rerun / replan？
- 是否同步 `state-machines.md`？

### Runtime / Storage / Artifact / Trace

- runtime 错误是否被归一化？
- artifact 是否避免大 payload 或源码内容直接进 API？
- TraceEvent 是否支持 replay，而不是重新执行？

### Security / Privacy

- 是否涉及 secret、token、本地路径、诊断导出、遥测 payload？
- 是否上传业务内容？
- 是否绕过 loopback token 或 preload allowlist？

### Module Boundary

- 是否违反 [`module-boundaries.md`](./module-boundaries.md)？
- 是否跨包相对导入？
- 是否导入其他包 internal？
- 是否把业务逻辑塞进 route、adapter、bridge 或 UI？

### Naming

- 新 public API、route、event、artifact type、DB 字段是否符合 [`../reference/naming-conventions.md`](../reference/naming-conventions.md)？

## 5. 文档同步规则

| 变化类型           | 必须检查的文档                                                                         |
| ------------------ | -------------------------------------------------------------------------------------- |
| 产品范围           | `docs/product/`、必要时 ADR                                                            |
| 领域对象 / 状态机  | `docs/design/domain-model.md`、`docs/design/state-machines.md`                         |
| API / adapter      | `docs/contracts/`、shared contracts tests                                              |
| 工程规范           | `docs/engineering/`、`CHANGELOG.md`                                                    |
| 安全 / 隐私        | `docs/design/security-model.md`、`docs/design/telemetry-and-privacy.md`、`docs/legal/` |
| 用户安装 / 排错    | `docs/ops/`                                                                            |
| 用户可见或重要变更 | `CHANGELOG.md`                                                                         |

## 6. Review 输出格式

review 输出必须包含以下字段：

- `Risk:` 只能写 `Low`、`Medium`、`High` 或 `Release`。
- `Changed surfaces:` 写 §3 中实际涉及的 surfaces，用英文逗号分隔。
- `Required verification run:` 逐行列出已经运行或必须运行的命令。
- `Docs updated:` 逐行列出本次已同步的文档；纯代码变更且无需文档时写 `None required`。
- `Findings:` 先列阻塞问题；没有问题时写 `None`。
- `Residual risk:` 列出未覆盖风险；没有剩余风险时写 `None identified`。

示例：

```text
Risk: Low
Changed surfaces: docs, tooling
Required verification run:
- pnpm run docs:lint
- pnpm run format:check
- git diff --check
Docs updated:
- docs/engineering/coding-standards.md
Findings:
- None
Residual risk:
- None identified
```

## 7. 变更历史

| 日期       | 变更                                              |
| ---------- | ------------------------------------------------- |
| 2026-05-16 | 初版：从 agent collaboration 拆出工程 review gate |
