## 1. 基线检查

- [x] 1.1 检查当前未提交的编辑器改动，识别哪些文件已经被用户或前序工作修改。
- [x] 1.2 按 `editor-interaction-styling` 要求审查 `EditArea`、`Material`、`MaterialItem`、`MaterialWrapper`、`Outline`、`Source` 和 `Setting`。
- [x] 1.3 运行或审查当前编辑器回归测试预期，识别画布、物料、设置、源码/大纲和预览工作流的覆盖缺口。

## 2. 画布交互和布局

- [x] 2.1 修复画布响应式宽度切换，确保桌面、平板和手机模式保持可见、居中且可编辑。
- [x] 2.2 修复 hover 和选中遮罩定位，确保滚动、resize 和组件选择时遮罩保持对齐。
- [x] 2.3 验证拖拽反馈和结构快捷操作能保持合法组件树父子关系和根 Page 保护。
- [x] 2.4 打磨编辑器画布 CSS，避免横向溢出、控件重叠、尺寸不稳定和拖拽状态不一致。

## 3. 物料面板体验

- [x] 3.1 优化物料分类、搜索、收藏和模板视图，使其视觉一致且易于扫描。
- [x] 3.2 确保物料搜索覆盖名称、描述、分类和关键词，并展示清晰空状态。
- [x] 3.3 确保收藏切换继续通过现有 localStorage 流程持久化，且不影响拖拽 payload。
- [x] 3.4 确保内置模板插入继续通过现有编辑器 store 流程创建合法父子关系。

## 4. 设置、源码和大纲面板

- [x] 4.1 优化设置面板选中组件头部，让名称、类型和 id 紧凑且可读。
- [x] 4.2 稳定属性、样式和事件页签搜索，确保过滤不会修改组件数据，空结果展示清晰空状态。
- [x] 4.3 打磨密集设置控件，避免编辑 props 或 styles 时文本溢出、布局跳动和焦点丢失。
- [x] 4.4 验证源码 JSON 校验和应用确认在非法输入时会保留当前画布状态。
- [x] 4.5 验证大纲选择和拖拽/排序与画布选中状态同步，并遵守现有父子关系规则。

## 5. 回归覆盖和验证

- [x] 5.1 更新 `e2e/editor-regression.spec.ts`，覆盖尚未断言的受影响编辑器工作流。
- [x] 5.2 运行 `npm run lint`，修复本次 change 引入的问题。
- [x] 5.3 运行 `npm run build`，修复本次 change 引入的 TypeScript 或生产构建问题。
- [x] 5.4 运行 `npm run test:e2e:editor`；如本地无法运行，记录环境相关阻塞原因。
- [x] 5.5 仅当实现行为改变了已记录的编辑器体验时，更新相关项目文档。

## 6. 追加缺陷修复

- [x] 6.1 修复连续右键不同组件时右键菜单不跟随新鼠标位置和新目标组件的问题。
- [x] 6.2 修复外观面板输入快捷样式或 CSS 源码后画布样式不即时更新的问题。
- [x] 6.3 补充回归测试覆盖连续右键菜单重定位和外观样式更新。
- [x] 6.4 重新运行 `npm run lint`、`npm run build`、`npm run test:e2e:editor` 和 `openspec validate fix-editor-interaction-styling`。

## 7. 外观面板即时反馈

- [x] 7.1 去除用户可感知的外观样式更新延迟，快捷样式和 CSS 源码输入都应立即更新画布。
- [x] 7.2 处理宽度、高度等常见尺寸字段的纯数字输入，使其能以 px 尺寸立即生效。
- [x] 7.3 在外观面板增加“恢复默认样式”操作，清空当前组件自定义 styles 并同步表单和 CSS 源码。
- [x] 7.4 补充回归测试覆盖纯数字样式输入和恢复默认样式。
- [x] 7.5 重新运行 `npm run lint`、`npm run build`、`npm run test:e2e:editor` 和 `openspec validate fix-editor-interaction-styling`。

## 8. px 尺寸输入体验

- [x] 8.1 将宽度、高度、间距等 px 尺寸快捷样式改为数字输入，px 作为固定后缀展示。
- [x] 8.2 修复清空尺寸输入后样式无法删除的问题，空值应从组件 styles 中移除。
- [x] 8.3 确保 CSS 源码仍支持带单位值，且不会破坏快捷样式表单展示。
- [x] 8.4 补充回归测试覆盖 px 后缀展示、数字输入生效、清空输入删除样式。
- [x] 8.5 重新运行 `npm run lint`、`npm run build`、`npm run test:e2e:editor` 和 `openspec validate fix-editor-interaction-styling`。

## 9. 控件类物料真实样式

- [x] 9.1 梳理编辑态物料中 styles 只作用于编辑器外壳的控件类组件，并区分容器类和控件类处理方式。
- [x] 9.2 为 Button、Input、Select 等常用控件类物料应用真实控件样式，而不是只改变选中外壳尺寸。
- [x] 9.3 保持编辑器可选中、可拖拽外壳稳定，避免真实控件样式破坏 `data-component-id`、拖拽和遮罩定位。
- [x] 9.4 补充回归测试覆盖按钮和输入框样式作用到真实控件。
- [x] 9.5 重新运行 `npm run lint`、`npm run build`、`npm run test:e2e:editor` 和 `openspec validate fix-editor-interaction-styling`。
