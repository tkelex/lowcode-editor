# 关键文件地图

这个文件给未来 Claude Code 会话、其它 AI 或新协作者快速定位项目关键文件。它不是完整文件清单，只列经常需要读取或修改的入口。

## 顶层入口

| 文件 | 作用 | 修改风险 |
| --- | --- | --- |
| `CLAUDE.md` | Claude Code 项目级工作说明，包含命令、关键约定和上下文入口。 | 不要写成大段源码说明，否则每次会话都会浪费 token。 |
| `package.json` | 前端依赖和脚本。 | 改 lint/build 脚本会影响验证流程。 |
| `server/package.json` | 后端依赖和脚本。 | 后端依赖升级需注意 NestJS/Prisma 兼容。 |
| `.github/workflows/ci.yml` | GitHub Actions 质量门禁，执行依赖安装和 `npm run check`。 | 改脚本前要确保 CI 环境也安装了 `server` 依赖。 |
| `.gitignore` | 忽略 node_modules、dist、.env 等。 | 不要让 `.env` 被提交。 |
| `.dockerignore` | Docker build context 忽略规则。 | 不要把源码需要的 `packages`、`server/prisma` 排除。 |
| `docker-compose.yml` | 本地 PostgreSQL 服务。 | 改端口、账号、库名要同步 `server/.env.example` 和文档。 |

## 项目上下文文档

| 文件 | 作用 | 修改风险 |
| --- | --- | --- |
| `docs/00-总览/项目上下文索引.md` | 项目低 token 总入口和阅读顺序。 | 应保持简洁，只写稳定事实。 |
| `docs/01-产品/产品路线图.md` | 当前产品阶段规划、上线演练、协作治理、模板素材、数据源和工程质量方向。 | 产品方向或优先级变化时同步上下文索引和复盘文档。 |
| `docs/02-架构/架构说明.md` | 前端、后端、数据库架构和数据流。 | 架构变化时必须同步。 |
| `docs/02-架构/模块边界与拆分规范.md` | 前端、后端、数据库、共享协议和功能模块的隔离规则。 | 调整目录边界、依赖方向或拆分策略时必须同步。 |
| `docs/03-接口/接口说明.md` | API 路由、鉴权、schema contract。 | 后端接口变化时必须同步。 |
| `docs/02-架构/技术决策记录.md` | 技术/产品决策和原因。 | 不要记录临时状态；只记录会长期影响项目的决策。 |
| `docs/08-复盘/开发进度与学习总结.md` | 阶段进度、验证、学习总结。 | 每次重要里程碑后更新。 |
| `docs/09-学习资料/项目系统学习计划.md` | 面向项目所有者的系统学习路线，串联 docs、源码、练习和验收标准。 | 项目结构、技术栈或学习重点变化时同步。 |
| `.claude/skills/context-index/SKILL.md` | 生成/更新上下文索引的 Claude Code skill。 | 改 skill 时要确保输出文件列表仍准确。 |
| `docs/05-开发/CI与部署基础.md` | 记录 test、check、API smoke、CI 和 Docker/Nginx 使用方式。 | 脚本或 infra 路径变化时同步。 |
| `docs/05-开发/GitHub与Netlify上线指南.md` | 记录 GitHub 推送、Netlify 前端部署、后端/数据库独立部署和环境变量配置。 | 前端托管平台、后端部署平台或生产环境变量变化时同步。 |
| `docs/05-开发/部署与运维指南.md` | 生产环境变量、Docker 部署、管理员授予、发布升级、日志排障和回滚。 | 部署流程、日志字段、健康检查或回滚策略变化时同步。 |
| `docs/05-开发/数据库备份与恢复.md` | PostgreSQL 备份、恢复和演练说明。 | 数据库连接方式、脚本或生产备份策略变化时同步。 |

## 工程化与部署

