# 内部试用运行手册 / Internal Trial Runbook

> 状态：🟡 Draft
> 最后更新：2026-05-21
> 适用对象：Cairn 项目内部开发者

---

## 1. 目的

这份手册定义 Cairn 第一轮**内部开发者试用**的统一口径，用于重复验证当前主线是否已经具备可演示、可排障、可复查的最小闭环。

这不是外部 alpha，不是公开预发布，也不是面向最终用户的安装说明。

---

## 2. 试用范围

本轮内部试用只覆盖以下链路：

- 开发者本机运行 `apps/desktop`
- Desktop 开发态验证最小 Workspace Core bridge；默认 mock sidecar，真实 Codex 仅通过 env opt-in；与外部手动启动 Core 的观察路径分开记录
- Workspace Core 通过 Codex Runtime Adapter 执行一条真实短任务
- 通过 API 或 Desktop 读取 run / task / agent-run / artifact / trace / replay evidence
- 验证最小观察与最小接管能力是否仍然成立

### 明确包含

- `apps/desktop`
- `apps/workspace-core`
- `packages/shared_contracts`
- `packages/application`
- `packages/runtime_gateway`
- 只读 replay / evidence 读取路径
- 最小 operator action 验证口径

### 明确不包含

- `apps/web`
- 安装器、签名、公证、notarization
- 对外分发包或公开试用说明
- 企业级审批、治理、多租户能力
- 复杂 workflow builder
- 桌面端无限制本地自动化能力

---

## 3. 进入试用前的前提条件

### 本机环境

- Node.js：以仓库 `.nvmrc` 为准
- pnpm：使用根 `package.json` / workspace 当前要求的版本范围
- 已执行 `pnpm install`
- 本机可执行 `codex`，或通过 `CAIRN_WORKSPACE_CORE_CODEX_EXECUTABLE` 指向可执行文件
- Codex CLI 已在当前机器完成本地登录或可用会话准备

### 约束与安全口径

- 真实 smoke 只允许使用合成 prompt
- 不在命令、截图、日志、artifact 中粘贴真实凭据
- 不输入客户数据、业务秘密或仓库外敏感内容
- 当前内部试用不是打包产物验证，默认在开发态完成

---

## 4. 基线验证命令

在做手动 smoke 之前，先确认基础门禁通过：

```bash
pnpm run check
pnpm test
pnpm --filter @cairn/ui-preview build
pnpm --filter @cairn/desktop build
```

预期：

- 所有命令通过
- 没有额外放宽测试、lint 或 build 门禁来“换取”试用通过

---

## 5. 启动方式

### 5.1 启动 Workspace Core Codex 开发态（手动 smoke 主路径）

```bash
CAIRN_WORKSPACE_CORE_RUNTIME=codex \
CAIRN_WORKSPACE_CORE_RUNTIME_WORKDIR="$PWD/.cairn/runtime/internal-trial" \
CAIRN_WORKSPACE_CORE_CODEX_SANDBOX_MODE=read-only \
pnpm --filter @cairn/workspace-core dev
```

`pnpm --filter @cairn/workspace-core dev` 会在 `apps/workspace-core` 包目录内执行脚本；这里使用
`$PWD/.cairn/...` 形式是为了让 Codex adapter 的受控工作目录稳定指向仓库根下的 ignored
本地目录，避免相对路径随包脚本工作目录漂移。

默认 API 地址：

```bash
export CAIRN_BASE_URL="${CAIRN_BASE_URL:-http://127.0.0.1:4321}"
```

如本地启用了认证，再显式设置本地开发 token：

```bash
# 仅在本地 dev auth 打开时设置
export CAIRN_AUTH_TOKEN='local-dev-token'
```

```bash
CAIRN_CURL_AUTH_ARGS=()
if [ -n "${CAIRN_AUTH_TOKEN:-}" ]; then
  CAIRN_CURL_AUTH_ARGS=(-H "Authorization: Bearer $CAIRN_AUTH_TOKEN")
fi
```

### 5.2 启动 Desktop 开发态（观察路径）

```bash
pnpm --filter @cairn/desktop dev
```

Desktop 开发态默认走 mock sidecar；通过 preload allowlist 中的 `workspaceCore.runInternalTrial()`
触发 `workspace-core:run-internal-trial` IPC 入口，可读取最小 replay evidence。

默认 Desktop sidecar runtime 是 mock。启动会写入不含 token 的诊断快照：

```text
<userData>/diagnostics/workspace-core-sidecar.json
```

该快照会记录 `runtime: "mock" | "codex"`，用于区分本次 sidecar 后端。

不设置 `CAIRN_DESKTOP_SIDECAR_RUNTIME=codex` 时，这条路径只验证 mock sidecar 与 bridge。
真实 Codex run 仍走 §5.1 的手动 API smoke 或 §5.3 的 Desktop sidecar opt-in 路径。

