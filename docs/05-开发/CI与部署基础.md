# CI 与部署基础

## 本地质量命令

当前根目录提供三类质量命令：

```bash
npm.cmd run lint
npm.cmd run test
npm.cmd run check
```

- `lint`：检查前端和脚本代码规范。
- `test`：先构建后端，再用 Node 内置 test runner 验证共享 schema、迁移器和 URL normalize。
- `check`：统一执行 lint、前端构建、后端构建和单元测试，是当前本地质量门禁。

## API Smoke

API smoke 脚本位置：

```text
scripts/smoke/api-smoke.mjs
```

运行前需要本地 PostgreSQL 和 NestJS API 已启动：

```bash
docker compose up -d postgres
npm.cmd run dev --prefix server
npm.cmd run smoke:api
```

默认请求地址是：

```text
http://localhost:3000/api
```

也可以指定其它环境：

```bash
$env:API_BASE_URL="https://example.com/api"
npm.cmd run smoke:api
```

脚本会验证注册、登录、创建项目、创建页面、保存 schema、版本生成、发布、公开读取和取消发布的核心闭环。

## GitHub Actions

CI 配置位置：

```text
.github/workflows/ci.yml
```

当前 CI 在 `push` 和 `pull_request` 时执行：

```text
npm ci
npm ci --prefix server
npm run prisma:generate --prefix server
npm run check
npm run prisma:deploy --prefix server
npm run smoke:api
npm run test:e2e
```

CI 会启动 PostgreSQL service，执行 Prisma migration，拉起 NestJS API，等待 `/api/health` 可用后跑 API smoke。这样可以覆盖依赖安装、前端 lint/build、后端 build、共享 schema 测试、真实数据库迁移、接口权限链路和前端 mock E2E 主链路。

CI 失败时会上传：

- `server-ci-log`：后端启动日志。
- `playwright-report` / `test-results`：Playwright 报告和 trace。

## Docker 与 Nginx

本地完整栈：

```text
docker-compose.yml
```

基础容器模板：

```text
infra/docker/Dockerfile.web
infra/docker/Dockerfile.server
infra/nginx/web.conf
infra/docker/docker-compose.prod.example.yml
```

示例启动：

```bash
docker compose up --build
docker compose -f infra/docker/docker-compose.prod.example.yml up --build
```

默认访问：

```text
前端：http://localhost:8080
后端：http://localhost:3000/api
```

生产使用前必须修改：

- `JWT_SECRET`
- 数据库账号和密码
- `FRONTEND_ORIGIN`
- 对外端口和域名

容器启动顺序：

1. `postgres` 通过 `pg_isready` 健康检查。
2. `server` 执行 `npm run prisma:deploy` 后启动 NestJS，并通过 `/api/health` 健康检查。
3. `web` 使用 Nginx 托管前端静态资源，并把 `/api` 代理到 `server:3000/api`。

上传素材会持久化到 `uploads_data` volume，本地源码启动时仍默认使用 `server/uploads/`。

当前 Docker 配置是上线基础模板，不等于完整生产部署方案。后续还需要补 HTTPS、日志、备份、镜像版本管理、环境变量注入和灰度发布策略。
