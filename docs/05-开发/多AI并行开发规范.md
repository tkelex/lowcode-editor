# 多 AI 并行开发规范

本文用于多个 AI 对话框同时开发本项目时降低冲突和 bug。每个对话框开始前都应该先读本文、`AGENTS.md`、`docs/00-总览/AI快速上手.md` 和本次任务对应模块文档。

## 1. 基本原则

- 一个对话框只负责一个清晰任务包。
- 一个任务包只拥有一组明确文件。
- 不跨模块顺手重构。
- 不修改无关格式、文案、样式和依赖。
- 不覆盖其它对话框或用户已有改动。
- 先补测试，再改高风险核心逻辑。
- 任何权限、schema、数据库、发布链路改动都必须同步文档。

## 2. 分支策略

建议每个 AI 对话框单独开分支：

```text
codex/<module>-<short-task>
```

示例：

```text
codex/models-field-designer
codex/dynamic-records-api
codex/menu-permissions
codex/model-table-material
```

分支规则：

- 不在同一个分支并行做两个互不相关的大功能。
- 不把多个 AI 的半成品混在同一提交。
- 每个任务完成后用小提交记录。
- 提交信息格式使用 `<type>: <summary>`。

常用类型：

```text
docs
server
frontend
schema
test
fix
chore
```

## 3. 任务认领模板

每个新对话框开始时，先在聊天中明确：

```text
任务名：
目标：
拥有文件：
禁止修改：
依赖任务：
验收命令：
手动验收：
预计输出：
```

示例：

```text
任务名：数据模型字段校验
目标：新增模型字段 schema 类型和校验函数
拥有文件：packages/lowcode-schema/src/model-*.ts、scripts/test/model-schema.test.mjs
禁止修改：src/editor/runtime、server/prisma/schema.prisma
依赖任务：无
验收命令：npm run test
手动验收：无
预计输出：共享类型、校验函数、测试
```

## 4. 文件所有权

默认按模块分配文件。没有认领的文件不要改。

| 模块 | 可拥有文件 |
| --- | --- |
| 文档规划 | `docs/01-产品/*`、`docs/05-开发/*协作*` |
| 共享 schema | `packages/lowcode-schema/src/*`、`scripts/test/*schema*.mjs` |
| 编辑器核心 | `src/editor/stores/*`、`src/editor/components/EditArea/*`、`src/editor/runtime/*` |
| 编辑器物料 | `src/editor/materials/<Name>/*`、`src/editor/registry/configs/*` |
| 项目/页面 API | `server/src/modules/pages/*`、`server/src/modules/projects/*`、`src/shared/api/pages.ts` |
| 数据模型 | `server/src/modules/models/*`、`src/features/models/*`、`src/shared/api/models.ts` |
| 动态记录 | `server/src/modules/dynamic-records/*`、`src/shared/api/dynamic-records.ts` |
| 菜单权限 | `server/src/modules/access/*`、`src/features/access/*` |
| 管理后台 | `src/features/admin/*`、相关 admin API |
| 部署运维 | `infra/*`、`scripts/ops/*`、部署文档 |

高风险共享文件需要额外小心：

- `server/prisma/schema.prisma`
- `packages/lowcode-schema/src/migrate.ts`
- `packages/lowcode-schema/src/types.ts`
- `src/editor/stores/components.tsx`
- `src/editor/runtime/Preview/index.tsx`
- `src/editor/registry/component-config.tsx`
- `server/src/modules/projects/project-access.service.ts`
- `server/src/modules/pages/*`

修改这些文件前必须说明原因、影响面和测试计划。

## 5. 数据库协作规则

- 同一时间尽量只有一个任务改 Prisma schema。
- 每个数据库任务只生成一个 migration。
- migration 名称必须语义化。
- 不允许删除已有字段或表，除非有迁移方案和回滚说明。
- 新表必须考虑项目隔离、创建人、更新时间、审计需求。
- 新业务写操作必须记录 AuditLog，或在文档中说明为什么不需要。