### 5.3 启动 Desktop + Codex sidecar 观察真实 run

如需让 Desktop 自行拉起 **Codex-backed Workspace Core sidecar**，请在启动 Desktop 前设置：

```bash
export CAIRN_DESKTOP_SIDECAR_RUNTIME=codex
export CAIRN_DESKTOP_SIDECAR_RUNTIME_WORKDIR="$PWD/.cairn/runtime/internal-trial"
export CAIRN_DESKTOP_SIDECAR_CODEX_SANDBOX_MODE=read-only
# 如 codex 不在 PATH，再显式指定
export CAIRN_DESKTOP_SIDECAR_CODEX_EXECUTABLE="${CAIRN_DESKTOP_SIDECAR_CODEX_EXECUTABLE:-$(command -v codex)}"
```

然后启动：

```bash
pnpm --filter @cairn/desktop dev
```

预期：

- sidecar 仍只绑定 loopback + launch-scoped bearer token
- Run Detail 读取到的是 **真实 Codex runtime** 产生的 run / task / agent-run / artifact / trace / replay evidence
- sidecar 诊断快照中的 `runtime` 为 `codex`
- 未设置上述环境变量时，Desktop 保持默认 mock sidecar 路径

---

## 6. 内部试用 Smoke Path

### 6.1 创建真实 run

先显式使用当前 Workspace Core 启动时的 bootstrap IDs。默认值需与
`apps/workspace-core/src/config.ts` 保持一致；如启动 Core 时覆盖过
`CAIRN_WORKSPACE_CORE_BOOTSTRAP_WORKSPACE_ID` / `CAIRN_WORKSPACE_CORE_BOOTSTRAP_EVENT_ID`，
这里必须同步覆盖，否则 SQLite 外键会拒绝创建 run。

```bash
export CAIRN_WORKSPACE_ID="${CAIRN_WORKSPACE_CORE_BOOTSTRAP_WORKSPACE_ID:-01J000000000000000000000W0}"
export CAIRN_EVENT_ID="${CAIRN_WORKSPACE_CORE_BOOTSTRAP_EVENT_ID:-01J000000000000000000000E0}"
```

```bash
curl -sS -X POST "$CAIRN_BASE_URL/v1/workspaces/$CAIRN_WORKSPACE_ID/runs" \
  "${CAIRN_CURL_AUTH_ARGS[@]}" \
  -H 'content-type: application/json' \
  -d "{\"originEventId\":\"$CAIRN_EVENT_ID\",\"task\":{\"taskKind\":\"custom\",\"title\":\"Internal trial smoke\",\"brief\":\"Synthetic internal-trial Codex smoke only.\"}}" \
  | tee /tmp/cairn-internal-trial-run.json
```

```bash
export CAIRN_RUN_ID="$(jq -r '.orchestrationRunId' /tmp/cairn-internal-trial-run.json)"
```

### 6.2 读取 task 并提交真实 Codex AgentRun

```bash
curl -sS "$CAIRN_BASE_URL/v1/runs/$CAIRN_RUN_ID/tasks" \
  "${CAIRN_CURL_AUTH_ARGS[@]}" \
  | tee /tmp/cairn-internal-trial-tasks.json
```

```bash
export CAIRN_TASK_ID="$(jq -r '.items[0].taskId' /tmp/cairn-internal-trial-tasks.json)"
```

```bash
curl -sS -X POST "$CAIRN_BASE_URL/v1/tasks/$CAIRN_TASK_ID/agent-runs" \
  "${CAIRN_CURL_AUTH_ARGS[@]}" \
  -H 'content-type: application/json' \
  -d '{"runtimeType":"codex","model":"default","prompt":"Reply with exactly: Cairn internal trial ok"}' \
  | tee /tmp/cairn-internal-trial-agent-run.json
```

```bash
export CAIRN_AGENT_RUN_ID="$(jq -r '.agentRunId' /tmp/cairn-internal-trial-agent-run.json)"
```

### 6.3 Drain runtime events

```bash
curl -sS -X POST "$CAIRN_BASE_URL/v1/agent-runs/$CAIRN_AGENT_RUN_ID/drain-runtime" \
  "${CAIRN_CURL_AUTH_ARGS[@]}" \
  -H 'content-type: application/json' \
  -d '{}' \
  | tee /tmp/cairn-internal-trial-drain.json
```

### 6.4 确认终态与证据可读

