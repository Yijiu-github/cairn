# ADR-0017: 首发 Runtime Adapter 采用 OpenAI Codex CLI（子进程 + PTY）

- **状态**：🟢 Accepted
- **日期**：2026-05-14
- **决策者**：项目主理
- **关联**：ADR-0007、ADR-0014、[`../contracts/runtime-adapter.md`](../contracts/runtime-adapter.md)、[`../design/security-model.md`](../design/security-model.md)

---

## 背景

`docs/product/roadmap.md` 把"Codex runtime 首发接入"列为 R1 必交付项，但 v0.4 主稿与 R1 范围里"Codex"的实际形态一直没敲定。

候选含义：

- (a) OpenAI Codex CLI（开源命令行工具）
- (b) OpenAI Codex 推理模型 HTTP API
- (c) OpenAI Codex Cloud Agent
- (d) 自研抽象层

项目主理拍板：**(a) OpenAI Codex CLI**。

## 决策

**Cairn 首发 RuntimeAdapter 采用 OpenAI Codex CLI 子进程接入。**

具体地：

1. **接入方式**：通过 **PTY 子进程**（基于 `node-pty`）启动 `codex` CLI 进程
2. **运行模式**：使用 Codex CLI 的**非交互 / 机器可读模式**（具体 flag 待 spike 确认，如 `--json` / `--no-tty` / `--non-interactive`）
3. **凭据**：用户在 OS 安全存储（见 ADR-0010）中配置 OpenAI 凭据 / 登录态；Adapter 不接触原始凭据
4. **沙箱**：每次执行限定 cwd 在 `<userData>/Cairn/workspaces/<id>/runs/<run_id>/`；环境变量仅传必要项（`HOME`、`PATH`、`OPENAI_API_KEY` 等）
5. **取消**：通过 `SIGTERM`（5s 后升级到 `SIGKILL`）传播取消
6. **流式输出**：解析 Codex CLI 的 stdout（结构化 JSON 行模式），转换为 `AdapterStreamEvent`
7. **能力 profile**：诚实声明（如 `streaming: true`、`cancellable: true`、`toolCalling: ?`，具体在 spike 中验证）
8. **安装检测**：首次启动检测 `codex` 命令是否在 PATH 中，未安装时引导用户安装并提供链接

## 实施草案

### 包位置

```
packages/runtime_gateway/src/adapters/codex/
├─ codex-adapter.ts          # implements RuntimeAdapter
├─ codex-process.ts          # PTY 子进程封装
├─ codex-protocol.ts         # 解析 Codex CLI 的输出格式
├─ codex-capabilities.ts     # CapabilityProfile
├─ codex-errors.ts           # 错误码归一化映射
└─ __fixtures__/             # 测试用 mock 输出
```

### CapabilityProfile（首发占位，spike 验证后更新）

```ts
export const codexCapabilities: CapabilityProfile = {
  streaming: true,
  cancellable: true,
  toolCalling: true,          // Codex CLI 内置工具调用
  midStreamInjection: false,  // 暂不支持（待验证）
  idempotent: false,          // CLI 不保证幂等，由 Gateway 在本地做去重
  maxContextTokens: undefined, // 由具体模型决定
  maxOutputTokens: undefined,
  supportedArtifactKinds: ['text', 'patch', 'log'],
  models: [
    // 由 spike 时枚举 codex CLI 暴露的实际模型
  ],
};
```

### 启动 PTY 子进程

```ts
import * as pty from 'node-pty';

const child = pty.spawn('codex', [
  '--json',              // 待确认的真实 flag
  '--no-interactive',
  '--cwd', sandboxDir,
], {
  name: 'xterm-color',
  cols: 200,
  rows: 50,
  cwd: sandboxDir,
  env: {
    HOME: process.env.HOME,
    PATH: process.env.PATH,
    OPENAI_API_KEY: await secrets.get(`workspace:${wsId}:provider:openai`),
    NO_COLOR: '1',
  },
});
```

### 错误归一化

| Codex CLI 退出码 / 输出特征 | AdapterErrorCode |
|---|---|
| `command not found` / ENOENT | `MODEL_UNAVAILABLE`（adapter 未就绪） |
| 401 / `Unauthorized` | `AUTH_INVALID` |
| 429 / `Rate limit` | `AUTH_RATE_LIMITED` |
| Context 超限 | `CONTEXT_OVERFLOW` |
| 用户取消 / SIGTERM | `CANCELLED_BY_USER` |
| 超时 | `TIMEOUT` |
| 未知非零退出 | `INTERNAL_ERROR` |

### 安全约束（强制）

- ✅ 子进程必须 chdir 到 sandbox 目录
- ✅ 环境变量白名单（不直接 `...process.env`）
- ✅ 子进程必须在 Workspace Core 退出时被回收（`child.kill()` + 5s 后 `SIGKILL`）
- ✅ stdout / stderr 落 artifact，禁止直接打入业务日志（避免 secret 泄漏）
- ✅ Codex CLI 调用任何 shell 命令时，由 Codex CLI 自身的内置 sandbox 负责（不由 Cairn 二次封装）
- ❌ 不允许 Cairn 直接 spawn 任意 shell（命令白名单只有 `codex` 一个）

## 后果

### 好的

- 首发能力强：Codex CLI 已是成熟工具，省去自实现长任务 + 工具调用 + 文件编辑的工程量
- 与 ADR-0014 的 `RuntimeAdapter` 接口契合自然
- 用户体验：用户保留自己的 OpenAI 计费关系，Cairn 不做中间转发
- 可演进：未来加 Claude Code CLI / Aider 等 adapter，复用 PTY + 子进程的抽象

### 坏的

