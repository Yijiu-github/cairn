# Git Workflow

> 状态：🟡 Draft
>
> 最后更新：2026-05-20
>
> 目的：明确 Cairn 仓库的分支管理、远程分支生命周期、PR 与合并规则。

---

## 1. 总原则

Cairn 当前统一采用 **`main` + `develop` + 短分支 PR** 的轻量分支模型。

核心规则：

1. `main` 是稳定发布分支，不接普通功能、修复、文档或设计 PR。
2. `develop` 是唯一日常集成分支，也是普通 PR 的默认 base。
3. 不再新建或推广 `dev` 分支；历史文档中的 `dev` 语义统一由 `develop` 承担。
4. 所有普通工作从 `develop` 切短分支，完成后 PR 回 `develop`。
5. 远程短分支合并后删除，避免远程分支长期堆积。
6. `integration/*` 只作为短期集成验证分支，不作为固定角色分支。
7. release / hotfix 是例外流程，必须按本文回灌规则同步回 `develop`。

## 2. 分支分层

| 层级   | 分支或模式                                            | 用途                             | 生命周期         |
| ------ | ----------------------------------------------------- | -------------------------------- | ---------------- |
| 稳定层 | `main`                                                | 发布、tag、release notes         | 长期             |
| 集成层 | `develop`                                             | 日常集成、默认 PR base           | 长期             |
| 集成层 | `integration/*`                                       | 临时跨分支验证或 CI 收口         | 短期，验证后删除 |
| 工作层 | `feature/*`、`fix/*`、`docs/*`、`design/*`、`chore/*` | 普通功能、修复、文档、设计、维护 | 短期，合并后删除 |
| 发布层 | `release/*`                                           | 发布冻结、候选修复               | 发布结束后删除   |
| 热修层 | `hotfix/*`                                            | 从 `main` 切出的线上紧急修复     | 合并并回灌后删除 |

## 3. 分支角色

| 分支或模式      | 角色           | 规则                                                             |
| --------------- | -------------- | ---------------------------------------------------------------- |
| `main`          | 稳定发布分支   | 只接受 release promotion 或 hotfix PR；禁止普通分支直接提交或 PR |
| `develop`       | 日常集成分支   | 所有普通功能、修复、文档、设计分支的默认 PR 目标                 |
| `feature/*`     | 功能开发       | 从 `develop` 切出，完成后 PR 回 `develop`                        |
| `fix/*`         | 缺陷修复       | 从 `develop` 切出，完成后 PR 回 `develop`                        |
| `docs/*`        | 文档修改       | 从 `develop` 切出，完成后 PR 回 `develop`                        |
| `design/*`      | 设计与产品文档 | 从 `develop` 切出，完成后 PR 回 `develop`                        |
| `chore/*`       | 工程维护       | 从 `develop` 切出，完成后 PR 回 `develop`                        |
| `integration/*` | 临时集成验证   | 只用于短期集成、冲突收口或 CI 验证，完成后删除                   |
| `release/*`     | 发布冻结       | 从 `develop` 切出，发布后 PR 到 `main`，并同步回 `develop`       |
| `hotfix/*`      | 紧急线上修复   | 从 `main` 切出，合并到 `main` 后必须同步回 `develop`             |

## 4. 远程分支保留策略

长期保留：

- `main`
- `develop`

短期保留：

- `feature/*`
- `fix/*`
- `docs/*`
- `design/*`
- `chore/*`
- `integration/*`

短期分支管理规则：

1. 合并后删除远程分支。
2. 关闭 PR 后删除远程分支，除非 owner 明确说明仍需保留。
3. 未合并但超过两周无更新的短期分支，需要 owner 标注状态。
4. 无 owner、无 PR、无近期更新的短期分支可以删除。
5. 删除远程分支前先确认没有未合并提交需要保留。

推荐清理命令：

```bash
git fetch --all --prune
git branch -r --sort=-committerdate
```

删除已确认无用的远程分支：

```bash
git push origin --delete docs/old-topic
```

## 5. 推荐开发流程

普通任务：

```bash
git fetch origin
git checkout develop
git pull --ff-only

git checkout -b docs/update-ux-specs
# 修改、验证、提交
git push -u origin docs/update-ux-specs
# GitHub PR base 选择 develop，不选 main
```

本地已有提交但还在 `develop` 上时，优先切出短分支再 push：

```bash
git checkout -b docs/current-work
git push -u origin docs/current-work
```

不要把普通任务直接 push 到 `origin/develop`。

## 6. PR 目标选择

| 场景              | PR base                                  |
| ----------------- | ---------------------------------------- |
| 普通功能          | `develop`                                |
| bug fix           | `develop`                                |
| 文档更新          | `develop`                                |
| 设计稿 / 产品文档 | `develop`                                |
| UI 实现           | `develop`；大 UI 分支应拆小 PR           |
| QA / 集成修复     | `develop`；只提交可验证的小范围修复      |
| release 准备      | `main`，但来源应是 `release/*`           |
| hotfix            | `main`，但必须补一个同步 PR 回 `develop` |

