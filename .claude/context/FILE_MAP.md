# 关键文件地图

本文件只记录文件职责和修改风险。阅读顺序见 `docs/00-总览/项目上下文索引.md`，命令见 `AGENTS.md`，数据流见架构说明。

## Repository

| 路径 | 职责 | 主要风险 |
| --- | --- | --- |
| `src/` | Vite 前端、项目后台和编辑器 | 不得引用后端或 Prisma implementation |
| `apps/publisher-next/` | Next.js 公开发布运行时 | 只能通过公开 runtime seam 和 HTTP 使用其它 context |
| `server/` | NestJS API | 权限和业务不变量必须在后端执行 |
| `server/prisma/` | 数据库 schema 与 migrations | 结构变化必须配套 migration |
| `packages/lowcode-schema/` | 跨运行时 schema 契约 | 不得依赖 React、NestJS、Prisma 或浏览器状态 |
| `scripts/` | 测试、smoke、审计和架构检查 | 脚本应验证公开 interface，不依赖临时实现路径 |
| `infra/` | Docker、Nginx 和部署示例 | 环境变量和服务名需与应用配置一致 |

## Frontend Assembly

| 文件 | 职责 | 主要风险 |
| --- | --- | --- |
| `src/main.tsx` | Vite 入口 | Provider 变化影响全应用 |
| `src/app/App.tsx` | 会话、视图和页面装配 | 不应吸收 feature 业务逻辑 |
| `src/app/providers/AppProviders.tsx` | 全局 Provider | DnDProvider 缺失会破坏拖拽 |
| `src/app/hooks/useEditorPageLoader.ts` | 页面草稿读取和 store 载入 | 必须先迁移 schema |
| `src/features/projects/ProjectDashboard.tsx` | 项目和页面工作台 | API 编排和 UI 状态影响范围大 |
| `src/features/admin/AdminDashboard.tsx` | 平台管理后台 | 操作影响全局用户、项目和发布页 |
| `src/features/publish/PublishedPageView.tsx` | Vite 公开页回退 adapter | 必须使用 public runtime seam |

## Editor

| 文件 | 职责 | 主要风险 |
| --- | --- | --- |
| `src/editor/index.tsx` | 编辑器三栏装配和模式切换 | 布局变化需验证 edit/preview |
| `src/editor/stores/components.tsx` | 组件树、选择、历史和持久化 | 兼容名 `useComponetsStore` 不可随意删除 |
| `src/editor/stores/component-tree.ts` | 组件树纯操作 | 必须保持不可变更新语义 |
| `src/editor/registry/component-config.tsx` | 物料 interface 与 implementation 注册 | 必须与 schema registry 对齐 |
| `src/editor/components/EditArea/index.tsx` | 编辑态递归渲染和选择 | 依赖 `data-component-id` |
| `src/editor/hooks/useMaterialDrop.ts` | 新增和移动物料 | 父子规则与 parentId 必须一致 |
| `src/editor/components/Setting/` | 属性、样式和事件设置 | 写入格式必须兼容 schema |
| `src/editor/components/AiBuilderPanel/` | AI 候选预览与确认 | 未确认结果不得写入 store |

## Runtime

| 文件 | 职责 | 主要风险 |
| --- | --- | --- |
| `src/editor/runtime/public/index.ts` | 发布快照 migration + validation interface | Vite 与 Next 的共同事实来源 |
| `src/editor/runtime/public/PublishedPageRuntime.tsx` | 匿名公开运行时 interface | 不得暴露 custom JS 或 token provider |
| `src/editor/runtime/Preview/index.tsx` | 内部渲染、事件、变量和数据源 implementation | 编辑器模式与公开模式策略不同 |
| `src/editor/runtime/runtimeData.ts` | 数据源和运行值解析 | URL、allowed origins 与变量解析属于安全面 |
| `src/editor/events/` | 事件 schema 适配和动作执行 | 需兼容历史事件字段 |
| `src/editor/stores/runtime-logs.ts` | 运行日志 | 不要让日志状态成为公开运行时 interface |

## Publisher

| 文件 | 职责 | 主要风险 |
| --- | --- | --- |
| `apps/publisher-next/app/publish/[publicId]/page.tsx` | 服务端页面入口和 metadata 装配 | 不得导入 editor store 或内部 Preview |
| `apps/publisher-next/src/published-pages/fetchPublishedPage.ts` | 读取并准备发布快照 | 只调用 NestJS 公开接口 |
| `apps/publisher-next/src/published-pages/metadata.ts` | SEO metadata | 文本和 URL 必须清洗 |
| `apps/publisher-next/src/published-pages/config.ts` | 显式 runtime 配置 | 不得向客户端泄漏 secret |
| `apps/publisher-next/app/api/revalidate/published-page/route.ts` | 缓存 tag 失效 | 必须校验共享 secret |

## Server

| 文件 | 职责 | 主要风险 |
| --- | --- | --- |
| `server/src/main.ts` | NestJS 启动与全局配置 | CORS、prefix、filter 影响所有接口 |
| `server/src/app.module.ts` | module 装配 | 新 module 必须显式注册 |
| `server/src/prisma/prisma.service.ts` | Prisma client 生命周期 | 不在业务 module 重复创建 client |
| `server/src/modules/projects/project-access.service.ts` | 项目角色和状态检查 | 所有项目资源应复用 |
| `server/src/modules/pages/pages.service.ts` | 页面访问控制 interface | owner/editor/viewer 规则不得下沉到前端 |
| `server/src/modules/pages/page-lifecycle.service.ts` | 页面写入、版本、发布和审计事务 | 必须保护 publishedVersion 生命周期不变量 |
| `server/src/modules/pages/published-page-revalidate.service.ts` | Next 缓存失效 adapter | 远程失败不能破坏数据库状态 |
| `server/src/modules/audit/audit-logs.service.ts` | 审计写入 | 删除业务对象后日志仍需保留 |
| `server/src/modules/ai/` | AI 网关和 agent 编排 | 模型输出不能直接写页面或执行任意工具 |

## Schema And Database

| 文件 | 职责 | 主要风险 |
| --- | --- | --- |
| `packages/lowcode-schema/src/types.ts` | schema 与 action 类型 | 变化影响全部运行时 |
| `packages/lowcode-schema/src/migrate.ts` | 历史 schema 迁移 | 必须保持旧页面、版本和缓存可读 |
| `packages/lowcode-schema/src/validate.ts` | 组件树校验 | 过严阻断旧页面，过松放过非法树 |
| `packages/lowcode-schema/src/registry.ts` | schema 物料父子规则 | 必须与 editor registry 对齐 |
| `packages/lowcode-schema/src/action-runtime.ts` | 事件动作纯运行逻辑 | custom JS 和 HTTP action 是安全面 |
| `packages/lowcode-schema/src/ai-*` | AI schema/patch 契约 | 必须保持白名单和 stale baseline 校验 |
| `packages/lowcode-schema/src/data-model-crud-*` | 数据源模型与 CRUD schema 生成 | 生成结果仍走标准页面链路 |
| `server/prisma/schema.prisma` | 数据库模型事实来源 | 改动必须生成 migration |

## Validation Assets

| 路径 | 职责 |
| --- | --- |
| `scripts/test/*.test.mjs` | schema、runtime、AI 与 publisher 行为测试 |
| `scripts/architecture/check-boundaries.mjs` | 可执行依赖策略 |
| `scripts/smoke/api-smoke.mjs` | API、权限、保存、版本、发布和审计闭环 |
| `e2e/editor-regression.spec.ts` | 编辑器关键交互回归 |
| `.github/workflows/ci.yml` | CI 质量门禁 |
