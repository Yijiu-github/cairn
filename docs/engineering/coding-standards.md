# 代码规范 / Coding Standards

> 状态：🟡 Draft  
> 最后更新：2026-05-14  
> 关联：ADR-0002

---

## 1. 语言与版本

- **TypeScript**：5.x（具体版本随 release 升级时更新本节）
- **Node.js**：LTS（具体 LTS 版本在 `local-dev-setup.md` 钉死）
- **strict 模式**：必须开启

## 2. TypeScript 配置基线

`tsconfig.base.json` 必须包含：

```jsonc
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  }
}
```

## 3. Lint / Format

- **ESLint**：项目根统一配置；包级别可扩展不可覆盖
- **Prettier**：项目根唯一配置；不允许包级别 override
- **Pre-commit hook**：Husky + lint-staged，提交前自动 lint + format

### ESLint 关键规则（草案）

- `@typescript-eslint/recommended-strict`
- `import/order`（统一导入顺序）
- 禁止 `any`（必要时用 `unknown` + narrowing）
- 禁止 `console.log`（必须用 `@cairn/observability` 的 logger）
- 禁止 `process.env` 直接使用（必须经过统一 config 模块）

## 4. 命名约定

| 类型 | 规则 | 示例 |
|---|---|---|
| 文件 | kebab-case | `orchestration-run.ts` |
| 类型 / 接口 | PascalCase | `OrchestrationRun`, `RuntimeAdapter` |
| 变量 / 函数 | camelCase | `dispatchTask` |
| 常量 | UPPER_SNAKE | `MAX_RETRIES` |
| 枚举值 | snake_case（与 DB 一致） | `running`, `single_worker` |
| 包 | scoped + kebab | `@cairn/domain` |

详细见 [`../reference/naming-conventions.md`](../reference/naming-conventions.md)（待写）。

## 5. 模块导出

- 每个包通过 `src/index.ts` 暴露公开 API
- 不允许跨包导入 `**/internal/**`
- 跨包引用只能通过路径别名（见 `repo-layout.md §7`）

## 6. 错误处理

- 自定义错误类继承 `BaseError`（在 `@cairn/observability`）
- 抛出错误必须携带 `code` + `message` + `cause`
- 不允许 `throw new Error("string")` 用于业务错误
- 边界处（API handler / IPC handler）必须捕获并转译为统一错误码

## 7. 日志规范

- 统一使用 `@cairn/observability` 的 logger（Pino-based）
- 必须 structured（不允许字符串拼接）
- 所有日志必须可被 `trace_id` 关联
- 不允许日志中出现 secret / 凭据 / 完整 prompt 内容（脱敏中间件）

```ts
logger.info({ traceId, runId, status: "started" }, "AgentRun started");
```

## 8. 注释与文档

- 公开 API（`src/index.ts` 导出的内容）必须 JSDoc / TSDoc
- 复杂算法 / 非平凡决策**必须**注释「为什么」
- 不写"代码做了什么"的废注释（如 `// increment counter`）
- TODO 必须带上下文：`// TODO(@you, 2026-XX-XX): reason`

## 9. 异步与并发

- 优先使用 `async / await`，避免裸 Promise 链
- `Promise.all` 用于明确无依赖的并发
- 长任务必须支持 cancel（`AbortSignal`）
- 不允许 fire-and-forget（必须 `await` 或显式 `void`）

## 10. 数据库代码

- 所有 SQL 通过 ORM（Drizzle）写出，不允许字符串拼接 SQL
- 跨数据库不一致的写法必须封装为 repository 方法
- 事务边界明确：`storage.tx(async (db) => {...})`
- 不允许在 `domain/` 直接引用 `storage/`

## 11. 测试代码

- 测试文件与被测代码同目录，命名 `*.spec.ts`
- 不允许测试代码引入业务逻辑分支
- 不允许测试代码直接读写真实数据库（用 in-memory 或 testcontainers）

## 12. 提交相关

- **Conventional Commits**：见 `commit-convention.md`（待写）
- **PR 要求**：见 `../../CONTRIBUTING.md`
- **PR 大小**：建议 ≤ 400 行 diff；超出需拆分或在描述中说明

## 13. 待办

- [ ] 提交 `.eslintrc.json` / `.prettierrc.json` / `tsconfig.base.json` 模板
- [ ] 提交 Husky + lint-staged 配置
- [ ] 提交 `naming-conventions.md`
- [ ] 提交 `commit-convention.md`

## 变更历史

| 日期 | 变更 |
|---|---|
| 2026-05-14 | 初版 |
