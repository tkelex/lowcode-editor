## Why

当前事件页签已经能展示事件、配置动作并写入 `props.onEvent`，但信息组织仍偏“列表堆叠”：事件数据不够易引用，已配置动作不够突出，动作入口也缺少按使用场景的引导。用户在配置组件联动、HTTP 请求、变量写入和条件动作时，需要更清晰的事件心智模型。

这次变更要在不改变现有 schema、保存、预览和发布契约的前提下，让事件面板更像一个可扫读的动作编排工具，同时同步梳理当前物料组件的事件规划。

## What Changes

- 优化右侧事件页签的信息结构，突出事件名、触发说明、动作数量、事件数据和动作流水线。
- 增加事件筛选能力，支持查看全部、已配置、未配置以及按事件类别过滤。
- 将事件数据展示为可复制 token，方便在动作表单、条件表达式、HTTP 模板和自定义 JS 中引用。
- 优化动作空状态和添加动作入口，为常用动作提供更直接的配置路径。
- 保留现有动作编辑、删除、复制、启用/禁用、排序能力，并增强动作摘要的可扫读性。
- 梳理组件事件矩阵文档，明确布局、基础、表单、数据、反馈和结构节点的事件策略。
- 不引入 breaking change；继续使用 `props.onEvent[eventName].actions` 和 registry `events` 声明。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `editor-interaction-styling`: 增强设置面板事件页签的可读性、筛选、事件数据引用和组件事件规划要求。

## Impact

- 影响代码：
  - `src/editor/components/Setting/ComponentEvent.tsx`
  - `src/editor/components/Setting/ActionModal.tsx`
  - `src/editor/settingPanel.css`
  - 必要时补充轻量测试或现有 E2E 断言
- 影响文档：
  - `docs/04-编辑器/事件能力矩阵.md`
  - `docs/04-编辑器/事件动作规划.md`
  - 必要时同步 `docs/04-编辑器/编辑器体验优化说明.md`
- 不影响后端接口、数据库结构、页面 schema 保存格式、发布页 custom JS 禁用规则。
