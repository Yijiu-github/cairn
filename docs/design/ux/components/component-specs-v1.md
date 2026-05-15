# Component Specs V1

> 状态：🟡 Draft
> 最后更新：2026-05-15
> 范围：第一批核心 UI 组件规格；中文为主，英文可切换。

---

## 1. 通用要求

- 所有用户可见文案必须走 i18n key，默认 `zh-CN`。
- 状态不能只靠颜色表达，必须有 icon + label。
- 所有可交互对象必须有 stable id，用于 trace、测试和快捷命令。
- 危险动作必须明确影响范围，并在需要时二次确认。
- Desktop/Web 共用组件不能直接调用 Electron / 本地文件系统 API。

## 2. 交互状态

所有可点击控件统一支持：

| 状态          | 视觉要求                                              |
| ------------- | ----------------------------------------------------- |
| hover         | 轻微阴影或背景变化，可点击卡片允许 `translateY(-1px)` |
| focus-visible | 必须显示 2px focus ring，不只依赖阴影                 |
| active        | 回落，阴影减弱或取消                                  |
| disabled      | 禁用态不响应 hover shadow，透明度降低但仍可读         |
| loading       | 保留控件宽度，显示 spinner 或进度文案                 |

组件实现建议使用 `:focus-visible`，避免鼠标点击后残留强 focus ring。

## 3. `StatusBadge`

### 用途

展示 run、task、artifact、runtime、review 等状态。

### Props 草案

```ts
type StatusTone = 'info' | 'success' | 'warning' | 'danger' | 'neutral';

type StatusBadgeProps = {
  id: string;
  status: string;
  tone: StatusTone;
  icon?: string;
  labelKey: string;
  labelParams?: Record<string, unknown>;
  metadataKey?: string;
  metadataParams?: Record<string, unknown>;
  size?: 'sm' | 'md';
};
```

### 文案示例

| 状态           | zh-CN  | en-US          |
| -------------- | ------ | -------------- |
| running        | 运行中 | Running        |
| blocked        | 已阻塞 | Blocked        |
| completed      | 已完成 | Completed      |
| review_pending | 待审阅 | Review pending |
| healthy        | 正常   | Healthy        |

## 4. `HandoffQueueItem`

### 用途

首页和 Run Header 中展示等待人类判断的事项。

### 必填信息

- 来源对象：run / task / artifact / runtime issue
- 阻塞原因或待处理原因
- 等待时长
- 推荐主操作
- 次操作：打开来源、查看 trace、拒绝/忽略非阻塞提醒

### Props 草案

```ts
type HandoffKind =
  | 'protected_action'
  | 'failed_task'
  | 'artifact_review'
  | 'runtime_issue'
  | 'ambiguous_plan';

type HandoffQueueItemProps = {
  id: string;
  kind: HandoffKind;
  source: {
    objectType: 'run' | 'task' | 'artifact' | 'runtime';
    objectId: string;
    titleKey: string;
    titleParams?: Record<string, unknown>;
  };
  reasonKey: string;
  reasonParams?: Record<string, unknown>;
  ageMs: number;
  blocking: boolean;
  primaryAction: ActionSpec;
  secondaryActions: ActionSpec[];
};
```

### 行为

- `blocking=true` 的事项不能被简单 dismiss，只能处理或打开来源。
- Protected action 的主按钮文案必须写明范围，例如“仅本次批准”。
- Artifact review 的主动作通常是“接受”，但必须同时提供“要求修改”。

## 5. `ArtifactCard`

### 用途

展示 run 产物列表和 review 状态。

### Props 草案

```ts
type ReviewState = 'unreviewed' | 'accepted' | 'rejected' | 'superseded';

type ArtifactCardProps = {
  id: string;
  artifactId: string;
  title: string;
  kind: 'diff' | 'log' | 'summary' | 'screenshot' | 'file' | 'dataset';
  reviewState: ReviewState;
  sourceTaskId: string;
  verificationSummary?: {
    status: 'none' | 'passed' | 'failed' | 'partial';
    labelKey: string;
  };
  sensitive?: boolean;
  onOpen: (artifactId: string) => void;
};
```

### 视觉

- `accepted` 使用 success，但不等于 run completed。
- `rejected` 必须降低默认复用权重。
- `sensitive=true` 显示敏感标识，导出/复制前提示。

## 6. `InterventionComposer`

### 用途

让用户给当前 run/task/agent run/protected step 提交接管动作。

### Effect

| Effect       | zh-CN    | en-US        | 含义                               |
| ------------ | -------- | ------------ | ---------------------------------- |
| applies_now  | 立即生效 | Applies now  | 提交后影响当前调度                 |
| applies_next | 下次生效 | Applies next | 进入下一次 planning / retry 上下文 |
| records_only | 仅记录   | Records only | 只写入 note/decision               |

### Props 草案

```ts
type InterventionTarget = {
  objectType: 'run' | 'task' | 'agent_run' | 'protected_step' | 'artifact';
  objectId: string;
};

type InterventionComposerProps = {
  id: string;
  target: InterventionTarget;
  allowedActions: ActionSpec[];
  selectedEffect: 'applies_now' | 'applies_next' | 'records_only';
  riskSummaryKey?: string;
  riskSummaryParams?: Record<string, unknown>;
  placeholderKey: string;
  requireConfirmation?: boolean;
};
```

### 行为

- 危险动作显示二次确认，包括影响对象、不可逆程度、是否只本次生效。
- 用户提交后生成 `operatorActionId` 或 `operatorNoteId`，进入 trace。
- 文案不能只写“确认”，必须写“取消运行”“仅本次批准”等具体动作。

## 7. `LanguageSwitcher`

### 用途

首启和设置页切换界面语言。

### Props 草案

```ts
type Locale = 'zh-CN' | 'en-US';

type LanguageSwitcherProps = {
  id: string;
  value: Locale;
  options: Array<{ locale: Locale; label: string; nativeLabel: string }>;
  onChange: (locale: Locale) => void;
  compact?: boolean;
};
```

### 文案

| locale | label              | nativeLabel |
| ------ | ------------------ | ----------- |
| zh-CN  | Chinese Simplified | 简体中文    |
| en-US  | English            | English     |

### 行为

- 首启中切换后立即刷新当前页面。
- 设置页切换后保存到本地 preference。
- 若某 key 缺失，开发环境显示缺失提示，生产环境回退。

## 8. 变更历史

| 日期       | 变更                                                                                      |
| ---------- | ----------------------------------------------------------------------------------------- |
| 2026-05-15 | 初版：StatusBadge、HandoffQueueItem、ArtifactCard、InterventionComposer、LanguageSwitcher |
