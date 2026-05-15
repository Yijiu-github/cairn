# Engineering

回答："**怎么持续地把它做下去**"——给开发者和未来的自己看。

## 文件

| 文件                      | 作用                                                      | 状态     |
| ------------------------- | --------------------------------------------------------- | -------- |
| `repo-layout.md`          | apps / packages 责任 + 依赖方向                           | 🟡 Draft |
| `coding-standards.md`     | TS/ESM、错误处理、日志、异步、数据库、测试与公开 API 规则 | 🟡 Draft |
| `module-boundaries.md`    | 包职责、依赖方向、public/internal API 边界                | 🟡 Draft |
| `agent-collaboration.md`  | AI 协作、上下文工程、契约设计与文档/ADR 路由              | 🟡 Draft |
| `review-gates.md`         | 风险分级、验证命令、文档同步与 review 输出模板            | 🟡 Draft |
| `standards-automation.md` | 已自动化规则、standards:check 与 CI 接入路线              | 🟡 Draft |
| `git-workflow.md`         | 分支管理、远程分支生命周期、PR / release / hotfix 流程    | 🟡 Draft |
| `commit-convention.md`    | Conventional Commits + 中英双语提交规则 + commitlint      | 🟡 Draft |
| `testing-strategy.md`     | Unit / Contract / Integration / E2E 金字塔                | 🟡 Draft |
| `ci-cd.md`                | GitHub Actions 矩阵、签名公证、artifact 发布              | 🟡 Draft |
| `local-dev-setup.md`      | 本地一键起 desktop + workspace-core + web                 | 🟡 Draft |
| `release-playbook.md`     | 从 tag 到分发到回滚的逐步手册                             | 🟡 Draft |
| `db-migrations.md`        | Drizzle 迁移流程、SQLite↔PG 差异                          | ⚪ TODO  |
| `observability.md`        | 日志、trace_id、本地/远程 backend                         | ⚪ TODO  |

## 阅读顺序

新成员第一周：

1. `repo-layout.md` — 仓库怎么组织
2. `local-dev-setup.md` — 怎么把代码跑起来
3. `coding-standards.md` — 怎么写代码不被退回
4. `git-workflow.md` + `commit-convention.md` — 怎么提 PR
5. `testing-strategy.md` — 怎么证明你写的是对的

发布前：

- `release-playbook.md`
- `ci-cd.md`

## 与其他目录的关系

- `engineering/` 的所有规范都应可在 CI 中**机器检查**
- 规范变化必须配合 ADR（如果是结构性决策）或直接更新文档（如果是细节调整）
