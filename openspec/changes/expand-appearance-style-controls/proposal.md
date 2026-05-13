## Why

当前外观面板虽然已经具备 amis 风格的搜索、快捷样式和 CSS 源码分组，但快捷样式仍主要停留在宽度、高度、外边距、内边距等少量字段。用户在搭建页面时还需要频繁调整排版、颜色、边框、背景、布局、显示和溢出等常见样式，如果只能依赖 CSS 源码，会降低低代码编辑器的可视化编辑效率。

## What Changes

- 扩展外观面板可视化样式能力，覆盖常用 CSS 维度：
  - 尺寸与布局：宽高、最小/最大宽高、display、flex 方向、对齐、间距、定位、层级、溢出。
  - 间距：外边距、内边距及四方向细分字段。
  - 排版：字号、字重、行高、文字颜色、对齐、装饰、换行。
  - 背景与边框：背景色、边框颜色、宽度、样式、圆角、阴影。
  - 可见性与透明度：opacity、visibility 等适合内联样式表达的字段。
- 将“快捷样式”从单一长列表升级为更合理的分组呈现：
  - 参考 amis editor 外观面板的检查器心智，保留顶部搜索、折叠分组、字段数量、恢复默认和 CSS 源码兜底。
  - 按“布局”“尺寸”“间距”“文字”“背景”“边框”“效果”等分组展示，默认展开高频分组。
  - 搜索时可跨分组匹配字段名称、中文标签和关键词，并只显示命中的分组与字段。
- 增强样式 setter 的元数据能力：
  - 在不破坏现有 `stylesSetter` 数组兼容性的前提下，允许样式字段声明分组、关键词、单位、控件类型和选项。
  - 为颜色、选择项、数字尺寸、百分比/小数、文本输入等样式类型提供合适控件。
- 保持现有数据模型和运行时协议：
  - 样式仍写入当前组件节点的 `styles` 字段。
  - CSS 源码继续作为高级编辑入口，并与可视化控件双向同步。
  - 不新增后端接口、不修改页面 schema 保存格式、不引入 amis 依赖。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `editor-interaction-styling`: 扩展外观页签的可视化样式字段范围、分组展示、搜索过滤、样式控件类型和 CSS 源码同步要求。

## Impact

- 影响代码：
  - `src/editor/registry/factory.ts`
  - `src/editor/registry/types.ts`
  - `src/editor/registry/configs/*.tsx`
  - `src/editor/components/Setting/ComponentStyle.tsx`
  - `src/editor/components/Setting/CssEditor.tsx`
  - `src/editor/settingPanel.css`
  - 必要时调整 `src/editor/materials/styleSplit.ts` 和具体物料 `dev/prod` 的样式落点，确保真实控件生效。
- 影响测试：
  - 需要补充或更新编辑器回归用例，覆盖新增样式字段、分组搜索、字段清空、恢复默认、CSS 源码同步和真实控件应用。
- 不影响：
  - 后端 API、数据库结构、页面 schema 保存格式、事件动作系统、公开发布页安全规则。
