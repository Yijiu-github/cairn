# Cairn 工程规范补强设计 / Engineering Standards Reinforcement Design

> 状态：Accepted
> 日期：2026-05-16
> 范围：coding standards、repo layout、naming conventions、module boundaries、review gates、standards automation

---

## 1. 目标

本设计用于把 Cairn 现有工程规范从“文档草案 + 部分工具强制”补强为分层清晰、可逐步机器化的治理体系。

它要解决五个问题：

1. `coding-standards.md` 与实际 `tsconfig.base.json` / `eslint.config.js` 不完全同步。
2. 命名规则散在 `coding-standards.md` 中，缺少长期参考页。
3. `repo-layout.md` 有依赖方向，但缺少更细的 package boundary 矩阵。
4. `agent-collaboration.md` 已有 review gate，但承载过多细节，工程 gate 需要独立权威页。
5. 模块边界目前主要靠人工 review，缺少未来可落地的 `standards:check` 路线。

## 2. 非目标

本设计不直接修改现有工具配置，不引入新依赖，不改变现有包结构，也不把所有规范立即接入 CI。

后续实施应分阶段推进，避免在 R1 工程基线仍快速变化时过早把规则硬化，阻塞核心闭环开发。

## 3. 推荐路径

采用 **分阶段治理**。

### Phase 1：文档对齐

先把工程规范文档与仓库现实对齐：

- 更新 `docs/engineering/coding-standards.md`
- 新建 `docs/reference/naming-conventions.md`
- 新建 `docs/engineering/module-boundaries.md`
- 新建 `docs/engineering/review-gates.md`
- 新建 `docs/engineering/standards-automation.md`
- 更新 `docs/engineering/README.md`
- 更新 `docs/engineering/agent-collaboration.md`，让它成为 AI 协作入口，而不是承载全部工程 gate 细节

### Phase 2：轻量机器检查

新增非阻塞脚本：

```bash
pnpm run standards:check
```

初期只检查最容易造成架构漂移的规则：

1. 禁止跨包相对导入 `../../packages/*`。
2. 禁止导入其他包的 `src/internal/*`。
3. 检查 `@cairn/*` import 是否符合 `module-boundaries.md` 的依赖矩阵。
4. 检查文件名 kebab-case，并保留明确例外。

Phase 2 初期不接入 `pnpm run check`，由 agent 和 reviewer 手动运行。

### Phase 3：CI 强化

当 `standards:check` 稳定后：

1. 加入 `pnpm run check`。
2. 加入 GitHub CI required check。
3. 在 `review-gates.md` 中把相关风险从人工 gate 升级为机器 gate。
4. 若规则误伤频繁，先调整例外或分级，不硬性扩大阻断范围。

## 4. 规范文档体系

建议形成五个权威页。

| 文档                                       | 职责                                                                                                         |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `docs/engineering/coding-standards.md`     | 单文件 / 单包代码规则：TypeScript、ESM、错误处理、日志、异步、数据库、测试、公开 API 文档                    |
| `docs/reference/naming-conventions.md`     | 命名规则：文件、目录、包、类型、变量、状态值、DB 字段、HTTP route、事件名、artifact type、runtime capability |
| `docs/engineering/module-boundaries.md`    | 跨模块依赖规则：包职责、允许依赖、禁止依赖、public exports、internal 目录                                    |
| `docs/engineering/review-gates.md`         | 人工评审门禁：风险分级、必跑命令、必须同步的文档、架构 review 条件                                           |
| `docs/engineering/standards-automation.md` | 机器检查路线：已自动化规则、待自动化规则、暂不自动化规则、CI 接入阶段                                        |

权威关系：

```text
coding-standards        写代码规则
naming-conventions      命名规则
module-boundaries       跨模块依赖规则
review-gates            人工评审门禁
standards-automation    机器检查与 CI 接入路线
```

`agent-collaboration.md` 继续作为 AI 协作入口，保留上下文工程、外部 skill 边界和协作原则；具体 review gate 细节迁移或路由到 `review-gates.md`。

## 5. Coding Standards 补强方向