| 文件 | 作用 | 修改风险 |
| --- | --- | --- |
| `scripts/test/schema.test.mjs` | Node 内置 test runner 用例，覆盖共享 schema migration、校验和 URL normalize。 | 测试依赖后端构建产物 `server/dist/packages`，改构建路径要同步。 |
| `scripts/architecture/check-boundaries.mjs` | 架构边界检查，防止前端直接引用后端、共享包反向依赖应用、以及新代码绕回旧 `src/api`。 | 新增合法跨层依赖时先评估是否应该调整模块边界，而不是直接放宽规则。 |
| `scripts/smoke/api-smoke.mjs` | API smoke 脚本，验证注册、项目成员权限、页面保存、版本、发布、公开读取和审计闭环。 | 需要后端和数据库运行；改 API 路由或权限规则时同步。 |
| `infra/docker/Dockerfile.web` | 前端生产镜像构建，Nginx 托管 Vite dist。 | 改 Vite 环境变量或构建命令时同步。 |
| `infra/docker/Dockerfile.server` | 后端生产镜像构建，包含 Nest 构建产物和 Prisma 资源。 | 依赖 `server/dist/server/src/main.js` 输出路径。 |
| `infra/nginx/web.conf` | 前端 SPA fallback 和 `/api` 反向代理。 | 改后端服务名或 API 前缀时同步。 |
| `infra/docker/docker-compose.prod.example.yml` | 测试环境容器编排示例。 | 生产使用前必须替换 secret 和数据库配置。 |

## 共享包

| 文件 | 作用 | 修改风险 |
| --- | --- | --- |
| `packages/lowcode-schema/src/types.ts` | 前后端共享的页面 schema、组件 schema、事件动作和组件 registry 类型。 | 改类型会影响前端保存、事件配置和后端校验。 |
| `packages/lowcode-schema/src/defaults.ts` | 当前 schema 版本和默认 Page schema。 | 改默认 schema 会影响新页面和缺省 schema 迁移。 |
| `packages/lowcode-schema/src/migrate.ts` | 共享 schema 迁移器，补齐旧数据并把旧事件字段迁移到 `props.onEvent`。 | 高风险；打开页面、回滚、公开发布页、本地缓存恢复和后端入库都会调用。 |
| `packages/lowcode-schema/src/registry.ts` | 内置物料 schema registry，记录组件是否可接收子组件。 | 必须和 `src/editor/registry/component-config.tsx` 的物料/父子关系保持一致。 |
| `packages/lowcode-schema/src/validate.ts` | 前后端共享组件树校验器。 | 高风险；过严会拦截旧页面，过松会放过非法 schema。 |

## 前端应用入口

| 文件 | 作用 | 修改风险 |
| --- | --- | --- |
| `src/main.tsx` | React 入口，包裹 DnDProvider。 | DnDProvider 移除会影响拖拽。 |
| `src/App.tsx` | 兼容入口，转发到 `src/app/App.tsx`。 | 不要把复杂逻辑重新写回这里。 |
| `src/app/App.tsx` | 应用级装配入口，组合路由识别、会话状态、页面加载和视图出口。 | 影响登录态、页面打开和 schema 加载。 |
| `src/app/providers/AppProviders.tsx` | 应用 Provider 装配，目前包含 DnDProvider。 | 移除 DnDProvider 会影响拖拽。 |
| `src/app/components/AppErrorBoundary.tsx` | 应用级错误边界，避免运行态渲染异常导致整站白屏。 | 不要在这里执行复杂业务恢复逻辑。 |
| `src/app/components/RuntimeErrorFallback.tsx` | 通用错误兜底页，提供返回首页、刷新页面和排障编号展示。 | 文案和按钮行为要兼顾公开页和登录后页面。 |
| `src/app/hooks/useAuthSession.ts` | 登录态初始化、当前用户读取和退出登录封装。 | 影响 token 失效处理和登录后进入项目面板。 |
| `src/app/hooks/useEditorPageLoader.ts` | 打开页面时读取 page schema，先迁移再写入编辑器 store。 | 影响从项目面板进入编辑器和旧 schema 兼容。 |
| `src/app/components/AppViewOutlet.tsx` | 根据 `AppView` 渲染 auth/dashboard/editor。 | 影响应用级页面切换。 |
| `src/app/routes/publicRoutes.ts` | 识别 `/publish/:publicId` 公开访问路径。 | 影响公开发布页绕过登录。 |
| `src/features/auth/AuthView.tsx` | 登录/注册页面。 | 表单字段要和 Auth API DTO 对齐。 |
| `src/features/projects/ProjectDashboard.tsx` | 项目和页面入口面板。 | 影响创建项目、创建页面、进入编辑器流程。 |
| `src/features/projects/model/*` | 项目面板的功能内类型和展示字典。 | 只放纯类型、文案映射和无副作用规则，不放 API 请求。 |
| `src/features/admin/AdminDashboard.tsx` | 平台管理员后台，总览、用户、项目、发布页和全局审计管理。 | 高风险；操作会影响账号状态、项目状态和公开发布页。 |
| `src/features/admin/model/*`、`src/features/admin/components/*` | 管理员后台展示字典、格式化工具、概览卡片、状态标签和表格工具栏。 | 子模块保持展示或纯工具职责，不直接新增管理员 API 调用。 |
| `src/features/publish/PublishedPageView.tsx` | 公开发布页运行态渲染，先迁移发布快照，再传 `allowCustomJS={false}`。 | 公开页必须绕过登录且不能执行 customJS。 |

