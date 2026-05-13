## ADDED Requirements

### Requirement: Appearance panel exposes common visual style controls

外观页签 SHALL 为当前选中组件提供覆盖常用页面搭建场景的可视化样式控件，而不要求用户只能通过 CSS 源码编辑基础外观。

#### Scenario: Show expanded style catalog
- **WHEN** 用户选中一个使用通用 `stylesSetter` 的组件并切换到“外观”页签
- **THEN** 面板提供布局、尺寸、间距、文字、背景、边框、效果和显示状态等常用样式字段，而不仅限于宽度、高度、外边距和内边距

#### Scenario: Edit typography styles visually
- **WHEN** 用户在外观面板修改字号、字重、行高、文字颜色、文本对齐或文本装饰
- **THEN** 当前组件 `styles` 写入对应 React style key，画布和 CSS 源码立即同步展示新文字样式

#### Scenario: Edit background and border styles visually
- **WHEN** 用户在外观面板修改背景色、边框颜色、边框宽度、边框样式、圆角或阴影
- **THEN** 当前组件 `styles` 写入对应样式，画布真实组件外观立即更新，并且 CSS 源码显示同等声明

#### Scenario: Edit layout and display styles visually
- **WHEN** 用户在外观面板修改 display、flex 方向、主轴对齐、交叉轴对齐、gap、position、zIndex 或 overflow
- **THEN** 当前组件按内联样式更新布局表现，且不会破坏组件树、选中状态或右侧设置面板

#### Scenario: Preserve CSS source fallback
- **WHEN** 用户需要编辑外观表单未覆盖但可表达为内联 style 的 CSS 声明
- **THEN** 用户仍可通过 CSS 源码区写入该声明，并同步到当前组件 `styles`

### Requirement: Appearance quick styles are grouped by style domain

外观页签 SHALL 将快捷样式按样式语义分组呈现，便于用户扫描、折叠和搜索，而不是展示为单一长列表。

#### Scenario: Render grouped quick styles
- **WHEN** 当前组件存在多个外观字段
- **THEN** “快捷样式”内部按“布局”“尺寸”“间距”“文字”“背景”“边框”“效果”等分组展示字段，并在分组标题展示可见字段数量

#### Scenario: Expand high frequency groups by default
- **WHEN** 用户首次打开一个组件的外观页签
- **THEN** 高频分组默认展开，低频分组可折叠，且用户能在不离开外观页签的情况下展开或收起分组

#### Scenario: Search across grouped style controls
- **WHEN** 用户在外观搜索框输入字段名称、中文标签、分组名称或关键词
- **THEN** 面板只展示命中的分组和字段，隐藏无匹配字段的分组，并且不修改当前组件数据

#### Scenario: Show grouped empty state
- **WHEN** 搜索后没有任何快捷样式字段匹配
- **THEN** 面板展示外观搜索空状态，并保留 CSS 源码命中规则和当前组件 `styles`

### Requirement: Appearance controls use appropriate input types

外观页签 SHALL 根据样式字段语义使用合适的表单控件和单位转换规则，减少用户输入 CSS 语法的负担。

#### Scenario: Use numeric px controls
- **WHEN** 用户编辑宽高、最小/最大宽高、四方向间距、字号、圆角、边框宽度、定位偏移或 gap 等 px 字段
- **THEN** 输入控件只要求填写数字，固定后缀显示为 `px`，组件 `styles` 中保存为带 `px` 的值

#### Scenario: Use number controls without px
- **WHEN** 用户编辑 opacity、zIndex 或配置为无单位数字的字段
- **THEN** 输入控件不显示 `px` 后缀，组件 `styles` 保存为可用于 React style 的无单位值

#### Scenario: Use color controls
- **WHEN** 用户编辑文字颜色、背景色、边框颜色或其他颜色字段
- **THEN** 面板提供颜色输入能力，并允许合法 CSS 颜色值同步到组件 `styles` 和 CSS 源码

#### Scenario: Use select controls for enumerated values
- **WHEN** 用户编辑 display、position、overflow、textAlign、fontWeight、borderStyle、visibility 等枚举字段
- **THEN** 面板使用选项控件展示可选值，并将选中的 CSS 值写入组件 `styles`

#### Scenario: Clear visual style control
- **WHEN** 用户清空任意可视化样式控件的值
- **THEN** 对应 style MUST 从当前组件 `styles` 中移除，快捷样式表单、CSS 源码和画布同步恢复默认表现

### Requirement: Appearance style metadata remains backward compatible

样式 setter 元数据扩展 SHALL 保持现有 registry 写法兼容，已有组件配置不需要迁移页面数据即可继续工作。

#### Scenario: Render legacy style setter
- **WHEN** 某个物料的 `stylesSetter` 仍只声明 `name`、`label`、`type` 和 `options`
- **THEN** 外观面板仍能渲染该字段、搜索该字段并按当前规则写入组件 `styles`

#### Scenario: Render enhanced style setter
- **WHEN** 某个样式 setter 声明了 group、keywords、unit、control、min、max、step 或 placeholder 等扩展元数据
- **THEN** 外观面板使用这些元数据决定分组、搜索命中、控件类型、单位显示和样式值规范化

#### Scenario: Preserve saved schema shape
- **WHEN** 用户通过扩展后的外观控件修改任意样式
- **THEN** 系统只更新当前组件节点的 `styles` 字段，不新增外观专用字段、不修改 `props`、不改变页面保存格式

### Requirement: Expanded visual styles apply to real editable controls

控件类物料 SHALL 将扩展后的视觉样式应用到真实可见控件本体，同时保留编辑器外壳需要的布局和选中能力。

#### Scenario: Apply button visual styles
- **WHEN** 用户给 Button 物料配置字体、颜色、背景、边框、圆角、内边距、宽度或高度
- **THEN** 画布中的真实 Ant Design Button 可见外观随样式更新，选中框仍与按钮位置和尺寸对齐

#### Scenario: Apply input visual styles
- **WHEN** 用户给 Input、Select、Textarea、DatePicker 或类似表单控件配置宽高、字体、颜色、背景、边框、圆角或内边距
- **THEN** 真实 Ant Design 控件本体可见样式随设置更新，而不是只改变外层可选中容器

#### Scenario: Keep shell-only layout styles on wrapper
- **WHEN** 用户给控件类物料配置外边距、定位或其他影响编辑器布局外壳的样式
- **THEN** 这些样式应用到可选中外壳，且不会导致真实控件与选中框错位

#### Scenario: Reset expanded control styles
- **WHEN** 用户点击恢复默认样式
- **THEN** 控件类物料此前通过扩展外观字段配置的自定义样式全部清空，真实控件和外壳同步恢复默认表现
