# 国际化与语言切换 / I18n and Language Switching

> 状态：🟡 Draft
> 最后更新：2026-05-15
> 产品决策：中文为主，英文可切换。

---

## 1. 决策

Cairn 的默认界面语言为 **简体中文**，同时提供英文切换。

原因：

- 当前首批使用者以中文用户为主，中文更适合解释本地路径、权限、接管、诊断等高风险操作。
- Cairn 面向开发者，英文术语不可避免；中文主界面应保留必要英文技术名词，避免过度翻译导致理解成本上升。
- 语言切换是产品能力，不是后期文案替换；所有 UI 文案、状态、空状态、错误、诊断导出都要走 i18n key。

## 2. 语言策略

| 项       | 决策                                              |
| -------- | ------------------------------------------------- |
| 默认语言 | `zh-CN`                                           |
| 首批支持 | `zh-CN`, `en-US`                                  |
| 语言入口 | Settings / Preferences；首启向导也可选择          |
| 切换方式 | 即时切换，不要求重启                              |
| 持久化   | workspace/user preference，本地保存               |
| 缺省回退 | 缺 key 时回退英文或显示 key，开发环境必须暴露缺失 |

## 3. 文案风格

### 3.1 中文主文案

中文文案要直接、克制、可操作：

- 用“运行”对应 Run，但首次出现可写作“运行（Run）”。
- 用“任务”对应 Task。
- 用“产物”对应 Artifact。
- 用“待我处理”对应 Handoff Queue / Needs attention。
- 用“接管”对应 Intervention / Operator action。
- 用“证据”对应 Evidence。
- 用“追溯信息”或“来源链”对应 Provenance，技术面板可保留 Provenance。
- 用“运行时”对应 Runtime。
- `Core`、`Codex CLI`、`trace`、`diff`、`token` 等开发者熟悉词可保留英文。

避免：

- “会话”作为 Conversation / Session / Run 的混用翻译。
- “神器”“智能体魔法”等营销感强的词。
- 危险操作用含糊文案，例如“继续”“确认一下”。应写清楚影响。

### 3.2 英文文案

英文保持开发工具风格：

- Calm, direct, not marketing-heavy.
- Prefer concrete verbs: Approve once, Retry task, Export redacted status.
- Avoid vague AI product copy: supercharge, magic, autonomous teammate.

## 4. 术语表

| 概念             | zh-CN        | en-US            | 备注                     |
| ---------------- | ------------ | ---------------- | ------------------------ |
| Workspace        | 工作区       | Workspace        | 顶级边界                 |
| Run              | 运行（Run）  | Run              | 结构化执行单元           |
| Task             | 任务         | Task             | Run 内部拆分             |
| AgentRun         | Agent 运行   | Agent run        | 技术面板可保留英文       |
| Artifact         | 产物         | Artifact         | 可审阅交接物             |
| Evidence         | 证据         | Evidence         | 测试、diff、截图、摘要等 |
| Trace            | Trace / 追踪 | Trace            | Debug 面板保留 Trace     |
| Handoff Queue    | 待我处理     | Handoff queue    | 首页核心模块             |
| Intervention     | 接管         | Intervention     | 用户介入执行             |
| Protected action | 受保护动作   | Protected action | 需批准的危险动作         |
| Approve once     | 仅本次批准   | Approve once     | 不默认永久授权           |
| Request changes  | 要求修改     | Request changes  | Artifact review          |
| Runtime          | 运行时       | Runtime          | Codex / future adapters  |
| Core             | Core         | Core             | 本地 Workspace Core      |
| Diagnostics      | 诊断         | Diagnostics      | 运行时健康与日志         |
| Redacted status  | 脱敏状态     | Redacted status  | 可复制给维护者           |

## 5. UI 布局约束

中文通常比英文更短，但部分技术解释会更长。因此组件需要：

- Button 支持最小宽度而不是固定宽度。
- Badge 支持 metadata 换行或 tooltip。
- Handoff card 的标题最多 2 行，原因说明最多 2 行。
- 表格列名不写死宽度；Run List 支持列隐藏。
- 侧边栏导航支持 4 个中文字符宽度与英文长词。
- Empty state 和错误说明允许正文换行，主操作按钮保持可见。

## 6. i18n key 规范

建议 key 按页面和组件分组：

```text
common.action.approveOnce
common.action.reject
common.status.running
nav.inbox
home.newRun.title
home.handoffQueue.title
runDetail.intervention.effect.appliesNow
artifact.review.requestChanges
runtime.diagnostics.copyRedactedStatus
```

原则：

- 不用完整英文句子作为 key。
- 状态枚举的显示文案必须集中维护。
- 错误码与人类可读文案分离。
- 诊断导出中可包含稳定英文 code，但 UI 展示用当前语言。

## 7. 首启与设置

### 7.1 First Launch

首启第一页提供语言选择：

```text
界面语言 / Language
[简体中文] [English]
```

默认选 `zh-CN`。切换后当前向导即时刷新。

### 7.2 Settings

设置位置：`Settings → Preferences → Language`。

字段：

- Interface language
- Follow system language（R1 可暂不启用）
- Developer terminology style（未来可选：中文优先 / 英文术语优先）

## 8. 组件要求

- 所有组件 props 不接受已经拼好的长文案，优先接受状态/枚举，由组件内部或页面层取 i18n key。
- 对含变量文案使用 interpolation，不拼接字符串。
- 日期、持续时间、数字、货币、token/cost 使用 locale-aware formatter。
- aria-label 同样需要 i18n。

## 9. 对 V1 视觉参考的影响

- 后续视觉参考图以中文为主，必要时提供 `*-en.svg` 对照。
- 当前新增 `ui-v1-home-inbox-zh.svg` 作为中文主界面方向参考。
- 现有英文 SVG 可视为英文 locale 参考，不作为默认界面。

## 10. 变更历史

| 日期       | 变更                                                                   |
| ---------- | ---------------------------------------------------------------------- |
| 2026-05-15 | 初版：确定中文为主、英文可切换，并定义术语表、布局约束与 i18n key 规范 |