## 前端 API 层

| 文件 | 作用 | 修改风险 |
| --- | --- | --- |
| `src/shared/api/http.ts` | axios 实例和 token header 注入。 | 改 token key 或 baseURL 会影响所有 API。 |
| `src/shared/api/auth.ts` | register/login/me/logout/token storage。 | 要和 `/api/auth/*` 保持一致。 |
| `src/shared/api/projects.ts` | 项目 API 封装。 | 要和 ProjectsController 路由保持一致。 |
| `src/shared/api/pages.ts` | 页面 API 封装、schema 保存、版本列表、回滚、版本删除、发布、取消发布和公开页读取。 | 影响保存、版本管理和发布访问闭环。 |
| `src/shared/api/admin.ts` | 平台管理员 API 封装。 | 要和 AdminController 路由保持一致。 |
| `src/shared/api/types.ts` | 前端 API 类型，`PageSchema` 复用 `packages/lowcode-schema`。 | 后端响应结构或共享 schema 类型变化时同步。 |
| `src/api/*` | 旧 API 路径兼容导出。 | 不要在这里新增主逻辑。 |
| `src/api/admin.ts`、`src/api/index.ts` | 管理员 API 和聚合 API 的旧路径兼容导出。 | 只允许 re-export，新增 API 主实现必须放在 `src/shared/api`。 |

## 编辑器核心

