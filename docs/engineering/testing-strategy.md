# 测试策略 / Testing Strategy

> 状态：🟡 Draft  
> 最后更新：2026-05-14

---

## 1. 测试金字塔

```text
        ┌────────────┐
        │    E2E     │   桌面 + Web 端到端，少而关键
        ├────────────┤
        │ Integration│   跨包、跨服务集成
        ├────────────┤
        │  Contract  │   schema / API 契约
        ├────────────┤
        │    Unit    │   纯函数 / 单包逻辑
        └────────────┘
```

**比例目标**（按测试数量）：

- Unit：70%
- Contract：10%
- Integration：15%
- E2E：5%

## 2. 单元测试（Unit）

- 框架：**Vitest**（速度快、ESM 原生、TS 友好）
- 范围：纯函数、单包内逻辑、状态机转移
- 命名：`*.spec.ts`，与被测代码同目录
- 覆盖率目标：核心业务包（`domain` / `application` / `runtime_gateway`）≥ 80%

### 必须覆盖的关键路径

- 所有状态机的转移（happy path + 至少一条 failure path）
- 错误归一化（每个 `AdapterErrorCode` 至少一条用例）
- retry / rerun / replan 语义边界

## 3. 契约测试（Contract）

- 框架：Vitest + Zod schema 校验
- 范围：
  - `shared_contracts` 的 schema 演进兼容性
  - HTTP API 请求/响应符合 OpenAPI
  - WebSocket 事件符合 schema
  - Runtime Adapter 实现符合 `RuntimeAdapter` 接口
- 位置：`tests/contract/`
- 触发：每次 schema 变更 + CI 每次跑

### Adapter 契约测试

每个 Runtime Adapter 必须通过统一的"adapter conformance suite"：

- submit / stream / cancel 行为符合契约
- capability profile 与实际行为一致
- 错误归一化映射全覆盖

## 4. 集成测试（Integration）

- 框架：Vitest + Testcontainers（PG） / in-memory SQLite
- 范围：
  - 跨包业务流程（如：event → orchestration → task → agent_run → artifact）
  - DB 迁移正确性（双方言）
  - WebSocket 流式订阅
- 位置：与被测代码同 monorepo 包内的 `__integration__/`

## 5. E2E 测试

### 5.1 桌面 E2E

- 框架：**Playwright + Electron**
- 范围（首发）：
  - 启动桌面端，sidecar 正常拉起
  - 新建一个 OrchestrationRun（mock adapter），看到完整 UI 流程
  - retry 失败的 task
  - 取消运行中的 run
  - 关闭应用，重启后状态正确恢复

### 5.2 Web E2E

- 框架：Playwright
- 范围（Release 2 之后）：
  - 接入远程 workspace
  - 同等核心流程

### 5.3 跨平台运行

- macOS：CI 上跑 Apple Silicon runner
- Windows：CI 上跑 Win 11 runner
- Linux：可选（Web E2E）

## 6. 性能 / 负载测试

不在首发强制，但留位置：

- 高频 TraceEvent 写入压测（SQLite 在 WAL 下的极限）
- 多 Worker 并发任务（CPU / 内存）
- 长运行任务（24h+）的稳定性

## 7. 安全测试

- 依赖审计：`pnpm audit`（CI 每周）
- IPC allowlist 检查：自动化测试覆盖 preload 暴露的 API
- 凭据脱敏：snapshot 测试日志输出

## 8. 测试数据

- 不使用真实生产数据
- Fixture 在 `<package>/src/__fixtures__/`
- 复杂 fixture 用 factory function 生成（避免大 JSON 落盘）
- 数据库测试用迁移到最新 schema 的临时实例

## 9. CI 集成

| 阶段 | 时机 |
|---|---|
| Unit + Contract | 每次 PR、每次 push |
| Integration | 每次 PR |
| E2E（桌面） | 每次 PR（关键路径） + 每日（全量） |
| E2E（Web） | 每次 PR + 每日 |
| 性能 spike | 手动触发 |
| 依赖审计 | 每周定时 |

详见 [`ci-cd.md`](ci-cd.md)。

## 10. 测试反例（不要做的事）

- ❌ 测试代码包含业务逻辑分支
- ❌ Mock 一切以至于测了个寂寞
- ❌ 把测试写得依赖外部网络
- ❌ E2E 写得太脆（依赖时序 / 像素 / 具体文案）
- ❌ 用 `console.log` 调试测试代码而不删
- ❌ skip 的测试没有 issue 链接

## 11. 待办

- [ ] 提交 Vitest 根配置
- [ ] 提交 Playwright + Electron 启动模板
- [ ] 起草 "adapter conformance suite"
- [ ] 起草 CI 缓存策略

## 变更历史

| 日期 | 变更 |
|---|---|
| 2026-05-14 | 初版 |
