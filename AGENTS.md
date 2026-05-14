# AGENTS.md

> 给 AI 编码助手（Cursor / Claude Code / Codex / Aider / 其他）的"项目使用手册"。  
> 在你做任何修改前，请先读完本文件，然后按 §2 的"必读优先级"展开上下文。

---

## 0. 这是什么项目

**Cairn**：面向个人开发者与小技术团队的、自托管且本地优先的多 Agent 协作工作台。

- 共享核心 + 双外壳（Desktop / Web）
- 本地工作区（SQLite）+ 远程工作区（PostgreSQL）双形态
- 桌面端基于 Electron + Node sidecar
- 主语言：TypeScript / Node.js

详细背景在 `docs/design/设计文档V0.1.0.md`。

---

## 1. 当前项目状态（重要）

> ⚠️ **Desktop / Web / Workspace Core 应用尚未启动，但工程基线与核心包已经启动**。

所以你在这个仓库里：

- **可以**：读文档、维护工程配置、补充 `packages/shared_contracts` / `packages/domain` / `packages/storage` / `packages/runtime_gateway` / `packages/application` 等已存在核心包、起草接口草案、写 ADR
- **不要**：假装 Desktop / Web / Workspace Core 已经存在、引用不存在的目录如 `apps/desktop/src/`
- **要谨慎**：任何"创建 `apps/` 或新增大包实际代码"的请求，先确认是否在做对应工程启动阶段

---

## 2. 必读优先级

当用户向你提出任务时，按以下顺序补充上下文：

1. `README.md`（项目门面）
2. `docs/product/positioning-and-boundaries.md`（产品边界——避免做错方向）
3. `docs/reference/glossary.md`（术语统一——避免误用 Agent / Task / Run 等概念）
4. `docs/design/设计文档V0.1.0.md`（**主稿**，唯一权威设计）
5. 任务相关的具体文档（见 `docs/README.md` 的"我想……去看"路由表）
6. 相关 ADR（`docs/adr/`）

不要跳过 §2-3，否则极易踩"产品边界"。

---

## 3. 不可违反的硬约束

### 3.1 产品边界（来自 `positioning-and-boundaries.md`）

**当前明确不做**：

- 企业级多租户审批治理平台
- 开放外部 worker marketplace
- 一开始就支持所有模型 / 所有 provider / 所有入口
- 一开始就做复杂流程编排器 / 拖拽 workflow builder
- 一开始就把会商 / 投票 / 仲裁 / 审批流做厚
- 把桌面端做成全权限无边界本地自动化工具

任何提议碰到这些边界都需要在 PR 里显式说明 + 升级到 ADR 讨论。

### 3.2 双端语义不可分叉

桌面与 Web 共享同一套协作核心。**不允许**：

- 给桌面端单独写一套"快捷流程"绕过 Workspace Core
- Web 端使用不同的领域对象 / 状态机
- 在 `desktop_bridge/` 里塞业务逻辑（它只承载系统能力桥接）

### 3.3 数据本地化

- 默认数据落本机；远程模式落用户自控 server
- 永远不**上报业务内容**（task / message / artifact）
- 永远不**上报凭据**
- 详见 `docs/design/telemetry-and-privacy.md`

### 3.4 状态机约束

- 终态对象不可被修改
- `retry / rerun / replan` 语义不可混用（详见 `docs/design/state-machines.md §4`）
- "回放（replay）" 指**从 TraceEvent 重建 UI**，不是重新执行

### 3.5 安全基线

- Electron Renderer 必须 `contextIsolation: true` + `nodeIntegration: false` + `sandbox: true`
- 所有桌面能力通过 `preload + contextBridge` allowlist 暴露
- secret 通过系统安全存储（Keychain / DPAPI），不明文落盘
- workspace-core sidecar 必须 loopback + token 鉴权

详见 `docs/design/security-model.md`。

---

## 4. 仓库结构

```text
cairn-workspace/
├─ AGENTS.md              ← 本文件
├─ README.md
├─ docs/                  ← 所有设计、决策、规范
│  ├─ product/            ← 定位 / 边界 / 用户 / roadmap / business
│  ├─ design/             ← 领域模型 / 状态机 / 安全 / 分发 / 回放
│  ├─ adr/                ← Architecture Decision Records
│  ├─ contracts/          ← API / Adapter / 事件契约
│  ├─ engineering/        ← 仓库结构 / 规范 / 测试 / CI / 发布
│  ├─ ops/                ← 安装 / 排错（面向用户）
│  ├─ legal/              ← 隐私 / 数据本地化
│  └─ reference/          ← 术语 / 命名 / 复盘
├─ apps/                  ← (尚未创建) desktop / web / workspace-core
├─ packages/
│  ├─ shared_contracts/   ← 已创建：Zod schema / ts-rest contracts / WS events
│  └─ domain/             ← 已创建：Drizzle SQLite-first schema / migrations
│  └─ storage/            ← 已创建：SQLite connection / migration runner 基线
│  └─ runtime_gateway/    ← 已创建：RuntimeAdapter contract / mock adapter / conformance test 基线
│  └─ application/        ← 已创建：orchestration service / ports / state progression tests 基线
│  ui / ... 尚未创建
└─ .github/
```

