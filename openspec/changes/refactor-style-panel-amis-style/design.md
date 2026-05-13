## Context

右侧设置面板已经采用自定义 tabbar、搜索框和 `settingPanel.css` 的紧凑编辑器风格。外观页签由 `ComponentStyle.tsx` 驱动，当前主要能力包括：

- 从 `componentConfig[curComponent.name].stylesSetter` 渲染快捷样式表单。
- 通过 `onValuesChange` 调用 `updateComponentStyles` 即时更新组件 `styles`。
- 通过 `CssEditor` 编辑 `.comp {}` 内部 CSS，并解析为内联样式。
- 通过“恢复默认”清空自定义样式。

用户给出的 amis editor 参考截图强调的是一个样式检查器心智：搜索外观配置、快捷样式分组、px 后缀尺寸输入、恢复默认入口、CSS 源码分组和提示说明。这个 change 需要重构外观页签的信息架构与视觉结构，但不改变组件 schema 或预览运行时。

## Goals / Non-Goals

**Goals:**

- 外观页签形成“搜索 -> 快捷样式 -> CSS 源码”的清晰纵向结构。
- 快捷样式默认展开，标题展示数量，并在标题右侧提供恢复默认。
- 尺寸类样式使用数字输入和固定 `px` 后缀，清空数字时移除对应 style。
- 快捷样式表单和 CSS 源码保持双向同步，且同步时不丢焦点、不导致面板尺寸跳动。
- CSS 源码区明确只编辑 `.comp` 内部声明，保存为组件内联 `styles`。
- 视觉上参考 amis editor 的紧凑属性检查器，但落到本项目的白底、细边框、蓝色功能强调和 6px 以内圆角体系。

**Non-Goals:**

- 不引入 amis、amis-editor 或新的样式编辑依赖。
- 不修改 `stylesSetter` 数据结构。
- 不修改组件树 schema、页面保存格式、后端接口或发布页渲染协议。
- 不实现 CSS 选择器级别的嵌套规则、伪类、媒体查询或全局样式编辑。
- 不重构属性页签、事件页签或编辑器三栏布局。

## Decisions

### 1. 保持 `ComponentStyle` 作为外观页签唯一入口

外观页签仍由 `ComponentStyle.tsx` 负责读取当前组件、registry 样式 setter、表单状态和 CSS 源码状态。这样能继续复用现有 `useComponetsStore.updateComponentStyles` 和 `CssEditor`，避免把样式编辑逻辑拆散到多个无共享上下文的组件里。

备选方案是新建 `AppearancePanel` 并迁移现有逻辑。它在长期上更清晰，但本次重点是重构样式体验，不需要改变模块边界。若实现后 `ComponentStyle.tsx` 继续膨胀，可在后续 change 中拆分 `QuickStyleGroup`、`StyleSourceGroup` 和 `styleValueTransform`。

### 2. 快捷样式与 CSS 源码用同一份规范化样式对象同步

所有入口都先归一化为 `Record<string, any>`：

- 表单入口：数字类样式转换为 `Npx` 字符串，空值转换为 `undefined` 并从 `styles` 移除。
- CSS 入口：解析 `.comp` 内部声明后转换为 React style key，再更新 `styles`。
- 恢复默认入口：以 replace 模式写入 `{}`，并重置表单和 CSS 源码。

这保持当前 `styles` 字段是唯一事实来源。表单和源码只是不同编辑视图，不各自持久化状态。

### 3. CSS 编辑同步要避免频繁重置编辑器焦点

当前 `ComponentStyle` 在切换组件时重置 form 和 css。实现时应继续只在 `curComponentId` 变化时重置整块编辑状态；同一组件内用户输入时，只更新必要状态：

- 表单变更时更新 `css` 字符串，但不重新挂载 `CssEditor`。
- CSS 变更时更新 form 字段，但不调用 `form.resetFields()`。
- `CssEditor` 容器使用固定高度和 `overflow: hidden`，防止 Monaco 布局改变撑开面板。

备选方案是对 CSS 变更做 debounce。它能降低频繁解析成本，但会削弱“修改后立即同步到画布”的预期。本次优先保持即时同步；若后续出现性能问题，再加轻量 debounce。

### 4. 分组视觉使用现有 `setting-collapse` 体系，不复制 amis 依赖

截图中的结构可以映射到现有 Ant Design `Collapse`：

- 分组标题：浅灰底、36px 左右高度、左侧展开图标、标题和数量、右侧恢复默认。
- 分组内容：12px 内边距，表单项 12px 间距。
- CSS 提示：浅蓝提示块，强调 `.comp` 内部声明。

继续使用现有 `settingPanel.css` 控制视觉细节，避免把 amis 的 DOM、依赖或大面积灰底直接引入项目。

### 5. 搜索只过滤外观配置，不改变数据

外观搜索沿用设置面板顶部的 `keyword`。过滤规则：

- 快捷样式按 setter 的 `name`、`label` 匹配。
- CSS 源码分组在关键字为空，或关键字命中 `css`、`样式`、`源码`、`自定义` 时显示。
- 搜索无结果时显示空状态，不清空当前表单、不写入 `styles`。

## Risks / Trade-offs

- [Risk] CSS 字符串解析能力有限，复杂 CSS 可能无法完整保留。  
  → Mitigation: 明确只支持 `.comp` 内部声明，并把复杂选择器、伪类和媒体查询排除在本次范围外。

- [Risk] 表单和 CSS 双向同步可能造成循环更新或焦点抖动。  
  → Mitigation: 组件切换才重置整表；同组件内只做 `setFieldsValue` 和局部状态更新，并保持 `CssEditor` 不重新挂载。

- [Risk] `px` 后缀字段如果处理不一致，会出现表单显示数字、源码显示字符串的差异。  
  → Mitigation: 统一使用 `normalizeStyleValue`、`stripPx` 和 `toCSSStr` 转换，清空时移除字段。

- [Risk] 只靠 CSS 覆盖可能难以达到截图里的稳定布局。  
  → Mitigation: 允许调整 `ComponentStyle.tsx` 的局部 JSX 结构，但不改变 setter、store 和 schema 契约。

## Migration Plan

不需要数据迁移。已有页面的 `component.styles` 会继续按现有格式读取。

实施顺序：

1. 梳理并稳定 `ComponentStyle` 的样式值转换函数。
2. 重构快捷样式分组标题、恢复默认入口、空状态和字段渲染。
3. 重构 CSS 源码分组提示、编辑器容器和同步逻辑。
4. 更新 `settingPanel.css` 中外观页签相关样式，保持右侧面板整体风格一致。
5. 补充编辑器回归用例或组件测试，覆盖关键交互。

回滚策略：由于数据结构不变，可以回退 `ComponentStyle.tsx` 和 `settingPanel.css` 到上一版，已有页面样式数据不受影响。

## Open Questions

- 是否需要在快捷样式里新增更细的分类，例如“布局”“间距”“文字”“边框”？本次先延续 registry 当前 setter 顺序，避免引入新的元数据。
- CSS 源码是否需要错误提示和上一次有效值回滚？本次可先保持解析失败不写入，后续再做显式校验体验。
