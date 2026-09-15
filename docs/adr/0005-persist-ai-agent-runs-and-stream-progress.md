# 持久化 AI Agent run，并演进到 SSE 进度推送

决策状态：已确认。PostgreSQL 持久化任务、租约 worker、GET/列表/取消接口、编辑器轮询以及候选确认/拒绝已经实现，并完成 store/数据库层的独立 PostgreSQL 集成验收。SSE、实时工具事件、provider 分级重试和自动清理仍未实现。

## 决策

AI 页面搭建使用后端持久化的异步任务模型，保存上下文、工具轨迹、候选结果和审计状态。第一版使用 PostgreSQL 任务表和带租约恢复的 API 内 worker，不额外引入 Redis/BullMQ。候选确认后仍只应用到编辑器 store，用户需要显式保存页面；Agent 不直接修改 `Page.schema`，也不创建 `PageVersion`。

相比进程内 Map，数据库任务可以支持进程重启后的状态恢复、多 API 实例抢占和候选审计。当前前端使用轮询读取快照；SSE 是后续的进度传输优化，不改变 PostgreSQL 作为任务状态事实来源的边界。

## 已实现范围

- Prisma 定义 `AiAgentRun` 和 `AiAgentRunEvent`；任务输入、上下文和候选快照保存在 JSONB，有序事件使用独立表和递增 `sequence`。
- 同一页面最多存在一个 `queued/running` 任务；创建接口立即返回 HTTP 202 和 `runId`。
- API 内 worker 使用 `FOR UPDATE SKIP LOCKED` 抢占任务，租约为 30 秒、每 10 秒续租、单次执行上限 120 秒；租约过期最多重新排队一次，旧 lease token 不能续租或提交结果。
- 状态主链路为 `queued -> running -> awaiting_confirmation -> accepted/rejected/expired`，执行阶段也可进入 `cancelled/failed`。
- API 已提供任务 GET、列表、取消、`POST /ai/agent-runs/:runId/confirm` 和 `POST /ai/agent-runs/:runId/reject`。
- 编辑器每 1.5 秒轮询活动任务；打开面板时恢复最近任务，离开面板停止本地轮询但不取消后端任务。
- confirm/reject 仅允许任务发起者或项目 owner；服务端校验候选归属、状态和有效期，重复执行相同决策保持幂等，相反决策或 candidate ID 不一致返回冲突。
- 候选生成完成后有效期为 24 小时。confirm/reject 使用 PostgreSQL `clock_timestamp()` 判断过期，并先在事务中写入 `expired` 状态、事件和 `ai.agent.expire` 审计，再返回冲突。
- 前端只在服务端返回 `accepted` 后把候选写入 editor store；该操作不自动保存页面。
- 排队、开始和恢复事件即时持久化；生成器内部工具轨迹在结果事务中批量持久化。
- 持久化 JSON 限制为 512 KB，并拒绝常见凭证键和 Bearer 值；worker 不保存 provider 原始异常。

## 尚未实现

- `GET /ai/agent-runs/:runId/events` SSE 事件流、`Last-Event-ID` 补发和前端 fetch 流式读取。
- plan、tool call 和 validation 的实时事件写入；当前生成器内部轨迹在任务完成时批量保存。
- provider 网络错误与超时的分级重试、退避和正在执行模型请求的真实中止。
- 无用户操作时的候选定时过期扫描、run/event 30 天自动清理。
- 完整的 token、耗时、失败率、成本统计和更全面的敏感凭证识别。
- 真实进程 kill/restart 与多主机故障恢复演练。

## 外部访问边界

Agent 使用用户提供的接口说明、响应示例、项目数据源模型和页面物料上下文生成声明式数据源或 HTTP action，不直接探测、调用或写入外部业务 API。实际业务请求由受宿主策略约束的页面 runtime 执行；后端模型网关调用已配置的模型服务不属于此处禁止的业务 API 访问。候选预览同样属于 runtime 执行场景，不能把“Agent 无外部 API 直连权限”等同于“预览不会发出请求”。

## 验收证据

- `apps/api-server/test/ai-agent-postgres.mjs` 使用真实 PostgreSQL 和两个 `AiAgentRunStore` 实例验证同页并发入队、并发抢占、一次租约恢复、旧 lease 拒绝、连续事件序号、幂等取消、confirm/reject、候选冲突、过期迁移和不创建 `PageVersion`；它不是启动两个真实 worker 或经过 HTTP controller 的端到端测试。
- `scripts/test/ai-agent-persistence.test.mjs` 验证凭证拒绝、512 KB 限制和旧租约结果拒绝。
- `.github/workflows/ci.yml` 在 API worker 启动前运行 `npm run test:agent:postgres`。
- 人工执行记录：2026-09-15 曾在独立本机 PostgreSQL 测试库运行通过，仓库未保存该次原始日志；可复现步骤见 `docs/06-测试与验收/Agent数据库集成验收.md`。