代码层目录的设计规范见 `docs/engineering/repo-layout.md`，**目前尚未创建 `apps/*` 应用代码**。

---

## 5. 关键术语（节选，完整见 `docs/reference/glossary.md`）

- **Workspace**：一等领域对象，所有数据的一级边界
- **OrchestrationRun**：一次完整编排执行，是产品最重要的对象之一
- **Task**：OrchestrationRun 内的子任务节点（DAG）
- **AgentRun**：一次具体的 agent 调用执行（Task 重试时产生新的 AgentRun）
- **Artifact**：执行产物（summary / patch / log / file snapshot / ...）
- **TraceEvent**：横切的可观察事件
- **Supervisor / Worker / Operator**：主 agent / 子任务 agent / 接管的人类
- **Runtime Adapter**：接入具体 runtime（Codex / Claude / Ollama 等）的适配层

❌ 禁用术语：`Pipeline`、`Workflow Builder`、`Marketplace`、`Tenant`（含义冲突或不在产品范围）

---

## 6. 代码规范要点

完整规范见 `docs/engineering/coding-standards.md`。核心提醒：

- **TypeScript strict 模式**，禁止 `any`（必要时 `unknown` + narrowing）
- **ESM only**（`"type": "module"`，`verbatimModuleSyntax: true`）
- **不允许 `console.log`**（使用 `@cairn/observability` 的 logger）
- **不允许 `process.env` 直接使用**（经过统一 config 模块）
- **不允许字符串拼接 SQL**（必须经 ORM）
- **不允许跨包相对路径**（用路径别名 `@cairn/*`）
- **文件名 kebab-case**，类型 PascalCase，变量 camelCase，DB / 枚举值 snake_case
- **公开 API 必须 JSDoc / TSDoc**
- **TODO 必须带上下文**：`// TODO(@you, 2026-XX-XX): reason`

---

## 7. 提交 / PR 规范

- 分支：`feat/* | fix/* | docs/* | chore/*`，不允许直接 push 到 `main`
- Commit：Conventional Commits，标题格式为 `feat(scope): 中文摘要 / English summary`（中文在前，英文在后）
- PR：使用 `.github/PULL_REQUEST_TEMPLATE.md`
- 涉及设计决策必须配套 ADR
- 涉及 schema 必须附迁移说明
- 涉及 UI 必须附截图 / GIF

---

## 8. 常用命令（占位，代码启动后更新）

```bash
# 安装
pnpm install

# 开发
pnpm dev                # 启动桌面 + workspace-core + web
pnpm --filter @cairn/desktop dev

# 校验
pnpm lint
pnpm typecheck
pnpm test

# 构建
pnpm build
```

详细见 `docs/engineering/local-dev-setup.md`。

---

## 9. 在写代码 / 文档时，请遵循

### 9.1 代码

- 修改前先 grep / 读相邻文件，理解现有模式
- 跨包改动必须保持依赖方向（见 `docs/engineering/repo-layout.md §5`）
- 状态机改动**先**更新 `docs/design/state-machines.md`，再改代码
- 新的 adapter 必须实现 `docs/contracts/runtime-adapter.md` 完整接口 + capability profile

### 9.2 文档

- 文档目录用法看 `docs/README.md`
- ADR 一旦 Accepted 不修改，只能 Supersede
- 术语变更必须同步 `glossary.md`
- 重大变更必须更新 `CHANGELOG.md` 的 `[Unreleased]`
- 重大功能、架构决策、状态机语义、adapter 能力、数据 schema、运行/部署方式有变化时，必须同步更新对应文档（设计文档 / ADR / contracts / ops / README 等），不能只改代码
- 若一次实现推翻或细化既有 Accepted ADR，新建 ADR 记录 Supersede / refinement，不直接改旧 ADR

### 9.3 当你不确定时

- **不要假设**。直接问用户。
- 涉及"产品边界"的请求 → 读 `positioning-and-boundaries.md`
- 涉及"为什么这么选" → 读 `docs/adr/`
- 涉及"字段长什么样" → 读 `docs/design/domain-model.md`

---

## 10. 我（AI 助手）不应该主动做的事

- 创建大量"预期未来需要"的占位代码 / 文件
- 提议引入新依赖而不在 ADR 中讨论
- 修改 ADR 文件（应新建 ADR `Supersede`）
- 在没确认的情况下选择 LICENSE
- 假定项目已经开源并按开源规范行事（License 尚未拍板）
- 把 Cursor / Claude Code 等具体工具的特性硬编码进产品

---

## 11. 元信息

- 本文件适用工具：Cursor、Claude Code、Codex、Aider、Continue、以及任何按 [AGENTS.md 约定](https://agents.md) 读取项目上下文的 agent
- 本文件**应当被读取，不应被修改**（除非你在维护工程基线）
- 如本文件与具体文档冲突，**以 `docs/` 下的具体文档为准**
- 最后更新：2026-05-14