| 文件 | 作用 | 修改风险 |
| --- | --- | --- |
| `src/editor/index.tsx` | 编辑器布局入口，接收 `pageId` 和 `onBack`。 | 影响编辑/预览模式和 Header 传参。 |
| `src/editor/stores/components.tsx` | 组件树 Zustand store，包含撤销/重做历史栈、复制、同级移动、重命名、按位置移动和包裹容器；`setComponents` 和 persist 恢复会执行 schema migration。 | 高风险；影响拖拽、选择、属性修改、事件配置、源码应用、大纲树、右键菜单、旧缓存恢复和保存。 |
| `src/editor/stores/component-tree.ts` | 组件树纯工具：查找、克隆、移动辅助、父子关系、锁定判断和 id 生成。 | 只放无副作用树操作工具；改动会影响 store 多个 action。 |
| `src/editor/registry/component-config.tsx` | 物料注册表、分类元信息、setter、events、methods，当前包含 P3 基础/表单/数据/反馈物料。 | 高风险；影响物料面板、设置面板、编辑态和运行态渲染。 |
| `src/editor/registry/types.ts`、`src/editor/registry/factory.ts` | 物料注册表公共类型、事件定义、setter 工厂和通用选项。 | 适合沉淀共享注册能力；具体物料配置后续继续按分类拆分。 |
| `src/editor/stores/component-config.tsx` | 旧物料注册表路径兼容导出。 | 不要在这里新增主逻辑。 |
| `src/editor/schema/validateComponents.ts` | 前端 schema 校验兼容出口，实际逻辑来自 `packages/lowcode-schema`。 | 高风险；规则过严会拦截旧页面，规则过松会让非法 schema 进入保存和发布。 |
| `src/editor/interface.ts` | 通用组件 props 类型。 | 改 `id/name` 类型会影响 dev/prod materials。 |
| `src/editor/components/Header/index.tsx` | 顶部栏、保存、发布、版本历史、回滚、版本删除、预览切换；保存前序列化为共享 schema，回滚后先迁移再载入。 | 保存、发布、回滚、版本删除逻辑和 pageId 绑定在这里。 |
| `src/editor/components/Header/schema.ts`、`src/editor/components/Header/VersionDiffSummary.tsx` | Header 的 schema 序列化和版本差异展示子模块。 | 保持纯函数/展示组件，避免把 API 调用写回这里。 |
| `src/editor/components/EditArea/index.tsx` | 编辑态递归渲染组件树，包含响应式画布宽度切换、hover/selected 遮罩、右键菜单和拖拽状态。 | 影响选择、hover、右键操作、拖拽和编辑画布渲染。 |
| `src/editor/runtime/Preview/index.tsx` | 预览态/公开运行态递归渲染和事件动作执行，公开页通过 `allowCustomJS={false}` 禁用 customJS。 | 高风险；含 `customJS` 执行路径，公开发布页必须保持禁用。 |
| `src/editor/components/Preview/index.tsx` | 旧 Preview 路径兼容导出。 | 不要在这里新增主逻辑。 |
| `src/editor/components/Preivew/index.tsx` | 旧拼写兼容导出。 | 不要在这里新增主逻辑。 |
| `src/editor/events/types.ts` | 事件动作类型的兼容导出和编辑器运行上下文类型；action schema 主类型来自共享包。 | 改 action schema 会影响配置面板、预览和旧数据兼容。 |
| `src/editor/events/normalize.ts` | 事件配置 normalize、旧 action schema 迁移和 URL normalize。 | 高风险；影响旧页面事件和链接跳转。 |
| `src/editor/events/createEventData.ts` | 不同事件生成 `eventData` 的规则。 | 影响自定义 JS 和条件表达式可用变量。 |
| `src/editor/events/runtime.ts` | toast/url/confirm/condition/http/component/custom 等动作执行器。 | 高风险；公开发布页必须尊重 `allowCustomJS={false}`。 |
| `src/editor/events.ts` | 旧事件单文件兼容导出。 | 不要在这里新增主逻辑。 |
| `src/editor/components/Setting/index.tsx` | 设置面板入口。 | 影响属性、样式、事件配置。 |
| `src/editor/components/Material/index.tsx` | 左侧物料面板，按分类展示并支持搜索、收藏和常用模板。 | 新物料分类、搜索关键字、模板引用和展示顺序依赖 registry 元信息。 |
| `src/editor/components/Material/model.ts` | 物料面板分类元信息、模板类型、模板恢复和模板保存序列化工具。 | 只放物料面板内部模型和纯工具；内置模板后续可继续拆到独立文件。 |
| `src/editor/components/MaterialItem/index.tsx` | 单个物料拖拽卡片。 | 拖拽 item.type 必须保持物料 name，否则无法添加组件。 |
| `src/editor/components/Outline/index.tsx` | 左侧大纲树，支持定位组件、拖拽排序和重命名。 | 拖拽要遵守 registry 的 acceptsChildren，避免生成非法父子关系。 |
| `src/editor/components/Setting/ActionModal.tsx` | 事件动作配置弹窗，新增和编辑 toast/url/componentAction/confirm/condition/http/setComponentProps/setComponentStyles/custom 动作。 | 打开已有动作必须初始化当前配置，避免直接确认时丢失配置。 |
| `src/editor/hooks/useMaterialDrop.ts` | 当前拖拽 hook 主实现。 | 影响新增组件和移动组件的拖拽规则。 |
| `src/editor/hooks/useMaterailDrop.ts` | 旧拼写兼容导出。 | 不要在这里新增主逻辑。 |

## 物料目录

| 目录/文件 | 作用 | 修改风险 |
| --- | --- | --- |
| `src/editor/materials/<Name>/dev.tsx` | 编辑态物料实现。 | 应暴露 `data-component-id`，可容器组件需支持 drop。 |
| `src/editor/materials/<Name>/prod.tsx` | 预览/运行态物料实现。 | 要过滤低代码内部 props，并转发 registry 声明的事件 props，否则事件绑定无法触发。 |
| `src/editor/materials/p3.tsx` | P3 新增物料的集中实现：Link/Icon/Space/Flex/Grid/Tabs/Steps、表单控件、数据展示和反馈组件。 | 后续物料多了可以逐步拆目录；拆分时保持 dev/prod 导出和 registry 不变。 |
| `src/editor/materials/commonChildren.ts` | 常用容器可接收子组件白名单。 | 必须和 `packages/lowcode-schema/src/registry.ts` 的父子关系保持一致。 |
| `src/editor/materials/Text/*` | 文本物料，支持内容、字重、斜体、字号和颜色配置。 | dev/prod 要保持展示一致。 |
| `src/editor/materials/Image/*` | 图片物料，支持地址、alt、宽高配置。 | 外链图片可能加载失败，默认值只用于占位演示。 |
| `src/editor/materials/Divider/*` | 分割线物料。 | orientation/dashed 等 props 要和 Ant Design Divider 兼容。 |
| `src/editor/materials/Card/*` | 卡片容器物料，可继续拖入子组件。 | 容器类必须同时支持 drag 和 drop。 |
| `src/editor/materials/Alert/*` | 提示反馈物料。 | type/message/description 要和 Ant Design Alert 兼容。 |
| `src/editor/materials/Input/*` | 输入框物料。 | 运行态是展示控件，不做数据源绑定。 |
| `src/editor/materials/Select/*` | 下拉框物料，使用逗号分隔文本生成 options。 | 第一阶段不是复杂选项编辑器。 |
| `src/editor/materials/Switch/*` | 开关物料。 | 当前配置默认值，不做表单联动。 |
| `src/editor/materials/Form/*` | 表单物料，支持多种 FormItem 类型、默认值、校验、提交/重置和 valuesChange。 | 新增字段类型要同步 Form dev/prod、FormItem setter 和事件数据。 |
| `src/editor/materials/Table/*` | 表格物料，支持静态/远程数据源、分页、空状态、日期列和操作列。 | 改列配置要同步 TableColumn setter、预览测试和 schema 示例。 |
| `src/editor/materials/Button/prod.tsx` | Button 运行态实现。 | 已过滤 `id/name`，不要重新传给 AntD Button。 |
| `src/editor/materials/Page/*` | Page 根组件。 | 根节点 id 通常是 1，保存/恢复依赖组件树结构。 |

