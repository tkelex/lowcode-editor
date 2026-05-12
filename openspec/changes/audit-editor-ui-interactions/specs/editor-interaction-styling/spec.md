## ADDED Requirements

### Requirement: Editor UI audit is protected by regression tests

编辑器 SHALL 为画布、右键菜单、设置面板和物料真实样式生效提供可重复运行的 e2e 回归覆盖。

#### Scenario: Audit canvas and context menu interactions
- **WHEN** 执行编辑器 UI/交互巡检
- **THEN** 回归测试覆盖画布滚动、组件选中、空白区域点击关闭右键菜单、连续右键另一个组件时菜单重新定位并切换操作目标

#### Scenario: Audit setting panel style editing
- **WHEN** 用户在设置面板外观页编辑样式字段
- **THEN** 回归测试验证样式即时生效、输入焦点不丢失、px 尺寸字段只输入数字、清空字段会删除对应样式、恢复默认按钮会清空自定义 styles

#### Scenario: Audit real material style application
- **WHEN** 用户给控件类物料配置颜色、字体、内边距、背景等视觉样式
- **THEN** 回归测试验证样式作用到真实控件节点，而不是只改变编辑器选中外壳或蓝色选中框

#### Scenario: Run editor regression suite after audit
- **WHEN** 巡检或修复完成
- **THEN** `npm run test:e2e:editor` MUST 通过，或在变更记录中明确说明无法运行的原因
