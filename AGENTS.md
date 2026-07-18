# AGENTS.md

本文件是仓库内自动化工具的项目规范入口。项目事实以源码、`CONTEXT-MAP.md` 和 `docs/` 中的当前文档为准。

## Language

- 自然语言默认使用简体中文。
- 标识符、路径、命令、依赖名和机器解析字段保持原格式。

## Reading Order

按任务读取，不要通读全仓库：

1. `CONTEXT-MAP.md`：确定部署单元或共享包。
2. 对应目录的 `CONTEXT.md`：确认领域术语和职责。
3. `docs/00-总览/项目上下文索引.md`：找到任务入口和高风险文件。
4. 架构改动读 `docs/02-架构/架构说明.md` 与 `模块边界与拆分规范.md`。
5. API、鉴权或持久化改动读 `docs/03-接口/接口说明.md`。
6. 长期决策读 `docs/adr/`。

仓库存在 `.codegraph/` 时，理解或定位代码优先使用 `codegraph explore`。

## Commands

- 安装：`npm install`
- 开发：`npm run dev`、`npm run dev:publisher`、`npm run dev:server`
- 构建：`npm run build`、`npm run build:publisher`、`npm run build:server`
- 检查：`npm run lint`、`npm run test`、`npm run check:architecture`、`npm run check`
- 主链路：`npm run smoke:api`、`npm run test:e2e:editor`、`npm run preflight`

## Repository Boundaries

- `apps/editor-web/` 是编辑器应用，内部按 `app / features / shared` 组织。
- `apps/publisher-web/` 是匿名发布站，不读取编辑器或后端源码。
- `apps/api-server/` 是 API 部署单元；`prisma/` 是唯一数据库结构和 migration 来源。
- `packages/lowcode-schema/` 只定义跨运行时契约，不依赖任何 app。
- `packages/lowcode-runtime/` 只提供无状态运行时，不依赖任何 app。
- `shared/` 只放业务无关能力；业务 API、类型和展示规则归对应 feature。
- 跨 feature 依赖必须通过目标 feature 的公开入口。
- 多应用、数据库、网络和卷由 `infra/docker/` 编排；每个 app 自己维护 Dockerfile。

## Critical Invariants

- 页面根节点必须是 `Page`；写入前必须迁移并校验 schema。
- 编辑器 store 是 `useComponentsStore`；历史栈只保存在内存，不持久化。
- 公开页只读取 `publishedVersionId` 指向的快照。
- 发布运行时必须禁用 custom JS，且不得注入当前用户 token。
- 后端权限由 guard/service 执行，不能只隐藏前端按钮。
- Prisma model 变化必须提交 migration，并同步 DTO、类型和接口文档。
- 物料变化要同时检查 editor dev 实现、runtime prod 实现、registry、schema 与测试。

## AI Page Builder

- AI 只生成低代码 schema 或 schema patch，不生成任意应用源码。
- 模型调用只通过后端 AI 网关，前端不得保存模型 API key。
- AI 结果写入前必须经过物料、组件树、事件、stale baseline 和 custom JS 校验。
- AI 结果先展示摘要、warnings、assumptions、执行轨迹和预览，用户确认后才写入 store。

## Validation

| 修改范围 | 至少运行 |
| --- | --- |
| 编辑器或样式 | `npm run lint`、`npm run build` |
| schema、事件、URL、HTTP action | `npm run test` |
| 发布站 | `npm run build:publisher` |
| API | `npm run build:server` |
| 目录或依赖边界 | `npm run check:architecture` |
| 权限、保存、发布 | `npm run smoke:api` |
| 编辑器关键交互 | `npm run test:e2e:editor` |

只评审当前任务产生的 diff。全量命令发现的既有问题，仅在阻塞当前验证时说明。

## Documentation

- README 只保留产品说明、最短启动和文档入口。
- 当前架构写入 `docs/02-架构`，接口契约写入 `docs/03-接口`。
- 不在多个文档重复维护同一命令、数据流或能力状态。
- 个人规划、复盘和学习资料写入 `E:\obsidian notes\笔记`，不提交到仓库。
- 架构、接口、命令或目录发生变化时，同步更新相应当前文档。
