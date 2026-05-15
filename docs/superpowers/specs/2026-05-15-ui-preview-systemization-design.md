# UI Preview Systemization Design

> 状态：🟡 Draft for user review  
> 日期：2026-05-15  
> 范围：Cairn UI preview 与共享 UI 组件的分阶段系统化整理  
> 分支上下文：`feat/ui-desktop-v0` → PR base `develop`

## 1. 背景

当前 `apps/ui-preview` 已经覆盖 Home Inbox、Run Detail、Artifact Review 与 Components Gallery，能够表达 Cairn 的 operator experience。`packages/ui` 也已经形成 primitives、feedback、data-display、Cairn product components 与 tokens 的基本分层。

调研发现，当前实现适合原型展示，但继续演进会遇到五类设计债：

1. preview 页面逐渐变大，demo data、布局与局部 section 混在页面文件中。
2. 页面业务语义没有稳定 ViewModel，run、artifact、risk、approval 等信息散落在 JSX 附近。
3. 本地路径与敏感产物的安全规则主要靠页面自觉，尚未下沉到组件 API。
4. `packages/ui/src/tokens`、Tailwind class 与 preview CSS variables 并行存在，长期容易分叉。
5. `Tabs`、`Dialog` 等 primitives 具备基础语义，但距离正式可复用的 keyboard / screen reader 行为还有差距。

用户已选择“方案 C 分步完成”。本设计将方案 C 拆成可单独 review、单独验证、必要时单独提交的阶段。

## 2. Goals

- 保持 UI preview 静态演示性质，不连接 backend，不接 `workspace-core`。
- 把大型 preview 页面拆成更清晰的 data、section、page 结构。
- 建立 preview-only ViewModel，让 demo 数据更接近页面输入模型，而不是散落常量。
- 把“本地路径默认隐藏 / 导出前提示风险”变成组件层默认规则。
- 收口 tokens 与 preview CSS 的职责，降低视觉系统分叉风险。
- 强化核心 primitives 的可访问性，尤其是 Tabs 与 Dialog。
- 每个阶段保持可验证：typecheck、lint、build，必要时补充视觉 sanity check。

## 3. Non-goals

- 不接入真实 runtime、backend、database 或 `workspace-core`。
- 不设计真实 API schema，不承诺 ViewModel 等于未来后端 contract。
- 不引入全局状态管理库。
- 不做大范围视觉 redesign。
- 不替换 Tailwind 或引入复杂 theme provider。
- 不实现真实 secret/token redaction 引擎。
- 不一次性重写全部 primitives。
- 不把当前 PR 变成不可 review 的单次大重构。

## 4. Phase Plan

### Phase 1 — Preview structure cleanup

目标：降低页面文件复杂度，不改变视觉与行为。

新增建议目录：

```txt
apps/ui-preview/src/preview-data/
apps/ui-preview/src/preview-sections/
```

页面职责调整：

- `apps/ui-preview/src/pages/*` 只负责页面级组合、少量局部 state 与 route/page 切换输入。
- `preview-data/*` 存放静态 demo data。
- `preview-sections/*` 存放页面内可命名的 section，例如：
  - `RunTaskTreeSection`
  - `RunEvidenceSection`
  - `RunArtifactsSection`
  - `ArtifactRiskSection`
  - `HomeHandoffSection`
  - `GalleryPrimitiveSection`

边界：

- 不改 `@cairn/ui` public API。
- 不改 tokens。
- 不改视觉风格。
- 不接 backend。

验收：

- 页面视觉与交互基本不变。
- `pnpm --filter @cairn/ui-preview typecheck` 通过。
- `pnpm --filter @cairn/ui-preview lint` 通过。
- `pnpm --filter @cairn/ui-preview build` 通过。
- 页面文件明显变短，职责更清楚。

### Phase 2 — Preview ViewModel boundary

目标：让 preview 的业务语义变成稳定输入模型。

新增建议目录：

```txt
apps/ui-preview/src/preview-models/
```

建议类型：

```ts
type PreviewRun = {
  id: string;
  title: string;
  status: CairnRunStatus;
  summary: string;
  tasks: readonly TaskTreeItem[];
  evidence: readonly EvidenceTimelineItem[];
  artifacts: readonly PreviewArtifact[];
};

type PreviewArtifact = {
  artifactId: string;
  title: string;
  kind: CairnArtifactKind;
  reviewState: CairnReviewState;
  summary: string;
  source?: string;
  localPath?: string;
  sensitivity: PreviewArtifactSensitivity;
  verification?: string;
};

type PreviewArtifactSensitivity = 'none' | 'local_path' | 'secret_risk';
```

说明：上述类型是 preview-only ViewModel，不是后端 contract。它的职责是让页面结构更容易理解，并为后续安全 API 改造提供稳定输入。

验收：

- demo data 更像页面输入模型，而不是 JSX 附近的一组零散常量。
- run/artifact/risk/approval 文案能从 ViewModel 派生。
- 不新增真实 runtime 依赖。
- `@cairn/ui-preview` typecheck / lint / build 通过。

### Phase 3 — Sensitive path and artifact safety API

目标：把“本地路径默认隐藏”变成组件层默认规则。

候选 API：

