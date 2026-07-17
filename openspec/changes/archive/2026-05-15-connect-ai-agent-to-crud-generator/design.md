## Context

现有 AI agent run 由后端 `AiAgentOrchestrationService` 编排，前端只负责提交 prompt、展示 run 事件和在用户确认后应用候选 patch 或组件树。现有 CRUD 生成器 `generateCrudPageSchema` 位于 shared schema 包，输入 `ProjectDataSourceModelConfig` 与 `CrudGenerationOptions`，输出普通 Page schema。

本变更只连接这两块能力，不改变页面保存、版本、发布、权限和审计流程。agent 工具仍然只返回候选 schema 或 patch，不直接创建页面或持久化数据。

## Decisions

### 1. 用确定性工具处理 CRUD 意图

agent 编排先对用户 prompt、目标类型、接口描述和上下文数据源模型做轻量意图识别。命中 CRUD/数据源类请求时，跳过自由 schema 生成链路，改为调用 `generateCrudPageSchema` 包装工具。

原因是 CRUD 页结构强约束、可由模型配置确定，确定性生成器比模型自由拼复杂 schema 更稳定。

### 2. CRUD 工具返回整页 components candidate

CRUD 生成器本身产出 Page schema，更适合返回 `kind: "components"` 的整页候选。前端已有整树应用逻辑，因此无需把完整 CRUD 页面再转成 patch。

当用户在选中组件范围发起 CRUD 请求时，agent 会把影响范围提升为 `page` 并添加 warning，避免把完整后台页误插入局部容器。

### 3. 数据源模型优先使用已有配置

agent 上下文允许携带项目数据源模型列表。CRUD 工具先按模型 key/name、接口 URL 和 prompt 关键词匹配已有模型；匹配失败时从自然语言、接口描述和响应示例生成临时 model draft。

临时 draft 必须通过 `validateDataSourceModelConfig`，不合法时工具失败并返回可读错误；可恢复场景可降级到普通 AI 草稿，但必须展示 warning。

### 4. 临时 model draft 采用保守推导

第一版只做确定性启发式：

- 从 `/api/users`、`user/users` 等 URL 推导模型 key/name。
- 从响应示例对象字段推导字段映射和类型。
- 默认主键为 `id`，如果不存在则使用第一个字段并添加 warning。
- 根据 URL 推导 list/create/detail/update/delete 接口，缺失接口保留 warning。

这避免引入新的模型调用协议，也让未配置 provider 的本地环境仍可测试。

### 5. 前端只增强展示，不改变确认闸门

AI 面板继续展示事件、summary、assumptions、warnings 和预览。若候选携带 CRUD 元信息，额外展示模型、页面类型、路由和来源。用户仍需点击确认后才写入编辑器 store。

## Risks / Trade-offs

- 模型匹配可能误选已有数据源模型：显示来源、模型名和 warning，让用户在确认前可发现。
- 临时 draft 字段推导有限：响应示例缺失时只生成最小字段并提示用户补充模型配置。
- CRUD 请求页面类型可能模糊：默认生成列表页，包含新增、编辑、详情意图时在 warning 中提示可继续生成对应页面。
- 整页候选会覆盖当前页面：明确影响范围为整页，并复用原有确认入口。

## Migration Plan

1. 新增 shared 类型字段，兼容旧 run/candidate 响应。
2. 后端添加 CRUD 工具、意图识别、模型匹配与临时 draft 生成。
3. 前端按可选元信息增强展示，旧候选不受影响。
4. 补充单测与 e2e，确认现有 AI 页面生成和 agent patch 流程仍可用。
