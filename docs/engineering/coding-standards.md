# 代码规范 / Coding Standards

> 状态：🟡 Draft
> 最后更新：2026-05-16
> 关联：ADR-0002、[`repo-layout.md`](./repo-layout.md)、[`module-boundaries.md`](./module-boundaries.md)、[`../reference/naming-conventions.md`](../reference/naming-conventions.md)

---

## 1. 定位

本文规定 Cairn 单文件、单包内的代码书写规则。跨包依赖看 [`module-boundaries.md`](./module-boundaries.md)，命名细则看 [`../reference/naming-conventions.md`](../reference/naming-conventions.md)，提交与分支看 [`commit-convention.md`](./commit-convention.md) 与 [`git-workflow.md`](./git-workflow.md)。

规则分三类：

| 类别       | 含义                                                                            | 例子                                                               |
| ---------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| 已机器强制 | 当前 `tsconfig.base.json`、`eslint.config.js`、commitlint 或 lint-staged 已检查 | strict TS、no explicit any、no console、import order、commit title |
| 人工 gate  | 目前由 review 检查，不能只靠工具判断                                            | 错误码语义、日志脱敏、公开 API 是否需要 TSDoc                      |
| 待自动化   | 后续进入 `standards:check` 或 CI                                                | 跨包边界矩阵、public/internal import、repo layout drift            |

## 2. 语言与版本

- TypeScript：5.x，ESM only。
- Node.js：`package.json` 要求 `>=22.0.0`。
- pnpm：`package.json` 要求 `>=9.15.0`。
- 包必须声明 `"type": "module"`。

## 3. TypeScript 基线

`tsconfig.base.json` 是唯一根基线。以下规则已机器强制：

- `strict`
- `noImplicitAny`
- `strictNullChecks`
- `strictFunctionTypes`
- `strictBindCallApply`
- `strictPropertyInitialization`
- `noUncheckedIndexedAccess`
- `exactOptionalPropertyTypes`
- `noImplicitOverride`
- `noImplicitReturns`
- `noFallthroughCasesInSwitch`
- `noUnusedLocals`
- `noUnusedParameters`
- `noPropertyAccessFromIndexSignature`
- `verbatimModuleSyntax`
- `isolatedModules`
- `forceConsistentCasingInFileNames`

禁止为了通过局部代码而放松包级 tsconfig。确需例外时，先在 PR 中说明原因，再更新本文或相关 ADR。

## 4. ESLint / Prettier / Hooks

已机器强制：

- 根 `eslint.config.js` 使用 ESLint flat config。
- `typescript-eslint` strict typed rules。
- 禁止显式 `any`，测试文件除外。
- 禁止 unsafe assignment / call / member access / return。
- 禁止 floating promises。
- 强制 type-only imports / exports。
- 禁止 `console.log`；`console.warn` 与 `console.error` 当前允许。
- 禁止直接使用 `process` / `process.env`。
- 强制 import order。
- 强制文件名 kebab-case。
- Prettier 是唯一格式化器。
- Husky + lint-staged 在提交时对 staged 文件运行 ESLint / Prettier / markdownlint。

人工 gate：

- `console.warn` / `console.error` 只允许临时边界或 CLI 场景；长期业务日志应迁移到 `@cairn/observability`。
- 直接 `process.env` 已被禁止，但统一 config 包尚未创建；新增环境变量前必须说明读取边界。

## 5. 命名

简表：

| 类型        | 规则                          | 示例                                |
| ----------- | ----------------------------- | ----------------------------------- |
| 文件        | kebab-case                    | `orchestration-run-service.ts`      |
| 测试        | 与被测代码同目录，`*.spec.ts` | `orchestration-run-service.spec.ts` |
| 类型 / 接口 | PascalCase                    | `OrchestrationRun`                  |
| 变量 / 函数 | camelCase                     | `dispatchTask`                      |
| 常量        | UPPER_SNAKE                   | `MAX_RETRIES`                       |
| DB / 枚举值 | snake_case                    | `single_worker`                     |
| 包名        | scoped + kebab                | `@cairn/runtime-gateway`            |

