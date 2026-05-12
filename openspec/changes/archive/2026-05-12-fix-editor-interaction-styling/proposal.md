## Why

编辑器画布、物料面板和设置面板是这个低代码编辑器的核心日常工作流。项目已经记录了很多目标交互模式，但当前体验需要一次聚焦的稳定性和视觉一致性修复，让拖拽、选择、配置和预览更可靠。

## What Changes

- 稳定画布交互，包括组件 hover、选中、拖拽反馈、响应式画布宽度、遮罩定位和结构快捷操作。
- 优化物料面板，让搜索、分类、收藏、模板和拖拽状态更易扫描，并与编辑器整体 UI 保持一致。
- 优化设置面板，让组件身份信息、属性/样式/事件页签、搜索、空状态和密集表单控件更清晰稳定。
- 保持现有 schema、物料 registry、事件、保存、预览和发布契约不变。
- 为受影响的编辑器回归路径补充或更新验证覆盖。

## Capabilities

### New Capabilities

- `editor-interaction-styling`: 定义编辑器画布、物料面板、设置面板、源码面板和大纲面板作为统一编辑工作区时应具备的交互和视觉行为。

### Modified Capabilities

- 无。当前还没有已归档的 OpenSpec capability。

## Impact

- 受影响的前端编辑器模块：
  - `src/editor/index.tsx`
  - `src/editor/editorCanvas.css`
  - `src/editor/settingPanel.css`
  - `src/index.css`
  - `src/editor/components/EditArea/index.tsx`
  - `src/editor/components/Material/index.tsx`
  - `src/editor/components/MaterialItem/index.tsx`
  - `src/editor/components/MaterialWrapper/index.tsx`
  - `src/editor/components/Outline/index.tsx`
  - `src/editor/components/Source/index.tsx`
  - `src/editor/components/Setting/*`
  - `src/editor/materials/Page/dev.tsx`
- 受影响的测试：
  - `e2e/editor-regression.spec.ts`
- 不预期修改后端 API、数据库 schema、共享 schema 包或发布契约。
