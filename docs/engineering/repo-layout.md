# 仓库结构 / Repository Layout

> 状态：🟡 Draft  
> 最后更新：2026-05-14  
> 关联：[`../design/设计文档V0.1.0.md §10`](../design/设计文档V0.1.0.md)

---

## 1. Monorepo 工具

- **包管理器**：pnpm（workspaces）
- **任务编排**：turborepo（候选） / nx（备选）
- **决策**：见 ADR-0011（待写）

## 2. 顶层结构

```text
cairn-workspace/
├─ apps/
│  ├─ desktop/                    # Electron Desktop Shell
│  ├─ web/                        # Browser Web Shell
│  └─ workspace-core/             # 唯一服务核心（嵌入式 / 远程部署）
├─ packages/
│  ├─ domain/                     # 领域对象与不变量
│  ├─ application/                # 编排、调度、接管、综合
│  ├─ runtime_gateway/            # 执行总线 + adapter
│  ├─ storage/                    # SQLite / Postgres / artifact store
│  ├─ ui/                         # 共享 UI 组件与业务状态
│  ├─ desktop_bridge/             # 桌面专属能力桥接
│  ├─ shared_contracts/           # Zod schema + 派生类型 + OpenAPI
│  └─ observability/              # logging / tracing / metrics
├─ docs/                          # 见 docs/README.md
├─ tests/
│  ├─ contract/                   # 跨模块契约测试
│  └─ e2e/                        # 桌面 / Web 端到端测试
├─ scripts/                       # 构建、签名、发布脚本
├─ .github/                       # CI / templates
├─ pnpm-workspace.yaml
├─ package.json
├─ tsconfig.base.json
└─ turbo.json
```

## 3. apps/

### `apps/desktop/`

Electron Desktop Shell。

- 入口：Electron Main 进程
- Renderer：使用 `packages/ui` 组合页面
- 通过 `packages/desktop_bridge` 暴露受控系统能力
- 启动并管理 `apps/workspace-core` sidecar

### `apps/web/`

Browser Web Shell。

- 入口：Vite + React
- 通过 `packages/ui` 组合页面
- 直接连接 Remote Workspace Core（不嵌入 sidecar）

### `apps/workspace-core/`

唯一服务核心。

- 入口：Fastify server
- 可独立部署（远程模式）
- 可被 Electron Main 作为 sidecar 启动（本地模式）

## 4. packages/

| 包                  | 职责                                                         | 依赖                                             |
| ------------------- | ------------------------------------------------------------ | ------------------------------------------------ |
| `domain/`           | 领域对象、不变量、状态枚举                                   | 无（除 `shared_contracts`）                      |
| `application/`      | OrchestrationRun / Task / AgentRun 推进、operator 接管、综合 | `domain`、`storage` 端口、`runtime_gateway` 端口 |
| `runtime_gateway/`  | adapter 总线、run 生命周期、能力 profile                     | `shared_contracts`                               |
| `storage/`          | SQLite / Postgres 实现、artifact store、迁移                 | `domain`                                         |
| `ui/`               | 共享 React 组件、业务状态层                                  | `shared_contracts`                               |
| `desktop_bridge/`   | 桌面专属能力（仅由 `apps/desktop` 引用）                     | 桌面 API                                         |
| `shared_contracts/` | Zod schema、TS 类型、OpenAPI、事件协议                       | 无                                               |
| `observability/`    | structured logger、trace_id、OTLP 兼容                       | 无                                               |

## 5. 依赖方向（不可违反）

```text
              ┌───────────────┐
              │  apps/* (壳)  │
              └───────┬───────┘
                      │
                      ▼
              ┌───────────────┐
              │  application  │
              └───┬───────┬───┘
                  │       │
                  ▼       ▼
            ┌──────┐  ┌──────────────┐
            │domain│  │runtime_gateway│
            └──┬───┘  └──────┬───────┘
               │             │
               ▼             ▼
            ┌──────┐     ┌──────────┐
            │storage│    │ adapters │
            └──────┘     └──────────┘

基础设施横切：shared_contracts / observability / ui
```

不允许：

- `domain` 依赖 `application` 或 `storage` 具体实现
- `storage` 具体实现依赖 `application`
- `runtime_gateway` 依赖 `application`
- `desktop_bridge` 被非桌面包引用

## 6. 命名约束

- 不使用 `controlplane` 作为额外平台层
- `workspace-core` 是**唯一**服务核
- `runtime_gateway` 保留，但只代表执行总线，不代表开放生态平台
- `desktop_bridge` 只承载桌面专属能力桥接，**不承载业务领域逻辑**

## 7. 路径别名

`tsconfig.base.json` 提供路径别名，禁止用相对路径跨包引用：

```jsonc
{
  "compilerOptions": {
    "paths": {
      "@cairn/domain": ["packages/domain/src"],
      "@cairn/application": ["packages/application/src"],
      "@cairn/runtime-gateway": ["packages/runtime_gateway/src"],
      "@cairn/storage": ["packages/storage/src"],
      "@cairn/ui": ["packages/ui/src"],
      "@cairn/desktop-bridge": ["packages/desktop_bridge/src"],
      "@cairn/shared-contracts": ["packages/shared_contracts/src"],
      "@cairn/observability": ["packages/observability/src"],
    },
  },
}
```

## 8. 测试位置约定

- 单元测试：与被测代码同目录，命名 `*.spec.ts`
- 契约测试：`tests/contract/`
- E2E 测试：`tests/e2e/`
- 包内 fixture / mock：`<package>/src/__fixtures__/`

详见 [`testing-strategy.md`](testing-strategy.md)。

## 9. 待办

- [ ] 决定 turborepo / nx（写 ADR-0011）
- [ ] 起草 pnpm-workspace.yaml 与 tsconfig.base.json 模板
- [ ] 决定包是否要发布到 npm registry（个人项目可全部 private）

## 变更历史

| 日期       | 变更 |
| ---------- | ---- |
| 2026-05-14 | 初版 |
