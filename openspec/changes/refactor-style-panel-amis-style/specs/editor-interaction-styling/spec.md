## ADDED Requirements

### Requirement: Appearance panel follows inspector workflow

设置面板的外观页签 SHALL 以样式检查器工作流展示当前组件的样式配置，包含外观搜索、快捷样式分组、CSS 源码分组和恢复默认入口。

#### Scenario: Show appearance inspector groups
- **WHEN** 用户选中一个支持外观配置的组件并切换到“外观”页签
- **THEN** 面板显示外观搜索框、默认展开的“快捷样式”分组和“CSS 源码”分组

#### Scenario: Count quick style controls
- **WHEN** 当前组件的 registry 声明了 `stylesSetter`
- **THEN** “快捷样式”分组标题显示可配置样式数量，并且数量与当前搜索过滤后的可见字段一致

#### Scenario: Display empty quick style state
- **WHEN** 当前组件没有快捷样式 setter 或搜索后没有匹配字段
- **THEN** 快捷样式分组显示空状态，而不是空白区域或破损布局

#### Scenario: Keep layout stable while editing appearance
- **WHEN** 用户连续编辑快捷样式或 CSS 源码
- **THEN** 外观面板分组、输入控件和 CSS 编辑器保持稳定尺寸，不因输入内容导致横向溢出或焦点丢失

### Requirement: Quick style controls synchronize to component styles

外观页签的快捷样式控件 SHALL 通过现有 store action 更新当前组件 `styles`，并立即同步到画布和 CSS 源码视图。

#### Scenario: Edit quick style value
- **WHEN** 用户在快捷样式控件中修改颜色、字号、边距、宽度或高度等支持字段
- **THEN** 当前组件的 `styles` 被更新，画布立即反映新样式，并且 CSS 源码区显示同等声明

#### Scenario: Edit px dimension control
- **WHEN** 用户在宽度、高度、外边距、内边距等尺寸字段输入数字
- **THEN** 组件 `styles` 中对应字段以 `px` 值保存，输入框显示数字本身，固定后缀显示为 `px`

#### Scenario: Clear px dimension control
- **WHEN** 用户清空尺寸字段的数字
- **THEN** 对应 style MUST 从组件 `styles` 中移除，画布和 CSS 源码同步恢复该字段的默认表现

#### Scenario: Preserve existing schema
- **WHEN** 快捷样式控件写入任意样式值
- **THEN** 系统只更新当前组件节点的 `styles` 字段，不新增外观专用 schema、不修改 `props`、不改变页面保存格式

### Requirement: CSS source editor synchronizes with quick styles

外观页签的 CSS 源码编辑器 SHALL 允许用户编辑 `.comp` 选择器内部声明，并将可解析声明同步为当前组件内联 `styles`。

#### Scenario: Edit CSS source declaration
- **WHEN** 用户在 CSS 源码区编辑 `.comp` 内部的合法 CSS 声明
- **THEN** 系统将声明转换为 React style key 后写入当前组件 `styles`，并同步更新快捷样式表单和画布

#### Scenario: Explain CSS source scope
- **WHEN** CSS 源码分组展开
- **THEN** 面板显示提示，说明只需要编辑 `.comp` 选择器内部 CSS 声明，保存后会同步为组件内联样式

#### Scenario: Ignore unsupported CSS source safely
- **WHEN** CSS 源码包含无法解析的内容、复杂选择器、伪类或媒体查询
- **THEN** 系统 MUST 不破坏当前组件树，并且不得写入无法表示为组件内联 `styles` 的结构

#### Scenario: Keep CSS editor usable
- **WHEN** 用户在 CSS 源码区连续输入
- **THEN** Monaco 编辑器保持固定可用高度、自动布局和滚动能力，不遮挡后续内容

### Requirement: Appearance reset clears custom styles

外观页签 SHALL 提供明确的恢复默认操作，用于清空当前组件自定义样式并同步重置所有外观编辑视图。

#### Scenario: Reset custom styles
- **WHEN** 用户点击外观页签中的“恢复默认”或“恢复默认样式”
- **THEN** 当前组件的自定义 `styles` 被清空，画布恢复默认外观，快捷样式表单和 CSS 源码区同步重置

#### Scenario: Reset does not affect other component data
- **WHEN** 用户恢复默认样式
- **THEN** 系统 MUST 保留当前组件的 `props`、`children`、事件配置、组件 id 和父子关系不变

#### Scenario: Reset feedback
- **WHEN** 恢复默认样式成功
- **THEN** 面板向用户显示成功反馈，并且不会关闭当前外观页签或改变当前选中组件

### Requirement: Appearance search filters without mutation

外观页签搜索 SHALL 只过滤当前页可见配置项，不修改组件数据、不改变当前选中组件、不触发表单写入。

#### Scenario: Search quick style controls
- **WHEN** 用户在外观搜索框输入与样式字段名称或标签匹配的关键字
- **THEN** 快捷样式分组只展示匹配字段，CSS 源码分组按关键字匹配规则显示或隐藏

#### Scenario: Empty appearance search
- **WHEN** 外观搜索没有匹配快捷样式字段，也没有命中 CSS 源码关键字
- **THEN** 面板显示外观搜索空状态，并且当前组件 `styles` 保持不变

#### Scenario: Clear appearance search
- **WHEN** 用户清空外观搜索关键字
- **THEN** 面板恢复展示当前组件全部外观配置，之前已编辑的样式值保持不变
