# AI 页面搭建

AI 能力只辅助生成和修改低代码 schema，不生成任意 React、Vue 或 HTML 源码。

## 调用边界

- 前端通过 feature API 请求 `api-server`。
- 模型 key 只存在于后端环境变量。
- 未配置 provider key 时，后端返回本地规则生成的可编辑草稿。
- provider 配置使用 `AI_PROVIDER_BASE_URL`、`AI_PROVIDER_API_KEY`、`AI_PROVIDER_MODEL` 和超时变量。

## 输出

- 整页或片段组件树。
- 针对当前页面或选中组件的 schema patch。
- CRUD 页面候选和数据源绑定候选。
- 事件动作候选。

输出必须包含可展示的摘要、warnings、assumptions、路由决策和工具执行信息。

## 校验与确认

1. 读取页面、选中组件、registry 和数据源模型上下文。
2. 路由到生成、patch、事件或数据源工具。
3. 校验物料白名单、组件树、父子关系、事件动作和 custom JS。
4. patch 额外校验 baseline fingerprint 和目标组件。
5. 前端展示候选预览。
6. 用户确认后才调用 `applyAiComponentPatch` 或替换/插入组件树。

AI 不能绕过编辑器 store、页面保存、版本和发布流程。

## 异步任务与候选决策（M1/M2 已实现）

Agent 创建请求只负责入队，PostgreSQL 的 `AiAgentRun` / `AiAgentRunEvent` 保存输入、状态、结果与有序事件。API 内 worker 以短事务和 `FOR UPDATE SKIP LOCKED` 抢占；租约 30 秒、每 10 秒续租，单次执行上限 120 秒。过期租约最多重新排队一次，旧租约令牌不能提交结果；模型调用在事务外，恢复可能重复调用模型，不承诺恰好一次计费。独立 PostgreSQL 集成检查已覆盖入队互斥、多 worker 抢占、租约恢复、候选决策和过期迁移。

编辑器通过轮询展示排队/执行/候选状态；打开面板时查询当前用户最近任务，离开面板停止订阅但不取消后端任务。历史恢复不自动覆盖草稿；整页候选和 patch 会先在前端检查当前 baseline 并完成 schema 校验，随后请求服务端确认，只有返回 `accepted` 才写入 editor store。该写入不保存页面、不创建 `PageVersion`，用户仍需手动保存。拒绝可附加原因且不修改草稿；隐藏结果只影响面板，不等于服务端 reject。

候选有效期时间戳为生成完成后 24 小时。确认或拒绝时由 PostgreSQL `clock_timestamp()` 判断是否过期；过期状态、事件和 `ai.agent.expire` 审计在事务中先持久化，之后才向客户端返回冲突。同一决策幂等；相反决策或候选 ID 不一致会返回冲突。当前尚未实现 SSE、无用户操作时的定时过期扫描、30 天清理、provider 分级重试及完整凭证识别。当前只限制持久化 JSON 512 KB 并拒绝常见凭证键和 Bearer 值；不应输入真实业务凭证。内部工具轨迹在任务完成时批量持久化，排队/开始/恢复事件单独持久化。

服务启动前必须部署 migration；独立 PostgreSQL 集成检查见 `npm run test:agent:postgres`。2026-09-16 已在隔离测试库验证 migration、并发抢占、租约恢复和候选决策；该检查仍不等同于真实进程 kill/restart 或多主机故障演练。

## 安全

- viewer 无写入权限。
- custom action 默认不进入生成结果。
- 服务端限制步骤数、修复次数、上下文规模、超时和请求频率。
- 模型输出视为不可信输入，必须经过共享 schema 校验。

相关实现位于 `apps/api-server/src/modules/ai`、`apps/editor-web/src/features/editor/components/AiBuilderPanel` 和 `packages/lowcode-schema/src/ai-*`。
