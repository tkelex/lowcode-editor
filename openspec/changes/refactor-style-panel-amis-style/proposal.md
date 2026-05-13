## Why

当前外观面板已经能编辑快捷样式和 CSS 源码，但信息层级、输入控件、源码编辑区和恢复默认入口还不够接近专业低代码编辑器的样式检查器体验。用户希望参考 amis editor 的外观面板，把样式配置重构成更清晰、紧凑、可搜索、可即时同步的工作流。

## What Changes

- 将右侧设置面板的“外观”页签重构为 amis 风格的样式检查器：
  - 顶部保留外观配置搜索，搜索只过滤当前外观页内容，不修改组件数据。
  - “快捷样式”作为默认展开分组，展示当前组件可配置样式数量，并提供组标题区域的“恢复默认”入口。
  - 快捷样式字段采用更接近截图的垂直表单布局：标签在上，控件在下，宽度/高度/外边距/内边距等尺寸字段使用数字输入加固定 `px` 后缀。
  - 快捷样式修改后立即同步到画布，并同步更新 CSS 源码区。
- 将 CSS 源码区重构为独立分组：
  - 提供说明提示，明确只编辑 `.comp` 选择器内部声明。
  - 使用稳定高度的 Monaco CSS 编辑器，避免输入时面板跳动或焦点丢失。
  - CSS 源码修改后解析为组件 `styles`，并同步回快捷样式表单。
- 增强恢复默认体验：
  - 点击恢复默认后清空当前组件自定义 `styles`。
  - 快捷样式表单和 CSS 源码同步恢复到空的 `.comp {}`。
  - 画布恢复组件默认外观。
- 保持现有 schema 和运行时不变：
  - 仍然写入组件节点的 `styles` 字段。
  - 不新增后端接口、不修改页面保存格式、不改变预览渲染协议。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `editor-interaction-styling`: 修改设置面板外观页签的样式编辑、CSS 源码同步、恢复默认和搜索过滤要求。

## Impact

- 影响代码：
  - `src/editor/components/Setting/ComponentStyle.tsx`
  - `src/editor/components/Setting/CssEditor.tsx`
  - `src/editor/settingPanel.css`
  - 必要时调整 `src/editor/registry/component-config.tsx` 中现有 `stylesSetter` 的展示兼容性，但不改变 registry 数据结构。
- 影响测试：
  - 需要补充或更新编辑器回归用例，覆盖外观搜索、px 尺寸编辑、CSS 源码同步和恢复默认。
- 不影响：
  - 后端 API、数据库结构、页面 schema 保存格式、事件动作系统、公开发布页安全规则。
