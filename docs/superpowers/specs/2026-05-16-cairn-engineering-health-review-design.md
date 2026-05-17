# Cairn 工程体检设计 / Engineering Health Review Design

> 状态：Accepted
> 日期：2026-05-16
> 分支：`develop`
> 基准提交：`cebd17e feat(ui): 添加 UI 组件预览应用 / add UI preview app`

---

## 1. 目标

本次工程体检用于回答一个问题：**当前 `develop` 分支的工程实际推进到了哪里，哪些链路已经可作为后续开发基础，哪些缺口会阻塞 R1 主线。**

它不是代码审查，也不是重新设计产品。体检结论应服务于近期排期、任务拆分和多 agent 协作校准。

## 2. 范围

体检按 R1 交付链路组织，而不是按文件树平铺：

1. 契约与领域模型
2. SQLite / storage
3. Application orchestration
4. Runtime Gateway / Codex adapter
5. Workspace Core HTTP API
6. Code Context
7. UI package / UI preview
8. Desktop / Web shell 缺口
9. R1 下一步优先级

明确不覆盖：

- 企业级多租户治理
- 外部 worker marketplace
- 拖拽 workflow builder
- 多 provider 全量适配
- Desktop 全权限无边界自动化

这些边界与 `docs/product/positioning-and-boundaries.md` 保持一致。

## 3. 事实基线

### 3.1 项目阶段

Cairn 当前处于 **R1 工程基线 + Workspace Core 最小闭环建设阶段**。

已经具备：

- pnpm workspace + Turborepo 工程基线
- shared contracts / domain schema / SQLite storage
- runtime gateway adapter 契约、mock adapter、Codex CLI adapter 基线
- application 层 single-worker orchestration 基线
- `apps/workspace-core` Fastify 最小服务与 SQLite repository
- Code Context R1a/R1b-a 基线
- `packages/ui` 共享 UI 包
- `apps/ui-preview` UI 组件与产品视图预览应用

仍未启动：

- `apps/desktop`
- `apps/web`
- `packages/desktop_bridge`
- `packages/observability`

### 3.2 本地验证

本次体检前已执行以下验证：

```bash
pnpm install --frozen-lockfile
pnpm run check
pnpm test
pnpm --filter @cairn/ui-preview build
```

结果：

- `pnpm install --frozen-lockfile` 通过
- `pnpm run check` 通过
- `pnpm test` 通过
- `pnpm --filter @cairn/ui-preview build` 通过

本地环境：

- Node：`v26.0.0`
- pnpm：`9.15.0`
- 当前分支：`develop`
- 当前提交：`cebd17e`

注意：`better-sqlite3` 在 Node 26 下安装成功，但预编译包下载超时后走本地编译，并出现 V8 deprecation warnings。当前不阻塞测试，但应记录为环境兼容观察项。

## 4. 状态判断口径

每个链路节点使用四档状态：

| 状态      | 含义                                         |
| --------- | -------------------------------------------- |
| 🟢 可用   | 有代码、有测试、验证通过，可作为后续开发基础 |
| 🟡 基线   | 结构已建立，但功能还薄，需要继续补主路径     |
| 🟠 风险   | 当前能过校验，但会影响下一阶段推进           |
| ⚪ 未启动 | 文档定义存在，代码尚未创建                   |

风险分级：

| 等级 | 含义                                 |
| ---- | ------------------------------------ |
| P0   | 不处理就无法进入下一阶段闭环         |
| P1   | 不影响当前测试通过，但会放大后续返工 |
| P2   | 短期可接受，需要在特定阶段前处理     |

## 5. 体检结构

每个链路节点按统一结构输出：

1. 当前状态
2. 已有证据
3. 主要缺口
4. 风险判断
5. 建议下一步

示例：

```text
Workspace Core
状态：🟡 基线
证据：Fastify app、/health、run/task/agent-run HTTP 闭环、SQLite repository、测试通过
缺口：真实 Codex adapter 尚未接入实际执行路径；retry/rerun/cancel API 未完整
风险：P1。如果继续堆 UI，可能提前绑定不稳定 API
下一步：先补 orchestration lifecycle/operator action 契约与 routes
```

## 6. 预期体检结论骨架

### 6.1 契约与领域模型

预期状态：🟢 可用 / 🟡 基线。

已有 shared contracts、Zod schemas、ts-rest contracts、domain Drizzle schema 与迁移。它们已经能承载当前 run/task/agent-run、conversation/event/message、artifact、trace、code context 等基础对象。

重点缺口：

- operator actions、retry/rerun/cancel 的 contract 仍需补齐
- planning artifact / Goal Planner 输出模型需要进一步落入契约
- TraceEvent 与 replay UI 的消费契约尚未形成闭环

### 6.2 SQLite / storage

预期状态：🟢 可用。

已有 better-sqlite3 连接封装、PRAGMA 初始化、domain migration runner 与测试。Workspace Core 已能使用 SQLite repository 持久化 run/task/agent-run 状态。

重点缺口：

- artifact store 真实文件内容写入、保留策略、导出边界尚未落地
- PostgreSQL-ready 的接口边界应继续保持，但 R1 不实现 PostgreSQL

### 6.3 Application orchestration

预期状态：🟡 基线。

已有 OrchestrationRun service、repository ports、Runtime Gateway 提交端口，以及 single-worker run 创建与 adapter event 状态推进测试。

重点缺口：

- run lifecycle 还偏最小闭环
- retry / rerun / cancel / operator note 语义尚未完整进入 application service
- 多 task DAG、planning artifact 与 recovery 流程未启动

### 6.4 Runtime Gateway / Codex adapter

预期状态：🟡 基线 / 🟠 风险。

