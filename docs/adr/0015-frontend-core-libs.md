# ADR-0015: 前端核心库（TanStack Router + Query、Zustand、Pino）

- **状态**：🟢 Accepted
- **日期**：2026-05-14
- **决策者**：项目主理
- **关联**：ADR-0002、ADR-0009、ADR-0013、`packages/ui/`、`packages/observability/`

---

## 背景

Renderer / Web Shell 需要决定以下基础库：

1. **路由**：React Router / TanStack Router / Wouter
2. **数据获取（远程状态）**：TanStack Query / SWR / Apollo / 自建
3. **本地状态管理**：Redux Toolkit / Zustand / Jotai / Effector
4. **日志**：Pino / Winston / Bunyan / 自建
5. **类型化错误边界 / Suspense 策略**

为避免膨胀成"前端架构 ADR 大杂烩"，本 ADR 把**实际有分歧**的几条一次性钉住，其余写进 `coding-standards.md` 即可。

## 决策

### 1. 路由：**`@tanstack/react-router`**

- typed routes，路由参数 / search params 自动推断
- 与 TanStack Query 同生态，loader / pending state 衔接顺
- 文件式路由可选

### 2. 远程状态（数据获取）：**`@tanstack/react-query`**

- 与 ts-rest 客户端无缝集成（`@ts-rest/react-query`）
- 内置 retry / staleTime / mutation / 乐观更新
- WebSocket 事件可通过 `queryClient.setQueryData` 增量更新缓存

### 3. 本地状态：**`zustand`**

- API 极简（`create((set) => ...)`），无 Provider 包裹
- 与 React Query 互补：服务器状态 → Query；UI / 偏好 / 选中 → Zustand
- TS 类型推断好

### 4. 日志：**`pino`**

- 高性能 structured logging
- `pino-pretty` 开发态可读
- 跨进程使用（Workspace Core / Electron Main / Renderer 通过 IPC 桥）

### 5. 错误边界：**React 内置 `<ErrorBoundary>` + `react-error-boundary`**

- 在路由级别包装
- 失败时显示标准化 fallback UI + 上报到 telemetry（如启用）

### 6. 不做的事

- ❌ Redux Toolkit（zustand 已够）
- ❌ Recoil / Jotai（与 zustand 解决同问题）
- ❌ Apollo / urql（无 GraphQL）
- ❌ Winston / Bunyan（性能与生态不如 Pino）
- ❌ React Router v7（功能等价但 typed 推断不如 TanStack Router）

## 后果

### 好的

- TanStack 全家桶生态对齐（router + query），心智一致
- Zustand 学习曲线最低（个人项目最重要）
- Pino 与 Workspace Core 共用同一 logger 库 → 跨进程日志格式统一
- 错误边界 + 上报标准化，便于 Operator 排错

### 坏的

- TanStack Router 相对 React Router 案例较少，文档需补
- Pino 在浏览器中需要单独 transport（`pino/browser`），与 Node 版有差异
- Zustand 没有 Redux DevTools 那种"时间旅行"调试，但有官方 zustand-devtools

### 中性的

- 不引入 GraphQL → REST + ts-rest 已满足
- 远期如需复杂表单：评估 `react-hook-form` + `zod resolver`（独立小决策）

## 备选方案

- **React Router v7**：放弃。功能等价但 typed 推断不如 TanStack。
- **Redux Toolkit**：放弃。对 UI 状态管理过重；team size 小，不需要 reducer 范式。
- **SWR**：放弃。功能比 React Query 少一些，与 ts-rest 集成不如 React Query 顺。
- **Winston / Bunyan**：放弃。Pino 性能更好，API 现代。
- **MobX**：放弃。响应式范式与 React Query 重叠，且 boilerplate 多。

## 实施提示

### 包结构（`packages/ui` 与 `apps/*`）

- 路由 / Query Provider / Zustand store 创建在 `packages/ui/src/runtime/`
- 由 `apps/desktop/src/renderer` 与 `apps/web/src` 各自挂载并注入运行时 config（API base URL、token getter 等）

### React Query 与 WebSocket

```ts
// 收到 WS 事件后更新 React Query 缓存
ws.on('run.token', ({ runId, delta }) => {
  queryClient.setQueryData(['run', runId, 'output'], (old) => (old ?? '') + delta);
});

ws.on('run.succeeded', ({ runId }) => {
  queryClient.invalidateQueries({ queryKey: ['run', runId] });
});
```

### Zustand store 划分原则

- 一个 feature 一个 store（不要单一 root store）
- 仅放**纯 UI / 偏好 / 临时选中**，不放服务器数据
- 例：`useRunDetailUiStore`, `usePanelLayoutStore`, `useCommandPaletteStore`

### Pino 配置

```ts
// packages/observability/src/logger.ts
import pino from 'pino';

const isBrowser = typeof window !== 'undefined';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  ...(isBrowser
    ? { browser: { asObject: true } }
    : {
        transport:
          process.env.NODE_ENV === 'development'
            ? { target: 'pino-pretty', options: { colorize: true } }
            : undefined,
      }),
  redact: {
    paths: [
      '*.apiKey',
      '*.api_key',
      '*.token',
      '*.authorization',
      '*.password',
      '*.secret',
      'token',
    ],
    censor: '[REDACTED]',
  },
});
```

### 错误边界

```tsx
<ErrorBoundary
  fallbackRender={({ error, resetErrorBoundary }) => (
    <ErrorFallback error={error} onReset={resetErrorBoundary} />
  )}
  onError={(error, info) => {
    logger.error({ err: error, info }, 'renderer error boundary');
    if (telemetryEnabled) track('renderer.error', { name: error.name });
  }}
>
  <RouterProvider router={router} />
</ErrorBoundary>
```

## 后续

- [ ] 提交 `packages/ui/src/runtime/router.ts` 草案
- [ ] 提交 `@cairn/observability` logger 实现
- [ ] 起草 React Query 默认配置（staleTime / retry / 缓存大小）
- [ ] Renderer 错误边界 fallback UI 设计与文案

## 变更历史

| 日期       | 变更 |
| ---------- | ---- |
| 2026-05-14 | 初版 |