## 后端入口和公共能力

| 文件 | 作用 | 修改风险 |
| --- | --- | --- |
| `server/src/main.ts` | Nest app 启动、全局前缀、CORS、ValidationPipe、异常过滤器。 | 改 API prefix 或 CORS 要同步前端环境变量和文档。 |
| `server/src/app.module.ts` | 后端模块注册。 | 新模块需要在这里导入。 |
| `server/src/config/env.validation.ts` | 后端启动环境变量校验。 | 改必填变量要同步 `.env.example` 和部署文档。 |
| `server/src/prisma/prisma.service.ts` | Prisma Client 生命周期。 | 影响所有数据库访问。 |
| `server/src/common/logging/http-log.ts` | requestId、结构化日志输出和敏感信息脱敏工具。 | 改日志字段要同步排障文档和日志采集规则。 |
| `server/src/common/middleware/request-logging.middleware.ts` | 记录 method/path/status/duration 的请求日志中间件。 | 不要记录请求体、Authorization 或 query 中的敏感信息。 |
| `server/src/common/filters/http-exception.filter.ts` | 统一错误响应。 | 改格式会影响前端错误处理。 |
| `server/src/common/errors/error-codes.ts` | 统一业务错误码。 | 改错误码要同步 API 文档和前端处理。 |
| `server/src/common/errors/business.exception.ts` | 带错误码的业务异常。 | 改响应结构要同步异常过滤器。 |
| `server/src/common/guards/jwt.strategy.ts` | JWT payload 校验和 user 注入。 | 改 payload 要同步 AuthService。 |
| `server/src/common/guards/jwt-auth.guard.ts` | JWT Guard。 | 业务接口保护依赖它。 |
| `server/src/common/guards/admin.guard.ts` | 平台管理员 Guard，从数据库复查用户 role/status。 | 高风险；影响 `/api/admin/*` 权限边界。 |
| `server/src/common/decorators/current-user.decorator.ts` | Controller 获取当前用户。 | 改类型会影响所有受保护接口。 |

## 后端业务模块

