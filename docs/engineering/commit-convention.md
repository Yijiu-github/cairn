# Commit Convention

> 状态：🟡 Draft
> 最后更新：2026-05-14
> 目的：统一 Cairn 仓库的提交标题、双语顺序与基础自动校验方式。

---

## 1. 强制格式

Cairn 使用 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/)；**提交标题必须同时写中文和英文，且中文在前、英文在后**。

```text
<type>(<scope>): 中文摘要 / English summary
```

示例：

```text
feat(runtime-gateway): 增加 adapter 健康检查 / add adapter health check
fix(design): 修正设计主稿引用路径 / fix design doc link paths
docs(contributing): 补充双语提交规范 / add bilingual commit convention
```

## 2. 标题规则

- `type` 必须符合 Conventional Commits 白名单
- `scope` 推荐写包名、模块名或文档域，使用 `kebab-case`
- 中文摘要与英文摘要之间固定使用 `/` 分隔
- **中文在前，英文在后**
- 标题只描述一件事，避免把多个改动塞进一个 commit
- 标题不以句号结尾
- 标题建议保持简洁；当前 `commitlint` 仍限制整行不超过 100 字符

## 3. 正文规则（可选，但推荐）

如果这次提交需要额外上下文，请继续写正文，并保持**中文块在前、英文块在后**：

```text
<type>(<scope>): 中文摘要 / English summary

CN:
- 中文补充说明 1
- 中文补充说明 2

EN:
- English detail 1
- English detail 2
```

要求：

- `CN:` 段先写，`EN:` 段后写
- 两段表达的事实应一致，不要中英内容互相矛盾
- 正文用于补充背景、影响面、迁移提示，不要把标题重复一遍

## 4. type 建议

- `feat`：新功能
- `fix`：缺陷修复
- `docs`：文档修改
- `refactor`：重构（不改变外部行为）
- `test`：测试
- `chore`：杂项维护
- `perf`：性能优化
- `build`：构建系统、依赖、打包链路
- `ci`：CI/CD 配置
- `revert`：回滚提交
- `style`：纯格式调整（不影响逻辑）

## 5. 推荐示例

### 代码功能

```text
feat(workspace-core): 增加 run 暂停接口 / add run pause endpoint
```

### 文档修订

```text
docs(product): 收紧本地优先边界表述 / tighten local-first boundary wording
```

### 修复问题

```text
fix(desktop-shell): 修正托盘菜单状态同步 / fix tray menu state sync
```

## 6. 不推荐示例

```text
feat: update stuff
```

问题：没有中文摘要、英文过于模糊、没有 scope。

```text
docs(readme): add commit rules / 补充提交规则
```

问题：顺序反了；应为**中文在前，英文在后**。

## 7. 自动校验范围

执行 `pnpm install` 后，`prepare` 脚本会运行 `husky install`，从而启用 `commit-msg` hook 与 `commitlint` 校验。

当前仓库会通过 `commitlint` 校验以下内容：

- Conventional Commit 的 `type`
- 标题非空、无句号结尾、长度上限
- 标题是否符合 `中文摘要 / English summary`
- 是否满足**中文在前、英文在后**

当前**自动强校验主要覆盖标题**。正文中的 `CN:` / `EN:` 双语块属于团队规范，当前阶段以人工 review 为主。

## 8. 分支与 PR 规则

提交前必须确认当前分支和 PR 目标符合仓库 Git 工作流：

- 禁止直接提交到 `main`。
- 普通功能、修复、文档、设计分支不得直接 PR 到 `main`。
- 所有非发布/非紧急修复分支必须先 PR 到 `dev` / `develop`。
- 当前远端已有 `origin/develop`；如果后续统一为 `dev`，以 [`git-workflow.md`](./git-workflow.md) 更新为准。

如果 PR base 误选为 `main`，应在 review 前改回 `dev` / `develop`。

## 9. 关联文档

- 仓库贡献入口：[`../../CONTRIBUTING.md`](../../CONTRIBUTING.md)
- Git 工作流：[`./git-workflow.md`](./git-workflow.md)
- 工程规范：[`./coding-standards.md`](./coding-standards.md)
- 本地开发：[`./local-dev-setup.md`](./local-dev-setup.md)
