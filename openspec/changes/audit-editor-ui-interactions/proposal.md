## Why

编辑器近期集中修复了画布、右键菜单、设置面板和物料外观生效问题，但这些问题高度依赖真实页面交互，单靠人工点击复测成本高、也容易漏掉相似组件。现在需要把 UI/交互巡检流程纳入 OpenSpec，并把发现的问题沉淀为 e2e 回归测试，确保后续改动不会重新引入“看起来改了外壳、真实控件没变”的缺陷。

## What Changes

- 对编辑器画布、右键菜单、设置面板和物料编辑态样式做一次巡检。
- 检查设置面板样式输入是否即时更新、是否保持焦点、是否可恢复默认样式。
- 检查控件类物料的视觉样式是否作用到真实 Ant Design 控件，而不是只作用到编辑器选中外壳。
- 将巡检发现的问题补充为 `e2e/editor-regression.spec.ts` 中的稳定回归用例。
- 对发现的真实缺陷做最小范围修复，不改变组件 schema、已归档规格或运行时事件模型。

## Capabilities

### New Capabilities

### Modified Capabilities

- `editor-interaction-styling`: 增加编辑器 UI/交互巡检与 e2e 回归覆盖要求，明确物料真实样式生效需要被自动化测试保护。

## Impact

- 影响编辑器编辑态渲染：`src/editor/components/EditArea/`、`src/editor/materials/`。
- 影响设置面板样式编辑：`src/editor/components/Setting/`。
- 影响回归测试：`e2e/editor-regression.spec.ts`。
- 不新增外部依赖，不改变后端接口，不迁移持久化数据。
