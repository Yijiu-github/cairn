# Contracts

回答："**模块之间、产品之间、外部接入之间，遵守什么协议**"。

## 文件

| 文件                    | 作用                                                                            | 状态     |
| ----------------------- | ------------------------------------------------------------------------------- | -------- |
| `runtime-adapter.md`    | RuntimeAdapter 接口契约：submit / cancel / stream / capabilities / error 规范化 | 🟡 Draft |
| `workspace-core-api.md` | Workspace Core 的 HTTP API（OpenAPI 派生）                                      | ⚪ TODO  |
| `websocket-events.md`   | run / task / trace 流式事件协议                                                 | ⚪ TODO  |
| `shared-types.md`       | `packages/shared_contracts` 内 Zod schema 总览                                  | ⚪ TODO  |

## 契约 vs 实现

本目录**只描述契约**（什么进、什么出、什么时候、什么错误）。

具体实现细节、性能权衡、内部数据流——写在 `../design/` 或代码注释里。

## 单一来源原则

所有契约最终应由代码中的 Zod schema 自动派生为：

- TypeScript 类型（供 `apps/*` 与 `packages/*` 使用）
- OpenAPI 文档（供外部接入与文档站使用）
- 本目录的 Markdown 文件（供人类阅读）

**当 Zod schema 与本目录文档冲突时，以代码为准**，并立即更新文档。

## 版本与兼容性

- 契约采用语义化版本（major.minor）
- breaking change 必须新增 ADR 并在 `CHANGELOG.md` 标记 `breaking change`
- 至少保留前一个 major 版本的契约文档（标记 `Superseded`）
