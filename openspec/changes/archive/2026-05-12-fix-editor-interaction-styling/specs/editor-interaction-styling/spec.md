## ADDED Requirements

### Requirement: Canvas interaction states remain stable

编辑器画布 SHALL 在不改变底层组件 schema 的前提下，提供稳定的响应式宽度切换、hover 反馈、选中反馈、拖拽反馈和结构快捷操作。

#### Scenario: Switch canvas viewport width
- **WHEN** 用户在桌面、平板和手机画布宽度之间切换
- **THEN** 画布内容在所选宽度下保持可见、居中且可编辑

#### Scenario: Select component from canvas
- **WHEN** 用户点击一个已渲染的可编辑组件
- **THEN** 该组件进入选中状态，选中遮罩与实际渲染位置对齐，设置面板展示该组件

#### Scenario: Drag material into canvas
- **WHEN** 用户将允许投放的物料拖入页面或容器组件
- **THEN** 编辑器展示有效投放反馈，并在不生成非法父子关系的情况下添加组件

#### Scenario: Use structural quick action
- **WHEN** 用户对选中的非根组件执行复制、移动、包裹或删除等支持的快捷操作
- **THEN** 组件树更新，同时保持合法 parentId 和根 Page 保护规则

#### Scenario: Reposition context menu on another component
- **WHEN** 用户在一个组件上打开右键菜单后，不关闭菜单并继续右键另一个可编辑组件
- **THEN** 右键菜单移动到新的鼠标位置，并且操作目标切换为新组件

### Requirement: Material panel supports efficient discovery and insertion

物料面板 SHALL 支持用户通过分类、搜索、收藏和模板发现并插入物料，同时保持清晰的拖拽视觉反馈。

#### Scenario: Search materials
- **WHEN** 用户输入物料关键词
- **THEN** 物料面板按名称、描述、分类或关键词过滤可见物料

#### Scenario: Empty material search
- **WHEN** 物料搜索没有匹配项
- **THEN** 面板展示空状态，而不是空白或破损布局

#### Scenario: Toggle favorite material
- **WHEN** 用户切换物料收藏状态
- **THEN** 收藏状态在物料面板中更新，并可在收藏视图中继续访问

#### Scenario: Insert built-in template
- **WHEN** 用户插入内置模板
- **THEN** 生成的组件树通过正常编辑器组件树流程添加，并保持合法父子关系

### Requirement: Settings panel remains readable and searchable

设置面板 SHALL 展示当前选中组件身份信息，并提供可读的属性、样式、事件配置页签，包含搜索和空状态。

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

### Requirement: Source and outline panels remain consistent with canvas state

源码面板和大纲面板 SHALL 与当前组件树和选中组件保持同步，同时保留现有校验行为。

#### Scenario: Apply valid source JSON
- **WHEN** 用户从源码面板应用合法源码 JSON
- **THEN** 编辑器校验组件树，并且只在确认后替换画布

#### Scenario: Reject invalid source JSON
- **WHEN** 用户尝试应用非法 JSON 或非法组件树
- **THEN** 编辑器保留当前画布状态并显示错误

#### Scenario: Select from outline
- **WHEN** 用户在大纲面板中选择组件
- **THEN** 画布选中状态和设置面板同步到同一个组件

#### Scenario: Reorder from outline
- **WHEN** 用户通过大纲面板排序或移动组件
- **THEN** 编辑器执行与画布拖拽相同的父子关系规则

### Requirement: Editor regression coverage protects affected workflows

项目 SHALL 为本次 change 触及的编辑器工作流提供回归覆盖。

#### Scenario: Run editor regression test
- **WHEN** 在准备好的本地环境中执行 `npm run test:e2e:editor`
- **THEN** 测试覆盖受影响的画布、物料面板、设置面板、源码/大纲和预览工作流，并且不失败

#### Scenario: Run local quality checks
- **WHEN** 实现完成
- **THEN** `npm run lint`、`npm run build`、`npm run test:e2e:editor` 等相关本地检查通过，或明确记录未运行原因
