## Context

项目已有低代码编辑器、AI 页面搭建接口、AI agent run 接口、候选 patch/组件树确认流程和确定性 CRUD 生成器。当前能力的主要缺口不在“能否调用 AI”，而在用户是否能用自然语言表达开发目标，并清楚看到 agent 如何理解、路由和执行。

现有 `AiBuilderPanel` 同时承载普通页面草稿生成和 agent 修改，交互偏工程表单；后端 `AiAgentOrchestrationService` 已有 CRUD 分支，但路由结果只作为内部布尔判断存在，前端无法展示“为什么走 CRUD/为什么走 patch/影响范围是什么”。

## Goals / Non-Goals

**Goals:**

- 建立统一 agent route decision，覆盖 CRUD 页面、普通页面、局部编辑、样式优化、数据源绑定、事件绑定和页面诊断修复。
- 让 route decision 进入 agent run 结果、执行轨迹和前端候选展示。
- 将 `AI 搭建` 面板调整为自然语言 Agent 主入口，同时保留现有生成草稿和确认应用能力。
- 保持所有候选结果先校验、预览、确认，再写入编辑器 store。
- 为主要意图补最小单测，并为自然语言 CRUD 生成保留回归入口。

**Non-Goals:**

- 不在本变更中实现完整多页面 CRUD 向导或菜单/权限挂载。
- 不让 agent 自动保存、发布、删除页面或修改后端业务数据。
- 不引入新的模型供应商配置或前端模型 API key。
- 不默认生成或放宽 custom JS 策略。
- 不重写低代码 schema 格式、物料 registry 或运行态渲染架构。

## Decisions

### 1. Route decision 采用确定性分类优先

后端新增或抽出 `decideAiAgentRoute(input)`，先基于显式 `dataSourceModel`、接口 URL、CRUD 关键词、选中组件、样式/事件/数据绑定关键词等确定性信号分类。低置信度请求保守落到 `free-page` 或 `edit-selected`，并在 `fallback` 中说明原因。

理由：当前平台最重要的是稳定生成可编辑 schema；确定性分类更容易测试、审计和解释。模型可在后续版本参与补充字段、文案和结构，但不应成为 route 决策的唯一来源。

替代方案：直接让模型判断意图。该方案更灵活，但测试不稳定，也不利于展示可审计的命中原因。

### 2. Route decision 放在 agent run 顶层

`AiAgentRunResult` 增加 `routeDecision`，候选 `metadata` 可以保留更细的工具元信息。前端不需要从 candidate 类型倒推意图，而是直接读取 run 顶层 route decision 展示“识别意图”和“影响范围”。

理由：失败 run、无候选 run 或校验失败 run 也需要展示 agent 识别过程；顶层字段比候选 metadata 更完整。

替代方案：只放入 candidate metadata。该方案无法覆盖失败或等待确认前的执行轨迹。

### 3. CRUD 作为 route decision 的一个 intent，而不是特殊入口

现有 CRUD 分支保留，但从 `isCrudGenerationIntent` 布尔判断升级为 `intent === 'crud-page'`。命中后继续调用 `generateCrudPage` 确定性工具。

理由：CRUD 是自然语言开发助手的一种能力，不应该形成另一个用户入口或并行架构。

替代方案：保留单独 `target=crud` 主导流程。该方案短期可用，但会让后续事件绑定、数据绑定、样式优化继续碎片化。

### 4. 前端只做展示与确认，不做路由真相源

前端可以提供目标范围、高级参数和示例 prompt，但 route decision 由后端返回并作为执行事实展示。前端展示 route 卡片、工具标记、影响范围、warnings、assumptions 和预览。

理由：后端拥有权限、数据源模型和工具白名单上下文；让后端作为真相源更安全，也能统一 API 行为。

替代方案：前端先分类再调用不同接口。该方案会重复逻辑，并容易绕过权限/校验边界。

## Risks / Trade-offs

- route 规则过于简单导致误判 → 为每类 intent 写正反例测试，并在 route decision 中返回 `confidence` 和 `reasons` 方便调试。
- 面板改造过大影响现有 AI 生成入口 → 保留普通草稿生成作为次级能力，优先改文案和布局，不删除现有 API。
- 新增 route 类型但工具尚未完全实现 → 先返回保守 patch/free-page 流程，并用 `fallback` 标注“已降级为通用修改”。
- 前端展示信息过多影响可读性 → route 卡片只展示意图、置信度、影响范围和工具；详细步骤仍放在执行轨迹。
- 与已有未完成 OpenSpec change 产生冲突 → 本变更聚焦 AI/agent 面板和后端路由，不修改其它样式面板、事件面板重构主线。

## Migration Plan

1. 新增 route decision 类型和确定性路由函数，保持旧 `isCrudGenerationIntent` 兼容导出或迁移测试。
2. 后端 agent orchestration 使用 route decision 替代布尔 CRUD 判断，并把 route decision 写入 run 结果和事件。
3. 前端 AI 面板展示 route decision，调整主按钮和说明文案。
4. 补充路由单测和现有 CRUD 回归测试。
5. 更新接口、架构和上下文文档。

回滚策略：若新路由影响现有 agent 行为，可临时将非 CRUD intent 全部降级到现有 patch/free-page 流程，并保留 CRUD 分支原行为。

## Open Questions

- `bind-data-source` 和 `add-event-action` 是否在本变更中只做 intent 识别，还是同步落第一个可用工具实现？
- 低置信度请求是否需要真正的澄清问题 UI，还是先以 warning/fallback 展示？
- route decision 是否需要持久化进审计日志详情，还是仅在 run 结果和 audit summary 中保留摘要？
