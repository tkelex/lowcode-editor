## ADDED Requirements

### Requirement: Control dimensions apply to real editable controls

编辑器 SHALL 允许控件类物料通过外观面板或 CSS 源码配置宽度和高度，并且这些尺寸 MUST 同时反映在画布可选中外壳和真实控件本体上。

#### Scenario: Resize button dimensions
- **WHEN** 用户选中 Button 物料并在外观面板中设置宽度或高度
- **THEN** Button 的编辑器选中框和真实 `button` 控件都按设置后的尺寸更新

#### Scenario: Resize input dimensions
- **WHEN** 用户选中 Input 物料并在外观面板中设置宽度或高度
- **THEN** Input 的编辑器外壳和真实输入框都按设置后的尺寸更新，而不是只改变外层蓝色选中框

#### Scenario: Resize select-like controls
- **WHEN** 用户选中 Select、Textarea、DatePicker 或类似单控件物料并设置宽度或高度
- **THEN** 画布中的真实 Ant Design 控件可见尺寸应随样式更新，同时保持选中框与控件位置对齐

#### Scenario: Clear dimension style
- **WHEN** 用户清空控件宽度或高度字段
- **THEN** 对应尺寸样式 MUST 从组件 `styles` 中移除，真实控件和编辑器外壳都恢复默认尺寸

#### Scenario: Reset control dimensions
- **WHEN** 用户点击恢复默认样式
- **THEN** 控件类物料的自定义宽度和高度被清空，真实控件不再保留此前配置的尺寸
