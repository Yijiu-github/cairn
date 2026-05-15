# Operations

回答："**最终用户怎么装、怎么用、出问题怎么办**"。

## 文件

| 文件                  | 作用                                                         | 状态     |
| --------------------- | ------------------------------------------------------------ | -------- |
| `install-guide.md`    | Windows / macOS 安装步骤、首次启动权限说明                   | 🟡 Draft |
| `user-guide.md`       | 概念入门 + 端到端教程                                        | ⚪ TODO  |
| `troubleshooting.md`  | 常见问题排错（sidecar 启动失败 / 签名警告 / 代理 / API key） | 🟡 Draft |
| `faq.md`              | 高频问题快速答                                               | ⚪ TODO  |
| `support-channels.md` | 反馈渠道（GitHub Issues / Discussions / 邮件）               | ⚪ TODO  |

## 写作原则

- **以用户视角写**，不要假设读者了解架构
- **优先给出"复制粘贴可用"的命令或步骤**
- 截图配合简短文字，不要堆术语
- 涉及不同 OS 的差异，使用分 tab 或分小节
- 链接到 issue 模板 / 安全报告 / 社区，不要让用户卡在文档里

## 与产品发布的关系

- Release 1 公测前必须就位：`install-guide.md` + `troubleshooting.md`
- Release 1 GA 前必须就位：`user-guide.md` + `faq.md` + `support-channels.md`