完整命名规则见 [`../reference/naming-conventions.md`](../reference/naming-conventions.md)。

## 6. 模块导出与导入

- 每个包通过 `src/index.ts` 暴露默认公开 API。
- `package.json` 中显式 `exports` 的子路径也属于公开 API。
- 跨包引用必须使用 `@cairn/*` alias 或 package export。
- 不允许跨包相对导入 `../../packages/*`。
- 不允许跨包导入其他包的 `src/internal/*`。
- 依赖方向与边界见 [`module-boundaries.md`](./module-boundaries.md)。

## 7. 错误处理

目标规则：

- 业务错误应有稳定 `code`、人类可读 `message`、可选 `cause`。
- API / IPC / runtime 边界必须捕获内部异常并转译为稳定错误码。
- 不把内部异常结构、secret、本地路径或完整 prompt 暴露给外部响应。

当前状态：

- `@cairn/observability` 尚未创建，`BaseError` 规则暂属目标规则。
- 已存在包内错误类型时，应遵守同样的稳定 code 原则。

## 8. 日志规范

目标规则：

- 统一使用 `@cairn/observability` 的 structured logger。
- 日志必须可通过 `trace_id` / `run_id` / `agent_run_id` 关联。
- 不记录 secret、凭据、完整 prompt、业务内容 payload 或未脱敏本地路径。

当前状态：

- `@cairn/observability` 尚未创建。
- ESLint 已禁止 `console.log`，但 `console.warn` / `console.error` 仍需人工 review。

## 9. 异步与并发

- 优先使用 `async` / `await`。
- 明确无依赖并发才使用 `Promise.all`。
- 长任务必须支持 `AbortSignal` 或等价取消机制。
- 不允许隐式 fire-and-forget；必须 `await` 或显式 `void` 并说明原因。
- runtime adapter、workspace-core route、sidecar 生命周期相关代码必须考虑取消与清理。

## 10. 数据库代码

- 所有 SQL 通过 Drizzle 或 repository 封装，不允许字符串拼接 SQL。
- 跨数据库差异必须隐藏在 storage/repository 边界内。
- `domain` 定义 schema，不直接执行 storage 行为。
- `application` 依赖 repository port，不依赖 storage 具体实现。
- schema / migration 变化必须同步 `CHANGELOG.md`，必要时更新 design docs 或 ADR。

## 11. 测试代码

- 测试文件与被测代码同目录，命名 `*.spec.ts`。
- 契约或跨包测试按 [`testing-strategy.md`](./testing-strategy.md) 放置。
- 测试不得包含业务逻辑分支来“复刻实现”。
- 不依赖真实生产数据。
- SQLite 测试使用临时库或 in-memory 策略。
- skip 测试必须说明原因和恢复条件。

## 12. 公开 API 文档

人工 gate：

- `src/index.ts` 导出的稳定 public API 应有 TSDoc。
- package export 子路径暴露的 public API 应有 TSDoc。
- 纯内部 helper 不强制 TSDoc，但复杂决策应注释“为什么”。
- 不写解释代码表面行为的废注释。

TODO 格式：

```ts
// TODO(@owner, 2026-05-16): explain why this remains unresolved.
```

## 13. 提交与 PR

- Commit 标题必须符合 [`commit-convention.md`](./commit-convention.md)。
- 分支和 PR base 必须符合 [`git-workflow.md`](./git-workflow.md)。
- PR 风险分级与验证命令见 [`review-gates.md`](./review-gates.md)。
- PR 大小建议控制在 400 行 diff 左右；超出时拆分或在 PR 说明中解释。

## 14. 变更历史

| 日期       | 变更                                                                          |
| ---------- | ----------------------------------------------------------------------------- |
| 2026-05-16 | 对齐实际 tsconfig / eslint / hook 状态，拆分命名、模块边界与 review gate 引用 |
| 2026-05-14 | 初版                                                                          |
