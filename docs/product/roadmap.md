# 路线图 / Roadmap

> 状态：🟡 Draft
> 最后更新：2026-05-18
> 来源：[`../design/设计文档V0.1.0.md §16`](../design/设计文档V0.1.0.md)

---

## 0. 总原则

> **不再使用"MVP"作为主叙事，但保留分 Release 的工程节奏。**

每个 Release 是一个**可交付的产品边界**，不是"最小版本"。

## 1. Release 1 — Personal Desktop Edition

> 目标版本：`0.1.0`
> 预估时间窗：3–6 个月（依团队规模）

### 目标

- Windows / macOS Apple Silicon 桌面版可装可跑
- 本地工作区可启动 embedded workspace core
- 能完成单用户复杂工程任务的规划、执行、结果回传、回放与沉淀

当前执行路线采用证据链优先：先打通 Workspace Core + Codex RuntimeAdapter + Artifact / Trace + Operator control 的真实闭环，再把 Desktop Shell 接到真实 Core 数据面，最后做 0.1.0 预发布硬化。

### 必须交付

| 项                                                                                                                                          | 状态    |
| ------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| Desktop Shell（Electron）                                                                                                                   | ⚪ TODO |
| Embedded Workspace Core                                                                                                                     | ⚪ TODO |
| SQLite + 本地 artifact store                                                                                                                | ⚪ TODO |
| 轻量代码上下文索引（SourceRoot / ContextPack 基线）                                                                                         | ⚪ TODO |
| Chat / Runs / Tasks / Run Detail / Artifact / Trace 视图                                                                                    | ⚪ TODO |
| retry / rerun / cancel                                                                                                                      | ⚪ TODO |
| 基础 operator note                                                                                                                          | ⚪ TODO |
| Codex runtime 首发接入（**OpenAI Codex CLI 子进程**，用于验证 runtime 控制面链路；见 [ADR-0017](../adr/0017-codex-cli-runtime-adapter.md)） | ⚪ TODO |
| macOS Apple Silicon 签名 + 公证                                                                                                             | ⚪ TODO |
| Windows 代码签名                                                                                                                            | ⚪ TODO |
| 手动检查更新 + 引导下载安装                                                                                                                 | ⚪ TODO |
| install-guide + troubleshooting                                                                                                             | ⚪ TODO |
| privacy-statement + data-locality（公开版）                                                                                                 | ⚪ TODO |

### 不在 Release 1

- 远程工作区部署
- PostgreSQL 支持
- 共享 workspace
- 第二个 runtime adapter（接口先抽好，实现在 R2）
- 语义 embedding / 向量搜索 / 全语言深度代码图
- 自动更新通道
- Web Shell 独立接入

## 2. Release 2 — Remote Workspace Edition

> 目标版本：`0.2.0`

### 目标

- 同一套 core 可部署到 Linux server
- Web shell 能独立接远程工作区
- 桌面端也可作为远程控制台
- 作为从个人本地工作台到小团队控制台的过渡形态，先提供共享观察面与用户自控 server

### 必须交付

| 项                                                                          | 状态    |
| --------------------------------------------------------------------------- | ------- |
| PostgreSQL 支持 + 迁移                                                      | ⚪ TODO |
| Workspace Core 远程部署形态（Docker / systemd）                             | ⚪ TODO |
| 基础鉴权（token / OIDC）                                                    | ⚪ TODO |
| Web Shell 独立运行                                                          | ⚪ TODO |
| 远程 artifact store 选项（本地磁盘 / S3）                                   | ⚪ TODO |
| 远程工作区代码上下文索引与权限策略                                          | ⚪ TODO |
| 第二个 runtime adapter（候选：Claude / Ollama / Generic OpenAI-Compatible） | ⚪ TODO |
| 受控自动更新通道（桌面端）                                                  | ⚪ TODO |
| 更稳的观测与日志导出（OTLP exporter）                                       | ⚪ TODO |

## 3. Release 3 — Collaborative Workspace Edition

> 目标版本：`0.3.0`

### 目标

- 支持小团队共享观察面与工作区
- 增强 operator 介入能力
- 为 run review、operator handoff、受保护步骤与决策沉淀提供正式入口，但不升级为企业级审批治理平台

### 可能交付

| 项                                           | 状态    |
| -------------------------------------------- | ------- |
| Workspace sharing                            | ⚪ TODO |
| 更强 intervention（protected task approval） | ⚪ TODO |
| deliberation / meeting 执行模式（受控引入）  | ⚪ TODO |
| 多通道更新（stable / beta）                  | ⚪ TODO |
| 团队版增值功能（如选 Open Core 模式）        | ⚪ TODO |

## 4. 不在前三个 Release 的事

- 企业级多租户审批
- 开放 marketplace
- 拖拽式 workflow builder
- 完整 deliberation / committee / 投票 / 仲裁机制
- 全平台 Linux 桌面（Linux 仅作为 server target）

## 5. 已拍板项

| 项                          | 决策                                                                                                                                                             |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| macOS 首发范围              | ✅ **仅 Apple Silicon**（不做 Intel / universal2）                                                                                                               |
| Windows 首发范围            | ✅ **Win 11 优先，Win 10 best-effort 不阻发**                                                                                                                    |
| 桌面首发更新方式            | ✅ **手动检查 + 引导下载**（见 [`../design/distribution-and-signing.md`](../design/distribution-and-signing.md)）                                                |
| Remote Workspace 是否进 R1  | ✅ **不进**（R2 主线）                                                                                                                                           |
| R1 首发 Runtime Adapter     | ✅ **OpenAI Codex CLI**，用于验证 runtime 控制面与证据层链路；不表示绑定 OpenAI 或重做 Codex 产品体验（见 [ADR-0017](../adr/0017-codex-cli-runtime-adapter.md)） |
| R2 首位候选 Runtime Adapter | ✅ **Generic OpenAI-Compatible Adapter**（覆盖 Ollama / LM Studio / 自配 endpoint；不内置、不背书具体第三方转 API / 反代项目）                                   |
| R1 是否承诺第二 runtime     | ✅ **不承诺，接口先抽好**（见 [ADR-0014](../adr/0014-orchestration-scheduler-port.md)）                                                                          |
| License                     | ✅ **Apache-2.0**（见 [ADR-0016](../adr/0016-license-apache-2.md)）                                                                                              |
| 仓库可见性                  | ✅ **完全开源，暂不积极接外部 PR**                                                                                                                               |
| 商标 "Cairn" 注册           | 🕓 **远期再说**（商业化前评估）                                                                                                                                  |

## 6. 时间节奏（粗估）

| Release | 预估时间  | 说明                |
| ------- | --------- | ------------------- |
| R1      | 3–6 个月  | 取决于团队规模      |
| R1 → R2 | +3–4 个月 | 远程部署 + Web 独立 |
| R2 → R3 | +4–6 个月 | 协作能力            |

实际时间表在每个 Release 启动时再细化。

## 7. 变更历史

| 日期       | 变更                                                                        |
| ---------- | --------------------------------------------------------------------------- |
| 2026-05-18 | 明确 R1 Codex 接入用于验证 runtime 控制面链路，补充 R2 Generic adapter 边界 |
| 2026-05-15 | 补充轻量代码上下文索引进入 R1/R2 节奏                                       |
| 2026-05-14 | 初版，从 V0.1.0 §16 抽出                                                    |