`coding-standards.md` 应同步实际工具状态，并把规则分成三类：

| 类别       | 含义                                             | 示例                                                                                |
| ---------- | ------------------------------------------------ | ----------------------------------------------------------------------------------- |
| 已机器强制 | 当前 `tsconfig` / `eslint` / `commitlint` 已检查 | `strict`、`noImplicitAny`、`noUncheckedIndexedAccess`、`no-console`、`import/order` |
| 人工 gate  | 当前暂不适合自动化，但 review 必须检查           | 错误码语义、日志脱敏、公开 API 是否需要 TSDoc                                       |
| 待自动化   | 后续可进入 `standards:check` 或 ESLint           | 跨包边界、命名例外、internal import 禁止                                            |

还应修正过期内容：

- `.eslintrc.json` 已不是目标形态，实际使用 `eslint.config.js`。
- Prettier、Husky、lint-staged、tsconfig 已存在，不应继续写成“待提交模板”。
- `@cairn/observability` 尚未创建，日志规范应标注为“目标规则 / R1 待落地”，不能写成已可用 API。
- `@cairn/config` 尚未创建，禁止直接 `process.env` 已由 ESLint 强制，但统一 config 模块仍需后续实现。

## 6. Naming Conventions 设计

`docs/reference/naming-conventions.md` 应覆盖：

- 文件：kebab-case，例如 `orchestration-run-service.ts`。
- 测试：同目录 `*.spec.ts`。
- React 组件：文件 kebab-case，导出 PascalCase。
- 类型 / 接口：PascalCase。
- 变量 / 函数：camelCase。
- 常量：UPPER_SNAKE。
- DB 表 / 字段 / 枚举值：snake_case。
- HTTP route：kebab-case 路径片段，版本前缀 `/v1`。
- WebSocket event type：snake_case 或明确项目约定，需与 shared contracts 同步。
- Artifact type：snake_case。
- Runtime adapter capability：snake_case。
- Package：`@cairn/<kebab-name>`，目录可保留现有下划线包目录，但 package name 使用 kebab-case。

命名文档需要说明例外来源：工具配置文件、Drizzle migration 文件、生成文件、第三方要求文件名。

## 7. Module Boundaries 设计

### 7.1 包职责矩阵

每个 app/package 都必须定义：

1. 负责什么。
2. 不负责什么。
3. 允许依赖谁。
4. 谁允许依赖它。

初版矩阵：

| 模块                        | 负责                                                                      | 允许依赖                                                                  | 禁止                                                                  |
| --------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `packages/shared_contracts` | Zod schemas、HTTP contracts、WS events、跨端 DTO                          | 无业务包                                                                  | `application`、`domain`、`storage`、`runtime_gateway`、`ui`、`apps/*` |
| `packages/domain`           | Drizzle schema、领域枚举、持久化 schema 形状                              | `shared_contracts`                                                        | `application`、`storage`、`runtime_gateway`、`apps/*`                 |
| `packages/storage`          | SQLite / Postgres 连接、迁移 runner、repository 实现、artifact store 实现 | `domain`、`shared_contracts`                                              | `application`、`runtime_gateway`、`apps/*`                            |
| `packages/runtime_gateway`  | RuntimeAdapter 契约、adapter conformance、mock / Codex adapter            | `shared_contracts`                                                        | `application`、`storage`、`apps/*`                                    |
| `packages/application`      | orchestration service、ports、operator action、状态推进                   | `domain`、`shared_contracts`、`runtime_gateway` 类型 / 端口               | storage 具体实现、workspace-core routes                               |
| `apps/workspace-core`       | HTTP API、组合 application / storage / runtime adapter、进程入口          | `application`、`storage`、`runtime_gateway`、`shared_contracts`、`domain` | 核心业务状态机逻辑                                                    |
| `packages/ui`               | UI primitives、feedback、Cairn 业务展示组件                               | `shared_contracts`                                                        | `workspace-core`、`storage`、`runtime_gateway`、`desktop_bridge`      |
| `packages/desktop_bridge`   | 桌面系统能力桥接                                                          | `shared_contracts`、`observability`                                       | 业务编排、状态机、storage 逻辑                                        |
| `apps/desktop`              | Electron shell 与 UI 组合                                                 | `ui`、`shared_contracts`、`desktop_bridge`                                | 绕过 Workspace Core 的业务流程                                        |
| `apps/web`                  | Web shell 与 UI 组合                                                      | `ui`、`shared_contracts`                                                  | 绕过 Workspace Core 的业务流程                                        |

