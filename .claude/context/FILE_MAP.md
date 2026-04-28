# 关键文件地图

这个文件给未来 Claude Code 会话、其它 AI 或新协作者快速定位项目关键文件。它不是完整文件清单，只列经常需要读取或修改的入口。

## 顶层入口

| 文件 | 作用 | 修改风险 |
| --- | --- | --- |
| `CLAUDE.md` | Claude Code 项目级工作说明，包含命令、关键约定和上下文入口。 | 不要写成大段源码说明，否则每次会话都会浪费 token。 |
| `package.json` | 前端依赖和脚本。 | 改 lint/build 脚本会影响验证流程。 |
| `server/package.json` | 后端依赖和脚本。 | 后端依赖升级需注意 NestJS/Prisma 兼容。 |
| `.gitignore` | 忽略 node_modules、dist、.env 等。 | 不要让 `.env` 被提交。 |
| `docker-compose.yml` | 本地 PostgreSQL 服务。 | 改端口、账号、库名要同步 `server/.env.example` 和文档。 |

## 项目上下文文档

| 文件 | 作用 | 修改风险 |
| --- | --- | --- |
| `docs/CONTEXT_INDEX.md` | 项目低 token 总入口和阅读顺序。 | 应保持简洁，只写稳定事实。 |
| `docs/ARCHITECTURE.md` | 前端、后端、数据库架构和数据流。 | 架构变化时必须同步。 |
| `docs/API.md` | API 路由、鉴权、schema contract。 | 后端接口变化时必须同步。 |
| `docs/DECISIONS.md` | 技术/产品决策和原因。 | 不要记录临时状态；只记录会长期影响项目的决策。 |
| `docs/development-progress-summary.md` | 阶段进度、验证、学习总结。 | 每次重要里程碑后更新。 |
| `.claude/skills/context-index/SKILL.md` | 生成/更新上下文索引的 Claude Code skill。 | 改 skill 时要确保输出文件列表仍准确。 |

## 前端应用入口

| 文件 | 作用 | 修改风险 |
| --- | --- | --- |
| `src/main.tsx` | React 入口，包裹 DnDProvider。 | DnDProvider 移除会影响拖拽。 |
| `src/App.tsx` | 应用级视图切换：auth、dashboard、editor。 | 影响登录态、页面打开和 schema 加载。 |
| `src/features/auth/AuthView.tsx` | 登录/注册页面。 | 表单字段要和 Auth API DTO 对齐。 |
| `src/features/projects/ProjectDashboard.tsx` | 项目和页面入口面板。 | 影响创建项目、创建页面、进入编辑器流程。 |

## 前端 API 层

| 文件 | 作用 | 修改风险 |
| --- | --- | --- |
| `src/api/http.ts` | axios 实例和 token header 注入。 | 改 token key 或 baseURL 会影响所有 API。 |
| `src/api/auth.ts` | register/login/me/logout/token storage。 | 要和 `/api/auth/*` 保持一致。 |
| `src/api/projects.ts` | 项目 API 封装。 | 要和 ProjectsController 路由保持一致。 |
| `src/api/pages.ts` | 页面 API 封装、schema 保存、版本列表和回滚。 | 影响保存与回滚闭环。 |
| `src/api/types.ts` | 前端 API 类型。 | 后端响应结构变化时同步。 |

## 编辑器核心

| 文件 | 作用 | 修改风险 |
| --- | --- | --- |
| `src/editor/index.tsx` | 编辑器布局入口，接收 `pageId` 和 `onBack`。 | 影响编辑/预览模式和 Header 传参。 |
| `src/editor/stores/components.tsx` | 组件树 Zustand store。 | 高风险；影响拖拽、选择、属性修改、保存。 |
| `src/editor/stores/component-config.tsx` | 物料注册表、setter、events、methods。 | 高风险；影响物料面板和设置面板。 |
| `src/editor/interface.ts` | 通用组件 props 类型。 | 改 `id/name` 类型会影响 dev/prod materials。 |
| `src/editor/components/Header/index.tsx` | 顶部栏、保存按钮、版本历史、回滚、预览切换。 | 保存和回滚逻辑、pageId 绑定在这里。 |
| `src/editor/components/EditArea/index.tsx` | 编辑态递归渲染组件树。 | 影响选择、hover、编辑画布渲染。 |
| `src/editor/components/Preivew/index.tsx` | 预览态递归渲染和事件动作执行。 | 高风险；含 `customJS` 执行路径。 |
| `src/editor/components/Setting/index.tsx` | 设置面板入口。 | 影响属性、样式、事件配置。 |
| `src/editor/components/Setting/ActionModal.tsx` | 事件动作配置类型。 | 影响 goToLink/showMessage/customJS/componentMethod。 |
| `src/editor/hooks/useMaterailDrop.ts` | 当前拖拽 hook。 | 拼写错误是现有 API，不要随手改。 |
| `src/editor/perf/zustandPerf.ts` | Zustand 性能埋点。 | 新 store action 如需统计应调用 markZustandUpdate。 |

## 物料目录

