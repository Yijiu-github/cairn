# Design

回答："**系统是怎么搭起来的、为什么这么搭、状态怎么流转、边界怎么守**"。

## 文件

| 文件                          | 作用                                                                             | 状态        |
| ----------------------------- | -------------------------------------------------------------------------------- | ----------- |
| `设计文档V0.1.0.md`           | **设计主稿**（当前唯一权威设计文档）                                             | ✅ Accepted |
| `domain-model.md`             | 核心领域对象的字段、关系、ER 图                                                  | 🟡 Draft    |
| `state-machines.md`           | OrchestrationRun / Task / AgentRun 状态机 + retry/rerun/replan/cancel/pause 语义 | 🟡 Draft    |
| `security-model.md`           | Electron 安全基线、sidecar 鉴权、secret 管理、桌面能力 allowlist                 | 🟡 Draft    |
| `distribution-and-signing.md` | macOS notarization / Windows code signing / 更新通道                             | 🟡 Draft    |
| `telemetry-and-privacy.md`    | 上报什么、不上报什么、用户开关、匿名化策略                                       | 🟡 Draft    |
| `replay-and-recovery.md`      | "回放"的明确定义 + 桌面崩溃恢复机制 + heartbeat/lease 字段                       | 🟡 Draft    |
| `ux/`                         | 信息架构、关键流程、屏幕清单                                                     | ⚪ TODO     |

## 与主稿（V0.1.0）的关系

- **`设计文档V0.1.0.md` 是顶层主稿**：它定方向、定边界、定结构
- 其他文件是**主稿的子文档**：把主稿中过于浓缩的章节扩展为可落地的工程文档
- 主稿一旦更新，子文档需要同步检查；建议每次主稿版本升级（v0.5 / v1.0）时统一审视一次

## 主稿 ↔ 子文档对照

| 主稿章节           | 对应子文档                                     |
| ------------------ | ---------------------------------------------- |
| §8 总体架构        | `domain-model.md` + `state-machines.md`        |
| §11 执行模型       | `state-machines.md` + `replay-and-recovery.md` |
| §12 核心领域对象   | `domain-model.md`                              |
| §14 桌面安全与权限 | `security-model.md`                            |
| §15 分发签名更新   | `distribution-and-signing.md`                  |
| §16 发布路线       | `../product/roadmap.md`                        |
| §17 ADR 摘要       | `../adr/000X-*.md`                             |
