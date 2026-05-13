## Why

按钮、输入框等控件类物料在低代码编辑器中应该可以调整宽度和高度；这是页面搭建的基础能力。当前实现把部分尺寸样式当作编辑器外壳样式处理，容易出现画布蓝色选中框变了、真实 Ant Design 控件本体没有按预期变宽或变高的问题，用户会误以为样式配置无效。

## What Changes

- 明确控件类物料的 `width`、`height`、`min/max` 尺寸样式应同时驱动画布占位尺寸和真实控件视觉尺寸。
- 梳理 Button、Input、Select、Textarea、DatePicker、Upload、Popover、Notification 等控件类编辑态物料的尺寸样式分发。
- 保留编辑器可选中外壳用于选中框、拖拽和布局定位，但不能让外壳尺寸与真实控件尺寸脱节。
- 补充 e2e 回归，覆盖通过外观面板修改按钮、输入框等控件宽高后，画布上的真实控件即时变化。
- 不改变组件 schema、不新增依赖、不调整后端接口。

## Capabilities

### New Capabilities

### Modified Capabilities

- `editor-interaction-styling`: 强化控件类物料尺寸样式真实生效的要求，明确宽高配置不仅应影响编辑器外壳，也应反映到真实控件本体。

## Impact

- 影响编辑态控件物料：`src/editor/materials/Button/dev.tsx`、`Input/dev.tsx`、`Select/dev.tsx`、`p3/form.tsx`、`p3/feedback.tsx` 等。
- 影响样式拆分工具：`src/editor/materials/styleSplit.ts`。
- 影响设置面板样式验证：`src/editor/components/Setting/ComponentStyle.tsx` 相关回归。
- 影响 e2e：`e2e/editor-regression.spec.ts`。