```bash
curl -sS "$CAIRN_BASE_URL/v1/agent-runs/$CAIRN_AGENT_RUN_ID" \
  "${CAIRN_CURL_AUTH_ARGS[@]}" \
  | tee /tmp/cairn-internal-trial-final-agent-run.json

curl -sS "$CAIRN_BASE_URL/v1/tasks/$CAIRN_TASK_ID" \
  "${CAIRN_CURL_AUTH_ARGS[@]}" \
  | tee /tmp/cairn-internal-trial-final-task.json

curl -sS "$CAIRN_BASE_URL/v1/runs/$CAIRN_RUN_ID" \
  "${CAIRN_CURL_AUTH_ARGS[@]}" \
  | tee /tmp/cairn-internal-trial-final-run.json

curl -sS "$CAIRN_BASE_URL/v1/runs/$CAIRN_RUN_ID/replay-source" \
  "${CAIRN_CURL_AUTH_ARGS[@]}" \
  | tee /tmp/cairn-internal-trial-replay-source.json
```

预期：

- `AgentRun`、`Task`、`OrchestrationRun` 到达终态
- `replay-source` 可返回 run、tasks、agentRuns、artifacts、traceEvents、inspector 最小结构
- artifact payload 可按当前 API 约束单独读取

### 6.5 Desktop 观察路径

- §5.2：mock sidecar，只验证最小 bridge 与 replay UI。
- §5.3：Codex-backed sidecar，验证真实 Codex runtime 的 Desktop evidence。
- 外部手动启动的 Workspace Core 不会被 Desktop 自动复用；如要对照，需单独记录其 `runId`。
- Run Detail 至少应能显示 run、task / agent-run、artifact / trace 摘要，并按需读取 bounded payload text。
- 2026-05-21 的 Desktop window-level Codex-backed smoke 仍只是手动证据，不等于自动 e2e 覆盖。

如果本次验证采用 `CAIRN_DESKTOP_SIDECAR_RUNTIME=codex`：

- 记录本次 Desktop 观察的是 sidecar 自拉起的真实 Codex Core，而不是外部手工启动的 Core
- 如需复现同一条 run，建议记录 Desktop sidecar 对应的诊断快照位置与 runtime workdir，
  不记录 token 或完整本地敏感路径

### 6.6 最小 operator action

内部试用只要求验证**最小**接管动作链路，而不是完整操作台：

- 至少一次最小 operator action 可调用
- 相关状态或 evidence 更新可读
- 若本机会话不适合验证 cancel / retry / rerun，全量结果需明确记录为“本次未执行，原因是……”

最小可重复动作建议使用 operator note，因为它不改变已完成 run 的终态：

```bash
curl -sS -X POST "$CAIRN_BASE_URL/v1/runs/$CAIRN_RUN_ID/notes" \
  "${CAIRN_CURL_AUTH_ARGS[@]}" \
  -H 'content-type: application/json' \
  -d '{"note":"Synthetic internal-trial operator note.","visibility":"operator_only"}' \
  | tee /tmp/cairn-internal-trial-operator-note.json
```

随后重新读取 replay-source，并确认新增 trace event 的 `eventType` 为 `operator.note`。

### 6.7 结果记录

每次内部试用结束后，请把以下信息追加到本手册或配套 handoff。建议使用短表，不再扩写长段叙述：

| 项目                 | 记录                                         |
| -------------------- | -------------------------------------------- |
| sidecar 模式         | mock / `CAIRN_DESKTOP_SIDECAR_RUNTIME=codex` |
| run 证据             | `runId` / `taskId` / `agentRunId`            |
| 终态                 | 是否达到                                     |
| replay evidence      | 是否可读                                     |
| 最小 operator action | 是否执行                                     |
| 失败摘要             | 是否已脱敏                                   |

---

## 7. 故障排查 / Failure Triage

### Workspace Core 启动失败

优先检查：

- `pnpm install` 是否完整
- Node 版本是否偏离 `.nvmrc`
- SQLite native binding 是否安装成功
- 端口 `4321` 是否被占用

建议动作：

- 重新执行 `pnpm install`
- 单独跑 `pnpm --filter @cairn/workspace-core test`
- 查看终端中的 Fastify / storage 初始化错误

### Codex runtime 不可用

优先检查：

- `codex` 是否在 `PATH`
- `CAIRN_WORKSPACE_CORE_CODEX_EXECUTABLE` 是否指向正确路径
- 当前机器是否已完成 Codex 登录

建议动作：

- 执行 `codex --help` 或等价健康命令确认 CLI 可启动
- 记录为“环境前提未满足”，不要把它误记为产品逻辑失败

### Run 无法进入终态

优先检查：

- `drain-runtime` 是否已调用
- Codex CLI 是否非零退出
- runtime stderr 是否给出可归类错误

建议动作：

- 读取 AgentRun 最终状态
- 读取 trace timeline，确认第一处失败点
- 记录失败时间、命令、sanitized 错误摘要

### Replay source 缺失或结构异常

优先检查：

- run 是否真实存在
- trace / artifact 是否已落库
- `GET /v1/runs/:runId/replay-source` 是否返回稳定最小结构

