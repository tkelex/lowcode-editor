# 当前开发进度与学习总结

## 1. GitHub 连接

当前项目已添加远程仓库：

```bash
origin  https://github.com/tkelex/lowcode-editor.git
```

当前本地分支是：

```bash
master
```

远程默认分支查询时网络连接被 reset，所以暂时还没有 push。

如果确认要推送，可以执行：

```bash
git push -u origin master
```

如果远程默认分支是 `main`，可以先改名再推送：

```bash
git branch -M main
git push -u origin main
```

后续不会自动 push，除非明确要求。

补充说明：现在本地 `master` 已经成功关联并推送过 GitHub，后续新增 commit 仍然只会在你明确要求时 push。

## 2. 当前本地提交记录

目前已经按重要板块完成 3 个本地 commit：

```bash
da9e2e9 frontend: add auth dashboard and schema save flow
2c67205 server: add auth and page schema APIs
8b30dc7 docs: add production planning and project guidelines
```

## 3. 提交说明

### 3.1 文档和规范

提交：

```bash
8b30dc7 docs: add production planning and project guidelines
```

包含：

- `CLAUDE.md`
- `docs/backend-database-selection.md`
- `docs/product-requirements.md`
- `docs/project-implementation-plan.md`
- `docs/coding-standards.md`
- `docs/security-guidelines.md`
- `docs/git-workflow.md`
- `docs/backend-local-development.md`
- `.gitignore`

作用：

- 明确项目目标
- 明确技术选型
- 明确产品需求
- 明确实施计划
- 明确编码规范
- 明确安全规范
- 明确 Git 工作流

### 3.2 后端板块

提交：

```bash
2c67205 server: add auth and page schema APIs
```

包含：

- `server/`
- NestJS 后端项目
- Prisma 数据模型
- 用户注册 / 登录
- JWT 鉴权
- 项目 CRUD
- 页面 CRUD
- 页面 schema 保存 / 读取

核心文件：

```text
server/prisma/schema.prisma
server/src/main.ts
server/src/app.module.ts
server/src/modules/auth/
server/src/modules/projects/
server/src/modules/pages/
server/src/prisma/
server/src/common/
```

### 3.3 前端接入板块

提交：

```bash
da9e2e9 frontend: add auth dashboard and schema save flow
```

包含：

- 登录 / 注册页面
- 项目列表页面
- 页面列表页面
- 前端 API 请求层
- 编辑器打开页面时加载后端 schema
- 编辑器 Header 增加保存按钮
- 保存当前组件树到后端
- 修复前端 lint / build 配置

核心文件：

```text
src/App.tsx
src/api/http.ts
src/api/auth.ts
src/api/projects.ts
src/api/pages.ts
src/api/types.ts
src/features/auth/AuthView.tsx
src/features/projects/ProjectDashboard.tsx
src/editor/components/Header/index.tsx
src/editor/stores/components.tsx
```

## 4. 本次新增能力

当前项目已经从纯前端学习 Demo，开始转向具备产品闭环的低代码平台雏形。

本次新增能力包括：

1. 项目有了 Git 管理。
2. 项目连接到了 GitHub remote。
3. 有了产品需求文档。
4. 有了后端技术选型文档。
5. 有了项目实施计划。
6. 有了安全规范和编码规范。
7. 有了 NestJS 后端。
8. 有了 PostgreSQL / Prisma 数据模型。
9. 有了登录注册能力。
10. 有了项目 / 页面管理能力。
11. 有了前端保存 schema 到后端的闭环。

## 5. 已验证内容

已通过以下命令：

```bash
npm run build
npm run lint
npm run prisma:generate --prefix server
npm run build --prefix server
```

说明：

- 前端 TypeScript 构建通过。
- 前端 lint 通过。
- Prisma Client 生成通过。
- NestJS 后端构建通过。

## 6. 尚未完成的验证

完整端到端验证还未执行，原因是本地还需要准备 PostgreSQL。

后续需要：

1. 安装或启动 PostgreSQL。
2. 配置 `server/.env`。
3. 运行 Prisma migration。
4. 启动后端。
5. 启动前端。
6. 在浏览器中验证完整流程。

完整验证路径：

```text
注册 / 登录
  ↓
创建项目
  ↓
创建页面
  ↓
打开编辑器
  ↓
拖拽组件并修改配置
  ↓
点击保存
  ↓
刷新页面
  ↓
重新打开页面并确认组件树恢复
```

## 7. 学习重点

你的当前背景是：主要熟悉 React 前端，对后端、数据库、安全和 Git 工程流程还不熟悉。

因此接下来建议重点学习以下内容。

### 7.1 产品和业务视角

建议先看：

```text
docs/product-requirements.md
docs/project-implementation-plan.md
```

重点理解：

- 为什么低代码编辑器最重要的是“保存、再次打开、发布、回滚”。
- 为什么不是一开始堆组件数量。
- 为什么需要项目、页面、schema、版本这些业务概念。
- 什么叫“产品闭环”。

这部分可以帮助你从“写功能”转向“理解业务场景”。

### 7.2 后端最小业务架构

建议重点看：

```text
server/src/modules/auth/
server/src/modules/projects/
server/src/modules/pages/
```

NestJS 的基本分层：

```text
Controller：接收请求
Service：写业务逻辑
DTO：校验前端传来的数据
Guard：控制接口是否需要登录
Prisma：访问数据库
```

可以类比前端理解：

