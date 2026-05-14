# Changelog

本项目遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/) 规范，
版本号采用 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

格式提示：

- `Added` 新增
- `Changed` 变更
- `Deprecated` 废弃
- `Removed` 移除
- `Fixed` 修复
- `Security` 安全

---

## [Unreleased]

### Added

- 项目正式命名为 **Cairn**，仓库根目录改名为 `cairn-workspace/`
- 设计文档 V0.1.0 落位 `docs/design/`
- 工程文档骨架初始化（product / design / adr / contracts / engineering / ops / legal / reference）
- ADR-0001 ~ ADR-0017 全套技术决策落档
- 工程基线就位：AGENTS.md、ESLint flat config、Prettier、tsconfig、.editorconfig、Husky + commitlint
- Monorepo 引导文件：`pnpm-workspace.yaml`（catalog）、`turbo.json`、根 `package.json`、`.npmrc`、`.nvmrc`
- License 拍板：**Apache-2.0**，仓库公开开源
- NOTICE 文件
- 首发 Runtime Adapter 形态确认：**OpenAI Codex CLI**（子进程 + PTY）

### Changed

- Git 提交规范调整为 **中英双语标题，中文在前、英文在后**，并补充 `commit-msg` + `commitlint` 校验
- 设计主线从「Web 优先」升级为「共享核心 + 双外壳 + 可本地运行 + 可远程扩展」
- `package.json` 的 `license` 字段从 `SEE LICENSE IN LICENSE` 改为 `Apache-2.0`

### Removed

- 废止 v0.3 中所有以 Web-only / Desktop 后置 / MVP 收缩优先 为前提的约束

---

## 版本规划

| 版本  | 代号                                        | 范围                                          |
| ----- | ------------------------------------------- | --------------------------------------------- |
| 0.1.0 | Release 1 — Personal Desktop Edition        | Windows + macOS Apple Silicon 桌面版可装可跑  |
| 0.2.0 | Release 2 — Remote Workspace Edition        | Linux server 部署 + Web 独立接入 + PostgreSQL |
| 0.3.0 | Release 3 — Collaborative Workspace Edition | 小团队共享、增强 operator 介入                |

详见 [`docs/product/roadmap.md`](docs/product/roadmap.md)。
