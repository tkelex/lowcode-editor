## MODIFIED Requirements

### Requirement: Settings panel remains readable and searchable

设置面板 SHALL 展示当前选中组件身份信息，并提供可读、可搜索、可分组的属性、样式、事件配置页签；属性页签 MUST 支持更多常用组件属性和适合属性类型的编辑控件。

#### Scenario: Selected component details
- **WHEN** 一个组件被选中
- **THEN** 设置面板在紧凑头部展示组件名称、类型和 id

#### Scenario: Search settings
- **WHEN** 用户在属性、样式或事件中搜索
- **THEN** 面板过滤当前页签相关控件，并且不修改组件数据

#### Scenario: Empty settings search
- **WHEN** 当前设置搜索没有匹配控件
- **THEN** 面板展示空状态，说明没有找到匹配配置

#### Scenario: Edit component configuration
- **WHEN** 用户修改支持的属性、样式或事件动作
- **THEN** 组件树通过现有 store action 更新，并保持可保存和可预览

#### Scenario: Display grouped property configuration
- **WHEN** 用户打开选中组件的属性页签
- **THEN** 属性配置 MUST 按“基本”“数据”“移动端”等语义分组展示，并在分组标题中提供数量提示或清晰标题

#### Scenario: Filter grouped property configuration
- **WHEN** 用户在属性页签搜索属性名称或标签
- **THEN** 设置面板 MUST 只展示包含匹配属性的分组和字段，并保留属性页签与当前选中组件不变

#### Scenario: Edit boolean property with compact control
- **WHEN** 用户编辑禁用、显示边框、侧栏固定、下拉刷新等布尔属性
- **THEN** 属性页签 MUST 使用开关或复选框类控件表达布尔状态，而不是要求用户从“是/否”下拉框中选择

#### Scenario: Edit page-level properties
- **WHEN** 用户选中 Page 组件
- **THEN** 属性页签 MUST 展示页面标题、副标题、区域展示、控件提示、侧栏宽度可调节、侧栏固定、组件静态数据、初始化接口、移动端下拉刷新等页面级配置

#### Scenario: Edit common material properties
- **WHEN** 用户选中 Button、Text、Image、Container、Card、Form、Input、Select、Table 等常用物料
- **THEN** 属性页签 MUST 展示该物料常用的基础、状态、数据或展示属性，并将修改写入当前组件 `props`

#### Scenario: Edit JSON-like property
- **WHEN** 用户编辑页面变量、数据源、静态数据、表格数据或选项数据等 JSON 类属性
- **THEN** 属性页签 MUST 提供多行编辑控件和格式提示，并在格式不合法时给出反馈而不破坏用户已输入内容

#### Scenario: Edit style configuration
- **WHEN** 用户在外观面板修改快捷样式或 CSS 源码
- **THEN** 选中组件的画布样式立即更新，并且不会因为频繁输入而丢失焦点

#### Scenario: Edit px dimension style
- **WHEN** 用户在外观面板编辑宽度、高度、间距等 px 尺寸样式
- **THEN** 输入框只要求填写数字，px 作为固定后缀展示，清空数字时该样式从组件 styles 中移除

#### Scenario: Style inner form controls
- **WHEN** 用户给按钮、输入框、下拉框等控件类物料配置宽度、字号、颜色、内边距等外观样式
- **THEN** 尺寸定位样式用于编辑器可选中外壳，控件视觉样式应用到真实 Ant Design 控件本身，而不是只改变蓝色选中框

#### Scenario: Reset component styles
- **WHEN** 用户在外观面板点击恢复默认样式
- **THEN** 选中组件的自定义 styles 被清空，画布恢复该组件的默认外观，外观表单和 CSS 源码同步重置
