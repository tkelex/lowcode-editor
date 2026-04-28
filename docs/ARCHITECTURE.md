# 项目架构说明

## 架构概览

项目采用前后端同仓结构：

```text
lowcode-editor/
  src/                 # React 前端和低代码编辑器
  server/              # NestJS 后端 API
  server/prisma/       # Prisma 数据模型和迁移
  docs/                # 产品、工程、学习和上下文文档
  docker-compose.yml   # 本地 PostgreSQL
```

前端负责编辑器交互和组件树管理，后端负责用户、项目、页面和 schema 持久化，数据库负责保存业务实体和页面 JSON schema。

## 前端架构

### 应用入口

```text
src/main.tsx
  ↓
src/App.tsx
  ↓
登录/项目面板/编辑器三种视图
```

`src/App.tsx` 是当前应用级状态切换入口：

- 没有 token：进入 `AuthView`。
- 有 token：加载当前用户，进入 `ProjectDashboard`。
- 打开页面：请求后端 page，取出 `page.schema.components`，写入 `useComponetsStore`，进入编辑器。

### 编辑器布局

核心入口：`src/editor/index.tsx`

编辑模式：

```text
Header
Left: Material / Outline / Source
Center: EditArea
Right: Setting
```

预览模式：

```text
Header
Preview runtime component tree
```

编辑器模式存在 Zustand：

```ts
mode: 'edit' | 'preview'
```

### 编辑器状态

核心文件：`src/editor/stores/components.tsx`

组件节点结构：

```ts
{
  id: number;
  name: string;
  props: any;
  styles?: CSSProperties;
  desc: string;
  children?: Component[];
  parentId?: number;
}
```

核心状态：

- `components`：当前页面组件树。
- `curComponentId`：当前选中组件。
- `curComponent`：当前选中组件对象。
- `mode`：编辑或预览。

核心 actions：

- `addComponent`
- `deleteComponent`
- `updateComponentProps`
- `updateComponentStyles`
- `setCurComponentId`
- `setMode`
- `setComponents`

注意：store 导出名是 `useComponetsStore`，拼写错误是现有 API，不要随手改。

### 物料注册与渲染

核心文件：`src/editor/stores/component-config.tsx`

每个物料通常包含：

```text
src/editor/materials/<Name>/dev.tsx
src/editor/materials/<Name>/prod.tsx
```

- `dev.tsx`：编辑画布中使用，通常带 `data-component-id` 和拖拽能力。
- `prod.tsx`：预览/运行时使用，负责真实 UI 和事件执行。
- `component-config.tsx`：注册物料默认 props、setter、style setter、events、methods、dev/prod 实现。

编辑渲染：`src/editor/components/EditArea/index.tsx`

预览渲染：`src/editor/components/Preivew/index.tsx`

### 保存与读取数据流

打开页面：

```text
ProjectDashboard 点击页面
  ↓
App.handleOpenPage(pageId)
  ↓
GET /api/pages/:id
  ↓
setComponents(page.schema.components)
  ↓
进入 LowcodeEditor
```

保存页面：

```text
Header 点击保存
  ↓
读取 useComponetsStore.components
  ↓
PATCH /api/pages/:id
  ↓
后端保存到 Page.schema
  ↓
后端创建 PageVersion(source = save)
```

回滚页面：

```text
Header 打开版本历史
  ↓
GET /api/pages/:id/versions
  ↓
选择版本并确认回滚
  ↓
POST /api/pages/:id/rollback
  ↓
后端将 PageVersion.schema 恢复到 Page.schema
  ↓
后端创建 PageVersion(source = rollback)
  ↓
前端 setComponents(page.schema.components)
```

### 前端 API 层

```text
src/api/http.ts       # axios 实例，自动附加 Authorization
src/api/auth.ts       # register/login/me/logout/token
src/api/projects.ts   # 项目列表和创建
src/api/pages.ts      # 页面列表、创建、读取、更新
src/api/types.ts      # 前端 API 类型
```

## 后端架构

### 应用入口

```text
server/src/main.ts
  ↓
server/src/app.module.ts
  ↓
AuthModule / UsersModule / ProjectsModule / PagesModule / PrismaModule
```

`main.ts` 设置：

- 全局前缀：`/api`
- CORS：来自 `FRONTEND_ORIGIN`
- 全局 ValidationPipe
- 全局 HttpExceptionFilter

### NestJS 模块分层

```text
Controller  # 接收 HTTP 请求
Service     # 业务逻辑和权限校验
DTO         # 请求体校验
Guard       # JWT 鉴权
Prisma      # 数据库访问
```

当前模块：

```text
server/src/modules/auth/
server/src/modules/users/
server/src/modules/projects/
server/src/modules/pages/
```

### 鉴权架构

- 注册/登录接口公开。
- 业务接口使用 `JwtAuthGuard`。
- JWT payload 通过 `CurrentUser` 装饰器注入 controller。
- 密码使用 bcryptjs hash，不保存明文。

相关文件：

```text
server/src/common/guards/jwt.strategy.ts
server/src/common/guards/jwt-auth.guard.ts
server/src/common/decorators/current-user.decorator.ts
server/src/modules/auth/auth.service.ts
```

### 权限模型

当前是单用户 owner 模型：

```text
User 1 - N Project
Project 1 - N Page
User 1 - N Page(createdBy)
Page 1 - N PageVersion
User 1 - N PageVersion(createdBy)
```

权限原则：

- 用户只能访问自己拥有的 Project。
- Page 操作必须通过所属 Project 校验 owner。
- 删除 Project 会 cascade 删除 Page。

## 数据库架构

核心文件：`server/prisma/schema.prisma`

当前模型：

```text
User
Project
Page
PageVersion
```

最核心字段：

```prisma
Page.schema Json
```

它保存低代码编辑器的页面 schema，在 PostgreSQL 中对应 JSONB。

历史版本字段：

```prisma
PageVersion.schema Json
```

保存页面会生成 `source = "save"` 的版本；回滚页面会生成 `source = "rollback"` 的版本。

## 本地开发架构

```text
React dev server: http://localhost:5173
NestJS API:       http://localhost:3000/api
PostgreSQL:       localhost:5432
```

环境变量：

```text
.env                 # 前端 VITE_API_BASE_URL，本地忽略
.env.example         # 前端示例，提交
server/.env          # 后端 DATABASE_URL/JWT_SECRET，本地忽略
server/.env.example  # 后端示例，提交
```

## 当前架构边界

已完成：

- 用户注册登录。
- JWT 鉴权。
- 项目/页面基础管理。
- 页面版本管理和回滚。
- 本地 Docker PostgreSQL。
- Prisma migration。

尚未完成：

- 发布访问页。
- 项目成员权限。
- 生产部署 Dockerfile/Nginx。
- CI/CD。
- 自定义 JS 沙箱化。

## 高风险修改区域

- `src/editor/stores/components.tsx`：影响整个编辑器组件树。
- `src/editor/stores/component-config.tsx`：影响物料注册和属性面板。
- `src/editor/components/Preivew/index.tsx`：执行事件动作，包括 `customJS`。
- `server/src/modules/projects/projects.service.ts`：项目 owner 权限。
- `server/src/modules/pages/pages.service.ts`：页面 owner 权限和 schema 持久化。
- `server/prisma/schema.prisma`：数据库结构变更必须配套 migration。
