# 代码上下文索引 / Code Context Index

> 状态：🟡 Draft
> 最后更新：2026-05-15
> 来源：从 GitNexus / Graphify 一类 repo graph / MCP context 工具借鉴方向，但由 Cairn 自研实现
> 上游约束：[`../product/positioning-and-boundaries.md`](../product/positioning-and-boundaries.md)、[`security-model.md`](security-model.md)、[`telemetry-and-privacy.md`](telemetry-and-privacy.md)

---

## 0. 决策摘要

Cairn 会自研一个**轻量代码上下文索引**，用于把用户选择的本地代码目录转换为可查询、可复用、可追溯的上下文材料。

它服务于三件事：

1. 帮助 Supervisor 在规划 Task 时找到相关文件、符号与依赖线索。
2. 帮助 Worker 收到更小、更准的 `ContextPack`，避免把整个仓库粗暴塞进 prompt。
3. 帮助 UI 和 Operator 解释“为什么这个 run 看了这些文件”。

边界也很明确：

- 不引入 GitNexus / Graphify 的代码、包或运行时依赖。
- R1 不做完整 IDE 代码智能平台，不承诺全语言深度分析。
- 索引是 Workspace 内的**派生数据**，可删除、可重建，不是用户源代码的权威副本。
- 默认本地优先，不上传代码内容，不绕过 `.gitignore` 与 Cairn 的隐私排除规则。

---

## 1. 为什么需要

复杂工程任务的难点不是“能不能读文件”，而是：

- 在有限 context window 里选对文件与片段。
- 让多个 Worker 对同一代码库有一致的上下文基线。
- 在失败、review、rerun 时能解释上下文选择与影响面。
- 减少 Agent 重复全仓搜索的成本。

因此 Cairn 需要自己的 repo context 层，把“用户工作目录”变成可被 run / task / artifact / trace 复用的结构化输入。

---

## 2. 非目标

当前不做：

- 不做 GitNexus / Graphify 的替代产品或兼容层。
- 不做通用企业代码智能平台。
- 不做云端代码索引服务。
- 不做 worker marketplace 或外部索引插件生态。
- 不把代码索引放进 `desktop_bridge`；桌面桥只负责目录选择和受控文件权限。
- 不让索引器修改用户代码、自动提交、自动执行命令。
- 不在 R1 承诺语义 embedding、跨语言调用图、复杂类型推导或完整 LSP 能力。

---

## 3. 核心术语

### SourceRoot

用户授权给某个 Workspace 使用的本地代码根目录。一个 Workspace 可以有多个 SourceRoot。

### CodeContextIndex

SourceRoot 的派生索引，包含文件清单、文本索引、符号 outline、import/export 关系、文件摘要与更新时间。

### CodeIndexSnapshot

一次稳定索引快照。它记录 SourceRoot、扫描范围、ignore 规则版本、文件 digest 与生成时间，用于回放和追溯。

### ContextPack

给 Planner / Worker / Runtime Adapter 使用的上下文包。它不是完整仓库副本，而是有顺序、有来源、有理由的一组文件片段、符号 outline、依赖边与用户说明。

ContextPack 应作为 `Artifact` 持久化，并可被 Task 的 `context_refs` 引用。

---

## 4. 架构位置

```text
Desktop / Web Shell
  └─ Workspace Core
      ├─ source root registry
      ├─ code context index service
      ├─ context pack builder
      ├─ orchestration service
      └─ runtime gateway
          └─ Runtime Adapter (Codex CLI / future adapters)

Storage
  ├─ SQLite / PostgreSQL metadata
  ├─ FTS / search index tables
  └─ artifact store (ContextPack snapshots)
```

职责边界：

| 模块            | 职责                                                        |
| --------------- | ----------------------------------------------------------- |
| Workspace Core  | 注册 SourceRoot、触发索引、查询索引、生成 ContextPack       |
| Application     | 在 run planning / task dispatch 时决定需要哪些上下文        |
| Storage         | 保存索引元数据、FTS 表、快照记录；索引可重建                |
| Runtime Gateway | 只接收已准备好的 `input_ref` / `context_refs`，不直接扫仓库 |
| Desktop Bridge  | 目录选择、权限申请、打开文件位置；不承载索引业务逻辑        |
| UI              | 展示索引状态、上下文来源、影响面提示与 Operator 选择        |

---

## 5. R1 范围

R1 先做“够用且稳定”的本地索引：

### 必须有

R1a 已完成：

