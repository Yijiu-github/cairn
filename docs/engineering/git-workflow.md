# Git Workflow

> 状态：🟡 Draft  
> 最后更新：2026-05-15  
> 目的：明确 Cairn 仓库的分支、PR 与合并规则。

---

## 1. 分支角色

| 分支                    | 角色               | 规则                                                                              |
| ----------------------- | ------------------ | --------------------------------------------------------------------------------- |
| `main`                  | 稳定发布分支       | 只接受从 `dev` / `develop` 晋级的发布 PR；禁止功能分支直接提交或直接 PR 到 `main` |
| `dev` / `develop`       | 日常集成分支       | 所有功能、修复、文档分支的默认 PR 目标                                            |
| `feature/*`             | 功能开发           | 从 `dev` / `develop` 切出，完成后 PR 回 `dev` / `develop`                         |
| `fix/*`                 | 缺陷修复           | 从 `dev` / `develop` 切出，完成后 PR 回 `dev` / `develop`                         |
| `docs/*`                | 文档修改           | 从 `dev` / `develop` 切出，完成后 PR 回 `dev` / `develop`                         |
| `design/*`              | 设计与产品文档     | 从 `dev` / `develop` 切出，完成后 PR 回 `dev` / `develop`                         |
| `feature/desktop-ui-v0` | Desktop UI v0 实现 | 白霓负责的桌面端 UI / 交互 / 视觉实现分支，完成后拆小 PR 回 `develop`             |
| `haitang/qa`            | QA / 集成守门      | 海棠负责的测试、CI、文档对齐、合并前风险清单；不承载大功能开发                    |
| `release/*`             | 发布冻结           | 从 `dev` / `develop` 或 `main` 切出，视发布策略而定                               |
| `hotfix/*`              | 紧急线上修复       | 可从 `main` 切出，但合并后必须同步回 `dev` / `develop`                            |

> 当前远端已有 `origin/develop`。如果后续统一为 `dev`，需要同步更新 CI 与文档；在统一前，本文中的 `dev` 规则由 `develop` 承担。

## 2. 核心规则

1. **不能直接提交到 `main`**。
2. **除发布/紧急修复外，所有非主干分支都必须先 PR 到 `dev` / `develop`**。
3. 功能、修复、文档、设计分支不得直接 PR 到 `main`。
4. `main` 只用于稳定发布、tag 与 release 流程。
5. 如果 PR base 误选为 `main`，必须改回 `dev` / `develop` 后再 review。
6. 合并到 `dev` / `develop` 前至少通过基础 CI；文档-only PR 至少通过 docs lint。

## 3. 推荐流程

```bash
git fetch origin
git checkout develop
git pull --ff-only

git checkout -b docs/update-ux-specs
# 修改、验证、提交
git push -u origin docs/update-ux-specs
# GitHub PR base 选择 develop，不选 main
```

如果仓库已正式启用 `dev`：

```bash
git checkout dev
git pull --ff-only
git checkout -b feature/my-change
```

## 4. PR 目标选择

| 场景              | PR base                                                   |
| ----------------- | --------------------------------------------------------- |
| 普通功能          | `dev` / `develop`                                         |
| bug fix           | `dev` / `develop`                                         |
| 文档更新          | `dev` / `develop`                                         |
| 设计稿 / 产品文档 | `dev` / `develop`                                         |
| UI 实现           | `dev` / `develop`；大 UI 分支应拆小 PR                    |
| QA / 集成修复     | `dev` / `develop`；只提交可验证的小范围修复               |
| release 准备      | `main`，但来源应是 `dev` / `develop` 或 `release/*`       |
| hotfix            | 可 PR 到 `main`，但必须补一个同步 PR 回 `dev` / `develop` |

## 5. 多 Agent 协作角色

当前 Cairn 采用"一个产品裁剪人 + 多个专职 agent"：

- 产品裁剪人（Owner）：最终决定当前阶段做什么 / 不做什么；裁剪范围、排优先级、确认完成定义。
- Codex（本地）：主工程实现、核心框架设计、模块边界、主要代码推进。
- 白霓：Desktop UI v0、交互体验、视觉系统、组件与页面原型；推荐分支 `feature/desktop-ui-v0`。
- 海棠：QA / 集成守门、测试与 CI、文档对齐、架构边界检查、合并前风险清单；推荐分支 `haitang/qa`。

协作原则：Codex 负责往前造，白霓负责让产品可被理解和使用，海棠负责防止主线散架；所有 agent 都应给产品裁剪人提供利弊和建议，但最终范围决策以产品裁剪人为准。

## 6. PR 检查清单

提交 PR 前确认：

- [ ] base branch 是 `dev` / `develop`，不是 `main`（发布/热修除外）
- [ ] commit 标题符合 [`commit-convention.md`](./commit-convention.md)
- [ ] 本地已运行相关验证命令
- [ ] PR 描述写明变更范围、验证结果、风险点
- [ ] UI / 设计变更附截图或 SVG 参考
- [ ] 涉及危险权限、secret、本地路径时说明安全边界

## 7. 合并策略

- 默认使用 squash merge，保持 `dev` / `develop` 历史清晰。
- Squash commit 标题也必须符合双语 Conventional Commit 规范。
- 大型设计/文档 PR 可以保留多个 commit，但合并标题仍需规范。

## 8. 保护建议

建议在 GitHub Branch protection 中配置：

- 保护 `main`：禁止直接 push，要求 PR，要求 CI 通过。
- 保护 `dev` / `develop`：禁止直接 push，要求 PR，至少要求基础 CI/docs lint。
- 限制谁可以 bypass branch protection。
- 对 `main` 启用 require linear history 或 squash merge。

## 9. 变更历史

| 日期       | 变更                                                                              |
| ---------- | --------------------------------------------------------------------------------- |
| 2026-05-15 | 初版：明确所有普通分支必须先 PR 到 `dev` / `develop`，不能直接提交或 PR 到 `main` |