```ts
type ArtifactPathDisplayMode = 'hidden' | 'relative' | 'full';
type ArtifactSensitivity = 'none' | 'local_path' | 'secret_risk';

type ArtifactCardProps = {
  path?: string;
  pathDisplayMode?: ArtifactPathDisplayMode;
  sensitivity?: ArtifactSensitivity;
  redactionLabel?: string;
};
```

默认行为：

- `pathDisplayMode` 默认 `hidden`。
- `sensitivity='local_path' | 'secret_risk'` 时显示明确 warning badge。
- 只有显式传入 `pathDisplayMode='relative' | 'full'` 才显示路径。
- `full` 模式应在调用处伴随显式风险文案或 protected/export UI。

兼容策略：

- 现有 `sensitive?: boolean` 可以在一个阶段内保留并映射到新语义，避免一次性破坏调用方。
- Preview 页面逐步迁移到新 API。

验收：

- 不显式 opt-in 时，产物卡片不展示完整本地路径。
- Artifact Review 与 Diagnostic Export 场景都有清楚风险提示。
- `@cairn/ui` 与 `@cairn/ui-preview` typecheck / lint 通过。

### Phase 4 — Tokens and theme responsibility cleanup

目标：减少 token / Tailwind / preview CSS variables 的职责重叠。

职责划分：

- `packages/ui/src/tokens`：共享语义 token，例如 status tone、radius、motion、spacing、surface/text/state 语义。
- Tailwind class：组件实现层的布局和状态表达；可以消费与文档一致的语义值，但不要求所有值都 token 化。
- `apps/ui-preview/src/styles.css`：只保留 preview app shell、page layout 与 demo-only 样式。

实施策略：

- 先盘点 `styles.css` 中哪些变量是 app-shell 专属，哪些应沉到 shared tokens。
- 不强行把所有 Tailwind class 改为 token 调用。
- 不做视觉 redesign；只做命名、职责和少量重复值收口。

验收：

- preview CSS 变薄，变量职责更清楚。
- shared token 命名与 `docs/design/ux/foundations/design-tokens-v1.md` 对齐。
- `@cairn/ui` 与 `@cairn/ui-preview` typecheck / lint / build 通过。

### Phase 5 — Primitives accessibility hardening

目标：让核心 primitives 更接近正式可复用组件。

`Tabs`：

- 为 trigger 与 panel 建立 stable id。
- 增加 `aria-controls` / `aria-labelledby` 配对。
- 支持 keyboard navigation：ArrowLeft / ArrowRight / Home / End。
- 保持现有 compound component API 尽量兼容。

`Dialog`：

- 增加 `aria-modal`。
- 支持 Escape close。
- 支持 backdrop close，但点击 panel 内部不关闭。
- 初步 focus 管理：打开时 focus 到 panel 或取消按钮；危险 dialog 默认 focus 不落在危险主按钮。
- 保留标题与描述 id 关联。

实现选择：

- 优先小步增强现有 primitives。
- 如果实现复杂度明显上升，可单独评估是否引入 Radix Dialog/Tabs；该替换不在默认路径中。

验收：

- 纯键盘可切换 tabs 与关闭 dialog。
- Dialog screen reader 语义更完整。
- 现有 preview 页面不破。
- `@cairn/ui` 与 `@cairn/ui-preview` typecheck / lint 通过。

## 5. Recommended execution order

执行顺序固定为：

```txt
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5
```

原因：

1. 先让页面变薄，降低后续改动冲突。
2. 再稳定 preview ViewModel，给安全 API 与 tokens 改造提供清楚输入。
3. 然后处理 local path / artifact safety，因为它触及 public component API。
4. 再收口 tokens，避免在页面仍混乱时做全局样式判断。
5. 最后 harden primitives，因为 a11y 行为最容易引入交互细节变化，适合在结构稳定后单独验证。

## 6. Testing and verification

每个实现阶段至少运行：

```bash
pnpm --filter @cairn/ui-preview typecheck
pnpm --filter @cairn/ui-preview lint
pnpm --filter @cairn/ui-preview build
pnpm --filter @cairn/ui typecheck
pnpm --filter @cairn/ui lint
```

阶段特定验证：

- Phase 1 / 2：重点检查视觉是否基本不变，页面 section 是否仍完整。
- Phase 3：重点检查默认不泄露本地路径。
- Phase 4：重点检查 token 命名与现有 UX docs 是否一致。
- Phase 5：重点做 keyboard sanity check。

## 7. Risk management

- 控制 PR 大小：每个 phase 都可以单独 commit；如果 diff 过大，应拆更小。
- 避免行为漂移：Phase 1 / 2 不应改变用户可见 UI 行为。
- API 改造谨慎：Phase 3 保留兼容层，避免 preview 与组件库同时大面积破坏。
- Tokens 不追求一次完美：Phase 4 聚焦职责边界，不做大规模视觉重绘。
- A11y 变更单独验证：Phase 5 避免和样式重构混在一起。

## 8. Implementation planning gate

本 spec 经用户 review 通过后，下一步不是直接写代码，而是为 Phase 1 编写详细 implementation plan。Phase 1 完成并验证后，再进入 Phase 2；后续阶段同理。