### 7.2 导入规则

导入规则：

- 跨包只能使用 `@cairn/*` alias 或 package export。
- 禁止 `../../packages/*` 这类跨包相对路径。
- 禁止导入其他包的 `src/internal/*`。
- 禁止 app 反向导入另一个 app。
- 禁止 `packages/ui` 导入 runtime / storage / application。
- 禁止 `packages/runtime_gateway` 导入 application 或 storage。
- 禁止 `packages/storage` 导入 application。
- 禁止 `packages/desktop_bridge` 承载业务领域逻辑。

### 7.3 Public / internal 规则

每个包的 public API 只有：

- `src/index.ts`
- `package.json` 中显式 `exports` 的子路径，例如 `./schemas`、`./contracts`、`./adapters/mock`

其他目录默认 private。后续如果引入 `src/internal/`，跨包 import internal 必须由 `standards:check` 禁止。

## 8. Review Gates 设计

`review-gates.md` 应从 `agent-collaboration.md` 抽出并强化以下内容：

1. Risk levels：Low、Medium、High、Release。
2. Changed surfaces：schema、API、storage、runtime、security、docs、UI、desktop bridge、tooling。
3. Required verification：不同风险等级对应命令。
4. Docs updated：需要同步 `CHANGELOG.md`、design、contracts、ops、legal、ADR 的条件。
5. Residual risk：即使无问题也必须写剩余风险。
6. Module boundary checklist：是否违反 `module-boundaries.md`。
7. Naming checklist：新增 public API、route、event、artifact type 是否符合 `naming-conventions.md`。

`agent-collaboration.md` 应保留 Review 输出模板，但把详细规则链接到 `review-gates.md`。

## 9. Standards Automation 设计

`standards-automation.md` 应记录三类规则。

### 9.1 已自动化

- TypeScript strict：`tsconfig.base.json`
- ESLint strict typed rules：`eslint.config.js`
- no explicit any：ESLint
- no console：ESLint
- no direct `process.env`：ESLint
- import order：ESLint
- filename kebab-case：ESLint unicorn
- commit title bilingual Conventional Commit：commitlint
- Markdown lint：markdownlint-cli2
- format：Prettier

### 9.2 待自动化

- 跨包相对导入检查。
- `src/internal/*` 跨包导入检查。
- `@cairn/*` import 是否符合模块边界矩阵。
- package `exports` 与 public API 入口检查。
- 文件命名例外清单检查。
- `docs/engineering/repo-layout.md` 与实际 packages/apps 目录差异检查。

### 9.3 暂不自动化

- 错误码是否语义正确。
- 日志是否泄露业务内容或本地路径。
- 状态机设计是否符合产品语义。
- UI 是否过早绑定未定型 API。
- 是否需要 ADR。

## 10. 后续实施顺序

建议后续实施按以下顺序：

1. `coding-standards.md` 对齐实际工具配置。
2. 新建 `naming-conventions.md`。
3. 新建 `module-boundaries.md`。
4. 新建 `review-gates.md` 并更新 `agent-collaboration.md`。
5. 新建 `standards-automation.md`。
6. 更新 `docs/engineering/README.md` 与 `CHANGELOG.md`。
7. 再写 `standards:check` 实施计划。

## 11. 成功标准

这次规范补强完成后，应满足：

- 新协作者能从 `docs/engineering/README.md` 找到所有规范入口。
- agent 能明确知道代码规则、命名规则、模块边界、review gate 分别看哪里。
- 文档能区分“已机器强制”“人工 gate”“待自动化”。
- 模块依赖规则能被未来脚本转换为检查矩阵。
- 不引入产品边界外能力，不阻塞 R1 core 闭环推进。
