# ADR-0005: 数据库采用 SQLite first / PostgreSQL ready

- **状态**：🟢 Accepted
- **日期**：2026-05-13
- **决策者**：项目主理
- **关联**：ADR-0001, [`../design/设计文档V0.1.0.md#96-数据库sqlite-first--postgresql-ready`](../design/设计文档V0.1.0.md)

---

## 背景

ADR-0001 同时支持两类运行模式：

- **Local Workspace**（桌面单用户）
- **Remote Workspace**（团队 / 远程 server）

两类对存储的需求差异显著：

| 维度     | 本地             | 远程           |
| -------- | ---------------- | -------------- |
| 安装成本 | 必须为零依赖     | 可接受 PG 部署 |
| 并发     | 单用户           | 多用户         |
| 备份恢复 | 用户友好的单文件 | DB admin 流程  |
| 共享     | 不需要           | 需要           |

## 决策

**双数据库支持**：

1. **本地模式**：默认 SQLite
2. **远程模式**：默认 PostgreSQL
3. 领域层**不直接依赖**具体数据库
4. 存储端口（repository / migration / query builder）**统一抽象**
5. 本地与远程**共享 schema 语义**——schema 设计以双方都支持的特性为基线
6. ORM 选用支持双方言的方案（候选 Drizzle，详见未来 ADR-0008）

## 后果

### 好的

- 桌面端零依赖（SQLite 嵌入）首发体验最佳
- 远程模式拥有 PG 的并发与查询能力
- 同一份代码可无缝在两种存储后端运行
- 用户备份本地数据 = 复制单文件

### 坏的

- schema 设计**不能用 PG 独有特性**（如 JSONB 操作符、partial index 表达式、`tstzrange` 等）
- 迁移脚本必须双方言兼容，复杂度上升
- 性能调优需要在两种引擎间权衡
- 大事务 / 高并发场景 SQLite 会成为瓶颈（但本地单用户不应触发）

### 中性的

- 必须有完善的迁移测试（双引擎都跑过）
- 远端从 SQLite 导入 PG 的迁移工具（用户从本地升级到 self-hosted server 场景）将来需要

## 备选方案

- **仅 SQLite**：放弃。远程多用户场景下并发不足。
- **仅 PostgreSQL**：放弃。桌面零依赖体验破坏。
- **SQLite + DuckDB / TursoDB / LibSQL 替代 PG**：放弃。生态成熟度与团队场景适配不如 PG。

## 实施提示

- SQLite 启用 WAL 模式 + busy_timeout，提高并发读写
- 文件路径与命名约定在 `engineering/local-dev-setup.md` 钉死
- 用户数据目录：
  - Windows：`%APPDATA%\Cairn\workspaces\<workspace_id>\`
  - macOS：`~/Library/Application Support/Cairn/workspaces/<workspace_id>/`
- 主数据库文件名：`workspace.sqlite`
- 不在领域代码里写 `IF NOT EXISTS`、`PRAGMA` 等数据库专属语法，统一在 migration / repository 层

## 后续

- [x] [ADR-0008](0008-orm-drizzle.md)：钉死 ORM（Drizzle）
- [ ] `engineering/db-migrations.md`：写双方言兼容性细则

## 变更历史

| 日期       | 变更                                    |
| ---------- | --------------------------------------- |
| 2026-05-13 | 初次提议（来自 V0.1.0）                 |
| 2026-05-14 | 拆出独立 ADR 文件，补充数据目录路径约定 |
