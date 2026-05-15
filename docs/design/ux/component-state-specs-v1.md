# Component State Specs V1

> 状态：🟡 Draft  
> 最后更新：2026-05-15  
> 范围：把 V1 视觉参考拆成可实现组件的状态规格；中文为主，英文可切换。

---

## 1. 目标

本文补齐组件级状态，让前端实现不只照图搭静态界面，而是能处理真实运行中的 loading、empty、error、disabled、focus、hover、danger confirmation 等情况。

## 2. 通用状态矩阵

| 状态          | 触发               | 视觉                             | 行为                                   |
| ------------- | ------------------ | -------------------------------- | -------------------------------------- |
| default       | 正常可用           | 默认 token                       | 可交互                                 |
| hover         | 鼠标悬停           | 轻阴影 + 可选 1px 上浮           | 不改变数据                             |
| focus-visible | 键盘聚焦           | 2px focus ring + 柔光            | Enter / Space 触发主动作               |
| active        | 按下               | 阴影减弱，回落                   | 触发动作或保持 pressed                 |
| loading       | 请求中             | 保留尺寸，spinner / loading 文案 | 禁止重复提交                           |
| disabled      | 不可用             | 降低对比但保持可读               | 不响应 hover/click，解释原因           |
| error         | 请求失败或数据异常 | danger 状态 + 可恢复动作         | 提供 retry / diagnostics / open source |
| empty         | 无数据             | 空状态插画/文案 + 主动作         | 指向下一步                             |

## 3. `AppShell`

### 责任

- 顶部栏、侧边栏、主内容区域、全局 command/search、runtime 健康入口。
- Desktop/Web 共享信息结构；桌面端可注入 window chrome / native menu。

### Slots

| Slot            | 内容                                                            |
| --------------- | --------------------------------------------------------------- |
| `topBar`        | 产品名、workspace switcher、command search、runtime mini status |
| `sidebar`       | 主导航                                                          |
| `content`       | 当前页面                                                        |
| `globalOverlay` | command menu、toast、danger confirmation                        |

### 状态

| 状态               | UI                                            |
| ------------------ | --------------------------------------------- |
| core healthy       | 绿色状态点 + `Core 正常`                      |
| core degraded      | amber 状态点 + `Core 降级` + diagnostics 链接 |
| core unavailable   | red 状态点 + 顶部横幅，主内容保留只读缓存     |
| offline/local only | 显示 `本地模式`，隐藏远程同步入口             |

## 4. `SidebarNav`

### 责任

主导航与当前页面定位。

### 项目

- 待处理
- 运行
- 任务
- 产物
- 运行时
- 活动
- 设置

### 状态

| 状态              | UI                                 |
| ----------------- | ---------------------------------- |
| active            | 浅蓝背景 + 蓝色文字 + aria-current |
| hover             | 背景轻微加深                       |
| focus-visible     | focus ring 包住整行                |
| badge             | 待处理数量，最多显示 `99+`         |
| collapsed（未来） | icon + tooltip                     |

## 5. `RunCard`

### 责任

在 Home / Run List 展示一个 run 的摘要、状态、进度、产物、接管需求。

### Props 草案

```ts
type RunCardProps = {
  id: string;
  runId: string;
  title: string;
  status: RunStatus;
  statusReason?: string;
  progress: { done: number; total: number; blocked: number; failed: number };
  artifactCount: number;
  handoffCount: number;
  updatedAt: string;
  primaryAction: ActionSpec;
};
```

### 状态

| 状态      | UI                            | 主动作           |
| --------- | ----------------------------- | ---------------- |
| queued    | neutral badge                 | Open run         |
| planning  | info badge                    | Open run         |
| running   | info badge + progress         | Open run         |
| blocked   | warning badge，列表中置顶     | Review handoff   |
| failed    | danger badge，显示 errorLayer | Retry / Open run |
| completed | success badge，降低视觉权重   | Open artifacts   |
| cancelled | neutral badge                 | Rerun            |

## 6. `TaskTree`

### 责任

展示 run 内 task 结构、依赖、状态、attempt 和当前选中项。

### 状态要求

- active task 使用蓝色 icon + 左侧强调线。
- blocked / failed task 必须显示原因摘要。
- `attempt > 1` 显示 retry 标记。
- task hover 显示局部操作：Open trace、Retry、Add instruction。
- 键盘上下移动选中任务，Enter 打开详情。

## 7. `ArtifactPreview`

### 责任

根据 artifact kind 展示预览。

| kind         | 预览                               |
| ------------ | ---------------------------------- |
| `diff`       | monospace diff，高亮 added/removed |
| `log`        | monospace log，支持搜索            |
| `summary`    | markdown preview                   |
| `screenshot` | image preview                      |
| `file`       | 文件元信息 + Open / Reveal         |
| `dataset`    | table preview（R1 可只读）         |

### 异常状态

| 状态        | UI                         | 操作                             |
| ----------- | -------------------------- | -------------------------------- |
| unsupported | “暂不支持预览此类型”       | Open external / Reveal           |
| missing     | “产物文件不存在或已移动”   | Locate / View provenance         |
| sensitive   | 预览前提示可能包含敏感信息 | Reveal preview / Export redacted |
| too_large   | “文件过大，已显示摘要”     | Open external                    |

## 8. `DangerConfirmDialog`

### 用途

所有危险动作统一使用。

### 必填字段

- 动作名称，例如 `取消运行`
- 影响对象，例如 `run_01j...`
- 是否可恢复
- 会产生的 trace / audit record
- 二次确认按钮文案，不能只写“确定”

### 示例

```text
取消这个运行？

这会停止当前 Agent 运行，并把未完成任务标记为 cancelled。
已生成的产物会保留。

[返回] [取消运行]
```

## 9. `EmptyState`

### Props 草案

```ts
type EmptyStateProps = {
  id: string;
  titleKey: string;
  descriptionKey: string;
  primaryAction?: ActionSpec;
  secondaryAction?: ActionSpec;
  illustration?: 'run' | 'artifact' | 'runtime' | 'trace' | 'search';
};
```

### 文案原则

- 说明为什么空。
- 给一个最自然的下一步。
- 不用“暂无数据”结束。

## 10. 变更历史

| 日期       | 变更                                                                                                        |
| ---------- | ----------------------------------------------------------------------------------------------------------- |
| 2026-05-15 | 初版：补 AppShell、SidebarNav、RunCard、TaskTree、ArtifactPreview、DangerConfirmDialog、EmptyState 状态规格 |
