# ADR-0010: Secret 存储采用 Electron safeStorage + 系统 Keychain / DPAPI

- **状态**：🟢 Accepted
- **日期**：2026-05-14
- **决策者**：项目主理
- **关联**：ADR-0003、[`../design/security-model.md`](../design/security-model.md)、[`../legal/privacy-statement.md`](../legal/privacy-statement.md)

---

## 背景

桌面端必然保存敏感凭据：

- 第三方 AI provider 的 API key（OpenAI / Anthropic / Codex / 自建）
- 远程 Workspace Core 的鉴权 token（Release 2+）
- 其他第三方服务的 OAuth refresh token

要求：

- **不允许明文落盘**
- **Renderer 进程不允许直接接触原始 secret**
- 跨平台一致体验
- 卸载策略可控（卸载默认不自动清除——避免误删）

候选：

- A. **Electron `safeStorage` API**（底层使用 OS 凭据存储）
- B. 直接调用 `node-keytar`（基于 libsecret / Keychain / DPAPI）
- C. 自加密文件存储（如 sqlcipher）+ 用户主密码

## 决策

**采用 Electron `safeStorage` 作为统一接口，由其内部委托到 OS 凭据存储。**

具体地：

1. 所有 secret **只在 Workspace Core 进程中读写**；Renderer 不直接访问
2. Workspace Core 通过 Electron Main 提供的 `safeStorage` API（封装为 RPC 端口）持久化 secret
3. Renderer 通过 ts-rest API 提交"使用某 secret 调用 X 服务"的请求，**不能拿到原始 secret 内容**
4. 卸载默认**不**清理 OS 凭据存储中的条目；提供"完全卸载"步骤说明

### 平台映射

| 平台 | safeStorage 底层 |
|---|---|
| macOS | Keychain |
| Windows | DPAPI（保护 per-user） |
| Linux | libsecret（如可用），否则降级为"基本"模式（仍加密但无 OS 保护） |

### 命名空间

OS 凭据存储中的条目统一前缀 **`cairn:`**，便于卸载时手动清理。

例：

```
cairn:workspace:<workspace_id>:provider:openai
cairn:workspace:<workspace_id>:remote-auth
```

## 后果

### 好的

- 跨平台统一 API
- 不引入额外 native 模块（`safeStorage` 是 Electron 内置）
- secret 在 OS 层级加密，符合 `privacy-statement.md` 承诺
- Renderer 永远不接触原始 secret（最小权限原则）

### 坏的

- Linux 在缺少 libsecret 的极简环境下安全性降级（safeStorage 会回退到"basic"——仍加密但密钥可被同机进程读取）
- safeStorage 在 macOS 锁屏 / 第二用户 / Time Machine 恢复等边界场景的行为需 spike 验证
- 必须确保 secret 不出现在日志、telemetry、错误消息（脱敏中间件）

### 中性的

- 卸载不自动清理 → 在 `install-guide.md` 与 UI 中明示用户如何手动清理 OS 凭据条目
- 远程模式（Release 2+）的 server 端 secret 管理由用户在 server 上自行处理（不同问题域，不在本 ADR 范围）

## 备选方案

- **node-keytar**：放弃。曾是事实标准，但 Electron 14+ 已提供 `safeStorage` 覆盖大多数场景；node-keytar 是额外 native 模块，打包/签名复杂。
- **sqlcipher + 用户主密码**：放弃为默认。强加密但额外要求用户记主密码，与"本地优先 + 易用"调性冲突。**保留为未来高安全模式选项**——可在设置中允许用户启用。
- **明文 + 文件权限保护**：放弃。文件权限不足以防护同机进程窃取，违反 `security-model.md`。

## 实施提示

### Workspace Core 中的 SecretAccessor

```ts
// 由 Electron Main 注入到 sidecar；远程模式由 server 自身实现
export interface SecretAccessor {
  get(name: string): Promise<string | undefined>;
  set(name: string, value: string): Promise<void>;
  delete(name: string): Promise<void>;
  list(): Promise<string[]>; // 仅返回 name，不返回 value
}
```

### Renderer 端 API（严禁返回原始 secret）

```ts
// ts-rest contract
secrets: {
  list: { method: 'GET',  path: '/secrets',        responses: { 200: z.array(SecretName) } },
  set:  { method: 'PUT',  path: '/secrets/:name',  body: z.object({ value: z.string() }),
          responses: { 204: z.void() } },
  rm:   { method: 'DELETE', path: '/secrets/:name', responses: { 204: z.void() } },
  // ❌ 永远没有 GET /secrets/:name → value 这种端点
}
```

### 脱敏中间件

`@cairn/observability` 提供的 logger 必须默认脱敏以下字段名：
- `apiKey`, `api_key`, `token`, `authorization`, `password`, `secret`, `key`
- 任何 `cairn:*` 命名空间下的值

### 卸载用户提示（在 install-guide.md / uninstall 引导）

> 卸载 Cairn 不会自动从系统钥匙串删除你的 provider API key。如需完全清理：
> - macOS：打开「钥匙串访问」，搜索 `cairn:`，删除条目
> - Windows：打开「凭据管理器」，找到 `cairn:` 开头的条目并删除

## 后续

- [ ] Spike：safeStorage 在 macOS 锁屏 / 第二用户的行为
- [ ] Spike：Linux 无 libsecret 环境下 safeStorage 降级模式验证
- [ ] 编写脱敏中间件单元测试
- [ ] UI 提供"导出 secret 清单"（仅 name，不含 value），便于迁移
- [ ] 远期：可选"用户主密码"高安全模式（独立 ADR）

## 变更历史

| 日期 | 变更 |
|---|---|
| 2026-05-14 | 初版 |
