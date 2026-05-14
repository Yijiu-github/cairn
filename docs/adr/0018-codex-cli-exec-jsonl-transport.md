# ADR-0018: Codex CLI Adapter 首发传输优先采用 `exec --json` stdout JSONL

- **状态**：🟡 Proposed
- **日期**：2026-05-14
- **决策者**：项目主理
- **关联**：[ADR-0017](0017-codex-cli-runtime-adapter.md)、[`../contracts/runtime-adapter.md`](../contracts/runtime-adapter.md)

---

## 背景

ADR-0017 已决定 R1 首发 Runtime Adapter 接入 OpenAI Codex CLI，并假设采用 PTY 子进程，具体非交互 / 机器可读 flag 留给 Spike S5 确认。

S5 在 Windows 11 本机验证到：

- `codex --version`：`codex-cli 0.130.0-alpha.5`
- `codex exec --version`：`codex-cli-exec 0.130.0-alpha.5`
- `codex exec --help` 明确提供 `--json`：stdout 输出 JSONL 事件
- `codex exec` 支持 `--sandbox read-only`、`--ephemeral`、`--skip-git-repo-check`、`--ignore-rules`、`-C <DIR>`
- `codex exec` 不支持顶层 `--ask-for-approval` 参数；approval 需要通过配置或默认非交互策略处理
- 最小任务 `Reply exactly: CAIRN_STDIO_OK` 成功返回 JSONL：
  - `thread.started`
  - `turn.started`
  - `item.completed`（`agent_message`）
  - `turn.completed`
- 结构化 JSONL 在 stdout；插件同步、PowerShell shell snapshot 等 warning 在 stderr

因此，首发实现不必立即依赖 PTY；普通子进程 stdout/stderr pipe 已能满足非交互 JSONL 解析。

## 决策

提议将 Codex CLI Adapter 的首发传输方式调整为：

> 首选 `child_process.spawn('codex', ['exec', '--json', ...])` + stdout JSONL parser；PTY 作为需要交互能力或 pipe 路线不稳定时的 fallback。

ADR-0017 的"首发 runtime 选 Codex CLI"仍然成立；本 ADR 只细化 / 调整子进程传输层。

## 后果

### 好的

- 实现更小：不用首发引入 `node-pty` native 依赖
- Windows 路线更稳：先避开 ConPTY 兼容性与终端编码问题
- 协议清晰：stdout 只解析 JSONL，stderr 作为 log/debug artifact
- 测试更容易：可以用 fixture JSONL 做 parser 单元测试

### 坏的

- 依赖 `codex exec --json` 的事件 schema 稳定性；上游 alpha 版本仍可能变化
- 如果未来需要中途注入 operator note，pipe 模式未必足够
- 取消语义仍需专门测试：`SIGTERM` / Windows process kill 是否能清理子工具调用尚未确认

### 中性的

- `exec-server` 当前存在但标记 experimental，不进入首发路径
- `--json` 输出事件粒度目前较粗，细粒度 trace 取决于 Codex CLI 后续输出

## 备选方案

- **继续首发 PTY**：保留为 fallback。PTY 更接近交互 CLI，但 native 依赖和 Windows ConPTY 行为增加首发风险。
- **使用 experimental `exec-server`**：暂不采用。它可能更适合长期 daemon 化，但目前不应作为 R1 必交付前提。
- **直接接 OpenAI HTTP API**：仍按 ADR-0017 放弃为首发，因为会要求 Cairn 自实现工具调用、文件编辑与 sandbox。

## 实施提示

首发 Codex adapter 命令形态建议：

```text
codex exec --json --color never --sandbox read-only --ephemeral --skip-git-repo-check --ignore-rules -C <sandboxDir> <prompt>
```

实现要求：

- stdout：按行解析 JSONL，映射为 `AdapterStreamEvent`
- stderr：写入 debug/log artifact，不进入 JSONL parser
- 退出码非 0：结合 stderr 映射为 `AdapterErrorCode`
- 取消：先发 `SIGTERM`，超时后升级 kill；Windows 行为需单测 / 集成测试确认
- 环境变量：仍按 ADR-0017 白名单传递，不展开继承 `process.env`

## 后续

- [ ] 用真实长任务验证取消行为
- [ ] 验证 Windows 下 `child_process.spawn` 与 stdout JSONL 的流式粒度
- [ ] 若 pipe 路线稳定，把 ADR-0017 标记为被本 ADR 细化；若不稳定，再回退 PTY
- [ ] 实现 `packages/runtime_gateway/src/adapters/codex/codex-process.ts`

## 变更历史

| 日期       | 变更                                  |
| ---------- | ------------------------------------- |
| 2026-05-14 | 初版，记录 S5 对 `exec --json` 的验证 |
