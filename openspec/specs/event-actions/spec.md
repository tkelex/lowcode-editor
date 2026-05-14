# event-actions Specification

## Purpose

约束低代码编辑器中事件动作的配置、归一化、预览执行、发布页安全限制和回归验证，确保组件事件在编辑态、预览态和公开发布页中保持可配置、可迁移、可审计且不突破 custom JS 与 HTTP 安全边界。

## Requirements

### Requirement: Event actions are configured with explicit supported behavior
编辑器 SHALL 为组件事件提供可发现、可编辑、可校验的动作配置能力，并且动作配置 MUST 存储在 `props.onEvent[eventName].actions` 中。

#### Scenario: Add a configured action
- **WHEN** 用户在设置面板为组件事件添加一个动作并填写必填配置
- **THEN** 编辑器 MUST 将动作追加到该事件的 `props.onEvent[eventName].actions`
- **AND** 动作 MUST 保留其 `actionType`、`args` 和通用控制字段

#### Scenario: Reject invalid action form
- **WHEN** 用户在动作弹窗中缺少必填项或输入非法 JSON
- **THEN** 编辑器 MUST 阻止确认保存该动作
- **AND** 编辑器 MUST 在当前表单中展示可定位的错误反馈

#### Scenario: Edit existing action without losing fields
- **WHEN** 用户打开已有动作并修改其中一项配置
- **THEN** 编辑器 MUST 回填已有动作配置
- **AND** 保存后 MUST 保留该动作未被用户修改的兼容字段和通用控制字段

#### Scenario: Configure nested action
- **WHEN** 用户在确认动作或条件动作的分支中添加、编辑、复制、禁用、删除或排序嵌套动作
- **THEN** 编辑器 MUST 更新对应分支的 actions 数组
- **AND** 嵌套动作 MUST 使用与顶层动作一致的配置、校验和摘要规则

### Requirement: URL action supports explicit open target
跳转链接动作 SHALL 支持用户选择当前窗口或新窗口打开，并且运行时 MUST 按配置执行导航。

#### Scenario: Navigate in current window
- **WHEN** 用户配置跳转链接动作的打开方式为当前窗口并触发该事件
- **THEN** 运行时 MUST 归一化链接地址
- **AND** 运行时 MUST 在当前窗口导航到该地址

#### Scenario: Navigate in new window
- **WHEN** 用户配置跳转链接动作的打开方式为新窗口并触发该事件
- **THEN** 动作 schema MUST 保存 `args.blank` 为 `true`
- **AND** 运行时 MUST 使用新窗口打开归一化后的地址

#### Scenario: Edit URL action open target
- **WHEN** 用户编辑已有跳转链接动作
- **THEN** 动作表单 MUST 回填跳转地址和打开方式
- **AND** 动作列表摘要 MUST 展示跳转地址及当前窗口或新窗口信息

#### Scenario: Normalize legacy URL action
- **WHEN** 旧页面 schema 包含 `goToLink` 或旧版跳转字段
- **THEN** 迁移与 normalize MUST 将其转换为 `actionType: "url"`
- **AND** 可识别的新窗口配置 MUST 收敛为 `args.blank: true`

### Requirement: Action runtime executes actions consistently
运行时 SHALL 按动作数组顺序执行事件动作，并且 MUST 保持顶层动作与嵌套动作的执行语义一致。

#### Scenario: Execute actions in order
- **WHEN** 一个事件包含多个未禁用动作
- **THEN** 运行时 MUST 按数组顺序逐个执行动作

#### Scenario: Skip disabled action
- **WHEN** 一个动作被标记为 `disabled`
- **THEN** 运行时 MUST 跳过该动作
- **AND** 后续动作 MUST 继续按顺序执行

#### Scenario: Stop action sequence
- **WHEN** 一个动作配置了阻止继续执行的通用控制
- **THEN** 运行时 MUST 执行对应浏览器事件控制
- **AND** 后续动作 MUST 按现有停止规则中断或继续

#### Scenario: Execute confirm branch
- **WHEN** 用户触发确认动作并点击确认或取消
- **THEN** 运行时 MUST 只执行对应分支中的嵌套动作
- **AND** 嵌套动作 MUST 使用同一个事件数据、变量和组件引用上下文

#### Scenario: Execute condition branch
- **WHEN** 用户触发条件动作
- **THEN** 运行时 MUST 根据表达式结果执行 trueActions 或 falseActions
- **AND** 表达式执行失败时 MUST 记录错误并避免阻塞页面渲染

### Requirement: HTTP and data mutation actions expose reliable feedback
HTTP 请求、变量写入、组件属性写入和组件样式写入动作 SHALL 提供可预测的数据写入和失败反馈。

#### Scenario: Execute HTTP request successfully
- **WHEN** HTTP 动作请求成功
- **THEN** 运行时 MUST 将响应对象写入 `event.httpResponse`
- **AND** 如果配置了响应写入字段，运行时 MUST 写入该路径
- **AND** 如果配置了成功提示，运行时 MUST 展示成功消息

#### Scenario: Handle HTTP request failure
- **WHEN** HTTP 动作请求失败或目标域名不被允许
- **THEN** 运行时 MUST 将错误写入 `event.httpError`
- **AND** 如果配置了错误写入字段，运行时 MUST 写入该路径
- **AND** 运行时 MUST 展示配置的失败提示或默认失败提示

#### Scenario: Update component data
- **WHEN** 用户触发设置组件属性或设置组件样式动作
- **THEN** 运行时 MUST 只更新目标组件的对应 props 或 styles
- **AND** 未指定的现有字段 MUST 保持不变

#### Scenario: Set runtime variable
- **WHEN** 用户触发设置变量动作
- **THEN** 运行时 MUST 将固定值或表达式结果写入页面运行时变量路径
- **AND** 后续动作和运行时数据绑定 MUST 能读取更新后的变量值

### Requirement: Published pages keep custom script execution disabled
公开发布页 SHALL 禁止执行用户配置的自定义 JS 动作，同时保持其它安全动作可执行。

#### Scenario: Preview allows custom script in editor
- **WHEN** 编辑器预览以允许自定义 JS 的模式运行并触发 custom 动作
- **THEN** 运行时 MAY 执行该 custom 动作
- **AND** custom 动作 MUST 只能访问运行时提供的 context、event、args 和 doAction 能力

#### Scenario: Published page skips custom script
- **WHEN** 公开发布页触发包含 custom 动作的事件
- **THEN** 运行时 MUST 不执行该 custom 动作
- **AND** 同一事件中的其它非禁用安全动作 MUST 按顺序继续执行

### Requirement: Event action regressions are covered by tests
项目 SHALL 为事件动作配置、迁移和运行时行为提供回归覆盖。

#### Scenario: Run schema and runtime tests
- **WHEN** 实现完成后执行 `npm run test`
- **THEN** 测试 MUST 覆盖 URL 打开方式、旧 action schema 迁移、HTTP 成功/失败、组件联动、变量写入、条件/确认嵌套和 custom 动作安全边界

#### Scenario: Run editor event workflow test
- **WHEN** 实现完成后执行 `npm run test:e2e:editor`
- **THEN** 测试 MUST 覆盖在设置面板配置跳转打开方式、编辑动作、查看动作摘要和预览触发动作的关键路径

#### Scenario: Run local quality checks
- **WHEN** 实现完成
- **THEN** `npm run lint` 和 `npm run build` MUST 通过，或在交付说明中明确记录未运行原因和剩余风险

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
