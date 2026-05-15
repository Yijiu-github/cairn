# Cairn 分支管理设计 / Branch Management Design

> 状态：Accepted
> 日期：2026-05-16
> 适用范围：`main` / `develop` / feature、fix、docs、design、release、hotfix 与 agent 专项分支

---

## 1. 目标

本设计用于把 Cairn 的 Git 分支管理从“基础规则说明”收束为可执行的项目级治理规则，避免多 agent 并行时出现以下问题：

- `dev` / `develop` 并存导致 PR base 摇摆。
- 普通功能误 PR 到 `main`。
- 长期远程分支越来越多，难以判断哪些仍在使用。
- agent 专项分支承载过多功能，无法 review 或回收。
- release / hotfix 与日常集成分支回灌关系不清晰。

## 2. 核心决策

1. **统一使用 `develop` 作为日常集成分支**。不再新建或推广 `dev`。
2. **`main` 只承载稳定发布历史**。普通功能、修复、文档、设计 PR 不直接进 `main`。
3. **临时工作分支默认从 `develop` 切出并 PR 回 `develop`**。
4. **远程长期保留分支要少**：`main`、`develop`、少数明确 owner 的 agent/专项分支、活跃 `release/*` 或 `hotfix/*`。
5. **临时分支合并后删除远程引用**，避免远程分支成为状态垃圾堆。
6. **agent 专项分支不是无限集成分支**，需要定期拆小 PR 回 `develop`。

## 3. 分支分层

| 层级   | 分支                                                  | 用途                         | 生命周期         |
| ------ | ----------------------------------------------------- | ---------------------------- | ---------------- |
| 稳定层 | `main`                                                | 发布、tag、release notes     | 长期             |
| 集成层 | `develop`                                             | 日常集成、默认 PR base       | 长期             |
| 专项层 | `haitang/qa`、`feature/desktop-ui-v0`                 | 明确 owner 的持续专项工作    | 阶段性长期       |
| 工作层 | `feature/*`、`fix/*`、`docs/*`、`design/*`、`chore/*` | 普通任务分支                 | 短期，合并后删除 |
| 发布层 | `release/*`                                           | 发布冻结与候选修复           | 发布结束后删除   |
| 热修层 | `hotfix/*`                                            | 从 `main` 切出的线上紧急修复 | 合并并回灌后删除 |

## 4. 远程分支保留策略

长期保留：

- `main`
- `develop`
- `haitang/qa`
- 当前明确仍在推进的专项分支，例如 `feature/desktop-ui-v0`

短期保留：

- `feature/*`
- `fix/*`
- `docs/*`
- `design/*`
- `chore/*`
- `integration/*`

短期分支合并后应删除远程分支。未合并但超过两周无更新的短期分支，需要 owner 标注状态；无人认领则关闭 PR 并删除分支。

## 5. PR base 规则

默认 base：

- 普通功能：`develop`
- bug fix：`develop`
- 文档：`develop`
- 设计：`develop`
- UI 专项拆分 PR：`develop`
- QA / CI / 测试：`develop`

例外：

- release promotion：从 `develop` 或 `release/*` PR 到 `main`
- hotfix：从 `main` 切 `hotfix/*`，PR 到 `main`，合并后必须再同步回 `develop`

## 6. Agent 分支规则

Codex 默认不在长期专项分支上堆工作。普通任务使用短分支：

- `docs/<topic>`
- `design/<topic>`
- `feature/<topic>`
- `fix/<topic>`
- `chore/<topic>`

白霓可以使用 `feature/desktop-ui-v0` 做 Desktop UI v0 的阶段性工作，但每个可 review 的 slice 应拆 PR 回 `develop`。

海棠可以使用 `haitang/qa` 做 QA / 集成守门，但不承载大功能开发。QA 发现的问题应优先形成小的 `fix/*`、`docs/*` 或 `chore/*` 分支。

## 7. Release / hotfix 回灌

Release：

1. 从 `develop` 切 `release/<version>`。
2. 只接受发布阻塞修复、版本号、发布说明、安装与签名相关改动。
3. release 通过后 PR 到 `main`。
4. 如 release 分支包含额外修复，必须同步回 `develop`。
5. 发布后删除 `release/<version>`。

Hotfix：

1. 从 `main` 切 `hotfix/<issue>`。
2. 修复后 PR 到 `main`。
3. 合并后 tag 或补丁发布。
4. 同一个修复必须 PR 回 `develop`。
5. 回灌完成后删除 `hotfix/<issue>`。

## 8. 非目标

本设计不引入 Git Flow 的重流程，不要求所有改动都有长期 release 分支，也不把 agent 专项分支变成新的主干。

本设计不改变 commit 标题规范；提交仍遵守 `docs/engineering/commit-convention.md` 的中英双语 Conventional Commit。

## 9. 落地方式

本设计的权威规则收敛进：

- `docs/engineering/git-workflow.md`

后续如果 CI、branch protection、PR template 需要跟进，应以该文件为准。
