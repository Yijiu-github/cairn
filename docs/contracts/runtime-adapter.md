# Runtime Adapter 契约

> 状态：🟡 Draft  
> 最后更新：2026-05-14  
> 关联：ADR-0004、`../design/domain-model.md`、`../design/state-machines.md`

---

## 1. 角色与边界

**Runtime Adapter** 是 Cairn 与具体 agent runtime（如 Codex、Claude、本地模型等）之间的适配层。

- 上游：`packages/runtime_gateway`
- 下游：具体 runtime（CLI 子进程 / HTTP API / 本地 SDK）
- 定位：**通用运行时接入层**。它负责把不同 runtime 统一成同一套执行契约，而不是为某个单独的第三方桥接项目编写专属产品逻辑。

Runtime Adapter **只负责执行**，不负责：

- 任务规划（属于 Supervisor）
- 状态持久化（属于 Workspace Core）
- Operator 接管（属于 application 层）

## 2. 接口契约（TypeScript 草案）

```ts
/**
 * RuntimeAdapter — 所有 runtime 实现的统一接口。
 * 每个 adapter 必须实现本接口并通过 Capability Profile 声明能力。
 */
export interface RuntimeAdapter {
  /** Adapter 静态信息 */
  readonly id: string; // e.g. "codex", "claude", "ollama"
  readonly displayName: string;
  readonly capabilities: CapabilityProfile;

  /** 启动 adapter（连接验证、健康检查） */
  init(ctx: AdapterContext): Promise<void>;

  /** 优雅关闭 */
  shutdown(): Promise<void>;

  /** 提交一次执行 */
  submit(request: AdapterSubmitRequest): Promise<AdapterSubmitAck>;

  /** 订阅一次执行的流式输出 */
  stream(runId: string): AsyncIterable<AdapterStreamEvent>;

  /** 取消一次执行（best-effort） */
  cancel(runId: string, reason?: string): Promise<AdapterCancelAck>;

  /** 查询一次执行的状态（兜底，正常应靠 stream） */
  query(runId: string): Promise<AdapterRunSnapshot>;
}
```

### 2.1 CapabilityProfile

```ts
export interface CapabilityProfile {
  /** 是否支持流式输出 */
  streaming: boolean;
  /** 是否支持取消 */
  cancellable: boolean;
  /** 是否支持工具调用（function call） */
  toolCalling: boolean;
  /** 是否支持中途注入额外上下文（operator note） */
  midStreamInjection: boolean;
  /** 是否支持幂等性提交（同 idempotency key 返回前次结果） */
  idempotent: boolean;
  /** 上下文窗口（token） */
  maxContextTokens?: number;
  /** 单次最大输出 */
  maxOutputTokens?: number;
  /** 支持的产出类型 */
  supportedArtifactKinds: ArtifactKind[];
  /** 支持的模型列表（adapter 侧） */
  models: ModelDescriptor[];
}
```

### 2.2 AdapterContext

```ts
export interface AdapterContext {
  /** 由 Workspace Core 注入的受控 secret 访问器 */
  secrets: SecretAccessor;
  /** 受控的临时工作目录 */
  workdir: string;
  /** 日志器（结构化） */
  logger: Logger;
  /** 配置（adapter-specific） */
  config: Record<string, unknown>;
}
```

### 2.3 AdapterSubmitRequest

```ts
export interface AdapterSubmitRequest {
  /** Cairn 的 AgentRun.run_id，作为外部 idempotency 基准 */
  runId: string;
  /** 调用模型 */
  model: string;
  /** 输入（统一为 artifact 引用，content 由 adapter 加载） */
  inputs: ArtifactRef[];
  /** 工具能力（如启用 tool calling） */
  tools?: ToolDescriptor[];
  /** 超时（毫秒） */
  timeoutMs?: number;
  /** 预算 hint（token / cost） */
  budget?: BudgetHint;
  /** Trace id（贯穿一切） */
  traceId: string;
  /** 额外参数（adapter-specific） */
  options?: Record<string, unknown>;
}
```

### 2.4 AdapterStreamEvent

