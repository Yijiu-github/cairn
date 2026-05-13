# 遥测与隐私 / Telemetry & Privacy

> 状态：🟡 Draft  
> 最后更新：2026-05-14  
> 关联：`../legal/privacy-statement.md`、`../legal/data-locality.md`、ADR-0001

---

## 1. 立场

Cairn 是 **local-first + self-hosted** 产品。遥测必须：

- **默认收集量最小**
- **用户可一键关闭**
- **永远不上报业务内容**（task 内容、artifact、对话）
- **永远不上报凭据**

## 2. 收集的内容

### 2.1 ✅ 可以收集（默认开启，可关闭）

| 类别 | 字段 | 用途 |
|---|---|---|
| 启动 | OS 版本 / 架构 / 应用版本 / 设备匿名 id | 兼容性统计 |
| 崩溃 | 堆栈 / 进程类型 / 上下文摘要 | 修 bug |
| 性能 | 启动耗时 / DB 大小桶位 / artifact 数量桶位 | 优化 |
| 功能使用计数 | "新建 run"、"retry"、"取消" 等动作计数（**无内容**） | 排优先级 |

### 2.2 ❌ 永远不收集

- task brief / message 内容 / artifact 内容
- 文件路径（除非脱敏到模式，如 `<userData>/...`）
- API key / token
- 用户名 / 邮箱（除非用户主动登录远程模式）
- IP 地址（直接收集）
- 输入框中的任何文本

### 2.3 ⚠️ 用户主动启用才收集

- 详细 trace event（供 bug 报告时附带）
- 性能 profile（debug 模式开启）

## 3. 上报通道

### 3.1 默认行为

| 模式 | 默认上报 | 通道 |
|---|---|---|
| Local Workspace（桌面） | 仅启动 + 崩溃 + 使用计数 | HTTPS endpoint |
| Remote Workspace（self-hosted） | **不上报**（由用户在自己 server 决定） | — |
| Remote Workspace（官方 SaaS，未来） | 按服务条款 | — |

### 3.2 关闭开关

设置中提供单一开关："**发送匿名使用数据**"。

- 默认值：开启（社区约定俗成）
- 关闭后：仅保留崩溃报告（且崩溃报告也可单独关闭）

## 4. 匿名化策略

- 设备 id 使用**每次安装生成的随机 UUID**，不绑定硬件
- 卸载重装即视为新设备
- 崩溃报告中的路径自动替换为 `<userData>` 类占位
- 错误消息中的可能敏感字段（key / token / path）必须脱敏

## 5. 数据保留

- 上报数据保留期限：**90 天**（草案）
- 聚合统计可长期保留
- 用户可申请删除：通过设备 id 在 settings 中显示并申请

## 6. 法律与隐私声明

- 用户隐私声明在 [`../legal/privacy-statement.md`](../legal/privacy-statement.md)
- 数据本地化承诺在 [`../legal/data-locality.md`](../legal/data-locality.md)
- 两份文档**必须与本设计一致**；任何 telemetry 变更同步更新法律文档

## 7. 实施约束

- 上报代码必须有**完整的单元测试**覆盖"关闭开关"路径
- 上报模块对外只暴露 `track(eventName, props)`，禁止直接拼装 HTTP 请求
- 所有 `props` 在发送前经过 **schema 校验 + 字段白名单**
- 上报失败必须静默（不影响主流程）
- 不允许第三方分析 SDK（如 GA、Mixpanel、Segment）直接接入 Renderer

## 8. 待办

- [ ] 选定上报后端（自建 / 第三方私有部署）
- [ ] 起草 telemetry schema 与字段白名单
- [ ] 编写"关闭开关"的端到端测试
- [ ] 与 `privacy-statement.md` 对齐草稿

## 变更历史

| 日期 | 变更 |
|---|---|
| 2026-05-14 | 初版 |
