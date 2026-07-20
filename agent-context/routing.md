# 任务路由

按任务类型确定必读上下文。这里只做“读哪一层”的路由；具体文件入口见 `docs/00-总览/项目上下文索引.md`，代码定位优先使用 `codegraph explore`。

| 任务类型 | 必读上下文 |
| --- | --- |
| 编辑器交互、物料、设置面板 | `apps/editor-web/CONTEXT.md` → `docs/04-编辑器/` |
| 匿名发布页 | `apps/publisher-web/CONTEXT.md` → `docs/adr/0001-page-lifecycle-owns-published-snapshot.md` |
| API、鉴权、持久化 | `apps/api-server/CONTEXT.md` → `docs/03-接口/接口说明.md` |
| schema、事件、AI 契约 | `packages/lowcode-schema/CONTEXT.md` → `docs/02-架构/` |
| 运行时渲染 | `packages/lowcode-runtime/CONTEXT.md` → `docs/adr/0003-share-stateless-page-runtime.md` |
| AI 页面搭建与 agent | `docs/01-产品/AI页面搭建.md` → `agent-context/README.md` 的 AI Page Builder 约束 |
| 部署与运维 | `infra/docker/` → `docs/05-开发/部署与运维指南.md` |
| 目录结构、跨应用边界 | `CONTEXT-MAP.md` → `docs/02-架构/模块边界与拆分规范.md` → `docs/adr/0002-organize-top-level-by-deployable-app.md` |
| 文档维护 | `docs/README.md` |

## 工作规则

1. 只读取任务相关的上下文，不通读全仓库。
2. 项目事实以 `docs/` 和源码为准；本目录只维护阅读规则，不复述事实。
3. 修改架构、接口、命令或目录时，回到 `agent-context/README.md` 的单一事实来源表，更新对应来源文档。
