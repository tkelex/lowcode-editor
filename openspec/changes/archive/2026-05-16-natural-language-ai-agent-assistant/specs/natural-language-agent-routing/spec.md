## ADDED Requirements

### Requirement: Natural language requests are classified into agent intents

系统 SHALL 将用户自然语言请求分类为结构化 agent 意图，并返回可解释的 route decision。route decision MUST 至少包含 `intent`、`confidence`、`reasons`、`targetScope`、`preferredTool` 和可选 `fallback`。

#### Scenario: Classify CRUD page request
- **WHEN** 用户输入“基于 /api/users 生成用户管理页，包含列表、新增、编辑、详情”
- **THEN** 系统 MUST 将请求分类为 `crud-page`
- **AND** route decision MUST 标明首选工具为确定性 CRUD 生成器
- **AND** reasons MUST 包含接口、管理页、列表或增删改查等命中原因

#### Scenario: Classify selected component edit
- **WHEN** 用户选中组件并输入“把这个按钮改成主按钮，并点击后跳转到 /orders”
- **THEN** 系统 MUST 将请求分类为 `edit-selected` 或 `add-event-action`
- **AND** route decision MUST 标明目标范围为当前选中组件或其子树

#### Scenario: Classify style polish request
- **WHEN** 用户输入“优化当前页面视觉效果，让它更像后台数据看板”
- **THEN** 系统 MUST 将请求分类为 `style-polish`
- **AND** route decision MUST 标明候选结果应优先使用 schema patch

#### Scenario: Avoid CRUD false positive
- **WHEN** 用户输入“生成一个品牌营销首页首屏”
- **THEN** 系统 MUST NOT 将请求分类为 `crud-page`
- **AND** route decision MUST 分类为 `free-page` 或其它非 CRUD 意图

### Requirement: Low confidence routing remains conservative

当自然语言请求缺少明确意图或影响范围时，系统 SHALL 采用保守路由。低置信度 route decision MUST 提供 fallback 说明，并且 MUST NOT 默认整页覆盖。

#### Scenario: Ambiguous management request
- **WHEN** 用户输入“做个管理页面看看”且没有接口、字段、选中组件或响应示例
- **THEN** route decision MUST 包含低置信度或 fallback 说明
- **AND** 系统 MUST NOT 直接应用整页替换
- **AND** 候选结果 MUST 在用户确认前保持可放弃

#### Scenario: Tool not implemented for intent
- **WHEN** route decision 命中 `bind-data-source` 或 `add-event-action` 但对应专用工具尚不可用
- **THEN** 系统 MUST 降级到通用 patch 或返回可读 warning
- **AND** fallback MUST 说明降级原因

### Requirement: Agent routing is testable and auditable

系统 SHALL 为主要 agent 意图提供可复现测试样例，并在 agent run 中记录 route decision 摘要，便于调试和审计。

#### Scenario: Route decision appears in run result
- **WHEN** agent run 创建成功
- **THEN** 响应 MUST 包含本次请求的 route decision
- **AND** 执行事件或审计摘要 MUST 能体现识别到的 intent

#### Scenario: Routing tests cover positive and negative examples
- **WHEN** 执行 agent routing 单元测试
- **THEN** 测试 MUST 覆盖 `crud-page`、`free-page`、`edit-selected`、`style-polish` 的正例
- **AND** 测试 MUST 覆盖营销页不误判为 CRUD 的反例
