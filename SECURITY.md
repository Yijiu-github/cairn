# 安全策略

感谢你在 **Cairn** 中发现潜在的安全问题。负责任的披露能保护所有用户。

## 支持范围

| 版本 | 是否接受漏洞报告 |
|---|---|
| `main` 分支最新代码 | ✅ |
| 最新 release | ✅ |
| 旧 release | ❌（建议升级） |
| pre-release / nightly | ⚠️ best-effort |

## 报告渠道

> ⚠️ **请勿在公开 Issue / PR / Discussion 中披露未公开的安全问题。**

推荐渠道（按优先级）：

1. **GitHub Security Advisory**（首选）  
   仓库 `Security` → `Report a vulnerability`
2. **邮件**：`security@<your-domain>`（待定，见 [`docs/ops/support-channels.md`](docs/ops/support-channels.md)）

报告时请尽量包含：

- 受影响版本 / 平台 / 部署模式（local desktop / remote）
- 复现步骤（最小化）
- 影响评估（数据泄漏 / 远程命令执行 / 拒绝服务 / 提权 等）
- 建议修复方向（可选）

## 响应承诺

| 阶段 | 时限 |
|---|---|
| 收到回执 | 3 个工作日内 |
| 初步评估 | 7 个工作日内 |
| 修复计划 | 视严重程度 14–90 天 |
| 公开披露 | 默认在修复发布后 14 天，与报告者协商 |

## 关注的安全面

Cairn 是 local-first 桌面产品，重点防护：

- **本地 sidecar 鉴权**：workspace-core 监听 loopback 端口必须 token 鉴权
- **桌面能力暴露**：Electron renderer 与 main 之间通过 contextBridge allowlist
- **secret 管理**：provider key / token 不明文落盘
- **第三方 runtime 命令执行**：默认沙箱 / 用户显式同意
- **更新通道**：升级包必须签名校验
- **依赖供应链**：定期审计 npm dependencies

详细模型见 [`docs/design/security-model.md`](docs/design/security-model.md)。
