# 低代码编辑器

面向中后台页面搭建的全栈低代码项目。页面以 schema 表达，可编辑、预览、保存、版本化、回滚，并通过独立发布站提供匿名访问。

## 仓库结构

```text
apps/
  editor-web/       Vite + React 编辑器与项目后台
  publisher-web/    Next.js 公开发布站
  api-server/       NestJS API、Prisma schema 与 migrations
packages/
  lowcode-schema/   跨运行时 schema、迁移和校验契约
  lowcode-runtime/  无状态页面运行时与生产物料
infra/              Compose、Nginx 与运维脚本
tests/e2e/           跨应用 Playwright 流程
docs/                当前产品、架构、接口和运维事实
agent-context/      AI 工具的统一上下文入口
```

应用之间不读取彼此的内部实现：两个前端通过 HTTP 访问 API，共享能力只通过 `packages/*` 的公开导出复用。

## 本地启动

环境要求：Node.js 22、npm、Docker Desktop。

仓库根目录的 `.node-version` 固定为 Node.js 22.23.1。PowerShell 已启用 `fnm env --use-on-cd` 时，进入本目录会自动切换版本，不会修改全局默认 Node；已提前进入目录的终端请执行一次 `fnm use` 或重新进入目录。

```powershell
npm install
Copy-Item apps/editor-web/.env.example apps/editor-web/.env
Copy-Item apps/api-server/.env.example apps/api-server/.env
Copy-Item apps/publisher-web/.env.example apps/publisher-web/.env.local
docker compose -f infra/docker/docker-compose.yml up -d postgres
npm run prisma:generate
npm run prisma:deploy
```

分别启动三个进程：

```powershell
npm run dev
npm run dev:server
npm run dev:publisher
```

- 编辑器：`http://localhost:5173`
- API：`http://localhost:3000/api`
- 发布站：`http://localhost:5174/publish/:publicId`

完整 Docker 环境：

```powershell
docker compose -f infra/docker/docker-compose.yml up -d --build
```

## 常用命令

| 目标 | 命令 |
| --- | --- |
| 编辑器构建 | `npm run build` |
| 发布站构建 | `npm run build:publisher` |
| API 构建 | `npm run build:server` |
| Lint | `npm run lint` |
| 单元与运行时测试 | `npm run test` |
| 架构边界检查 | `npm run check:architecture` |
| API smoke | `npm run smoke:api` |
| 编辑器 E2E | `npm run test:e2e:editor` |
| 常规全量检查 | `npm run check` |

## 文档

- [AGENTS.md](./AGENTS.md)：仓库约束、验证要求和高风险规则
- [CONTEXT-MAP.md](./CONTEXT-MAP.md)：各部署单元与共享包的职责
- [项目上下文索引](./docs/00-总览/项目上下文索引.md)：按任务选择阅读入口
- [架构说明](./docs/02-架构/架构说明.md)：运行时、数据流和持久化边界
- [接口说明](./docs/03-接口/接口说明.md)：HTTP、鉴权和 schema 契约
- [项目运行指南](./docs/05-开发/项目运行指南.md)：环境、数据库和启动细节

个人路线图、学习、复盘与求职表达材料不放在仓库中。