推荐流程：

```text
设计数据结构 -> 更新 Prisma schema -> 生成 migration -> 更新 DTO/API -> 写测试 -> 更新接口文档
```

## 6. API 协作规则

- 新 API 主实现放 `src/shared/api/*`，不要写到旧 `src/api/*`。
- 后端模块必须包含 controller、service、dto。
- DTO 必须使用 class-validator。
- 项目资源必须校验项目权限。
- 管理员资源必须校验 admin guard。
- 错误走统一 BusinessException。
- API 变更同步 `docs/03-接口/接口说明.md`。

## 7. 前端协作规则

- 新业务模块放 `src/features/<module>`。
- API 调用集中在 `src/shared/api`。
- 组件内部不要直接拼 axios。
- 展示组件和请求编排分离。
- 表格列配置优先拆到 `tableColumns.tsx`。
- 类型和展示字典优先放 `model/*`。
- 大型页面先拆子组件，避免继续堆巨型文件。

## 8. 编辑器协作规则

编辑器是最高风险区域。改动前必须明确：

- 是否影响组件树 schema？
- 是否影响旧页面恢复？
- 是否影响撤销/重做？
- 是否影响拖拽？
- 是否影响公开发布页？
- 是否影响 customJS 安全边界？

物料新增规则：

- dev/prod 成对新增。
- dev 根节点提供 `data-component-id`。
- 可容器物料接入 `useMaterialDrop`。
- registry 配置 defaultProps、setter、events、methods。
- 同步共享 registry 或校验规则。
- 至少手动验证编辑态和预览态。

事件动作新增规则：

- 共享 action 类型先定义。
- 设置面板能编辑。
- runtime 能执行。
- 公开页安全策略明确。
- 添加 action runtime 测试。

## 9. 测试矩阵

每个任务必须按范围选择测试。

| 任务类型 | 必跑 |
| --- | --- |
| 共享 schema | `npm run test` |
| 前端编辑器 | `npm run lint`、`npm run build`、相关 e2e |
| 后端 API | `npm run build --prefix server`、API smoke 或 node test |
| 数据库迁移 | `npm run prisma:generate --prefix server`、本地迁移 |
| 发布链路 | `npm run smoke:api` |
| 大型跨模块 | `npm run check` |

不能运行测试时，最终回复必须说明原因和剩余风险。

## 10. Bug 预防清单

提交前逐项检查：

- 空状态、加载态、错误态是否处理。
- 权限不足是否后端拒绝。
- 表单是否有校验。
- API 错误是否给用户反馈。
- 旧数据是否能迁移。
- 删除操作是否有确认。
- 列表是否有分页。
- 时间、枚举、空值是否格式化。
- 公开页是否不依赖登录态。
- 环境变量是否有示例和校验。

## 11. 冲突处理

发现文件已有未提交改动时：

1. 判断是否属于本任务。
2. 如果无关，不要改。
3. 如果相关，先读懂改动再继续。
4. 如果无法判断，暂停并说明冲突点。

禁止：

- `git reset --hard`
- `git checkout -- <file>`
- 删除别人新增文件。
- 格式化整个仓库。
- 顺手升级依赖。

## 12. 交付格式

每个 AI 对话框完成后，最终说明必须包含：

```text
完成内容：
改动文件：
验证命令：
未验证风险：
后续建议：
```

如果创建了 migration，还要包含：

```text
Migration：
是否需要备份：
是否影响已有数据：
回滚建议：
```

## 13. 推荐并行队列

第一批可并行：

- A：编辑器 bug 审计，只读。
- B：数据模型共享类型和校验。
- C：菜单权限数据结构设计。
- D：当前 e2e 用例稳定性修复。

第二批在第一批合并后：

- E：模型管理后端 API。
- F：模型管理前端页面。
- G：动态记录 CRUD 后端。
- H：菜单管理前端。

第三批：

- I：ModelTable 物料。
- J：ModelForm 物料。
- K：CRUD 页面生成器。
- L：按钮权限和字段权限。