已有 RuntimeAdapter 契约、capability profile、mock adapter、Codex CLI `exec --json` 参数构造、JSONL 解析、错误映射与子进程封装。

重点缺口：

- 真实 Codex CLI adapter 尚未进入 workspace-core 端到端执行路径
- 取消、错误归因、流式事件到 TraceEvent / AgentRun 的映射还需收口
- Codex CLI 版本与行为变化需要 conformance 或 smoke 保护

### 6.5 Workspace Core HTTP API

预期状态：🟡 基线。

已有 Fastify 服务、`GET /health`、run/task/agent-run HTTP 闭环、SQLite application repository、Code Context API 与 mock runtime 验证。

重点缺口：

- retry/rerun/cancel/operator action routes 未完整
- 真实 runtime execution path 未打通
- TraceEvent、Artifact、planner output 的 API 与持久化闭环仍需补齐
- sidecar loopback token 与 Desktop 嵌入模式尚未实现

### 6.6 Code Context

预期状态：🟡 基线。

已有 SourceRoot registry、本地文件清单 reindex、metadata-only code search、metadata-only ContextPack manifest，以及 excerpt 行号范围与保守 token 估算。

重点缺口：

- 文本搜索尚未补齐
- TS/JS symbol outline 尚未补齐
- import/export dependency edge 尚未补齐
- Planner 尚未真正消费 ContextPack

### 6.7 UI package / UI preview

预期状态：🟡 基线。

已有 `packages/ui` tokens、primitives、feedback、Cairn 业务组件基线，以及 `apps/ui-preview` 预览应用。UI preview 已能 production build。

重点缺口：

- `docs/STATUS.md` 尚未反映 UI preview 最新进展
- UI preview 仍是静态/预览层，不代表 Web Shell 或 Desktop Shell 已启动
- 后续 UI 不应反向决定领域对象、状态机或 Workspace Core API 语义

### 6.8 Desktop / Web shell

预期状态：⚪ 未启动。

文档中 Desktop / Web 的产品形态、共享核心原则、安全边界和 Release 目标已经明确，但代码目录仍未创建。

重点缺口：

- Electron Desktop Shell
- Web Shell
- Desktop sidecar 生命周期管理
- loopback token 鉴权
- preload / contextBridge allowlist
- Chat / Runs / Tasks / Run Detail / Artifact / Trace 视图接入

## 7. 重点风险

| 风险                                                        | 等级 | 判断                                                    |
| ----------------------------------------------------------- | ---- | ------------------------------------------------------- |
| 真实 Codex CLI 尚未打通 workspace-core 端到端执行           | P0   | 没有真实 runtime 闭环，R1 核心价值无法验证              |
| run lifecycle / operator action / retry-rerun-cancel 未完整 | P1   | 当前测试通过，但后续 UI 与 Desktop 接入会绑定不稳定语义 |
| Artifact / Trace 未形成可回放数据闭环                       | P1   | Cairn 的 run-driven 与 replay 价值尚不能完整落地        |
| Desktop Shell 未启动                                        | P1   | R1 是 Personal Desktop Edition，core 闭环稳定后必须启动 |
| UI preview 领先 STATUS 文档                                 | P2   | 容易让协作者误判 Web/Desktop 已启动                     |
| Node 26 不是文档主验证环境                                  | P2   | 当前可跑，但 native dependency 需要持续观察             |

## 8. 建议推进顺序

1. 补齐 Orchestration API 契约与 workspace-core routes：run lifecycle、operator action、retry/rerun/cancel。
2. 接上真实 Codex CLI adapter 的 workspace-core 端到端执行闭环。
3. 打通 Artifact / Trace 基线，让 run 可观察、可回放。
4. 继续 Code Context R1b：文本搜索、TS/JS symbol outline、import/export edges，并让 Planner 消费 ContextPack。
5. 更新 `docs/STATUS.md`，同步 UI preview、最新验证结果和环境风险。
6. 在 core 闭环稳定后启动 Desktop Shell slice：sidecar、loopback token、preload allowlist、最小视图接入。
7. UI preview 继续服务产品视图验证，但不早于 API 语义定型。

## 9. 不建议现在做的事

- 不建议启动复杂 workflow builder。
- 不建议扩展多 provider 或开放 marketplace。
- 不建议把 Desktop 做成全权限无边界自动化工具。
- 不建议让 UI preview 反向决定领域对象和状态机。
- 不建议绕过 Workspace Core 给 Desktop / Web 写单独快捷流程。
- 不建议在真实 runtime 闭环前投入过多 Web/Desktop 壳层复杂交互。

## 10. `docs/STATUS.md` 更新建议

后续可将以下内容合入 `docs/STATUS.md`：

- 将 `apps/ui-preview` 加入已存在 apps，标记为 🟡 基线。
- 将 `packages/ui` 从“共享 UI 包基线”更新为包含 tokens / primitives / feedback / Cairn 业务组件与 UI preview 验证。
- 在验证基线中补充：
  - `pnpm --filter @cairn/ui-preview build`
  - 当前 `pnpm run check` 与 `pnpm test` 在 Node 26 下通过。
- 在本地环境注意事项中补充：
  - Node 26 下 `better-sqlite3` 可本地编译通过，但预编译包可能不可用，需持续观察。
- 在 R1 未完成能力中继续明确：
  - `apps/desktop` 与 `apps/web` 未创建。
  - UI preview 不等于 Web Shell。

## 11. 通过标准

这份工程体检在满足以下条件时视为完成：

- 每个链路节点都有状态、证据、缺口、风险和下一步。
- 风险结论可直接转成任务或 issue。
- 不引入产品边界外能力。
- 不假设 Desktop / Web 已存在。
- 与当前验证结果和 `develop` 实际文件结构一致。
