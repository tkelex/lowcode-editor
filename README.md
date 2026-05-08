# 低代码编辑器 Lowcode Editor

一个从 React 学习型 demo 演进中的低代码编辑器项目，目标是逐步完善为可上线的全栈低代码平台雏形。

当前项目已经具备注册登录、项目管理、页面管理、编辑器组件树保存、页面重新打开恢复、页面历史版本、版本回滚、删除历史版本记录和页面发布访问等核心能力。

## 项目亮点

- **完整产品闭环**：登录 → 项目 → 页面 → 编辑器 → 保存 → 恢复 → 版本历史 → 回滚 → 发布访问。
- **低代码编辑器核心模型**：用组件树描述页面，支持拖拽组件、属性配置、样式配置和事件配置。
- **前后端全栈实现**：前端负责编辑器交互，后端负责用户、项目、页面和 schema 持久化。
- **页面版本管理**：每次保存生成 `PageVersion`，支持回滚旧版本和删除无用版本记录。
- **页面发布访问**：发布时生成快照和公开 `publicId`，访客无需登录即可访问发布页。
- **权限校验**：业务接口使用 JWT，项目、页面和版本操作都需要校验 owner。
- **工程文档完善**：包含架构说明、API 文档、上下文索引和开发进度总结。

## 技术栈

### 前端

- Vite
- React
- TypeScript
- Ant Design
- Zustand
- React DnD
- Allotment
- Monaco Editor
- Tailwind CSS

### 后端

- NestJS
- TypeScript
- Prisma
- PostgreSQL
- JWT + Passport
- class-validator

### 本地开发

- Docker Compose PostgreSQL
- Prisma Migration
- 前后端同仓管理

## 核心功能

### 用户与项目

- 用户注册
- 用户登录
- JWT 鉴权
- 获取当前用户
- 创建 / 查看项目
- 创建 / 查看页面

### 编辑器

- 物料面板
- 拖拽添加组件
- 编辑态画布
- 预览态渲染
- 属性配置
- 样式配置
- 事件配置
- 组件树 Zustand 状态管理

### 页面持久化

- 打开页面时从后端读取 `Page.schema`
- 保存时把当前组件树写入 PostgreSQL
- 刷新或重新进入页面后恢复组件树

### 页面发布

- 登录用户可以发布页面
- 发布时生成 `PageVersion(source = publish)` 快照
- 公开访问使用不可枚举的 `publicId`
- 访客无需登录即可访问 `/publish/:publicId`
- 公开页面读取发布快照，不受后续草稿编辑影响
- 公开运行态禁用 `customJS`

## 项目结构

```text
lowcode-editor/
  src/                 # React 前端和低代码编辑器
  server/              # NestJS 后端 API
  server/prisma/       # Prisma schema 和 migration
  docs/                # 项目文档、架构说明、API 说明、进度总结
  .claude/context/     # AI 协作上下文索引
  docker-compose.yml   # 本地 PostgreSQL 服务
```

## 核心数据流

### 页面保存

```text
编辑器 Zustand components
  ↓
点击保存
  ↓
PATCH /api/pages/:id
  ↓
后端校验页面 owner
  ↓
更新 Page.schema
  ↓
创建 PageVersion 历史版本
```

### 页面恢复

```text
进入页面
  ↓
GET /api/pages/:id
  ↓
后端返回 Page.schema
  ↓
前端 setComponents(schema.components)
  ↓
恢复编辑器画布
```

### 页面回滚

```text
打开版本历史
  ↓
GET /api/pages/:id/versions
  ↓
选择版本并确认回滚
  ↓
POST /api/pages/:id/rollback
  ↓
后端将 PageVersion.schema 恢复到 Page.schema
  ↓
前端更新 Zustand components
```

### 删除历史版本

```text
打开版本历史
  ↓
点击删除并确认
  ↓
DELETE /api/pages/:id/versions/:versionId
  ↓
后端删除对应 PageVersion
  ↓
前端刷新版本列表
```

删除历史版本只删除快照记录，不会修改当前 `Page.schema`。

### 页面发布

```text
编辑器保存页面
  ↓
点击发布
  ↓
POST /api/pages/:id/publish
  ↓
后端校验页面 owner
  ↓
创建 PageVersion(source = publish) 发布快照
  ↓
更新 Page.isPublished / publicId / publishedVersionId
  ↓
访客访问 /publish/:publicId
  ↓
GET /api/public/pages/:publicId
  ↓
公开页面渲染发布快照
```

公开页面读取发布时的 `PageVersion.schema`，不会因为后续继续编辑草稿而自动变化。

## 数据库模型概览

核心模型：

