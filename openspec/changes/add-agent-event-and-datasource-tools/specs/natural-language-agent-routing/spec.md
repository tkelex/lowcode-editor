## ADDED Requirements

### Requirement: Event and data source intents route to implemented tools

当 `add-event-action` 和 `bind-data-source` 专用工具可用时，route decision SHALL select those tools as executable paths rather than marking them as generic fallback work.

#### Scenario: Event intent chooses event tool
- **WHEN** 用户选中 Button 并输入“点击后跳转到 /orders”
- **THEN** route decision MUST use intent `add-event-action`
- **AND** preferred tool MUST be `event-action-patch`
- **AND** orchestration MUST have an available allowlisted tool for that preferred tool

#### Scenario: Data source intent chooses data source tool
- **WHEN** 用户选中 Table 并输入“绑定 /api/users 数据源”
- **THEN** route decision MUST use intent `bind-data-source`
- **AND** preferred tool MUST be `data-source-patch`
- **AND** orchestration MUST have an available allowlisted tool for that preferred tool