建议动作：

- 同时保存 run、task、agent-run、replay-source 响应
- 优先按“读取面不稳定”归类，而不是 UI 问题

### Desktop 无法显示 evidence

优先检查：

- Desktop 是否连到当前 sidecar / Workspace Core
- sidecar 诊断快照中的 `runtime` 是否符合本次预期（`mock` 或 `codex`）
- preload bridge 是否能读取 replay-source
- renderer 是否拿到了正确 `runId`

建议动作：

- 先用 API 确认 replay-source 可读
- 再把问题归类为 Desktop bridge / renderer 映射问题

---

## 8. 已知限制 / Known Limits

- `apps/web` 不在本轮内部试用范围内；当前也不覆盖安装器、签名、公证与升级体验。
- Desktop 仍是最小观察壳，不是完整产品 UI；operator action 只验证最小动作。
- 真实 Codex smoke 仍然是手动步骤，不进入默认自动化 CI。
- 真实长任务、复杂 payload、长时取消链路仍可能存在平台差异。

### 8.0 真实 Codex window-level e2e 当前边界

当前 `pnpm --filter @cairn/desktop test:e2e` 只验证默认 mock sidecar 的窗口 ready smoke。
它会在 `main-window-ready-to-show` 后立即退出，不会自动执行以下真实 Codex 链路：

- 通过 renderer / preload 触发 `workspaceCore.runInternalTrial()`
- 等待真实 Codex-backed sidecar 完成 run / task / agent-run
- 读取 replay evidence、bounded payload text 与 operator note 更新

因此，真实 Codex window-level e2e 现在仍不适合进入默认 CI。主要约束是：

- 依赖本机 Codex 登录态与可用会话，CI 无法默认提供
- 受 Codex CLI 版本、响应时延与平台环境影响，结果天然更 flaky
- 现有最小 smoke 脚本只观察窗口 ready，没有稳定的 renderer 驱动与断言入口

后续若要补这条自动化链路，应先把它定义为 opt-in 手动或专用 runner smoke，而不是默认 gate。

## 8.1 当前手动证据基线

### 2026-05-21 06:55 CST

- Desktop window-level Codex-backed internal-trial smoke 已有一次手动成功记录。
- Electron / CDP 可触发 `runInternalTrial()`，并读回同一条真实 run 的 replay evidence、bounded payload text 与 operator note。
- 该记录可作为后续接力基线，但仍不是自动化 e2e 覆盖。

### 2026-05-22 03:36 CST

- Workspace Core + Codex API smoke 已重新手动复核成功。
- 环境：macOS 15.7.4，Node v26.0.0，pnpm 9.15.0，`codex-cli 0.131.0-alpha.9`。
- `runId=01KS60FG1PCSXKCQKSX09WVZZF`，`taskId=01KS60FG1P4JFHD5JMEHZVR4Q4`，
  `agentRunId=01KS60GA1SNCKD6ANYQC917NGM`。
- run / task / agent-run 均到达 `succeeded`；replay-source 返回 2 个 artifact、13 条
  trace event；operator note 产生 1 条 `operator.note` trace event。
- 本次仅验证外部手动启动的 Codex-backed Workspace Core API smoke；未执行 Desktop
  Codex sidecar 观察路径，不代表真实 Codex 自动化 e2e 覆盖。

### 2026-05-21 06:20 CST

- Workspace Core + Codex API smoke 已有一次手动成功记录。
- run / task / agent-run 到达 `succeeded`，replay-source 可读，operator note 可回写为 `operator.note` trace event。
  -- 文档示例已改用当前契约允许的 `taskKind: "custom"`，并建议使用 `$PWD/.cairn/...` 形式的 runtime workdir，避免包脚本工作目录漂移。

## 9. Trial Gate

内部试用通过标准必须同时满足：

- `pnpm run check`
- `pnpm test`
- `pnpm --filter @cairn/ui-preview build`
- `pnpm --filter @cairn/desktop build`
- 手动 smoke 完成：触发一条真实 run，读取 replay evidence，验证最小 operator action，确认终态与证据更新

### 手动结果记录要求

每次内部试用至少记录：

- 验证日期
- 执行机器与 Node 版本
- 自动化门禁是否通过
- 手动 smoke 是否通过
- 若未通过，失败点在 Core、Runtime、Replay 还是 Desktop
- 若某一步未执行，原因是什么

---

## 10. 最终试用口径

只有在以下条件都成立时，才可宣称“第一轮内部 trial 可跑”：

- 当前分支文档与状态页已同步
- 自动化门禁通过
- 至少一条真实 Codex 短任务 smoke 已完成并有证据
- Desktop 能作为最小观察壳读取同一条 run 的 evidence
- 已知限制已明确记录，没有把未完成项包装成已交付能力
