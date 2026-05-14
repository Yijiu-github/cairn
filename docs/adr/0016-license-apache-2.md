# ADR-0016: License 采用 Apache-2.0 + 完全开源（暂不积极接外部 PR）

- **状态**：🟢 Accepted
- **日期**：2026-05-14
- **决策者**：项目主理
- **关联**：[`../product/business-model.md`](../product/business-model.md)

---

## 背景

`docs/product/business-model.md` 列出了 4 种模式（MIT / Apache-2.0 / BUSL-1.1 / Proprietary）。项目主理需要在动工前拍板，以解锁：

- 仓库公开 / 可见性
- README License 节
- CHANGELOG / SECURITY / CONTRIBUTING 中相关措辞
- license-checker / third-party-notices CI job
- 对外接受 issue / 引用的可行性

## 决策

1. **License**：**Apache License 2.0**
2. **仓库可见性**：**完全开源**（GitHub public）
3. **贡献策略**：**暂不积极接受外部 Pull Request**（个人项目期专注快迭代）
   - Issue / Discussions 仍然欢迎
   - 安全报告通过 SECURITY.md 渠道
   - 小型 typo / 显然修正可能接受，但**默认不主动 merge 外部 PR**
4. **版权署名**：`Copyright 2026 Cairn Authors`（集合署名，便于未来加入协作者无需更新历史文件）
5. **NOTICE 文件**：随发布提供，列出本项目与第三方依赖归属
6. **远期可能**：未来如转向 **Open Core 模式**（团队版增值闭源），不影响当前 Apache-2.0 部分；将通过新 ADR 记录

## 后果

### 好的

- 含**专利条款**，企业用户更敢使用与集成
- OSI 认证开源，符合"本地优先 / 自托管偏执用户"的信任预期
- 仓库可立即公开，建立社区基础
- 允许未来转向 Open Core 模式（核心 Apache-2.0，附加闭源增值模块）
- 与多数 Apache-2.0 依赖兼容性最强（避免 GPL 传染问题）

### 坏的

- 没有 BUSL/FSL 那样的"反白嫖"保护——大厂可拿走源码做托管服务而不回馈
- "暂不接外部 PR" 可能让早期贡献者失望；需要在 README / CONTRIBUTING 显式说明并提供替代渠道（issue / discussion）

### 中性的

- 商标 / 项目名"Cairn"未注册商标，未来商业化前需评估
- 文件头不强制要求加 license header，但建议在每个**新建**的 TS / Rust / Python 等源文件顶部加简短 SPDX 标识：`// SPDX-License-Identifier: Apache-2.0`

## 备选方案（已对比，未采纳）

- **MIT**：放弃。缺少专利条款，企业接入信心略低；其余优点 Apache-2.0 全覆盖。
- **BUSL-1.1**：放弃。早期社区信任与 OSI 兼容性损失大；当前项目无明确"被大厂托管借走"的紧迫风险。保留为未来 Open Core 转型时的备选。
- **PolyForm Noncommercial / FSL**：放弃。同上理由。
- **Proprietary**：放弃。与 local-first / 数据归用户的产品价值观冲突。

## 实施清单（本 ADR 落地动作）

- [x] `LICENSE` 替换为标准 Apache-2.0 全文，署名 `Cairn Authors`
- [x] 创建 `NOTICE`
- [ ] 更新 `README.md` License 节
- [ ] 更新 `CHANGELOG.md` 加一条
- [ ] 更新 `CONTRIBUTING.md` 添加"暂不积极接外部 PR"说明
- [ ] 更新 `docs/product/business-model.md` 标注本 ADR 已拍板
- [ ] 在源码工程启动后：所有新建源文件顶部加 SPDX 标识
- [ ] CI 加 license header 检查（可选，使用 `license-check-and-add` 或类似工具）

## 远期触发条件（何时考虑变更）

| 触发                             | 可能动作                                                             |
| -------------------------------- | -------------------------------------------------------------------- |
| 出现明显被大厂托管"借走"且无回馈 | 评估转向 BUSL-1.1（仅新代码，旧版本保持 Apache-2.0）                 |
| 决定推出团队版商业增值           | 增值部分独立仓库 + 闭源 license；核心仍 Apache-2.0（Open Core 模式） |
| 引入 GPL 第三方依赖              | 评估替换或重新审视 license 兼容性                                    |

## 后续

- [ ] Spike：选定 SPDX 源码头工具（`license-check-and-add` / 自建脚本）
- [ ] 起草未来"接受外部 PR"门槛（贡献者数量 / 信任度门槛）
- [ ] 评估是否注册 "Cairn" 商标（远期商业化前）

## 变更历史

| 日期       | 变更 |
| ---------- | ---- |
| 2026-05-14 | 初版 |
