# AI 快速上手

这个文件服务于每个新的 AI 对话。目标是快速理解项目、识别任务边界、读取正确源码，并用合适命令验证结果。

## 新对话怎么开始

1. 读 `AGENTS.md`。
2. 读本文件。
3. 读 `docs/00-总览/项目上下文索引.md`。
4. 如果有多个窗口并行工作，读 `docs/10-协作/并行任务看板.md`。
5. 看 `git status --short`，确认工作区现场。
6. 按任务类型读取源码，不要一开始通读全仓库。

推荐开场：

```text
请先读取 AGENTS.md、docs/00-总览/AI快速上手.md、docs/00-总览/项目上下文索引.md，
再按本次任务类型读取相关源码。先确认任务边界，再执行。
```

并行任务窗口请改用：

```text
请先读取 AGENTS.md、docs/00-总览/AI快速上手.md、docs/10-协作/并行任务看板.md，
并查看 git status。你只能修改看板里分配给本窗口的文件。
```

## 项目心智模型

```text
前端编辑器
  管理组件树、拖拽、设置面板、预览和保存按钮

共享 schema 包
  定义 schema 类型、默认值、迁移、校验和物料父子规则

后端 API
  管理用户、项目、成员、页面、版本、发布和审计

PostgreSQL
  保存业务实体、Page.schema 和 PageVersion.schema
```

核心链路：

```text
打开页面 -> migratePageSchema -> Zustand components
编辑组件树 -> validateComponentTree -> PATCH /api/pages/:id
保存成功 -> Page.schema + PageVersion
发布 -> PageVersion(source=publish) + publicId
公开访问 -> PublishedPageView -> Preview(allowCustomJS=false)
```

## 任务阅读路线

| 任务 | 必读文件 |
| --- | --- |
| 编辑器布局/样式 | `src/editor/index.tsx`、`EditArea`、`Material`、`Setting`、`editorCanvas.css`、`settingPanel.css` |
| 物料新增/修复 | `src/editor/registry/component-config.tsx`、对应 material、`commonChildren.ts`、`packages/lowcode-schema/src/registry.ts` |
| 组件树 bug | `src/editor/stores/components.tsx`、`useMaterialDrop.ts`、`Outline`、`EditArea` |
| 事件系统 | `src/editor/events/*`、`ComponentEvent.tsx`、`ActionModal.tsx`、`runtime/Preview/index.tsx` |
| 保存/发布/回滚 | `Header`、`src/shared/api/pages.ts`、`useEditorPageLoader.ts`、`server/src/modules/pages/*` |
| 权限/成员 | `project-access.service.ts`、`projects.service.ts`、`pages.service.ts`、`scripts/smoke/api-smoke.mjs` |
| 管理员后台 | `server/src/modules/admin/*`、`admin.guard.ts`、`src/features/admin/AdminDashboard.tsx` |
| API/数据库 | `docs/03-接口/接口说明.md`、`server/prisma/schema.prisma`、相关 dto/service/controller |

## 高风险提醒

- 不要改掉历史 API 名：`useComponetsStore`、`useMaterailDrop`、`Preivew`、`Sourse`。
- 不要让公开发布页执行自定义 JS。
- 不要只改前端权限隐藏，后端必须校验权限。
- 改物料时同时检查 dev、prod、registry、schema registry、父子关系。
- 改 schema 时同时考虑旧页面、回滚版本、公开快照和本地缓存。
- 改 Prisma schema 必须生成 migration。
- 有未提交改动时，不要回滚用户现场。

## 每次任务最好这样写

```md
## 目标
本次要修复或新增什么。

## 问题现象
报错、截图、复现步骤、浏览器尺寸或接口响应。

## 范围
允许改哪些模块。

## 不做
本次明确不处理什么。

## 验收标准
1. 行为标准
2. UI 标准
3. 需要通过的命令

## 相关文件
- xxx
```

## 验证选择

| 修改范围 | 建议验证 |
| --- | --- |
| 前端组件或样式 | `npm run lint`、`npm run build` |
| schema / 事件 / URL / HTTP action | `npm run test` |
| 后端 API | `npm run build --prefix server` |
| 权限、保存、发布主链路 | `npm run smoke:api` |
| 编辑器关键交互 | `npm run test:e2e:editor` |
| 上线前 | `npm run preflight` |

无法运行验证时，最终回复必须说明原因和剩余风险。

## 输出习惯

审查任务：先列问题，按严重程度排序，给文件和行号。

修复任务：说明改了什么、验证了什么、还有什么风险。

文档任务：说明精简了哪些入口、哪些内容被降权或归档。
