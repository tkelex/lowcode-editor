## ADDED Requirements

### Requirement: Agent data source binding tool generates page data source patches

系统 SHALL 为 `bind-data-source` 意图提供专用 agent 工具，将自然语言请求转换为候选 `AiComponentPatch`。工具 MUST update Page `props.dataSources` and target component `props.dataSourceId` without replacing unrelated component props.

#### Scenario: Bind selected table to API
- **WHEN** 用户选中 Table 并输入“把当前表格绑定到 /api/users”
- **THEN** 工具 MUST add or update one Page runtime data source item
- **AND** 工具 MUST update selected Table `props.dataSourceId` to that data source id
- **AND** patch MUST pass existing AI patch validation before it is shown to the user

#### Scenario: Bind selected list to API
- **WHEN** 用户选中 List 并输入“这个列表用 /api/orders 数据”
- **THEN** 工具 MUST bind the List to a generated data source id
- **AND** Page `props.dataSources` MUST remain valid JSON string

#### Scenario: Preserve existing data sources
- **WHEN** Page already has `props.dataSources.items`
- **THEN** 工具 MUST append or update only the generated data source item
- **AND** existing unrelated data source items MUST be preserved

#### Scenario: Reject unsupported component
- **WHEN** 用户选中的组件不能使用 `dataSourceId`
- **THEN** 工具 MUST return a failed tool result or validation error
- **AND** agent MUST NOT apply a candidate patch

### Requirement: Data source binding tool uses safe API defaults

工具 SHALL use safe default runtime data source settings inferred from the prompt and interface description.

#### Scenario: Infer API URL and method
- **WHEN** 用户输入包含 `/api/users`
- **THEN** 工具 MUST infer url `/api/users`
- **AND** method MUST default to `GET` unless the request explicitly says otherwise

#### Scenario: Missing API URL
- **WHEN** 用户要求绑定数据源但没有提供 URL or endpoint
- **THEN** 工具 MUST return a readable warning or failure
- **AND** 工具 MUST NOT invent an external URL
