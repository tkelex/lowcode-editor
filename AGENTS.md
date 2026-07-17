# AGENTS.md

本文件是仓库内 AI 和自动化工具的规范入口。项目事实以源码和下列权威文档为准，不在本文件复制完整实现说明。

## Language Policy

- 自然语言默认使用简体中文，包括文档、计划、评审和用户说明。
- 代码标识符、路径、命令、依赖名和机器解析标题保持原格式。

## Context Routing

按任务读取，不要通读全仓库：

1. `CONTEXT-MAP.md`：选择相关领域上下文和术语。
2. `docs/00-总览/项目上下文索引.md`：项目心智模型和任务阅读路线。
3. `docs/02-架构/架构说明.md`：架构或跨运行时数据流。
4. `docs/02-架构/模块边界与拆分规范.md`：依赖方向和拆分约束。
5. `docs/03-接口/接口说明.md`：后端路由、鉴权和持久化契约。
6. `.claude/context/FILE_MAP.md`：文件职责与修改风险。

UI 任务另读 `docs/00-总览/UI需求表达指南.md`。长期决策见 `docs/02-架构/技术决策记录.md` 和相关 ADR。

## Commands

- 安装：`npm install`（根 workspace 单次安装）
- 开发：`npm run dev`、`npm run dev:publisher`、`npm run dev:server`
- 构建：`npm run build`、`npm run build:publisher`、`npm run build:server`
- 检查：`npm run lint`、`npm run test`、`npm run check:architecture`、`npm run check`
- 主链路：`npm run smoke:api`、`npm run test:e2e:editor`、`npm run preflight`

## Repository Boundaries

- `src/` 是 Vite 前端；`apps/publisher-next/` 是公开发布运行时；`server/` 是 NestJS API。
- `server/prisma/` 是唯一数据库结构与 migration 来源，前端不得引用。
- `packages/lowcode-schema/` 是跨运行时 schema 契约，不得依赖任何应用 implementation。
- 应用之间通过公开 interface 或 HTTP 交互，不从其它应用深层路径读取实现。
- 公开发布页只通过 `src/editor/runtime/public` 使用当前仓库内运行时 seam。

## Critical Invariants

- 页面根节点是 `Page`；页面写入前必须迁移并校验 schema。
- 公开发布运行时只读取发布快照，必须禁用 custom JS，且不得注入当前用户 token。
- 后端权限必须由 guard/service 执行，不能只隐藏前端按钮。
- Prisma model 变化必须生成 migration，并同步 DTO、前端类型和接口文档。
- 组件树历史栈只保存在内存，不进入持久化状态。
- 物料变化需同时检查 dev、prod、registry、schema 规则和相关测试。

## AI Page Builder

- AI 只生成低代码 schema 或 schema patch，不生成任意应用源码。
- 模型调用只通过后端 AI 网关，前端不得保存模型 API key。
- 结果写入前必须经过物料、组件树、事件、stale baseline 与 custom JS 校验。
- AI 结果先展示摘要、warnings、assumptions、执行轨迹和预览，用户确认后才写入编辑器 store。

## Compatibility

以下历史名称是兼容 interface，除非执行明确迁移，不要顺手删除：

- `useComponetsStore`
- `useMaterailDrop`
- `components/Preivew`
- `components/Sourse`

新代码优先使用 `useMaterialDrop`、`components/Preview`、`components/Source`。

## Validation

| 修改范围 | 至少运行 |
| --- | --- |
| 前端或样式 | `npm run lint`、`npm run build` |
| schema、事件、URL、HTTP action | `npm run test` |
| Next.js 发布运行时 | `npm run build:publisher` |
| 后端 API | `npm run build:server` |
| 权限、保存、发布 | `npm run smoke:api` |
| 编辑器关键交互 | `npm run test:e2e:editor` |

无法运行时说明原因和剩余风险。只评审当前任务产生的 diff；全量命令发现的既有问题仅作为背景报告。

## Documentation Ownership

- README 只保留产品说明、最短启动和文档入口。
- 稳定架构写入 `docs/02-架构`，接口契约写入 `docs/03-接口`。
- AI 阅读顺序和任务表达写入 `docs/00-总览`，文件职责写入 `.claude/context/FILE_MAP.md`。
- 不在多个入口复制相同数据流、命令清单或能力状态。
