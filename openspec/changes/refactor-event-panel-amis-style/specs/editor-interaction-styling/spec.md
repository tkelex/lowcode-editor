## ADDED Requirements

### Requirement: Event panel uses an add-event orchestration layout

设置面板事件页签 SHALL 使用“添加事件 -> 事件分组 -> 动作条”的编排布局，而不是默认铺开当前组件的所有可声明事件。

#### Scenario: Empty event panel
- **WHEN** 用户选中一个支持事件但尚未配置事件动作的组件
- **THEN** 事件页签展示 `添加事件` 主按钮和空状态提示，引导用户先添加事件

#### Scenario: Add event from registry
- **WHEN** 用户点击 `添加事件`
- **THEN** 面板展示当前组件 registry 声明的可绑定事件列表，并包含事件名称和触发说明

#### Scenario: Prevent duplicate event groups
- **WHEN** 某个事件已经添加到当前组件事件面板
- **THEN** 添加事件列表不允许用户重复添加同一个事件

#### Scenario: Show configured event groups
- **WHEN** 当前组件存在 `props.onEvent[eventName].actions`
- **THEN** 事件页签按事件分组条展示已配置事件，并展示事件名称、动作数量和事件说明入口

#### Scenario: Remove empty event group
- **WHEN** 用户删除一个事件分组
- **THEN** 对应 `props.onEvent[eventName]` 被移除或置为空配置，且不影响其它事件动作

### Requirement: Event groups manage action rows

每个事件分组 SHALL 管理该事件下的动作条列表，并保证动作顺序、编辑入口和删除入口清晰可见。

#### Scenario: Add action to event
- **WHEN** 用户点击某个事件分组上的添加动作按钮
- **THEN** 系统打开动作配置弹窗，并将当前事件作为动作配置上下文

#### Scenario: Filter actions by event
- **WHEN** 用户为某个事件选择动作
- **THEN** 动作配置弹窗只展示该事件 `allowedActions` 允许的动作类型

#### Scenario: Display action row
- **WHEN** 事件下存在动作
- **THEN** 面板展示动作名称、动作摘要、启用状态、设置入口、复制入口、删除入口和排序入口

#### Scenario: Reorder action rows
- **WHEN** 用户调整动作顺序
- **THEN** `props.onEvent[eventName].actions` 的数组顺序同步更新，并且预览态按新顺序执行

#### Scenario: Configure action row
- **WHEN** 用户点击动作条的设置入口
- **THEN** 系统打开该动作的专属配置表单，并保留已有配置值

### Requirement: Action modal provides categorized dedicated configuration

动作配置弹窗 SHALL 使用左右分栏结构，左侧负责搜索和选择动作类型，右侧负责展示所选动作的说明和专属配置表单。

#### Scenario: Browse action categories
- **WHEN** 用户打开动作配置弹窗
- **THEN** 左侧展示按页面、弹窗消息、服务、组件联动、数据、逻辑和高级等场景分组的动作列表

#### Scenario: Search action types
- **WHEN** 用户在动作配置弹窗中搜索动作
- **THEN** 左侧动作列表按动作名称、说明或关键词过滤

#### Scenario: Select common action
- **WHEN** 用户点击弹窗顶部的常用动作标签
- **THEN** 弹窗选中对应动作，并在右侧展示该动作的专属配置

#### Scenario: Show action-specific form
- **WHEN** 用户选择 `toast`、`url`、`http`、`condition`、`confirm`、`setVariable` 或 `custom` 等动作
- **THEN** 右侧展示该动作已有的专属配置字段，而不是通用 JSON 表单

#### Scenario: Confirm valid action
- **WHEN** 用户填写当前动作必填配置并确认
- **THEN** 系统将动作写入当前事件的 actions 列表

### Requirement: Component linkage has dedicated configuration

组件联动类动作 SHALL 以目标组件和操作意图为中心配置，避免用户只能填写不透明 JSON。

#### Scenario: Select target component
- **WHEN** 用户配置组件联动动作
- **THEN** 表单要求选择目标组件，并展示目标组件名称、类型和可用方法或操作

#### Scenario: Configure visibility and disabled state
- **WHEN** 用户选择显示、隐藏、启用或禁用操作
- **THEN** 表单只展示目标组件和操作类型等必要字段

#### Scenario: Configure value operation
- **WHEN** 用户选择设置值或清空值操作
- **THEN** 表单支持固定值、事件数据引用和表达式作为值来源

#### Scenario: Configure modal or form operation
- **WHEN** 用户选择打开/关闭弹窗或提交/重置表单操作
- **THEN** 表单只允许选择支持该操作的目标组件

#### Scenario: Configure props or styles operation
- **WHEN** 用户选择设置属性或设置样式操作
- **THEN** 表单提供 JSON 编辑能力，并保留当前 `setComponentProps` 或 `setComponentStyles` 动作结构

### Requirement: Event refactor preserves existing runtime contract

事件面板重构 SHALL 保持现有 schema、预览执行器和公开发布安全边界不变。

#### Scenario: Load existing event configuration
- **WHEN** 页面 schema 中已经存在 `props.onEvent[eventName].actions`
- **THEN** 新事件面板能正确渲染对应事件分组和动作条

#### Scenario: Save event configuration
- **WHEN** 用户添加事件和动作并保存页面
- **THEN** 组件树仍使用 `props.onEvent[eventName].actions` 表达事件动作

#### Scenario: Preserve custom JS safety
- **WHEN** 页面以公开发布模式渲染
- **THEN** `custom` 动作仍受 `allowCustomJS=false` 约束，不会在发布页执行

#### Scenario: Validate editor regression
- **WHEN** 实现完成
- **THEN** 编辑器回归测试覆盖添加事件、添加动作、动作专属配置、组件联动配置和右侧面板横向溢出
