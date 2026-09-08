# Agent 数据库集成验收

M1 的数据库约束、worker 抢占和租约隔离需要真实 PostgreSQL，mock 单测不能证明这些性质。当前本机尚未运行此验收；CI 已加入迁移之后、API worker 启动之前的独立检查。

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

检查脚本只读取显式 `AGENT_TEST_DATABASE_URL`，拒绝没有 `_test` / `_ci` 后缀的数据库名，不回退至 `.env`。必须停止连接此库的 API worker，并确保库中没有其他活动 Agent 任务。脚本创建自己的用户/项目/页面，结束后仅删除自己的测试记录（由用户关系级联清理），不清空数据库。

检查覆盖同页并发入队唯一约束、双 worker 抢占、租约过期后一次恢复、旧 worker 提交/续租被拒绝、连续事件序号、幂等取消和不创建 PageVersion。它模拟租约失效，不等于已完成真实进程 kill/restart 或多主机故障验收；后者仍需补充。

`npm run smoke:api` 已适配异步创建和 GET 轮询；运行它之前应单独将 API 与 smoke 指向同一个隔离数据库，禁止直接对个人开发数据运行初始化测试。当前 provider 分级重试、SSE、confirm/reject 和自动清理不在此脚本范围。

暂停测试数据库可使用 `docker compose -f infra/docker/docker-compose.agent-test.yml stop`，不删除数据卷。
