## Why

`audit-functional-bugs` 审查确认了多处“配置入口已经存在，但运行态行为未生效或结果错误”的问题。现在需要把这些报告项收敛为可验证的修复，避免用户在预览、发布页和事件联动中遇到看似可用但实际失效的体验。

## What Changes

- 修复编辑器预览态事件动作直接写回设计态 Zustand store 的问题，让运行态组件属性/样式变更只作用于本次预览快照。
- 修复组件联动 `setValue` 的值来源解析，让固定值、事件数据路径和 `{{...}}` 表达式都能写入真实运行时值。
- 修复 Tabs、Pagination 和可点击 Steps 的受控交互，让用户点击后有可见状态变化，同时继续触发已配置事件动作。
- 梳理 Page 属性面板中尚未落地的运行态设置，先隐藏容易误导用户的配置入口，保留已经真实消费或可作为数据配置使用的字段。
- 修正版本回滚无权限提示文案，避免把“回滚”错误提示为“删除版本”。

## Capabilities

### New Capabilities

### Modified Capabilities
- `event-actions`: 事件动作运行态必须隔离设计态数据，并正确解析组件联动值来源。
- `editor-interaction-styling`: 编辑器物料与 Page 设置面板必须只展示或执行真实有效的交互配置。

## Impact

- 影响前端编辑器运行态：`src/editor/runtime/Preview/index.tsx`、`packages/lowcode-schema/src/action-runtime.ts`。
- 影响事件配置与物料运行态：`src/editor/components/Setting/actions/ComponentControl.tsx`、`src/editor/materials/p3/**`。
- 影响 Page 物料配置：`src/editor/registry/configs/layout.tsx`、`src/editor/materials/Page/**`。
- 影响版本回滚提示：`src/editor/components/Header/index.tsx`。
- 需要补充或更新相关测试，至少覆盖 action runtime 值解析和核心编辑器质量检查。