```ts
export type AdapterStreamEvent =
  | { type: 'queued'; at: number }
  | { type: 'started'; at: number; providerRunId?: string }
  | { type: 'token'; at: number; delta: string }
  | { type: 'tool_call'; at: number; name: string; argsRef: ArtifactRef }
  | { type: 'tool_result'; at: number; name: string; resultRef: ArtifactRef }
  | { type: 'artifact'; at: number; artifact: ArtifactDescriptor }
  | { type: 'progress'; at: number; note: string }
  | { type: 'heartbeat'; at: number }
  | { type: 'succeeded'; at: number; finalArtifactRef: ArtifactRef }
  | { type: 'failed'; at: number; error: AdapterError }
  | { type: 'cancelled'; at: number; reason?: string }
  | { type: 'timeout'; at: number };
```

### 2.5 错误归一化（极重要）

不同 runtime 的错误码必须归一化为统一枚举，便于上层统一处理。

```ts
export interface AdapterError {
  code: AdapterErrorCode;
  message: string;
  retryable: boolean;
  /** 原始错误（供日志，不暴露给 UI） */
  cause?: unknown;
}

export type AdapterErrorCode =
  // 网络/连接
  | 'NETWORK_TIMEOUT'
  | 'NETWORK_UNREACHABLE'
  // 鉴权
  | 'AUTH_INVALID'
  | 'AUTH_EXPIRED'
  | 'AUTH_RATE_LIMITED'
  // 输入
  | 'INPUT_INVALID'
  | 'INPUT_TOO_LARGE'
  // 资源
  | 'CONTEXT_OVERFLOW'
  | 'BUDGET_EXCEEDED'
  | 'QUOTA_EXCEEDED'
  // 模型/服务
  | 'MODEL_UNAVAILABLE'
  | 'SERVICE_UNAVAILABLE'
  | 'INTERNAL_ERROR'
  // 工具
  | 'TOOL_EXECUTION_FAILED'
  | 'TOOL_PERMISSION_DENIED'
  // 其他
  | 'CANCELLED_BY_USER'
  | 'TIMEOUT'
  | 'UNKNOWN';
```

## 3. 生命周期与状态映射

Adapter 内部状态 → Cairn 的 AgentRun 状态（在 Runtime Gateway 内做映射）：

| AdapterStreamEvent | AgentRun.status 转移                         |
| ------------------ | -------------------------------------------- |
| `queued`           | `submitted → queued`                         |
| `started`          | `queued → running`                           |
| `heartbeat`        | 更新 `heartbeat_at`                          |
| `succeeded`        | `running → succeeded`                        |
| `failed`           | `* → failed`（依 error code 决定 retryable） |
| `cancelled`        | `* → cancelled`                              |
| `timeout`          | `* → timeout`                                |

**adapter 应每 ≤ 15s 发送一次 `heartbeat` 或其他事件**，否则 Gateway 视为可能丢失。

## 4. 实施约束

### 4.1 必须做

- 实现完整的 `RuntimeAdapter` 接口
- 完成错误归一化映射
- 提供 capability profile
- 单元测试覆盖：submit / stream / cancel / 错误归一化
- 提供集成测试（mock runtime 或真实 sandbox）

### 4.2 禁止做

- 不允许直接读写 Cairn 数据库
- 不允许直接落 artifact 文件（必须通过 Gateway 提供的 API）
- 不允许在 adapter 内做"任务规划"或"结果综合"——那是 Supervisor 的事
- 不允许在错误时静默吞掉（必须返回归一化错误）
- 不允许在不支持的能力上"假装支持"（在 capability profile 中诚实声明）

### 4.3 推荐做

