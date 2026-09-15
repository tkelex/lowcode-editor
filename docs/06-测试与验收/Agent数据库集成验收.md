# Agent 数据库集成验收

`AiAgentRun` 的数据库约束、并发抢占、租约隔离以及候选决策需要真实 PostgreSQL，mock 单测不能证明这些性质。人工执行记录显示 2026-09-15 曾在本机独立测试库运行通过，但仓库未保留该次原始日志；CI workflow 也在 migration 之后、API worker 启动之前执行同一检查。

## 当前验收结论

脚本已覆盖：

- 同一页面并发入队时只有一个任务成功。
- 两个 `AiAgentRunStore` 实例模拟并发抢占时只有一个获得任务；该脚本不启动两个真实 worker，也不经过 HTTP controller。
- 租约过期后只允许恢复一次，旧 worker 不能提交或续租。
- 事件 `sequence` 连续递增。
- 取消操作幂等。
- 候选生成后进入 `awaiting_confirmation`；测试验证有效期至少晚于执行时刻 23 小时，源码将其设置为 24 小时。
- confirm/reject 的正常决策、同决策幂等、相反决策冲突和 candidate ID 冲突。
- confirm/reject 可把数据库中已过期的候选迁移为 `expired`；使用 `clock_timestamp()` 的数据库时间边界由 store 源码确认。
- Agent 候选决策不会创建 `PageVersion`。

成功输出为 `Agent PostgreSQL integration checks passed`。该脚本模拟租约失效，不等于已经完成真实进程 kill/restart 或多主机故障演练；SSE、provider 分级重试、定时过期扫描和 30 天自动清理也不在此脚本范围。

## Windows 独立测试库

前置条件：Docker Desktop 已安装并启动（使用 Linux containers）。此配置使用独立 Compose 项目、数据卷和本机 55432 端口，不复用开发数据库。以下凭证仅用于本机测试，禁止用于部署。

```powershell
docker compose -f infra/docker/docker-compose.agent-test.yml up -d --wait
$env:AGENT_TEST_DATABASE_URL = 'postgresql://agent_test:agent_test_local_only@127.0.0.1:55432/lowcode_agent_test?schema=public'
$previousDatabaseUrl = $env:DATABASE_URL
try {
  $env:DATABASE_URL = $env:AGENT_TEST_DATABASE_URL
  npm.cmd run prisma:deploy
  if ($LASTEXITCODE -ne 0) { throw '测试库迁移失败，停止验收' }
  npm.cmd run prisma:generate
  if ($LASTEXITCODE -ne 0) { throw 'Prisma client 生成失败，停止验收' }
  npm.cmd run test:agent:postgres
} finally {
  $env:DATABASE_URL = $previousDatabaseUrl
}
```

检查脚本只读取显式 `AGENT_TEST_DATABASE_URL`，拒绝数据库名不以 `_test` 或 `_ci` 结尾的连接，不回退至 `.env`。运行前必须停止连接此库的 API worker，并确保库中没有其他活动 Agent 任务。脚本创建自己的用户、项目和页面，结束后只删除自己的测试记录，不清空数据库。

`npm run smoke:api` 已适配异步创建和 GET 轮询。运行 smoke 前，应让 API 和 smoke 指向同一个隔离数据库，禁止直接对个人开发数据执行初始化测试。

暂停测试数据库可使用 `docker compose -f infra/docker/docker-compose.agent-test.yml stop`，该命令不会删除数据卷。
