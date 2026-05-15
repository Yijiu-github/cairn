# 模块边界 / Module Boundaries

> 状态：🟡 Draft
> 最后更新：2026-05-16
> 目的：明确 apps / packages 的职责、允许依赖、禁止依赖与 public API 边界。

---

## 1. 定位

`repo-layout.md` 说明仓库结构。本文件说明模块之间可以如何依赖，以及什么行为必须阻止。

核心原则：

- Desktop 与 Web 共享 Workspace Core 语义。
- 业务状态机不进入 route、bridge、adapter 或 UI。
- 跨包依赖只能走 public API。
- 短期可以人工 review，后续进入 `standards:check`。

## 2. 职责矩阵

| 模块                        | 负责                                                                      | 不负责                                           | 允许依赖                                                                  | 禁止依赖 / 禁止行为                                                   |
| --------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `packages/shared_contracts` | Zod schemas、HTTP contracts、WS events、跨端 DTO                          | 业务推进、DB 实现、runtime 行为                  | 无业务包                                                                  | `application`、`domain`、`storage`、`runtime_gateway`、`ui`、`apps/*` |
| `packages/domain`           | Drizzle schema、领域枚举、持久化 schema 形状                              | repository 实现、service 编排                    | `shared_contracts`                                                        | `application`、`storage`、`runtime_gateway`、`apps/*`                 |
| `packages/storage`          | SQLite / Postgres 连接、迁移 runner、repository 实现、artifact store 实现 | orchestration 决策、runtime 调用                 | `domain`、`shared_contracts`                                              | `application`、`runtime_gateway`、`apps/*`                            |
| `packages/runtime_gateway`  | RuntimeAdapter 契约、adapter conformance、mock / Codex adapter            | application 状态推进、storage 持久化             | `shared_contracts`                                                        | `application`、`storage`、`apps/*`                                    |
| `packages/application`      | orchestration service、ports、operator action、状态推进                   | storage 具体实现、HTTP route、adapter 子进程细节 | `domain`、`shared_contracts`、`runtime_gateway` 类型 / 端口               | storage 具体实现、workspace-core routes                               |
| `apps/workspace-core`       | HTTP API、组合 application / storage / runtime adapter、进程入口          | 核心业务状态机、桌面桥接、UI 状态                | `application`、`storage`、`runtime_gateway`、`shared_contracts`、`domain` | 把业务状态机写进 route handler                                        |
| `packages/ui`               | UI primitives、feedback、Cairn 业务展示组件                               | runtime 调用、storage、Workspace Core 进程控制   | `shared_contracts`                                                        | `workspace-core`、`storage`、`runtime_gateway`、`desktop_bridge`      |
| `packages/desktop_bridge`   | 桌面系统能力桥接                                                          | 业务编排、状态机、storage 逻辑                   | `shared_contracts`、`observability`                                       | 被 Web / Workspace Core 引用                                          |
| `apps/desktop`              | Electron shell、sidecar 管理、UI 组合                                     | 绕过 Workspace Core 的业务流程                   | `ui`、`shared_contracts`、`desktop_bridge`                                | 直接实现独立 run/task 状态机                                          |
| `apps/web`                  | Web shell、UI 组合、远程 Workspace Core 控制台                            | 嵌入 sidecar、桌面系统能力桥接                   | `ui`、`shared_contracts`                                                  | 直接实现独立 run/task 状态机                                          |

## 3. 导入规则

允许：

```ts
import { runContract } from '@cairn/shared-contracts/contracts';
import { createOrchestrationRunService } from '@cairn/application';
```

禁止跨包相对导入：

```ts
import { runContract } from '../../packages/shared_contracts/src/contracts';
```

禁止跨包 internal 导入：

```ts
import { privateHelper } from '@cairn/application/internal/private-helper';
```

禁止 app 之间互相导入：

```ts
import { something } from '../../web/src/something';
```

## 4. Public API 规则

每个包的 public API 只有：

- `src/index.ts`
- `package.json` 中显式 `exports` 的子路径

新增 public API 时必须：

1. 从 public entrypoint 导出。
2. 补充 TSDoc 或清楚的类型命名。
3. 如涉及 shared contract，补 schema / contract 测试。
4. 更新相关文档或 CHANGELOG。

## 5. Internal 规则

`src/internal/` 表示包内私有实现。其他包不得导入。

如果某个 internal helper 被多个包需要，不能直接跨包引用。应选择：

1. 提升为该包 public API。
2. 移到更合适的共享包。
3. 复制少量无状态逻辑，并在后续抽象前保持局部。

## 6. Review Checklist

提交或 review 时检查：

- [ ] 是否有跨包相对导入？
- [ ] 是否导入了其他包 internal？
- [ ] 是否违反职责矩阵？
- [ ] 是否把业务逻辑塞进 route、bridge、adapter 或 UI？
- [ ] 是否让 Desktop / Web 绕过 Workspace Core？
- [ ] 新 public API 是否通过 package export 暴露？
- [ ] 需要同步的 contract / design / CHANGELOG 是否已更新？

## 7. 后续自动化

后续 `standards:check` 至少检查：

- 跨包相对导入。
- 跨包 internal 导入。
- `@cairn/*` import 是否符合职责矩阵。
- package exports 与 public API 是否一致。

自动化路线见 [`standards-automation.md`](./standards-automation.md)。

## 8. 变更历史

| 日期       | 变更                                                               |
| ---------- | ------------------------------------------------------------------ |
| 2026-05-16 | 初版：定义 package responsibility matrix 与 import/public API 边界 |
