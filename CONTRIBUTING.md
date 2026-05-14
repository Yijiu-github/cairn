# 贡献指南

欢迎对 **Cairn** 感兴趣！本项目使用 **Apache License 2.0** 开源（见 [`LICENSE`](LICENSE) 与 [ADR-0016](docs/adr/0016-license-apache-2.md)）。

> 本项目当前处于 **Pre-Release** 阶段，代码尚未启动。本文档先把流程规范定下来，后续启动时直接套用。

---

## 当前贡献策略（重要）

**项目处于快速迭代期，暂不积极接受外部 Pull Request。**

请按以下方式协作：

| 你想……                     | 推荐渠道                                                           |
| -------------------------- | ------------------------------------------------------------------ |
| 提 bug                     | ✅ **GitHub Issues**（使用 bug 模板）                              |
| 提功能建议                 | ✅ **GitHub Issues**（使用 feature 模板）                          |
| 讨论设计 / 提问            | ✅ **GitHub Discussions**                                          |
| 报告安全问题               | ✅ **GitHub Security Advisory**（见 [`SECURITY.md`](SECURITY.md)） |
| 修小 typo / 显然错误       | ⚠️ 可提 PR，但 review 节奏不定                                     |
| 改架构 / 重写模块 / 新功能 | ❌ 暂不接受外部 PR，请先开 Issue 讨论                              |

理由：

- 团队规模与精力有限，外部 PR 的设计协商、review 与 merge 成本目前高于产出
- 现阶段产品边界仍在快速演进（见 [`docs/product/positioning-and-boundaries.md`](docs/product/positioning-and-boundaries.md)），早期 PR 容易做了又改
- 等项目进入稳定期（约 Release 2 之后）会重新开放积极的外部贡献

如果你强烈想做某项改动，**请先开 Issue 或 Discussion 与维护者对齐**。被 issue 中明确"欢迎 PR"标记后再动手，避免劳动浪费。

---

---

## 在动手之前

1. **读完愿景与边界**：[`docs/product/positioning-and-boundaries.md`](docs/product/positioning-and-boundaries.md) 与 [`docs/design/设计文档V0.1.0.md`](docs/design/设计文档V0.1.0.md)
2. **认领或开启 issue**：避免重复劳动；较大改动请先开 Discussion 或 Issue 对齐方向
3. **新设计决策必须先提 ADR**：见 [`docs/adr/0000-template.md`](docs/adr/0000-template.md)

---

## 提交流程

### 分支策略

- `main`：保护分支，仅通过 PR 合并
- 功能分支命名：`feat/<short-topic>` / `fix/<short-topic>` / `docs/<short-topic>` / `chore/<short-topic>`
- 不允许直接 push 到 `main`

完整规范见 [`docs/engineering/git-workflow.md`](docs/engineering/git-workflow.md)。

### Commit Message

使用 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/) 规范；**提交标题必须使用中英双语，且中文在前、英文在后**：

```text
<type>(<scope>): 中文摘要 / English summary

<body>

<footer>
```

示例：

```text
docs(contributing): 补充双语提交规范 / add bilingual commit convention
```

`type` 取值：`feat` / `fix` / `docs` / `refactor` / `test` / `chore` / `perf` / `build` / `ci` / `revert` / `style`。

详见 [`docs/engineering/commit-convention.md`](docs/engineering/commit-convention.md)。

### Pull Request

- 单 PR 单一目标，diff 控制在可 review 的范围内
- PR 描述使用仓库模板（[`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md)）
- 必须通过 CI（lint / typecheck / test）才能合并
- 涉及 UI 变化的 PR 附截图或 GIF
- 涉及 schema / API 变化的 PR 附迁移说明

---

## 代码规范

- TypeScript strict 模式
- ESLint + Prettier，提交前必须 lint pass
- 命名约定见 [`docs/reference/naming-conventions.md`](docs/reference/naming-conventions.md)（待写）
- 公共 API 必须有 JSDoc / TSDoc

完整规范见 [`docs/engineering/coding-standards.md`](docs/engineering/coding-standards.md)。

---

## 测试要求

- 新增功能必须附测试（unit + 关键路径 integration）
- 涉及状态机的改动必须覆盖 happy path + 至少一条 failure path
- 桌面端 e2e 使用 Playwright + Electron

详见 [`docs/engineering/testing-strategy.md`](docs/engineering/testing-strategy.md)。

---

## 文档贡献

文档与代码同等重要。修改设计 / ADR / 契约时，请同步：

- 更新对应 `docs/` 文件
- 在 PR 描述中注明影响范围
- 涉及术语变更时同步更新 [`docs/reference/glossary.md`](docs/reference/glossary.md)

---

## 沟通

- 一般问题：GitHub Discussions
- Bug：GitHub Issues（使用 bug 模板）
- 安全问题：见 [`SECURITY.md`](SECURITY.md)
- 行为准则：[`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md)
