# Legal

回答："**用户的数据归谁、依赖的协议是什么、用我们的产品有什么义务**"。

## 文件

| 文件 | 作用 | 状态 |
|---|---|---|
| `privacy-statement.md` | 隐私声明：收集了什么、为什么、保留多久、如何关闭 | 🟡 Draft |
| `data-locality.md` | "本地优先"的正式承诺：哪些数据可能离开本机 | 🟡 Draft |
| `third-party-notices.md` | 依赖许可证清单（CI 自动生成） | ⚪ TODO |
| `terms-of-use.md` | 服务条款（仅当提供云端/远程服务时需要） | ⚪ TODO |

## 重要说明

- **本目录不构成正式法律建议**。商业化前请咨询律师
- 文档语言：中文为主，重要法律条款可考虑双语
- `privacy-statement.md` 与 `data-locality.md` 在公开分发前必须就位

## 与其他目录的关系

- `design/telemetry-and-privacy.md` 决定**技术上**收集什么
- `legal/privacy-statement.md` 是面向用户的**法律层面**声明
- 两者必须一致；冲突时以 telemetry-and-privacy 的最新设计为实情，再回写 privacy-statement
