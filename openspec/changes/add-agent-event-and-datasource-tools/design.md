## Context

自然语言 Agent 已经返回 `routeDecision` 并在前端展示理解结果。当前 `add-event-action`、`bind-data-source` 等意图仍进入通用 `generateSchemaDraft -> proposeSchemaPatch` 流程，容易生成过大 patch，也不够稳定。低代码编辑器已有事件动作 schema、HTTP action 运行态、Page `dataSources` 和 Table/List/Select 的 `dataSourceId` 约定，本变更只需要把这些现有契约封装成 agent 专用 patch 工具。

## Goals / Non-Goals

**Goals:**

- 为 `add-event-action` 意图生成最小 `updateProps` patch，写入目标组件的 `props.onEvent[eventName].actions`。
- 为 `bind-data-source` 意图生成最小 patch：更新 Page `dataSources`，并更新目标组件 `dataSourceId`。
- 工具输出继续经过 `applyAiComponentPatch`、物料白名单和安全规则校验。
- 支持最常见动作：URL 跳转、toast 提示、HTTP 请求；支持常见数据组件：Table、List、Select。
- 为工具 helper 和 agent orchestration 流程补单测。

**Non-Goals:**

- 不实现完整可视化事件编排器。
- 不实现复杂接口鉴权、分页参数映射、响应字段映射 UI。
- 不自动保存页面、发布页面或持久化数据源模型。
- 不生成 custom JS。
- 不替换现有设置面板里的手动事件/数据源配置能力。

## Decisions

### 1. 工具生成 patch，不直接生成组件树

事件动作和数据源绑定都是局部修改，工具应返回 `AiComponentPatch`，主要使用 `updateProps` 修改目标组件或 Page 根节点。

理由：patch 能保持变更范围最小，天然适配现有 stale baseline 和 scope 校验。

### 2. 目标组件优先使用选中组件

当用户选中组件发起请求时，工具以 `context.selectedComponentId` 作为目标。若未选中，工具可以根据组件类型寻找第一个合适目标；找不到则返回失败或 warning。

理由：自然语言里的“这个按钮/当前表格”通常依赖编辑器选中状态。

### 3. 事件动作使用确定性启发式

事件名默认：Button/Link 使用 `click`，Form 使用 `finish`。动作类型按 prompt 推断：包含 URL/跳转生成 `url` action；包含 POST/PUT/DELETE/接口生成 `http` action；包含提示/toast 生成 `toast` action；包含确认生成 `confirm` 包裹后续 action。

理由：覆盖高频场景即可明显提升自然语言开发体验，复杂动作仍可由后续事件面板或更强 agent 工具扩展。

### 4. 数据源绑定生成 Page 运行态数据源

工具从 prompt 或接口说明中提取 URL，生成稳定 dataSource id，如 `agentDataSource1` 或基于组件名/接口段推导。Page `props.dataSources` 保持 JSON 字符串格式，并追加或更新 `items`；目标组件写入 `dataSourceId`。

理由：当前运行态和设置面板已经使用 Page `dataSources` 字符串契约，复用它能避免新增运行时格式。

## Risks / Trade-offs

- URL/方法推断不准 → 限制为明确 URL/HTTP 方法/关键词；无法推断时返回 warning，不生成危险 action。
- 覆盖现有 onEvent 或 dataSources → 合并已有配置，不清空用户原有事件和数据源。
- 目标组件不支持能力 → 工具返回失败或 warning，agent run 不写入非法 patch。
- Select 等组件的数据格式可能需要 options 映射 → 本阶段只绑定数据源 ID，字段映射后续再扩展。

## Migration Plan

1. 新增共享 helper：构造事件动作 patch、构造数据源绑定 patch。
2. 工具 registry 注册 `generateEventActionPatch` 和 `bindDataSource`。
3. orchestration 根据 route intent 调用专用工具并复用现有 `validateCandidate`。
4. 补测试并更新文档。

回滚策略：若专用工具出现问题，可让 orchestration 对这两个 intent 临时回退到现有通用 patch 流程。
