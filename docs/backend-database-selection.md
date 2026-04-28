# 后端与数据库选型建议

## 背景与目标

当前项目是一个 React + TypeScript 的低代码编辑器，已有前端编辑、预览、组件树、事件配置和性能面板等能力。后续如果要上线，需要补齐后端、数据库、鉴权、资源存储、发布与运维能力。

低代码编辑器的后端重点不是简单 CRUD，而是要稳定保存“页面配置”和“发布产物”，并支持多人、多项目、多版本、权限控制和后续扩展。

## 推荐结论

建议采用以下技术栈作为第一版生产化方案：

- 后端：NestJS + TypeScript
- 主数据库：PostgreSQL
- ORM：Prisma
- 缓存/队列：Redis（上线初期可选，后续补充）
- 文件/静态资源：对象存储，开发期可先本地存储，生产期使用 S3 兼容服务或云厂商 OSS/COS
- 鉴权：JWT + Refresh Token，后续可扩展 OAuth
- 部署：Docker + 云服务器，后续再升级到容器平台

这套方案的优势是 TypeScript 前后端一致、工程化成熟、长期可维护，并且 PostgreSQL 很适合保存低代码页面 JSON、版本记录、用户项目关系等结构化和半结构化数据。

## 为什么后端推荐 NestJS

### 适合这个项目的原因

1. 与前端同为 TypeScript，类型可以复用或统一生成。
2. 模块化结构清晰，适合逐步拆分用户、项目、页面、发布、素材等模块。
3. 内置依赖注入、Guard、Pipe、Interceptor，适合做鉴权、权限、参数校验和统一异常处理。
4. 生态成熟，和 Prisma、Swagger、JWT、Redis、队列等集成方便。

### 可选替代方案

- Express：更轻量，但项目变大后结构需要自己约束，不如 NestJS 稳。
- Fastify：性能好，但业务复杂度高时仍需要额外组织架构。
- Java Spring Boot：稳定适合企业级，但对当前 React + TypeScript 个人项目来说开发成本更高。
- Go：性能和部署优秀，但会引入新的语言栈，前后端类型复用成本更高。

如果目标是“个人项目逐步做成可上线产品”，NestJS 是最平衡的选择。

## 为什么数据库推荐 PostgreSQL

低代码编辑器通常需要保存以下数据：

- 用户与团队
- 项目/应用
- 页面列表
- 页面组件树 JSON
- 页面版本历史
- 发布记录
- 素材资源
- 权限关系

PostgreSQL 同时支持关系型数据和 JSONB 字段，非常适合这种场景。

### PostgreSQL 的优势

1. 关系模型适合用户、项目、权限、发布记录等核心业务。
2. JSONB 适合保存组件树、页面 schema、事件配置、样式配置。
3. 支持事务，发布、回滚、版本保存等操作更可靠。
4. 后续可以对 JSONB 建索引，兼顾灵活性和查询能力。
5. 比 MongoDB 更适合“既有结构化关系，又有灵活配置 JSON”的业务。

### 与其他数据库对比

| 方案 | 优点 | 缺点 | 是否推荐 |
| --- | --- | --- | --- |
| PostgreSQL | 关系 + JSONB + 事务强 | 初期配置略复杂 | 推荐 |
| MySQL | 常见、稳定、部署简单 | JSON 查询能力弱于 PostgreSQL | 可选 |
| MongoDB | 存 JSON 很自然 | 关系、事务、权限模型维护成本较高 | 不作为首选 |
| SQLite | 本地开发简单 | 不适合多人生产环境 | 仅适合原型 |

## 核心数据模型建议

第一阶段可以围绕以下表设计：

### users

保存用户账号信息。

关键字段：

- id
- email / username
- password_hash
- nickname
- avatar_url
- created_at
- updated_at

### projects

保存低代码项目或应用。

关键字段：

- id
- owner_id
- name
- description
- status
- created_at
- updated_at

### pages

保存项目下的页面。

关键字段：

- id
- project_id
- name
- route_path
- schema JSONB
- current_version_id
- created_at
- updated_at

其中 `schema` 可以保存当前前端 Zustand 中的组件树结构。

### page_versions

保存页面历史版本，支持回滚。

关键字段：

- id
- page_id
- version_no
- schema JSONB
- changelog
- created_by
- created_at

### deployments

保存发布记录。

关键字段：

- id
- project_id
- page_id
- version_id
- environment
- status
- published_url
- created_by
- created_at

### assets

保存上传的图片、文件等素材资源。

关键字段：

- id
- project_id
- filename
- mime_type
- size
- storage_key
- url
- created_by
- created_at

## 后端模块划分建议

NestJS 中可以按业务模块组织：

```text
server/
  src/
    modules/
      auth/
      users/
      projects/
      pages/
      page-versions/
      deployments/
      assets/
    common/
      guards/
      decorators/
      filters/
      pipes/
    prisma/
    main.ts
```