- 子进程类 adapter（如 CLI tool）使用 `node-pty`，支持 `cancel()` 通过 SIGTERM/SIGKILL
- 内部并发请求做连接池
- 长流式响应做背压控制
- 工具调用沙箱化（见 [`../design/security-model.md#9-第三方-runtime-命令执行`](../design/security-model.md#9-第三方-runtime-命令执行)）

## 5. 首发 adapter

### Release 1：OpenAI Codex CLI（已拍板）

详细形态见 [ADR-0017](../adr/0017-codex-cli-runtime-adapter.md)。

要点：

- 接入方式：**PTY 子进程**（`node-pty`）
- 运行模式：S5 在 Windows 11 验证 `codex exec --json` 可输出 stdout JSONL；首发实现优先采用 `child_process.spawn` + stdout pipe，PTY 作为 fallback（见 [ADR-0018](../adr/0018-codex-cli-exec-jsonl-transport.md)）
- 凭据：用户 OS 安全存储（ADR-0010），Adapter 不接触原始凭据
- 沙箱：限定 cwd 到 `<userData>/Cairn/workspaces/<id>/runs/<run_id>/`，环境变量白名单
- 取消：`SIGTERM` → 5s 后 `SIGKILL`
- 流式输出：解析 stdout 结构化 JSON 行，转 `AdapterStreamEvent`
- 首启检测：未装 `codex` CLI 时，UI 引导安装

包位置：

```text
packages/runtime_gateway/src/adapters/codex/
├─ codex-adapter.ts
├─ codex-process.ts
├─ codex-protocol.ts
├─ codex-capabilities.ts
└─ codex-errors.ts
```

### Release 2 候选（尚未承诺，按优先级）

#### 1. Generic OpenAI-Compatible Adapter（强烈推荐 R2 首位）

一个 adapter 覆盖**所有遵循 OpenAI `chat/completions` 协议的 endpoint**：

- Ollama（OpenAI 兼容模式）
- LM Studio
- llama.cpp server
- vLLM / SGLang
- LiteLLM gateway
- OpenAI 官方 API（fallback）
- **用户自建 / 自配反代**（base URL 完全由用户填）

**接入方式**：HTTP POST + SSE 流式，UI 配置 `base URL` + `api key` + `model name`。

**官方立场**：

| 行为                                                                                    | 立场    |
| --------------------------------------------------------------------------------------- | ------- |
| 用户填任意符合 OpenAI 协议的 base URL                                                   | ✅ 支持 |
| 内置 / 推荐 / 教学任何具体"订阅转 API"项目（如 sub2api / chat2api / gpt4free / cpa 等） | ❌ 不做 |
| UI 配置自定义 endpoint 时显示警告                                                       | ✅ 强制 |

理由与免责见 [`../legal/data-locality.md` §"用户自配 endpoint 的责任边界"](../legal/data-locality.md)。

#### 2. Anthropic API Adapter

- 直接 HTTP + SSE 调用 `messages` API
- 支持工具调用 / streaming / 长任务

#### 3. Claude Code CLI Adapter

- PTY 子进程，结构同 Codex CLI Adapter（复用工程模式）

#### 4. Local-only Models Adapter（可选）

- air-gapped 场景，完全离线
- 通常用 §1 的 Generic adapter + Ollama 即可满足，单独立项的优先级低

#### 明确不做

- 针对**单一第三方 sub2api / cpa / 订阅转 API 项目**的专属 adapter
  - 这些项目与官方处于对抗关系，跟踪维护负担大
  - 用户需求通过 §1 的 Generic adapter 已覆盖

### 接入新 adapter 必备清单

每接入一个新 adapter，必须：

1. 提交独立 ADR（`docs/adr/`），描述选型与能力差异
2. 完整实现接口 + 通过 adapter conformance suite
3. 更新本契约的"首发 adapter"节
4. 在 Capability Profile 中**诚实**声明能力（不允许"假装支持"）
5. 更新 `docs/ops/install-guide.md`（如需用户额外配置）
6. 更新 `docs/ops/troubleshooting.md`（adapter 专属错误）

## 6. 待办

- [x] 澄清 Codex Adapter 的实际形态（CLI / API / 自研抽象）
- [ ] 起草 `packages/runtime_gateway/contracts/` 内的 Zod schema 草案
- [x] 起草 mock adapter（仅用于测试）
- [x] 起草 Codex CLI `exec --json` 进程封装与 JSONL parser
- [ ] 起草 adapter 的"开发者手册"，供第三方 / 未来接入者参考

## 变更历史

| 日期       | 变更                     |
| ---------- | ------------------------ |
| 2026-05-14 | 初版 TypeScript 接口草案 |