| 目录/文件 | 作用 | 修改风险 |
| --- | --- | --- |
| `src/editor/materials/<Name>/dev.tsx` | 编辑态物料实现。 | 应暴露 `data-component-id`，可容器组件需支持 drop。 |
| `src/editor/materials/<Name>/prod.tsx` | 预览/运行态物料实现。 | 要过滤低代码内部 props，避免传给 DOM/AntD 出错。 |
| `src/editor/materials/Button/prod.tsx` | Button 运行态实现。 | 已过滤 `id/name`，不要重新传给 AntD Button。 |
| `src/editor/materials/Page/*` | Page 根组件。 | 根节点 id 通常是 1，保存/恢复依赖组件树结构。 |

## 后端入口和公共能力

| 文件 | 作用 | 修改风险 |
| --- | --- | --- |
| `server/src/main.ts` | Nest app 启动、全局前缀、CORS、ValidationPipe、异常过滤器。 | 改 API prefix 或 CORS 要同步前端环境变量和文档。 |
| `server/src/app.module.ts` | 后端模块注册。 | 新模块需要在这里导入。 |
| `server/src/prisma/prisma.service.ts` | Prisma Client 生命周期。 | 影响所有数据库访问。 |
| `server/src/common/filters/http-exception.filter.ts` | 统一错误响应。 | 改格式会影响前端错误处理。 |
| `server/src/common/guards/jwt.strategy.ts` | JWT payload 校验和 user 注入。 | 改 payload 要同步 AuthService。 |
| `server/src/common/guards/jwt-auth.guard.ts` | JWT Guard。 | 业务接口保护依赖它。 |
| `server/src/common/decorators/current-user.decorator.ts` | Controller 获取当前用户。 | 改类型会影响所有受保护接口。 |

## 后端业务模块

| 文件 | 作用 | 修改风险 |
| --- | --- | --- |
| `server/src/modules/auth/auth.controller.ts` | 注册、登录、me 路由。 | 公开/受保护路由边界要清楚。 |
| `server/src/modules/auth/auth.service.ts` | 密码 hash、登录校验、JWT 签发。 | 高风险；不能返回 passwordHash。 |
| `server/src/modules/auth/dto/*.ts` | 注册/登录 DTO 校验。 | 要和前端表单字段一致。 |
| `server/src/modules/users/users.service.ts` | 用户查询。 | 不要泄露 passwordHash。 |
| `server/src/modules/projects/projects.controller.ts` | 项目 CRUD 路由。 | 全部需要 JWT。 |
| `server/src/modules/projects/projects.service.ts` | 项目 CRUD 和 owner 校验。 | 高风险；不能跨用户访问。 |
| `server/src/modules/pages/pages.controller.ts` | 页面列表、创建、读取、更新、删除、版本列表、回滚路由。 | 全部需要 JWT；版本接口也必须校验页面归属。 |
| `server/src/modules/pages/pages.service.ts` | 页面 CRUD、schema normalize、版本创建、回滚、owner 校验。 | 高风险；保存和回滚闭环依赖这里。 |
| `server/src/modules/pages/dto/*.ts` | 页面 DTO 校验，包括 routePath 和 rollback versionId。 | 前端创建页面和回滚接口要同步。 |

## 数据库

| 文件 | 作用 | 修改风险 |
| --- | --- | --- |
| `server/prisma/schema.prisma` | Prisma 数据模型：User/Project/Page/PageVersion。 | 改模型后必须生成 migration。 |
| `server/prisma/migrations/*/migration.sql` | 数据库变更 SQL。 | 不要手动乱改已应用 migration。 |
| `server/prisma/migrations/migration_lock.toml` | Prisma migration provider 锁定。 | 应提交到 Git。 |

## 环境变量

| 文件 | 作用 | 修改风险 |
| --- | --- | --- |
| `.env.example` | 前端环境变量示例。 | 改 API 地址说明要同步文档。 |
| `.env` | 本地前端环境变量，忽略。 | 不要提交。 |
| `server/.env.example` | 后端环境变量示例。 | 不要放真实 secret。 |
| `server/.env` | 本地后端环境变量，忽略。 | 不要提交。 |

## 常用修改路线

### 加一个新物料

1. 新增 `src/editor/materials/<Name>/dev.tsx`
2. 新增 `src/editor/materials/<Name>/prod.tsx`
3. 更新 `src/editor/stores/component-config.tsx`
4. 测试编辑态拖拽、属性设置、预览态渲染

### 改 schema 保存或回滚逻辑

1. `src/editor/components/Header/index.tsx`
2. `src/api/pages.ts`
3. `src/api/types.ts`
4. `server/src/modules/pages/pages.controller.ts`
5. `server/src/modules/pages/pages.service.ts`
6. `server/prisma/schema.prisma`，如数据库结构变化则加 migration

### 加后端业务模块

1. `server/src/modules/<module>/dto/`
2. `server/src/modules/<module>/<module>.controller.ts`
3. `server/src/modules/<module>/<module>.service.ts`
4. `server/src/modules/<module>/<module>.module.ts`
5. `server/src/app.module.ts`
6. `docs/API.md`

### 改数据库模型

1. 修改 `server/prisma/schema.prisma`
2. 运行 `npm run prisma:migrate --prefix server -- --name <name>`
3. 检查生成的 `server/prisma/migrations/*/migration.sql`
4. 更新相关 service/API/type/doc

## 当前验证命令

```bash
npm run build
npm run build --prefix server
```

如改前端 lint 相关代码，也运行：

```bash
npm run lint
```
