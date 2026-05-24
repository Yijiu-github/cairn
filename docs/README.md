# Cairn 文档总览

本目录是 Cairn 的**唯一文档源**。所有设计、决策、规范、运营手册都从这里组织。

当前事实基线见 [`STATUS.md`](STATUS.md)。它记录当前可用能力、测试基线、R1 已完成 / 未完成范围和近期主线，供人类与多 agent 协作时快速校准。

## 文档分层

```text
docs/
├─ product/      ← 1. 为什么做 / 给谁做 / 做到什么程度
├─ reference/    ← 2. 外部项目参考、术语、命名约定等长期参照
├─ design/       ← 3. 系统怎么设计（领域模型、状态机、安全、分发、回放）
├─ adr/          ← 4. 关键决策的不可变记录（Architecture Decision Records）
├─ contracts/    ← 5. 对外/对内的协议契约（API、事件、adapter 接口）
├─ engineering/  ← 6. 怎么开发、怎么测、怎么发布
├─ ops/          ← 7. 给最终用户的安装与使用文档
├─ legal/        ← 8. 隐私、数据本地化、第三方依赖声明
└─ reference/    ← 9. 术语表、命名约定、复盘模板等长期参照
```

## 怎么用

| 我的角色                     | 先读这里                                                                                            |
| ---------------------------- | --------------------------------------------------------------------------------------------------- |
| **新协作者**                 | `product/positioning-and-boundaries.md` → `design/设计文档V0.1.0.md` → `engineering/repo-layout.md` |
| **产品 / 设计**              | `product/` 全部 + `reference/` + `design/ux/`                                                       |
| **要看外部项目参考**         | `reference/README.md` → `reference/external-project-radar.md`                                       |
| **后端 / 架构**              | `design/` + `adr/` + `contracts/`                                                                   |
| **AI 编码协作 / review**     | `engineering/agent-collaboration.md`                                                                |
| **要看主线自动化接力**       | `superpowers/README.md`                                                                             |
| **要确认当前项目状态**       | `STATUS.md`                                                                                         |
| **要做 runtime 接入**        | `contracts/runtime-adapter.md`，R1 Codex 闭环见 `design/r1-codex-e2e-artifact-trace.md`             |
| **要做代码上下文索引**       | `design/code-context-index.md`                                                                      |
| **要发布版本**               | `engineering/release-playbook.md`                                                                   |
| **新用户**                   | `ops/install-guide.md`                                                                              |
| **安全研究者**               | 仓库根目录 `SECURITY.md` + `design/security-model.md`                                               |
| **想看为什么选某个方案**     | `adr/`                                                                                              |
| **想看后续可参考的外部项目** | `reference/external-project-radar.md`                                                               |

## 文档约定

- 所有 Markdown 文件统一使用简体中文为主，英文术语保留原文（首次出现给中文译名）
- 每份文档头部应有：标题、状态（Draft / Accepted / Superseded / Archived）、最后更新日期
- `reference/` 是长期参照，不是实现规范；被采纳的结论必须同步到 `product/`、`design/`、`contracts/`、`adr/`、`legal/` 或 `ops/`
- 跨文档引用使用相对路径，不使用绝对 URL
- 删除文档前先标记为 `Archived`，保留 6 个月再移除
- 重大变更必须更新 [`CHANGELOG.md`](../CHANGELOG.md)

## 文档生命周期

```text
Draft  →  Proposed  →  Accepted  →  Superseded by ADR-XXXX
                                 →  Archived
```

ADR 一经 `Accepted` 不再修改，只能被新的 ADR `Superseded`。
