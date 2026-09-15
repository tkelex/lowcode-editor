# Agent Context

本目录是所有 AI/自动化工具的统一上下文入口。它只负责“按什么顺序读什么”，不复制项目事实；事实以源码、`docs/` 和各部署单元 `CONTEXT.md` 为准。

## 单一事实来源

| 事实 | 唯一来源 |
| --- | --- |
| 部署单元与依赖关系 | `CONTEXT-MAP.md` + 各目录 `CONTEXT.md` |
| 命令、边界、不变量与验证 | 本文件 |
| 任务到文件的阅读路由 | `routing.md` + `docs/00-总览/项目上下文索引.md` |
| 架构与模块边界 | `docs/02-架构/` |
| 接口契约 | `docs/03-接口/接口说明.md` |
| 长期决策 | `docs/adr/` |
| AI 阅读规则 | 本目录 |

上述内容只在来源处维护，其他文档用链接引用，不复述。

## 阅读顺序

1. `CONTEXT-MAP.md`：确定部署单元或共享包。
2. 对应目录的 `CONTEXT.md`：确认领域术语和职责。
3. `routing.md`：按任务类型找到必读文件。
4. `docs/00-总览/项目上下文索引.md`：文件级路由和高风险入口。
5. 需要时读 `docs/02-架构/`、`docs/03-接口/`、`docs/adr/`。

## Commands

- 安装：`npm install`
- 开发：`npm run dev`、`npm run dev:publisher`、`npm run dev:server`
- 构建：`npm run build`、`npm run build:publisher`、`npm run build:server`
- 检查：`npm run lint`、`npm run test`、`npm run check:architecture`、`npm run check`
- 主链路：`npm run smoke:api`、`npm run test:e2e:editor`、`npm run preflight`
- 编辑器状态性能：`npm run benchmark:editor-state -- --sizes 500,1000 --iterations 5 --assert`
- Agent 数据库集成：`npm run test:agent:postgres`；先迁移独立测试库，显式设置 `AGENT_TEST_DATABASE_URL`（数据库名以 `_test` 或 `_ci` 结尾），不能复用个人开发库。

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
- 编辑器组件树更新必须保留未变化分支的引用；画布节点按引用跳过无关渲染，store 返回对象 selector 使用 `shallow`，拖放判定按需读取最新组件树。
- 未保存本地草稿只持久化组件树，必须按 `userId / projectId / pageId` 隔离；选中态和预览模式不得写入。
- 页面 PATCH 必须用 `expectedRevision` 原子比较并递增 `Page.revision`；冲突不得覆盖草稿或创建版本，回滚成功递增 revision。
- 公开页只读取 `publishedVersionId` 指向的快照。
- 发布运行时必须禁用 custom JS，且不得注入当前用户 token。
- 后端权限由 guard/service 执行，不能只隐藏前端按钮。
- Prisma model 变化必须提交 migration，并同步 DTO、类型和接口文档。
- 物料变化要同时检查 editor dev 实现、runtime prod 实现、registry、schema 与测试。

## AI Page Builder

- AI 只生成低代码 schema 或 schema patch，不生成任意应用源码。
- 模型调用只通过后端 AI 网关，前端不得保存模型 API key。
- AI 结果写入前必须经过物料、组件树、事件、stale baseline 和 custom JS 校验。
- AI 结果先展示摘要、warnings、assumptions、执行轨迹和预览；前端校验候选后请求服务端确认，只有 `accepted` 才写入 store。
- 候选确认/拒绝只允许任务发起者或项目 owner；确认不保存页面、不创建 `PageVersion`。
- Agent 创建返回 202 + runId；任务持久化与 worker 在 API 的 `ai-agent-run-store.service.ts` / `ai-agent-worker.service.ts`，不要重新把 HTTP 查询接到生成器进程内 Map。当前阶段边界见 `docs/01-产品/AI页面搭建.md`。

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
| 编辑器订阅、组件树更新或撤销重做 | `npm run benchmark:editor-state -- --sizes 500,1000 --iterations 5 --assert` |

只评审当前任务产生的 diff。全量命令发现的既有问题，仅在阻塞当前验证时说明。