```text
页面组件        ≈ Controller
业务 hooks      ≈ Service
表单校验规则    ≈ DTO
路由鉴权        ≈ Guard
请求 API 层     ≈ Prisma / 数据库访问层
```

### 7.3 数据库模型

建议重点看：

```text
server/prisma/schema.prisma
```

目前有三个核心模型：

```text
User     用户
Project  项目
Page     页面
```

其中低代码编辑器最核心的是：

```prisma
schema Json
```

它保存的就是前端 Zustand 里的组件树。

核心闭环是：

```text
前端 components 树
        ↓ 保存
后端 Page.schema
        ↓ 读取
前端重新恢复 components 树
```

这就是第一阶段最重要的业务闭环。

### 7.4 前端如何从 Demo 变成产品

建议重点看：

```text
src/App.tsx
src/api/
src/features/
src/editor/components/Header/index.tsx
src/editor/stores/components.tsx
```

以前的流程是：

```text
打开页面 → Zustand 本地状态 → 编辑 / 预览
```

现在的流程是：

```text
登录
  ↓
项目列表
  ↓
页面列表
  ↓
从后端加载 schema
  ↓
写入 Zustand
  ↓
编辑
  ↓
保存到后端
```

这就是从前端 Demo 走向完整产品的第一步。

## 8. 后续协作规则

后续每完成一个重要板块，都按以下流程执行：

1. 完成代码。
2. 运行必要验证。
3. 创建一次 git commit。
4. 说明本次修改了哪些文件。
5. 说明为什么这样改。
6. 总结你应该学习的知识点。

## 9. 2026-04-28 保存闭环验证记录

本次完成的是第一阶段最关键的后端保存闭环验证：把前端页面 schema 真正写入 PostgreSQL，并再次读取确认数据一致。

### 9.1 本次提交

提交：

```bash
993a3cd server: add initial Prisma migration
```

包含：

```text
server/prisma/migrations/20260428084614_init/migration.sql
server/prisma/migrations/migration_lock.toml
```

作用：

- 把 `server/prisma/schema.prisma` 里的模型转换成数据库建表 SQL。
- 创建 `User`、`Project`、`Page` 三张核心业务表。
- 创建唯一索引和外键约束。
- 让其他环境可以通过 migration 复现相同的数据库结构。

### 9.2 本次验证通过的内容

PostgreSQL Docker 容器已启动并通过健康检查。

Prisma migration 已成功执行：

```bash
npm run prisma:migrate --prefix server -- --name init
```

前后端构建验证通过：

```bash
npm run build
npm run build --prefix server
```

API smoke test 已验证完整闭环：

```text
注册用户
  ↓
登录获取 token
  ↓
调用 /auth/me 验证登录态
  ↓
创建项目
  ↓
创建页面
  ↓
PATCH /api/pages/:id 保存 schema
  ↓
GET /api/pages/:id 读取 schema
  ↓
确认保存的 Button 组件仍然存在
```

验证结果摘要：

```json
{
  "ok": true,
  "userId": 1,
  "projectId": 1,
  "pageId": 1,
  "savedComponent": "Button"
}
```

### 9.3 本次遇到的问题

第一次运行 Prisma migration 时，命令停在交互式输入：

```text
Enter a name for the new migration
```

原因是 `prisma migrate dev` 在首次生成 migration 时需要 migration 名称。

处理方式是改成非交互命令：

```bash
npm run prisma:migrate --prefix server -- --name init
```

中断第一次命令后，PostgreSQL 里残留了一个 Prisma advisory lock，导致下一次迁移短暂超时。

处理方式是终止本地开发库里卡住的 Prisma migration 会话，然后重新运行 migration。

### 9.4 你应该重点学习的点

#### Prisma migration 是什么

`schema.prisma` 是数据库模型设计文件，migration 是 Prisma 根据模型生成的真实 SQL 变更记录。

可以这样理解：

```text
schema.prisma       = 设计图
migration.sql       = 真正施工的 SQL
PostgreSQL tables   = 施工完成后的数据库结构
```

所以 migration 文件需要提交到 Git，否则别人或部署环境不知道应该如何创建数据库表。

#### 为什么低代码 schema 用 JSONB

低代码页面的组件树结构不固定，不同页面可能有不同组件、属性、样式和事件配置。

如果每个组件属性都拆成数据库表，会非常复杂；当前阶段更适合把整棵组件树保存到 `Page.schema`：

```prisma
schema Json
```

在 PostgreSQL 里它会变成 `JSONB` 字段，既能保存灵活 JSON，也比普通文本更适合后续查询和扩展。

#### 保存闭环的核心价值

现在项目已经不只是前端 demo，而是具备了最小产品闭环：

```text
用户登录
  ↓
创建项目和页面
  ↓
编辑器生成组件树
  ↓
保存到数据库
  ↓
重新打开页面恢复组件树
```

这是低代码平台能成为产品的基础。后续的版本管理、发布、权限、部署，都是建立在这个闭环之上。

### 9.5 后续总结规则

从现在开始，每次完成重要代码块后，除了简短聊天说明，还要把以下内容写入项目文档：

1. 本次提交。
2. 修改了哪些文件。
3. 每个文件的作用。
4. 执行了哪些验证。
5. 遇到了什么问题以及如何解决。
6. 你应该学习的知识点。

优先更新：

```text
docs/development-progress-summary.md
```

如果某次内容属于专门主题，例如后端、本地开发、部署、安全，再补充到对应专题文档。
