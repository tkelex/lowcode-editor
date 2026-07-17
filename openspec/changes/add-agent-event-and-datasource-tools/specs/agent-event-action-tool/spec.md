## ADDED Requirements

### Requirement: Agent event action tool generates safe event patches

系统 SHALL 为 `add-event-action` 意图提供专用 agent 工具，将自然语言请求转换为候选 `AiComponentPatch`。工具 MUST 只写入低代码事件配置 `props.onEvent[eventName].actions`，并且 MUST NOT 生成默认 `custom` action。

#### Scenario: Add URL action to selected button
- **WHEN** 用户选中 Button 并输入“点击后跳转到 /orders”
- **THEN** 工具 MUST 生成 `updateProps` patch
- **AND** patch MUST 写入 `props.onEvent.click.actions`
- **AND** actions MUST include `url` action with `/orders`

#### Scenario: Add HTTP submit action to selected form
- **WHEN** 用户选中 Form 并输入“提交时 POST /api/orders”
- **THEN** 工具 MUST 生成 `props.onEvent.finish.actions`
- **AND** actions MUST include `http` action with method `POST` and url `/api/orders`

#### Scenario: Add confirm wrapper
- **WHEN** 用户输入“点击按钮先确认再删除 /api/orders/{{ record.id }}”
- **THEN** 工具 MUST generate a `confirm` action when it can infer a nested destructive HTTP action
- **AND** nested actions MUST still be validated by existing event action validation

#### Scenario: Reject unsupported target
- **WHEN** 用户请求给不支持事件的目标或不存在的组件添加事件
- **THEN** 工具 MUST return a failed tool result or validation error
- **AND** agent MUST NOT apply any patch to the editor state

### Requirement: Event action patches preserve existing events

工具 SHALL merge new event actions with existing component props without deleting unrelated props, styles or other event names.

#### Scenario: Preserve existing onEvent entries
- **WHEN** 目标组件已有 `props.onEvent.hover.actions`
- **THEN** 工具新增 click or finish actions MUST preserve the existing hover event
- **AND** patch MUST only replace the minimum needed `props` keys
