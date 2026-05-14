# ADR-0003: 桌面壳默认采用 Electron

- **状态**：🟢 Accepted
- **日期**：2026-05-13
- **决策者**：项目主理
- **关联**：ADR-0001, ADR-0002, [`../design/设计文档V0.1.0.md#92-desktop-shellelectron`](../design/设计文档V0.1.0.md)

---

## 背景

ADR-0001 把桌面端抬为一等外壳，ADR-0002 钉死 TypeScript / Node 生态。

桌面壳的候选：

- **Electron**：成熟，Chromium + Node 双进程，本地能力丰富
- **Tauri**：体积小、性能更好，Rust 后端 + Web 前端
- **CEF / 原生 + Webview**：可控但工程量大

Cairn 的桌面端需求是**重本地能力**：

- 本地文件 / 终端 / 命令 / 子进程
- 长运行任务的状态桥接
- 升级分发
- 与 Node sidecar（Workspace Core）紧密集成

## 决策

**桌面壳默认采用 Electron，Tauri 保留为备选。**

具体地：

1. `apps/desktop` 使用 Electron + TypeScript
2. Workspace Core 作为**独立 Node sidecar 进程**存在，不塞进 Electron Main
3. Electron Main / Renderer / Sidecar 三进程边界明确
4. Renderer 默认配置：`contextIsolation: true` / `nodeIntegration: false` / `sandbox: true`，通过 preload + `contextBridge` 暴露白名单 API

## 后果

### 好的

- 本地文件、命令、终端、子进程、长运行任务路径成熟
- 与 Node sidecar 整合最自然
- Windows / macOS code signing 与 notarization 在 Electron 官方文档中有完整覆盖
- 调试、打包、系统集成的现成经验充足
- 三进程边界清晰，崩溃可恢复

### 坏的

- 安装包体积大（Chromium ~150MB 基线）
- 内存占用高于 Tauri
- 安全配置必须细致（详见 `../design/security-model.md`）

### 中性的

- 若未来桌面端被收缩为"薄壳远程控制台"，可重新评估 Tauri
- 自动更新需要选定方案（`electron-updater` / 自建 manifest，见 ADR-0012 待写）

## 备选方案

- **Tauri**：放弃为默认。优点：体积小、性能好；缺点：本地 runtime/PTY/process 集成不如 Electron 成熟，团队需要额外学习 Rust。保留为备选——如果未来桌面端去重，Tauri 是合格的迁移目标。
- **CEF / 原生 + Webview**：放弃。工程量过大，性价比不合适。
- **PWA / 浏览器代替桌面**：放弃。无法满足本地能力需求。

## 后续

- [x] 在 [ADR-0007](0007-sidecar-loopback-protocol.md) 钉死 sidecar 通信协议（loopback HTTP+WS + token）
- [x] 在 [ADR-0010](0010-secret-storage.md) 钉死 secret 存储方案
- [x] 在 [ADR-0012](0012-electron-toolchain-and-sidecar-packaging.md) 钉死 Electron 工具链 + 自动更新方案
- [ ] 在 `engineering/release-playbook.md` 给出签名/公证完整步骤

## 变更历史

| 日期       | 变更                                      |
| ---------- | ----------------------------------------- |
| 2026-05-13 | 初次提议（来自 V0.1.0）                   |
| 2026-05-14 | 拆出独立 ADR 文件，补充 Electron 安全基线 |