- SourceRoot registry：`POST/GET /v1/workspaces/:workspaceId/source-roots`
- 最小 `CodeIndexSnapshot` 元数据：注册 SourceRoot 时创建 `pending` 快照，不执行真实扫描
- 最小 `ContextPack` manifest：`POST /v1/workspaces/:workspaceId/context-packs`
- shared contracts / domain schema / application service / workspace-core SQLite adapter 基线

R1b-a 已完成：

- 手动 reindex：`POST /v1/source-roots/:sourceRootId/reindex`
- 最新索引快照读取：`GET /v1/source-roots/:sourceRootId/index`
- `code_index_files` 文件清单表：记录相对路径、大小、mtime、digest、语言猜测，不保存源码内容
- 本地 scanner 默认排除 `.git`、`node_modules`、`.env*`、密钥/证书、本地数据库、构建产物，并支持 SourceRoot include / exclude
- 最小文件清单搜索：`GET /v1/code-search` 支持按 `workspaceId`、可选 `sourceRootId`、`pathContains`、`language` 与 `limit` 查询最新 ready 快照中的文件元数据，不读取或返回源码内容
- 最小 ContextPack 生成：`POST /v1/workspaces/:workspaceId/context-packs/from-code-search` 将文件清单搜索结果转换为 `file_excerpt` manifest 条目，保留 `sourceRootId`、`path`、`digest`、`reason`、`confidence`，仍不读取或返回源码内容
- manifest 级片段范围与预算：`from-code-search` 可接收显式 `excerpt.startLine/endLine` 并写入每个 `file_excerpt`；未传 `tokenEstimate` 时按索引文件大小使用保守近似估算 token，不读取源码

后续 R1b/R1 继续补齐：

- SourceRoot 注册与状态：`active` / `indexing` / `stale` / `error`。
- 文本搜索：优先 SQLite FTS；不可用时降级为受控 `rg` 查询。当前 `code-search` 只覆盖路径 / 语言级元数据过滤。
- TypeScript / JavaScript 基础 symbol outline：函数、类、接口、导出符号、顶层常量。
- import/export 文件依赖边。
- 关系置信度标签：区分 `extracted` / `inferred` / `ambiguous`，避免把推断关系伪装成事实。
- ContextPack 生成：后续继续补齐 Task brief、用户选中文件、最近变更文件、文本片段与 token 预算。
- ContextPack artifact：记录来源文件、行号范围、digest、选择理由。

### 可以延后

- 深度调用图。
- 语义 embedding / 向量搜索。
- 全语言 Tree-sitter parser 矩阵。
- 跨仓库依赖分析。
- 增量索引 worker 池。
- LSP 级别 rename / references / type inference。

---

## 6. 索引策略

### 扫描规则

索引器必须遵守：

- `.gitignore`
- Cairn 内置隐私排除：`.env*`、密钥、证书、本地数据库、构建产物、`node_modules`、`.git`
- 用户在 Workspace Settings 中配置的 include / exclude
- 单文件大小上限与二进制文件检测

### 派生数据原则

- 索引数据可以删除并从 SourceRoot 重建。
- ContextPack 是一次 run 的输入证据，应作为 Artifact 保留。
- TraceEvent 记录索引开始、结束、失败和 ContextPack 生成，但不在 payload 中塞大段代码。
- Graphify 的 `graph.json` / `GRAPH_REPORT.md` / MCP 查询体验可作为交互参考；Cairn 落地时应映射为 Workspace Core 查询 API、TraceEvent 与 Artifact，而不是提交第三方输出目录。

### 增量更新

R1 可以先用手动 reindex + run 前 freshness check。

后续再加入文件 watcher，但 watcher 只负责标记 `stale`，真正重建由 Workspace Core 的受控任务执行，避免后台持续占用资源。

---

## 7. ContextPack 结构草案

```ts
interface ContextPackManifest {
  contextPackId: string;
  workspaceId: string;
  sourceRootIds: string[];
  createdFor:
    | { type: 'orchestration_run'; orchestrationRunId: string }
    | { type: 'task'; taskId: string };
  query: string;
  items: ContextPackItem[];
  tokenEstimate?: number;
  createdAt: string;
}

interface ContextPackItem {
  kind: 'file_excerpt' | 'symbol_outline' | 'dependency_edge' | 'user_note';
  sourceRootId?: string;
  path?: string;
  startLine?: number;
  endLine?: number;
  digest?: string;
  reason: string;
  confidence?: 'extracted' | 'inferred' | 'ambiguous';
  contentRef?: string;
}
```