- **强依赖 Codex CLI 上游稳定性**：升级 / 输出格式变化会冲击 adapter
- **强依赖用户本机已装 Codex CLI**：首启用户旅程多了一步
- **PTY 不易调试**：跨平台（Windows ConPTY / macOS / Linux）行为差异需测试
- **沙箱与 Codex CLI 内置 sandbox 的边界需对齐**：避免双重沙箱冲突
- **商业条款**：用户使用 OpenAI 凭据须遵守 OpenAI 服务条款；Cairn 在 README / install-guide 中提示

### 中性的

- Codex CLI 自身的可观察性（stdout 格式）决定 Cairn 能展示多细的 trace
- 子进程是黑盒，无法直接观察其内部状态机；通过结构化输出 + heartbeat 间接推断

## 备选方案（已对比，未采纳）

- **(b) Codex 模型 HTTP API（codex-mini-latest 等）**：放弃为首选。需要 Cairn 自实现长任务 / 工具调用 / 文件编辑 / shell 沙箱，工程量大。**保留为 R2 备选**（如果 CLI 路线遇到不可解决障碍）。
- **(c) Cloud Agent**：放弃。云端 long-running 与本地优先调性冲突，且依赖 ChatGPT 计费关系，非通用模式。
- **(d) 自研抽象层**：放弃为首发。绕过 Codex 重新实现等价能力没必要。

## R2 候选 Adapter 清单

按优先级排：

### 1. Generic OpenAI-Compatible Adapter（强烈推荐 R2 首位）

一个适配层覆盖**所有遵循 OpenAI `chat/completions` 协议的服务**：

- Ollama（OpenAI 兼容模式）
- LM Studio
- llama.cpp server
- vLLM / SGLang
- LiteLLM gateway
- 用户自建反代 / OpenAI 兼容 endpoint
- OpenAI 官方 API（如选作 fallback）

**接入方式**：HTTP + SSE 流式；用户在 UI 配置 `base URL` + `api key` + `model name`。

**官方立场**（写入实施文档）：

- ✅ 支持任意符合 OpenAI 协议的 endpoint
- ❌ 不内置、不集成、不教学任何具体的第三方"订阅转 API"项目（如 sub2api / chat2api / gpt4free / cpa 等）——这些项目可能违反原服务 ToS、稳定性差、合规风险由用户自担
- ⚠️ UI 在配置自定义 endpoint 时**强制显示警告**：信任 / 隐私 / 合规由用户负责

详见 [`../legal/data-locality.md` §"用户自配 endpoint"](../legal/data-locality.md) 与 [`../ops/troubleshooting.md` §"自定义 endpoint"](../ops/troubleshooting.md)。

### 2. Anthropic API Adapter

- 直接 HTTP + SSE 调用 `messages` API
- 支持工具调用 / streaming / 长任务

### 3. Claude Code CLI Adapter

- 与 Codex CLI 同结构（PTY 子进程）
- 复用 ADR-0017 的工程模式

### 4. Local-only Models Adapter（可选）

- 完全 air-gapped 场景
- 不依赖任何外部网络

### 不采纳的 R2 候选

- **针对单一第三方 sub2api / cpa 项目的专属 adapter**：放弃。
  - 这些项目与官方处于对抗关系，接口/鉴权/可用性随时变化
  - 让 Cairn 跟踪具体项目动态会产生持续维护负担
  - 用户的需求通过 §1 的 Generic adapter 已经覆盖

## Spike（首发前必做）

**S5：Codex CLI 集成基线**（与 ADR-0014 的 S1–S4 并列）

1. 在 macOS / Windows 11 上分别 `codex --version` 验证已安装
2. 跑一个 5 分钟的中等任务，确认：
   - 输出可被解析为结构化事件
   - `SIGTERM` 能干净取消（含子工具调用）
   - 失败退出码能映射到 `AdapterErrorCode`
3. 确认 Codex CLI 实际 flag：是否有 `--json` / `--non-interactive` / `--machine-readable`
4. 测试 PTY 在 Windows ConPTY 下的行为
5. 沙箱 cwd 在两端的实际权限验证

**未通过的处理**：

- 如果 CLI 没有稳定机器可读输出格式 → 评估走 fallback 至 (b) API 形态（新 ADR supersede 本 ADR）
- 如果 PTY 跨平台不稳 → 评估改用纯 `child_process.spawn` + pipe（损失部分交互能力）

## 用户旅程要求（R1 install-guide / troubleshooting 必须覆盖）

1. **首次启动检测**：若未检测到 `codex` CLI，UI 显示提示与安装链接
2. **凭据配置**：UI → Providers → Codex，引导用户登录或粘贴 API key
3. **失败排错**：常见错误码（rate limit / auth / context overflow）的中文提示
4. **数据流提示**：明确告知用户"输入将发送给 OpenAI"，符合 `data-locality.md` 承诺

## 后续

- [ ] 完成 Spike S5，结果写回本 ADR 的"能力 profile"与"实施细节"
- [ ] 起草 `packages/runtime_gateway/src/adapters/codex/codex-adapter.ts` 骨架
- [ ] 更新 `docs/contracts/runtime-adapter.md` 的"首发 adapter"节
- [ ] 更新 `docs/ops/install-guide.md` 与 `docs/ops/troubleshooting.md`（首启检测 + 排错）
- [ ] 起草 mock-codex adapter（用于无 Codex CLI 环境的测试）
- [ ] 评估 R2 是否承诺第二个 adapter（候选：Claude Code CLI / Anthropic API）

## 变更历史

| 日期 | 变更 |
|---|---|
| 2026-05-14 | 初版，首发 adapter 形态确认为 Codex CLI 子进程方式 |
