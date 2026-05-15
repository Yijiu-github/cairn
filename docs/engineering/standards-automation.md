# Standards Automation

> 状态：🟡 Draft
> 最后更新：2026-05-16
> 目的：记录工程规范中哪些已自动化、哪些待进入 `standards:check`、哪些保留人工 review。

---

## 1. 定位

本文不定义新规范，只记录规范如何被机器检查。规则来源：

- [`coding-standards.md`](./coding-standards.md)
- [`module-boundaries.md`](./module-boundaries.md)
- [`review-gates.md`](./review-gates.md)
- [`../reference/naming-conventions.md`](../reference/naming-conventions.md)

## 2. 已自动化

| 规则                                                 | 工具                 |
| ---------------------------------------------------- | -------------------- |
| TypeScript strict                                    | `tsconfig.base.json` |
| no explicit any                                      | ESLint               |
| no unsafe assignment / call / member access / return | ESLint               |
| no floating promises                                 | ESLint               |
| no console.log                                       | ESLint               |
| no direct `process` / `process.env`                  | ESLint               |
| import order                                         | ESLint               |
| filename kebab-case                                  | ESLint unicorn       |
| markdown lint                                        | markdownlint-cli2    |
| format                                               | Prettier             |
| bilingual Conventional Commit title                  | commitlint           |

## 3. Phase 2：`standards:check`

目标命令：

```bash
pnpm run standards:check
```

初期非阻塞，不纳入 `pnpm run check`。

第一批检查：

1. 禁止跨包相对导入 `../../packages/*`。
2. 禁止跨包导入 `src/internal/*`。
3. 检查 `@cairn/*` import 是否符合 `module-boundaries.md`。
4. 检查 public API 是否从 `src/index.ts` 或 package `exports` 暴露。
5. 检查新增文件命名是否符合 `naming-conventions.md`，并尊重例外清单。

候选后续检查：

1. 检查仓库内 Markdown 相对链接是否指向存在的文档或锚点。
2. 检查 `review-gates.md` 中 Changed Surfaces 标签是否被 review 输出机械复用。

## 4. Phase 3：CI 接入

接入条件：

- `standards:check` 在至少 5 个连续 PR 中无误伤。
- 例外清单已经写入文档。
- 失败信息能指出具体文件、import 和违反的边界。

接入步骤：

1. 将 `standards:check` 加入 `pnpm run check`。
2. 将对应命令加入 GitHub CI。
3. 在 `review-gates.md` 中把模块边界部分标为机器 gate。

## 5. 暂不自动化

以下规则继续人工 review：

- 错误码是否语义正确。
- 日志是否泄露业务内容、secret 或本地路径。
- 状态机设计是否符合产品语义。
- UI 是否过早绑定未定型 API。
- 是否需要 ADR。
- 是否违反产品边界。

## 6. 变更历史

| 日期       | 变更                                          |
| ---------- | --------------------------------------------- |
| 2026-05-16 | 初版：记录已自动化规则与 standards:check 路线 |