如果 PR base 误选为 `main`，必须改回 `develop` 后再 review。只有 release promotion 与 hotfix 可以进入 `main`。

## 7. Release 流程

Release 分支用于发布冻结，不作为长期开发分支。

流程：

1. 从 `develop` 切出 `release/<version>`。
2. 只接受发布阻塞修复、版本号、发布说明、安装、签名、公证、打包和回滚说明相关改动。
3. 发布候选通过验证后，从 `release/<version>` PR 到 `main`。
4. 如果 release 分支包含额外修复，必须 PR 或 fast-forward 同步回 `develop`。
5. 发布完成并回灌后删除 `release/<version>`。

示例：

```bash
git checkout develop
git pull --ff-only
git checkout -b release/0.1.0
```

## 8. Hotfix 流程

Hotfix 只用于已发布版本的紧急修复。

流程：

1. 从 `main` 切出 `hotfix/<issue>`。
2. 修复后 PR 到 `main`。
3. 合并后按发布手册 tag 或发布补丁版本。
4. 同一个修复必须同步回 `develop`。
5. 回灌完成后删除 `hotfix/<issue>`。

示例：

```bash
git checkout main
git pull --ff-only
git checkout -b hotfix/fix-startup-crash
```

## 9. 当前协作模型

当前 Cairn 按“产品裁剪人 + Codex”推进：

| 角色                | 责任边界                                                               | 推荐分支                              |
| ------------------- | ---------------------------------------------------------------------- | ------------------------------------- |
| 产品裁剪人（Owner） | 最终决定当前阶段做什么 / 不做什么；裁剪范围、排优先级、确认完成定义    | 不固定                                |
| Codex（本地）       | 主工程实现、核心框架设计、模块边界、代码推进、验证、文档同步与风险提示 | `develop` 或从 `develop` 切出的短分支 |

分支规则：

- Codex 默认使用短分支，不在 `develop` 上长期堆提交。
- UI、QA、文档与工程验证不再按固定角色分支拆分，而是纳入每个里程碑的完成定义。
- 如需跨分支收口，可临时创建 `integration/*`，验证完成后删除。
- 任何分支都不能绕过 PR review 和验证门禁。

协作原则：

1. Codex 负责往前造，但涉及产品边界时必须让产品裁剪人拍板。
2. 产品裁剪人保留最终范围决策权；Codex 主动给出利弊、风险与建议。
3. 普通功能 / 修复 / 文档 PR 的 base 仍为 `develop`；不要直接 PR 到 `main`。
4. 实际代码变更优先拆成短分支和小 PR。

## 10. PR 检查清单

提交 PR 前确认：

- [ ] base branch 是 `develop`，不是 `main`（发布/热修除外）
- [ ] 当前分支命名符合本文分支模式
- [ ] commit 标题符合 [`commit-convention.md`](./commit-convention.md)
- [ ] 本地已运行相关验证命令
- [ ] PR 描述写明变更范围、验证结果、风险点
- [ ] UI / 设计变更附截图、GIF 或可复现预览说明
- [ ] 涉及危险权限、secret、本地路径时说明安全边界
- [ ] 合并后可删除远程短分支，或已说明保留原因

## 11. 合并策略

- 默认使用 squash merge，保持 `develop` 历史清晰。
- Squash commit 标题也必须符合双语 Conventional Commit 规范。
- 大型设计/文档 PR 可以保留多个 commit，但合并标题仍需规范。
- 合并到 `develop` 前至少通过基础 CI；文档-only PR 至少通过 docs lint。
- 从 `develop` 晋级到 `main` 的 release promotion 必须记录验证结果与发布说明。

## 12. 保护建议

建议在 GitHub Branch protection 中配置：

- 保护 `main`：禁止直接 push，要求 PR，要求 CI 通过。
- 保护 `develop`：禁止直接 push，要求 PR，至少要求基础 CI/docs lint。
- 限制谁可以 bypass branch protection。
- 对 `main` 启用 require linear history 或 squash merge。
- 删除分支权限只授予 owner / maintainer，避免误删长期分支。

## 13. 非目标

本文不引入完整 Git Flow 重流程，不要求所有改动都有长期 release 分支，也不把临时集成分支变成新的主干。

本文不改变提交标题规范；提交仍遵守 [`commit-convention.md`](./commit-convention.md) 的中英双语 Conventional Commit。

## 14. 变更历史

| 日期       | 变更                                                                                 |
| ---------- | ------------------------------------------------------------------------------------ |
| 2026-05-20 | 收口为产品裁剪人 + Codex 两方协作，并移除固定 UI / QA 角色分支作为长期分支假设       |
| 2026-05-16 | 统一 `develop` 为日常集成分支，补充远程分支生命周期、agent 分支、release/hotfix 回灌 |
| 2026-05-15 | 初版：明确所有普通分支必须先 PR 到 `dev` / `develop`，不能直接提交或 PR 到 `main`    |
