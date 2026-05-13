## Why

当前右侧设置面板的“属性”页签只展示少量组件属性，字段组织也偏单层列表，用户很难像 amis editor 那样快速浏览基础配置、数据配置、移动端配置等常用区域。现在需要重构属性配置体验，让属性页签既保持项目现有编辑器风格，又能展示更多对低代码搭建有价值的属性。

## What Changes

- 将设置面板“属性”页签重构为更接近 amis editor 的分组式配置体验：
  - 在属性页签内按“基本”“数据”“移动端”等分组展示属性配置，分组支持折叠、数量提示和搜索过滤。
  - 保留顶部当前组件名称、组件类型、id、属性/外观/事件页签和当前页签搜索入口。
  - 搜索属性配置时只过滤当前属性页签内的属性项和分组，不修改组件数据。
- 扩充组件 registry 中需要展示的属性：
  - 为 Page 增加区域展示、页面标题、副标题、控件提示、侧栏宽度可调节、侧栏固定、组件静态数据、初始化接口、下拉刷新等更贴近参考图的属性。
  - 为 Button、Text、Image、Container、Card、Form、Input、Select、Table 等常用物料补齐常用基础属性、状态属性、数据属性或展示属性。
  - 属性仍写入组件节点 `props`，不改变组件树持久化结构。
- 增强属性控件渲染能力：
  - 在现有 input、textarea、select、inputNumber 基础上，支持 switch/checkbox、json textarea、url input、分组选项、帮助说明、占位提示等常用元信息。
  - 对暂无属性、搜索无匹配、属性值格式不合法等状态给出明确空状态或校验反馈。
- 保持现有编辑器运行链路不变：
  - 不新增后端接口。
  - 不改变预览事件动作 schema。
  - 不移除现有 `setter` 配置和 `useComponetsStore` 更新方式。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `editor-interaction-styling`: 扩展设置面板属性页签的分组展示、搜索过滤、属性控件类型、常用组件属性覆盖范围和编辑反馈要求。

## Impact

- 影响代码：
  - `src/editor/components/Setting/ComponentAttr.tsx`
  - `src/editor/components/Setting/index.tsx`
  - `src/editor/settingPanel.css`
  - `src/editor/registry/types.ts`
  - `src/editor/registry/factory.ts`
  - `src/editor/registry/configs/*.tsx`
  - 必要时同步调整相关 material 的 `dev.tsx` / `prod.tsx`，让新增 props 在编辑画布和预览中可见。
- 影响测试：
  - 需要补充或更新设置面板回归覆盖，验证属性分组、搜索、布尔开关、数值输入、JSON 文本和常用物料属性编辑。
- 不影响：
  - 后端 API、数据库结构、页面 schema 顶层结构、事件动作执行协议、发布页 `allowCustomJS` 安全规则。
