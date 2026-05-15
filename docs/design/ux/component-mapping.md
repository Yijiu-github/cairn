# UX 到工程实现映射 / UX to Implementation Mapping

> 状态：🟡 Draft
> 最后更新：2026-05-15
> 范围：把 R1 UX 文档落到 `packages/ui`、`apps/desktop`、未来 `apps/web` 与 core contracts 的实现边界。

---

## 1. 分层原则

| 层                  | 建议位置                          | 职责                                                                | 不应包含                        |
| ------------------- | --------------------------------- | ------------------------------------------------------------------- | ------------------------------- |
| Design primitives   | `packages/ui/src/primitives`      | Button、Badge、Dialog、Tabs、ResizablePanel 等无业务组件            | Cairn 领域对象请求              |
| Product components  | `packages/ui/src/cairn`           | RunHeader、TaskTree、TraceTimeline 等可被 Desktop/Web 共用的业务 UI | Electron API / 本地文件系统调用 |
| Desktop shell pages | `apps/desktop/src/renderer/pages` | 页面路由、桌面桥接、系统菜单、文件夹选择器                          | 核心编排规则                    |
| Core contracts      | `packages/shared_contracts`       | Zod schema、API 类型、状态枚举                                      | UI 状态管理细节                 |
| Desktop bridge      | `packages/desktop_bridge`         | 打开文件夹、选择目录、系统通知、日志导出                            | Run / Task 业务状态机           |

## 2. 页面到实现映射

| UX 页面             | 路由                     | 页面容器             | 共享组件                                                                                                         | 桌面专属依赖                                      | 数据来源                                                                                  |
| ------------------- | ------------------------ | -------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| First Launch Wizard | `/first-launch`          | `FirstLaunchPage`    | `WizardShell`, `RuntimeHealthCard`, `PathField`                                                                  | folder picker、启动 core、打开日志                | `workspace.initialize`, `core.health`, `runtime.detect`                                   |
| Home / Inbox        | `/`                      | `HomePage`           | `NewRunComposer`, `HandoffQueue`, `AttentionCard`, `RunCard`, `RuntimeMiniStatus`                                | working directory picker、文件附件 picker         | `runs.listRecent`, `interventions.listOpen`, `artifactReviews.listOpen`, `runtime.status` |
| Run List            | `/runs`                  | `RunListPage`        | `RunFilterBar`, `RunCard`, `StatusBadge`, `ErrorSummary`                                                         | 无；打开本地目录动作隐藏在 artifact               | `runs.list`                                                                               |
| Run Detail          | `/runs/:runId`           | `RunDetailPage`      | `RunHeader`, `TaskTree`, `AgentRunLog`, `TraceTimeline`, `EvidencePanel`, `ArtifactRail`, `InterventionComposer` | reveal artifact、系统通知入口                     | `runs.get`, `trace.stream`, `artifacts.listForRun`                                        |
| Artifact Detail     | `/artifacts/:artifactId` | `ArtifactDetailPage` | `ArtifactPreview`, `ProvenancePanel`, `TraceLinkList`                                                            | open external、reveal in Finder/Explorer          | `artifacts.get`, `trace.listByArtifact`                                                   |
| Runtime Status      | `/agents`                | `RuntimeStatusPage`  | `RuntimeHealthCard`, `CoreHealthCard`, `DiagnosticPanel`                                                         | restart core、open logs、export diagnostic bundle | `core.health`, `runtime.healthCheck`, `queue.status`                                      |
| Settings            | `/settings/*`            | `SettingsPage`       | `SettingsSection`, `DangerZone`, `PermissionHistory`                                                             | keychain bridge、update checker、local paths      | `settings.get/update`, `security.audit`                                                   |

## 3. 核心组件契约草案

### 3.1 `RunHeader`

输入：

- `runId`, `title`, `status`, `duration`, `runtimeName`
- `progressSummary`: running / blocked / done counts
- `availableActions`: pause / resume / cancel / retry failed / rerun / add note
- `riskBadges`: protected action、timeout、local file changes

输出事件：

- `onPause`, `onResume`, `onCancel`, `onRetryFailed`, `onRerun`, `onAddNote`

### 3.2 `TaskTree`

输入：

- task nodes with `id`, `title`, `status`, `attempt`, `agentRunId`, `artifactCount`, `dependencyIds`
- selected task id

输出事件：

- `onSelectTask`, `onRetryTask`, `onAddInstruction`

### 3.3 `InterventionComposer`

输入：

- target object：Run / Task / AgentRun / ProtectedStep
- allowed action list
- risk explanation / protected action payload summary

输出事件：

- `onSubmitNote`, `onSubmitInstruction`, `onApproveOnce`, `onReject`, `onCancelAgentRun`

约束：组件不直接调用 desktop bridge；由页面容器把事件转成 core API。

### 3.4 `EvidencePanel` / `ArtifactReviewPanel`

输入：

- artifact list with `reviewState`, `kind`, `sourceTaskId`, `verificationRefs`
- selected artifact id
- provenance summary

输出事件：

- `onOpenArtifact`, `onAcceptArtifact`, `onRejectArtifact`, `onRequestChanges`, `onReuseAsContext`

### 3.5 `HandoffQueue`

输入：

- queue items：protected action、failed task、review artifact、runtime issue、ambiguous plan
- recommended action、age、source object、blocking flag

输出事件：

- `onOpenSource`, `onPrimaryAction`, `onDismissNonBlocking`

### 3.6 `RuntimeHealthCard` / `CoreHealthCard`

输入：

- status：starting / healthy / degraded / unhealthy / stopped
- version、endpoint redaction、log pointers、last heartbeat
- actions enabled flags

输出事件：

- `onRunDiagnostics`, `onRestartCore`, `onOpenLogs`, `onCopyRedactedStatus`, `onConfigureRuntime`

## 4. 状态与 schema 需求

| UI 需求          | 合同/后端字段                                                  | 备注                           |
| ---------------- | -------------------------------------------------------------- | ------------------------------ |
| 状态标签不靠颜色 | `status`, `statusReason`                                       | 所有可见状态要有人类可读文案   |
| 错误分层         | `errorLayer`, `errorCode`, `message`, `traceEventId`           | 对应设计文档错误分层           |
| retry/rerun 区分 | `attempt`, `retryable`, `sourceRunId`                          | Retry 在原 run；Rerun 新建 run |
| 接管可追踪       | `operatorActionId`, `operatorNoteId`, `createdBy`, `createdAt` | 进入 Activity / Trace          |
| 本地路径脱敏     | `displayPath`, `redactedPath`, `canReveal`                     | 诊断导出使用 redacted          |
| runtime 能力     | `capabilities`, `supportsCancel`, `supportsStreaming`          | UI 根据能力显示操作            |

## 5. 首批实现切片建议

1. `packages/shared_contracts` 先补状态枚举与列表/详情 DTO。
2. `packages/ui` 先做无 Electron 依赖的 RunHeader、TaskTree、StatusBadge、RuntimeHealthCard。
3. `apps/desktop` 先接 First Launch + Runtime Status，确认本地 core / Codex 检测闭环。
4. Run Detail 先支持只读观察，再打开 Add note / protected action approval。
5. Artifact external open / reveal 放在 desktop bridge，Web Shell 自动降级为下载/预览。

## 6. 变更历史

| 日期       | 变更 |
| ---------- | ---- |
| 2026-05-15 | 初版 |