| 文件 | 作用 | 修改风险 |
| --- | --- | --- |
| `server/src/modules/auth/auth.controller.ts` | 注册、登录、me 路由。 | 公开/受保护路由边界要清楚。 |
| `server/src/modules/auth/auth.service.ts` | 密码 hash、登录校验、JWT 签发。 | 高风险；不能返回 passwordHash。 |
| `server/src/modules/auth/dto/*.ts` | 注册/登录 DTO 校验。 | 要和前端表单字段一致。 |
| `server/src/modules/users/users.service.ts` | 用户查询。 | 不要泄露 passwordHash。 |
| `server/src/modules/admin/*` | 平台管理员 API，总览、用户状态、项目状态、发布页取消发布和全局审计。 | 高风险；上线治理能力入口，必须保留后端权限校验和审计写入。 |
| `server/src/modules/audit/audit-logs.service.ts` | 项目和页面关键操作审计写入与查询。 | 审计日志不应随 Project/Page 删除级联丢失。 |
| `server/src/modules/projects/projects.controller.ts` | 项目 CRUD、成员管理和审计查询路由。 | 全部需要 JWT，成员管理和审计仅 owner 可操作。 |
| `server/src/modules/projects/project-access.service.ts` | owner/editor/viewer 角色解析和项目权限校验。 | 高风险；影响所有项目和页面 API。 |
| `server/src/modules/projects/projects.service.ts` | 项目 CRUD、成员管理、项目权限和审计查询。 | 高风险；不能跨项目越权。 |
| `server/src/modules/pages/pages.controller.ts` | 页面列表、创建、读取、更新、删除、版本列表、回滚、版本删除、发布、取消发布和公开读取路由。 | 受保护业务路由需要 JWT；公开 `PublicPagesController` 不能误加 Guard。 |
| `server/src/modules/pages/pages.service.ts` | 页面 CRUD、项目角色权限和 Pages 领域编排。 | 高风险；保存、版本管理、发布访问和审计闭环依赖这里。 |
| `server/src/modules/pages/page-schema.service.ts` | 页面 schema normalize，统一先调用共享迁移器再做服务端 schema 校验。 | 影响新页面、保存、发布、回滚的 schema 结构。 |
| `server/src/modules/pages/page-versions.service.ts` | PageVersion 列表、创建、回滚和删除。 | 高风险；影响版本号、回滚和删除历史版本。 |
| `server/src/modules/pages/page-publish.service.ts` | 发布、取消发布和公开读取发布快照。 | 高风险；影响公开页和草稿/发布隔离。 |
| `server/src/modules/pages/dto/*.ts` | 页面 DTO 校验，包括 routePath 和 rollback versionId。 | 前端创建页面和回滚接口要同步。 |

## 数据库

| 文件 | 作用 | 修改风险 |
| --- | --- | --- |
| `server/prisma/schema.prisma` | Prisma 数据模型：User/Project/ProjectMember/Page/PageVersion/AuditLog。 | 改模型后必须生成 migration 并运行 `prisma:generate`。 |
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
3. 更新 `src/editor/registry/component-config.tsx`，补充 `category`、`icon`、`keywords`、`sort`、setter 和 dev/prod 注册
4. 如物料要能拖入 Page/Container/Card，更新对应容器 `useMaterialDrop` accept 列表
5. 测试编辑态拖拽、属性设置、预览态渲染

### 改 schema 保存、版本、发布逻辑

1. `packages/lowcode-schema/src/*`，如改共享 schema 类型、默认值、迁移、registry 或校验逻辑
2. `src/editor/schema/validateComponents.ts`，如改前端兼容出口
3. `server/src/modules/pages/page-schema.service.ts`，如改服务端 schema normalize/校验
4. `src/editor/components/Header/index.tsx`
5. `src/shared/api/pages.ts`
6. `src/shared/api/types.ts`
7. `server/src/modules/pages/pages.controller.ts`
8. `server/src/modules/pages/pages.service.ts`
9. `src/app/hooks/useEditorPageLoader.ts`，如涉及载入 schema
10. `src/app/App.tsx` / `src/app/components/AppViewOutlet.tsx`，如涉及应用视图分发
11. `src/features/publish/PublishedPageView.tsx`，如涉及公开访问页面
12. `src/editor/events/*`，如涉及事件动作 schema、eventData、动作执行或 customJS 安全
13. `src/editor/runtime/Preview/index.tsx`，如涉及公开运行态渲染或事件注入
14. `server/prisma/schema.prisma`，如数据库结构变化则加 migration

### 加后端业务模块

1. `server/src/modules/<module>/dto/`
2. `server/src/modules/<module>/<module>.controller.ts`
3. `server/src/modules/<module>/<module>.service.ts`
4. `server/src/modules/<module>/<module>.module.ts`
5. `server/src/app.module.ts`
6. `docs/03-接口/接口说明.md`

### 改项目权限或协作能力

1. `server/src/modules/projects/project-access.service.ts`
2. `server/src/modules/projects/projects.service.ts`
3. `server/src/modules/pages/pages.service.ts`
4. `server/prisma/schema.prisma`，如新增角色或成员字段则加 migration
5. `src/shared/api/projects.ts` 和 `src/shared/api/types.ts`
6. `docs/03-接口/接口说明.md`
7. `scripts/smoke/api-smoke.mjs`

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

统一检查命令：

```bash
npm run check:architecture
npm run check
```

如改前端 lint 相关代码，也运行：

```bash
npm run lint
```
