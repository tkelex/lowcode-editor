# 项目上下文总索引

这个文件是给未来 Claude Code 会话、其它 AI、或新协作者使用的低 token 项目入口。先读这里，再按需要读取具体源码。

## 项目一句话说明

这是一个从 React 学习型 demo 演进中的低代码编辑器项目，目标是成为可上线的全栈产品。当前已具备注册登录、项目管理、页面管理、编辑器 schema 保存到 PostgreSQL、重新读取恢复页面的第一阶段闭环。

## 当前技术栈

| 层 | 技术 |
| --- | --- |
| 前端 | Vite + React + TypeScript |
| UI | Ant Design、Tailwind CSS、Allotment |
| 编辑器状态 | Zustand persist |
| 拖拽 | React DnD |
| 代码编辑 | Monaco Editor |
| 后端 | NestJS + TypeScript |
| 数据库 | PostgreSQL |
| ORM | Prisma |
| 鉴权 | JWT + Passport |
| 本地数据库 | Docker Compose PostgreSQL |

## 新会话推荐阅读顺序

### 只需要快速理解项目

1. `CLAUDE.md`
2. `docs/CONTEXT_INDEX.md`
3. `.claude/context/FILE_MAP.md`
4. `docs/development-progress-summary.md`

### 要改前端编辑器

1. `docs/ARCHITECTURE.md`
2. `.claude/context/FILE_MAP.md`
3. `src/App.tsx`
4. `src/editor/index.tsx`
5. `src/editor/stores/components.tsx`
6. `src/editor/stores/component-config.tsx`
7. 具体编辑器组件或 material 文件

### 要改后端 API

1. `docs/API.md`
2. `server/prisma/schema.prisma`
3. `server/src/app.module.ts`
4. `server/src/modules/auth/`
5. `server/src/modules/projects/`
6. `server/src/modules/pages/`

### 要理解产品方向

1. `docs/product-requirements.md`
2. `docs/project-implementation-plan.md`
3. `docs/DECISIONS.md`
4. `docs/development-progress-summary.md`

### 要本地运行

1. `docs/backend-local-development.md`
2. `.env.example`
3. `server/.env.example`
4. `docker-compose.yml`

## 当前核心业务闭环

```text
注册 / 登录
  ↓
创建项目
  ↓
创建页面
  ↓
打开编辑器
  ↓
后端 Page.schema → 前端 Zustand components
  ↓
拖拽组件、配置属性、样式、事件
  ↓
点击保存
  ↓
前端 components → PATCH /api/pages/:id → PostgreSQL Page.schema
  ↓
再次打开页面恢复组件树
```

## 当前重要命令

根目录前端：

```bash
npm install
npm run dev
npm run build
npm run lint
```

后端：

```bash
npm install --prefix server
npm run dev --prefix server
npm run build --prefix server
npm run prisma:generate --prefix server
npm run prisma:migrate --prefix server -- --name init
```

本地 PostgreSQL：

```bash
docker compose up -d postgres
docker compose ps
docker compose down
```

如果当前 Bash 找不到 Docker，Windows 本机环境可使用：

```bash
"/c/Program Files/Docker/Docker/resources/bin/docker.exe" compose ps
```

## 必须保留的历史拼写

这些名字已经成为当前代码 API，除非做全量迁移，否则不要随手改名：

- `useComponetsStore`
- `useMaterailDrop`
- `components/Preivew`
- `components/Sourse`

## 重要安全提醒

- 不要提交 `.env`、token、数据库密码或真实 JWT secret。
- 后端业务接口必须走 JWT Guard。
- 项目和页面接口必须校验 owner，不能跨用户访问。
- 预览模式支持 `customJS`，它会执行用户配置的 JS，后续上线前需要限制或沙箱化。

## 当前已验证状态

最近一次已验证：

- PostgreSQL Docker 容器 healthy。
- Prisma migration 成功。
- 注册、登录、创建项目、创建页面、保存 schema、读取 schema 的 API smoke test 通过。
- `npm run build` 通过。
- `npm run build --prefix server` 通过。

详细记录见 `docs/development-progress-summary.md`。

## 后续最可能的工作方向

1. 浏览器端完整手测保存闭环。
2. 页面版本管理：保存版本、版本列表、回滚。
3. 发布能力：发布当前页面并生成可访问地址。
4. 权限协作：项目成员、owner/editor/viewer。
5. 部署上线：Dockerfile、Nginx、迁移流程、生产环境变量。
6. CI/CD：自动 lint/build/test。