建议先做单体后端，不要一开始拆微服务。当前项目最重要的是完成业务闭环：登录、保存页面、加载页面、发布页面、版本回滚。

## API 设计建议

第一版可以优先实现这些接口：

### 鉴权

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `GET /auth/me`

### 项目

- `GET /projects`
- `POST /projects`
- `GET /projects/:id`
- `PATCH /projects/:id`
- `DELETE /projects/:id`

### 页面

- `GET /projects/:projectId/pages`
- `POST /projects/:projectId/pages`
- `GET /pages/:id`
- `PATCH /pages/:id`
- `POST /pages/:id/save-version`
- `GET /pages/:id/versions`
- `POST /pages/:id/rollback/:versionId`

### 发布

- `POST /pages/:id/publish`
- `GET /projects/:projectId/deployments`

### 素材

- `POST /assets/upload`
- `GET /projects/:projectId/assets`
- `DELETE /assets/:id`

## 前端需要配合调整的点

当前组件树存储在前端 Zustand 持久化中。接入后端后建议逐步调整：

1. 保留 Zustand 作为编辑器运行时状态。
2. 新增“保存”能力，把 `components` 序列化后提交到后端 `pages.schema`。
3. 打开页面时从后端加载 schema，再写入 Zustand。
4. 预览模式仍然使用当前前端渲染逻辑。
5. 发布时后端记录版本，并生成可访问的发布地址或发布配置。

不要一开始移除本地持久化，可以先保留作为开发兜底，等后端保存稳定后再决定是否关闭。

## 上线架构建议

第一阶段上线架构：

```text
Browser
  ↓
React/Vite 静态资源
  ↓
NestJS API Server
  ↓
PostgreSQL
  ↓
Object Storage
```

部署建议：

- 前端：构建后部署到 Nginx、Vercel、Netlify 或云厂商静态网站服务。
- 后端：Docker 部署 NestJS 服务。
- 数据库：优先使用云 PostgreSQL；个人学习阶段也可以 Docker 自建。
- 文件资源：生产环境使用对象存储，不建议直接放在服务器磁盘中。

## 分阶段实施路线

### 第一阶段：完成数据保存闭环

目标：编辑器页面可以保存到后端，并能重新打开。

任务：

1. 新建 NestJS 后端项目。
2. 接入 PostgreSQL + Prisma。
3. 建立 users、projects、pages 三类核心模型。
4. 实现注册、登录、项目列表、页面保存、页面读取。
5. 前端新增 API 层，把 Zustand 组件树保存到后端。

验收标准：

- 用户登录后能创建项目。
- 能保存当前编辑器页面。
- 刷新浏览器后能从后端恢复页面。

### 第二阶段：版本与发布

目标：项目具备低代码平台的基础生产能力。

任务：

1. 增加 page_versions 表。
2. 每次手动保存版本时记录 schema 快照。
3. 增加页面回滚功能。
4. 增加发布记录 deployments。
5. 生成预览/发布访问地址。

验收标准：

- 页面可以查看历史版本。
- 页面可以回滚到指定版本。
- 发布记录可追踪。

### 第三阶段：素材与权限

目标：支持更真实的项目使用场景。

任务：

1. 增加图片/文件上传。
2. 接入对象存储。
3. 增加项目成员与角色权限。
4. 区分 owner、editor、viewer。

验收标准：

- 组件可以使用上传的图片资源。
- 不同用户只能访问自己有权限的项目。

### 第四阶段：生产增强

目标：提高稳定性、安全性和可维护性。

任务：

1. 请求参数校验和统一异常返回。
2. 操作日志。
3. 接入 Redis 缓存或队列。
4. 接入日志和监控。
5. 增加备份策略。
6. 增加 CI/CD。

验收标准：

- 后端错误可追踪。
- 数据库有备份。
- 主要接口有权限保护。
- 前后端可以自动构建部署。

## 不建议一开始做的事情

- 不建议一开始上微服务，当前复杂度不需要。
- 不建议一开始做多租户复杂模型，可以先用 owner + project_members 简化。
- 不建议一开始做实时协作，协作编辑会显著增加复杂度。
- 不建议直接把页面 schema 拆成大量细粒度表，低代码页面结构变化快，JSONB 更合适。
- 不建议先追求复杂发布系统，先完成“保存版本 + 访问发布版本”。

## 最小可行版本技术清单

如果只做第一版可上线 MVP，建议最小范围如下：

- NestJS
- PostgreSQL
- Prisma
- JWT 登录
- users/projects/pages/page_versions 四类表
- 页面 schema 保存与读取
- 页面发布记录
- Docker 部署

这个范围足够让项目从“纯前端编辑器 Demo”变成“有账号、有项目、有持久化、有版本、有发布记录”的可上线低代码平台雏形。
