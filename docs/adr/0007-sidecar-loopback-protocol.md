# ADR-0007: Sidecar 通信协议采用 Loopback HTTP + WebSocket + per-launch token

- **状态**：🟢 Accepted
- **日期**：2026-05-14
- **决策者**：项目主理
- **关联**：ADR-0001、ADR-0003、[`../design/security-model.md`](../design/security-model.md)

---

## 背景

桌面端的进程拓扑（ADR-0003）：

```
Electron Renderer → Electron Main → Workspace Core (sidecar, Node)
```

Renderer 与 Workspace Core 之间需要一种**统一通信协议**，同时满足：

1. 桌面 Renderer 能直接调用
2. **Web Shell** 在远程模式下也能用同一套 API（浏览器不能开 Unix Socket）
3. 流式输出（TraceEvent / AgentRun token stream）
4. 防止同机其他进程访问

候选方案：

- **A. Loopback HTTP + WebSocket + token**
- B. Unix Socket / Named Pipe
- C. Electron IPC 三跳转发
- D. gRPC over loopback
- E. stdio JSON-RPC

详细对比见 `docs/design/unified-design-v0.4.md` 决策讨论附录。

## 决策

**采用 Loopback HTTP + WebSocket + per-launch token。**

具体规范：

1. **绑定**：`127.0.0.1:<random-port>`，**严禁**监听 `0.0.0.0` 或任何非 loopback 接口
2. **端口分配**：`port: 0`，由 OS 分配空闲端口，由 Main 将实际端口注入 Renderer 与 Bridge
3. **鉴权 token**：
   - 每次 Workspace Core 启动**生成新的随机 token**（≥ 32 bytes，base64 编码）
   - 通过 IPC 注入 Renderer；通过环境变量或私有文件传给其他受信进程
   - 所有请求必须携带 `Authorization: Bearer <token>`
4. **CSRF / Origin 校验**：
   - 拒绝 `Origin` 与 `Sec-Fetch-Site` 不符合本机预期的请求
   - 拒绝缺失 `Authorization` 的请求（即使来自 loopback）
5. **WebSocket 升级**：
   - 握手时校验 token + Origin
   - 断线重连必须重新携带 token
6. **单实例锁**：Electron Main 使用 `app.requestSingleInstanceLock()` 防止多桌面实例端口冲突
7. **远程模式（Release 2+）**：同一套 HTTP/WS 协议，但暴露在用户自控 server 上，由用户配置 TLS + 鉴权（OIDC / API token）

## 后果

### 好的

- 桌面与 Web **共享同一套网络层**，零分叉
- 调试便利：开发态可用 `curl` / Postman 直接测试
- 流式天然支持（WebSocket）
- 实现复杂度低（Fastify 原生 HTTP + ws）
- 安全等价于 Unix Socket（token 防同机进程探测）

### 坏的

- 同机**同用户**的恶意进程理论上可读 token（通过 `/proc/<pid>/environ`、`open files` 等）
- 需要管理 token 的生命周期与轮换
- 端口扫描可被检测到 Workspace Core 在跑（不算敏感信息）

### 中性的

- 远程模式上线时（Release 2）必须叠加 TLS + 用户级鉴权
- WebSocket 流回压策略需自行实现

## 备选方案

- **Unix Socket / Named Pipe**：放弃为默认。优点：更严的本机隔离；缺点：**Web Shell 不能直连**（需双协议），违反"单一协议"原则。仅作为"未来桌面专属优化"的退路。
- **IPC 三跳转发**：放弃。延迟、调试性、流式都更差。
- **gRPC**：放弃。protobuf 与 Web 端复用需要 grpc-web，工具链复杂，调试不便。
- **stdio JSON-RPC**：放弃。流式与并发请求模式复杂。

## 实施提示

### Token 处理

- Token 文件（如需落盘）权限设为 `0600`，存放在 `<userData>/run/`，进程退出删除
- 不允许 token 出现在日志、错误消息、telemetry 中（脱敏中间件白名单）

### 端口握手

```ts
// Electron Main 启动 sidecar
const child = spawn(nodeBinary, [sidecarEntry], {
  env: {
    ...process.env,
    CAIRN_LOOPBACK_PORT: '0',
    CAIRN_LOOPBACK_TOKEN: generateToken(),
  },
  stdio: ['pipe', 'pipe', 'pipe'],
});

// sidecar 启动后通过 stdout 报告实际端口
child.stdout.on('data', (chunk) => {
  const m = chunk.toString().match(/CAIRN_READY port=(\d+)/);
  if (m) injectToRenderer({ port: m[1], token: env.CAIRN_LOOPBACK_TOKEN });
});
```

### Fastify 中间件

```ts
fastify.addHook('onRequest', async (req, reply) => {
  const auth = req.headers.authorization;
  if (auth !== `Bearer ${expectedToken}`) {
    reply.code(401).send({ error: 'unauthorized' });
  }
});
```

### 远程模式扩展

- 复用同一套 Fastify route 与 WS handler
- 鉴权中间件从"token 比对"切换为 "OIDC verify" 或 "API key verify"
- 详见 `../design/unified-design-v0.4.md §6.3-B`

## 后续

- [ ] 在 `packages/runtime_gateway/contracts/` 起草 token 注入与鉴权 schema
- [ ] 起草 sidecar 启动/退出 spike
- [ ] 在 `coding-standards.md` 增加"严禁日志输出 token"规则
- [ ] Release 2 上线前补：远程模式的 TLS + 鉴权 ADR（可作 ADR-0007 supplement）

## 变更历史

| 日期 | 变更 |
|---|---|
| 2026-05-14 | 初版 |