```text
User
Project
Page
PageVersion
```

关系：

```text
User 1 - N Project
Project 1 - N Page
Page 1 - N PageVersion
```

关键字段：

```prisma
Page.schema Json
Page.publicId String?
Page.isPublished Boolean
Page.publishedVersionId Int?
PageVersion.schema Json
```

`Page.schema` 保存当前页面状态，`PageVersion.schema` 保存历史快照。发布时会创建一条 `source = publish` 的 `PageVersion`，并通过 `Page.publishedVersionId` 指向当前公开访问的快照。

## 本地启动

### 1. 安装依赖

根目录安装前端依赖：

```bash
npm install
```

安装后端依赖：

```bash
npm install --prefix server
```

### 2. 配置环境变量

前端环境变量参考：

```bash
cp .env.example .env
```

后端环境变量参考：

```bash
cp server/.env.example server/.env
```

本地默认 API 地址：

```text
VITE_API_BASE_URL=http://localhost:3000/api
```

后端需要配置：

```text
DATABASE_URL=postgresql://...
JWT_SECRET=...
FRONTEND_ORIGIN=http://localhost:5173
```

### 3. 启动 PostgreSQL

```bash
docker compose up -d postgres
```

查看容器状态：

```bash
docker compose ps
```

如果 Windows Bash 找不到 Docker，可以使用 Docker Desktop 的完整路径执行 compose 命令。

### 4. 执行 Prisma migration

```bash
npm run prisma:migrate --prefix server -- --name init
```

如果 schema 已经迁移过，只需要确保 Prisma Client 已生成：

```bash
npm run prisma:generate --prefix server
```

### 5. 启动后端

```bash
npm run dev --prefix server
```

默认地址：

```text
http://localhost:3000/api
```

### 6. 启动前端

```bash
npm run dev
```

默认地址：

```text
http://localhost:5173
```

## 常用命令

### 前端

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

### 后端

```bash
npm run dev --prefix server
npm run build --prefix server
npm run prisma:generate --prefix server
npm run prisma:migrate --prefix server -- --name <migration_name>
npm run prisma:studio --prefix server
```

### 数据库

```bash
docker compose up -d postgres
docker compose ps
docker compose down
```

## 已验证能力

最近已验证：

- PostgreSQL Docker 容器 healthy
- Prisma migration 成功
- 注册 / 登录 API 通过
- 创建项目 API 通过
- 创建页面 API 通过
- 保存页面 schema API 通过
- 读取页面 schema API 通过
- 页面历史版本 API 通过
- 页面回滚 API 通过
- 删除历史版本记录 API 通过
- 页面发布 API 通过
- 公开发布页面 API 通过
- `npm run build` 通过
- `npm run build --prefix server` 通过

## 文档入口

- `docs/00-总览/项目上下文索引.md`：项目低 token 总入口和阅读顺序
- `.claude/context/FILE_MAP.md`：关键文件地图
- `docs/02-架构/架构说明.md`：架构说明和数据流
- `docs/03-接口/接口说明.md`：API 路由、鉴权和 schema contract
- `docs/02-架构/技术决策记录.md`：关键技术 / 产品决策
- `docs/08-复盘/开发进度与学习总结.md`：开发进度和学习总结
- `docs/09-学习资料/面试讲解稿.md`：面试讲解稿
- `docs/06-测试与验收/功能演示流程.md`：功能演示流程和讲解话术

## 当前限制与后续计划

当前尚未完成：

- 项目成员协作权限
- 生产部署 Dockerfile / Nginx
- CI/CD
- 自定义 JS 沙箱化
- 更完整的自动化测试

后续优先方向：

1. 完善发布能力，增加取消发布入口、发布记录、SEO 和自定义域名等能力。
2. 增加项目成员和角色权限。
3. 补充生产部署方案。
4. 增加 CI/CD 自动构建和检查。
5. 补充更完整的自动化测试和异常兜底。

## 面试介绍简版

可以这样介绍这个项目：

> 这是一个 React 低代码编辑器项目，前端使用 React、TypeScript、Zustand 和 React DnD 实现组件拖拽、属性配置、样式配置、事件配置、编辑态和预览态渲染。后端使用 NestJS、Prisma 和 PostgreSQL 实现用户登录、项目管理、页面管理、页面 schema 持久化、历史版本和页面发布。项目的核心是把编辑器里的组件树保存到数据库，并且再次打开页面时恢复出来。后来我还补充了页面历史版本，每次保存生成快照，用户可以查看版本历史、回滚到旧版本，也可以删除无用版本记录；页面发布时会生成公开访问快照，访客无需登录即可打开发布页。

