## ADDED Requirements

### Requirement: Preview runtime mutations stay isolated from design schema
编辑器 Preview SHALL 使用独立运行态组件快照执行事件动作，组件属性和样式动作 MUST NOT 直接写回设计态 Zustand 组件树。

#### Scenario: Runtime props action in editor preview
- **WHEN** 用户在编辑器预览态触发 `setComponentProps` 或 `componentControl.setValue`
- **THEN** Preview MUST 更新本次运行态快照中的目标组件 props
- **AND** 退出预览后设计态组件树 MUST 保持触发前的 props

#### Scenario: Runtime styles action in editor preview
- **WHEN** 用户在编辑器预览态触发 `setComponentStyles`
- **THEN** Preview MUST 更新本次运行态快照中的目标组件 styles
- **AND** 退出预览后设计态组件树 MUST 保持触发前的 styles

#### Scenario: Published page runtime update
- **WHEN** 公开发布页触发组件属性或样式更新动作
- **THEN** 运行态 MUST 更新页面当前快照
- **AND** custom JS 动作 MUST 继续遵守 `allowCustomJS={false}` 的安全限制

### Requirement: Component control value sources resolve at runtime
组件联动设置值动作 SHALL 在运行时解析值来源，固定值 MUST 保持原值，事件数据路径和表达式 MUST 写入计算后的真实值。

#### Scenario: Set fixed value
- **WHEN** 用户配置组件联动设置值，值来源为固定值
- **THEN** 运行时 MUST 将该固定值写入目标组件指定 prop

#### Scenario: Set value from event data path
- **WHEN** 用户配置组件联动设置值，值为 `event.value`
- **THEN** 运行时 MUST 从当前事件数据读取 `value`
- **AND** 写入目标组件的 MUST 是事件真实值而不是字符串 `event.value`

#### Scenario: Set value from expression
- **WHEN** 用户配置组件联动设置值，值为 `{{event.value}}` 或其它安全表达式
- **THEN** 运行时 MUST 在当前事件、变量和上下文中计算表达式
- **AND** 写入目标组件的 MUST 是表达式结果

#### Scenario: Keep runtime stable when expression fails
- **WHEN** 组件联动值表达式解析失败
- **THEN** 运行时 MUST 避免阻塞页面渲染
- **AND** 后续动作 MUST 继续按现有规则执行