设计要点：

- `reason` 必须保留，方便 Operator 理解上下文选择。
- `confidence` 用于标记关系来源：AST / import 明确解析为 `extracted`，二跳调用图或共现关系为 `inferred`，冲突或低置信结果为 `ambiguous`。
- 大内容放 artifact store，manifest 只存引用和元数据。
- `digest` 用于检测“上下文生成后文件被改过”的情况。
- `startLine/endLine` 在 R1b-a 只表示调用方要求的目标片段范围；在未落地源码片段 artifact 前，不代表系统已经读取或保存该行范围内容。
- 自动 `tokenEstimate` 是基于 `CodeIndexFile.sizeBytes` 的保守近似，用于调度与 UI 预算提示；后续真实内容打包时可由 artifact builder 或 runtime capability 重新校准。

---

## 8. API 草案

这些 endpoint 只是设计方向，最终以 shared contracts 为准：

| Endpoint                                                          | 用途                                      |
| ----------------------------------------------------------------- | ----------------------------------------- |
| `POST /v1/workspaces/:workspaceId/source-roots`                   | 注册 SourceRoot                           |
| `GET /v1/workspaces/:workspaceId/source-roots`                    | 列出 SourceRoot 与状态                    |
| `POST /v1/source-roots/:sourceRootId/reindex`                     | 触发文件清单重建                          |
| `GET /v1/source-roots/:sourceRootId/index`                        | 查看最新快照与文件清单                    |
| `GET /v1/code-search`                                             | 文件清单搜索；后续扩展符号 / 文本搜索     |
| `POST /v1/workspaces/:workspaceId/context-packs`                  | 生成 ContextPack manifest                 |
| `POST /v1/workspaces/:workspaceId/context-packs/from-code-search` | 基于文件清单搜索生成 ContextPack manifest |

---

## 9. 隐私与安全

- 代码内容默认只留在本机或用户自控的远程 Workspace Core。
- 不做任何默认云端上传。
- 不索引密钥、凭据、本地数据库、构建输出和依赖目录。
- ContextPack 可能包含源码片段，必须继承 Artifact 的 visibility / retention / export 规则。
- 远程工作区模式下，SourceRoot 的真实路径与代码内容只进入用户部署的 server，不进入 Cairn 官方服务。
- 诊断导出默认不包含源码和 ContextPack 内容，只包含索引状态、错误码、文件数量桶位等元数据。

---

## 10. 发布节奏

| 阶段 | 范围                                                                                 | 触发条件                      |
| ---- | ------------------------------------------------------------------------------------ | ----------------------------- |
| R1a  | SourceRoot registry、文件清单、文本搜索、ContextPack artifact 草案                   | Workspace Core 接入 SQLite 后 |
| R1b  | TypeScript / JavaScript symbol outline、import/export edge、Planner 使用 ContextPack | Codex adapter 可跑通后        |
| R2   | PostgreSQL 兼容、远程 SourceRoot 权限、可选语义搜索                                  | Remote Workspace 主线         |
| R3   | 团队共享索引策略、Operator review 中的影响面解释                                     | Collaborative Workspace 主线  |

---

## 11. 待决问题

- R1 文本索引是否直接依赖 SQLite FTS5，还是先封装 search port 后按环境选择实现？
- TypeScript / JavaScript outline 使用 TypeScript compiler API 还是 Tree-sitter？
- ContextPack 的 token 估算应放在 Application 层还是 Runtime Gateway capability 层？
- 多 SourceRoot 场景下，ContextPack 如何表达跨仓库依赖？

---

## 12. 变更历史

| 日期       | 变更                                                      |
| ---------- | --------------------------------------------------------- |
| 2026-05-15 | R1b-a 补充 from-code-search 的片段范围与 token 估算语义   |
| 2026-05-15 | R1b-a 接入基于 code-search 的最小 ContextPack 生成接口    |
| 2026-05-15 | R1b-a 接入最小 code-search 文件清单搜索接口               |
| 2026-05-15 | R1b-a 接入手动 reindex 与本地文件清单快照                 |
| 2026-05-15 | R1a 接入 SourceRoot registry 与 ContextPack manifest 基线 |
| 2026-05-15 | 补充 Graphify 调研结论与置信度标签                        |
| 2026-05-15 | 初版，明确自研轻量代码上下文索引方向                      |
