# 低代码编辑器 Lowcode Editor

这是一个 Vite React 编辑器、Next.js 公开发布运行时、NestJS API 与 PostgreSQL 组成的全栈低代码平台。页面以 schema 表达，可编辑、保存、版本化、回滚并发布为匿名访问页面。

## 已有能力

- 用户、项目、成员角色与审计日志
- 页面 schema 编辑、保存、版本、回滚与发布
- 物料、组件树、属性、样式、事件、数据源和运行时变量
- 项目级外部 API 数据源模型与 CRUD 页面生成
- AI 页面草稿和受限 schema patch，写入前必须预览并确认
- Vite 编辑器预览与 Next.js 公开发布运行时
- PostgreSQL、Prisma migration、Docker 与基础 CI/部署配置

## 仓库结构

```text
src/                         Vite 前端、项目后台和编辑器
apps/publisher-next/         Next.js 公开发布运行时
server/                      NestJS API
server/prisma/               数据库 schema 与 migrations
packages/lowcode-schema/     跨运行时 schema 契约
scripts/                     测试、smoke 与架构检查
infra/                       Docker、Nginx 和部署模板
docs/                        产品、架构、接口和运维文档
```

依赖方向：

```text
Vite editor ───────┐
Next publisher ────┼──> lowcode-schema
NestJS server ─────┘

Vite / Next ──HTTP──> NestJS ──Prisma──> PostgreSQL
```

公开发布运行时通过 `src/editor/runtime/public` 使用页面运行能力，不读取编辑器 Zustand 状态，不执行 custom JS，也不携带当前用户 token。

## 本地启动

环境要求：Node.js 20、Docker Desktop、PostgreSQL 容器。

```bash
npm install

cp .env.example .env
cp server/.env.example server/.env
cp apps/publisher-next/.env.example apps/publisher-next/.env.local

docker compose up -d postgres
npm run prisma:generate
npm run prisma:migrate -- --name init
```

分别启动三个进程：

```bash
npm run dev
npm run dev:server
npm run dev:publisher
```

默认地址：

- Vite 编辑器：`http://localhost:5173`
- NestJS API：`http://localhost:3000/api`
- Next.js 发布页：`http://localhost:5174/publish/:publicId`

## 常用命令

| 目标 | 命令 |
| --- | --- |
| 前端开发 | `npm run dev` |
| 发布运行时开发 | `npm run dev:publisher` |
| 后端开发 | `npm run dev:server` |
| Lint | `npm run lint` |
| Vite 构建 | `npm run build` |
| Next.js 构建 | `npm run build:publisher` |
| 后端构建 | `npm run build:server` |
| 单元/运行时测试 | `npm run test` |
| 架构检查 | `npm run check:architecture` |
| API smoke | `npm run smoke:api` |
| 编辑器 E2E | `npm run test:e2e:editor` |
| 完整本地检查 | `npm run check` |

## 文档入口

- [AGENTS.md](./AGENTS.md)：跨工具协作规则与高风险约束
- [CONTEXT-MAP.md](./CONTEXT-MAP.md)：领域上下文和术语关系
- [项目上下文索引](./docs/00-总览/项目上下文索引.md)：低 token 项目入口和任务路由
- [架构说明](./docs/02-架构/架构说明.md)：当前架构与数据流
- [模块边界与拆分规范](./docs/02-架构/模块边界与拆分规范.md)：允许和禁止的依赖方向
- [接口说明](./docs/03-接口/接口说明.md)：HTTP、鉴权与持久化契约
- [技术决策记录](./docs/02-架构/技术决策记录.md)：长期决策及原因
- [项目运行指南](./docs/05-开发/项目运行指南.md)：更完整的环境和启动说明

需求、规划和实现状态以 OpenSpec、GitHub Issues 与源码为准；README 不维护阶段进度、面试稿或完整接口清单。
