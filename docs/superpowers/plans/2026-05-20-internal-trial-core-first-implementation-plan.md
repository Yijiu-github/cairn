# Internal Trial Core-First Implementation Plan

> 状态：🗄️ Archived
> 创建：2026-05-20
> 归档更新：2026-05-22
> 用途：记录第一轮内部试用的原始任务拆分，不再作为当前执行清单。

---

## 1. 当前入口

本计划已被后续小提交和 handoff 接力取代。继续推进 internal trial 时，不要从本文件的 checkbox 继续执行；请改读：

1. [`2026-05-21-nightly-cleanup-handoff.md`](2026-05-21-nightly-cleanup-handoff.md)
2. [`../../STATUS.md`](../../STATUS.md)
3. [`../../ops/internal-trial-runbook.md`](../../ops/internal-trial-runbook.md)
4. 当前 `git status --short`、`git diff --name-only` 与 `git log --oneline -12`

保留本文件是为了追溯当时如何把“第一试用版”拆给子 agent，而不是为了维持一个长期待办列表。

---

## 2. 原始目标

交付一个开发者自运行的 `Desktop + embedded Workspace Core + Codex runtime` 内部试用闭环，要求具备：

- 真实 Codex 短任务执行证据
- Workspace Core run/task/agent-run/artifact/trace/replay 读取面
- Desktop 最小观察 UI
- 最小 operator action 证据
- 可重复的自动化 gate 与手动 smoke 记录方式

---

## 3. 原始任务包

原计划拆成 9 个任务包：

1. **Lock Internal Trial Docs and Gates**
   负责 runbook、README、STATUS、本地开发、测试策略和 changelog 的试用口径。
2. **Stabilize Workspace Core Trial Read Model**
   负责 replay-source/read model 与 contracts 的最小稳定形态。
3. **Harden Workspace Core Evidence Storage and Repository Behavior**
   负责 opaque payload refs、artifact store 原子写入与 SQLite 读取面稳定性。
4. **Harden Codex Runtime Trial Behavior**
   负责 Codex process/adapter 的非零退出、无输出、部分输出、stderr 与 cancel 行为。
5. **Wire Runtime Evidence Back Through Workspace Core**
   负责把 runtime 终态与取消证据映射回 application trace。
6. **Expand Desktop Bridge to the Real Trial Path**
   负责 main/preload/client/sidecar 的真实 Workspace Core allowlist bridge。
7. **Render Real Trial Evidence in Desktop**
   负责 renderer 观察真实 run、replay evidence、artifact/trace 摘要与空态/错误态。
8. **Add Minimum Trial Operator Actions**
   负责 cancel、retry task、rerun、operator note 的最小试用动作集。
9. **Final Trial Verification and Gate Closure**
   负责全量 gate、手动 smoke、状态页、runbook、testing strategy 与 changelog 收口。

---

## 4. 后续已拆分出的主线提交

截至 2026-05-22，已知主线已按更小 review chunk 拆分并提交，包括：

- `54c31f4` `test(contracts): 补齐回放契约覆盖 / cover replay contracts`
- `7ae1498` `fix(runtime): 收紧 Codex 终态证据 / harden codex terminal evidence`
- `b1a98ba` `fix(core): 收紧回放证据读取 / harden replay evidence reads`
- `aaea412` `fix(desktop): 修正 preload 构建输出 / fix preload build output`
- `09120c1` `feat(desktop): 收紧 Core 桥接边界 / harden core bridge boundary`
- `477c9ba` `feat(desktop): 接入回放观察台 / wire replay observer`
- `0cef705` `chore(ui-preview): 清理预览角色名 / clean preview role labels`
- `72299cc` `docs(trial): 精简内部试用文档 / simplify trial docs`

本归档文件不继续维护逐项完成状态；事实状态以后以 git log、STATUS、runbook 和 handoff 为准。

---

## 5. 仍然有效的执行原则

- 每轮只收一个清晰子块，避免宽 diff。
- 先读相邻代码和契约，再动实现。
- 保持 Desktop sidecar 默认 mock，真实 Codex 只通过 env opt-in。
- 不创建 `apps/web`，不宣称 public alpha、installer、signing 或 notarization。
- Accepted ADR 不直接改；如需记录 refinement，新建 ADR 或更新 Proposed ADR。
- 提交前跑与改动范围匹配的 targeted tests / lint / typecheck / docs lint / `git diff --check`。
