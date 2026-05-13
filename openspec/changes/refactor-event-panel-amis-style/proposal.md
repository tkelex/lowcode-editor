## Why

当前事件页签仍然像“事件详情列表”，用户需要先理解每个折叠项里的事件数据和动作列表，才能完成事件编排。你给的 amis editor 示例更贴近低代码编辑器的心智：先添加事件，再在事件分组下维护动作条，并通过大弹窗选择动作类型和填写专属配置。

本变更要重构事件部分的排版和配置流程，让它支持“添加事件、针对不同事件添加对应动作、动作专属配置、组件联动配置”等完整编排体验，同时继续复用项目现有 `props.onEvent[eventName].actions` schema。

## What Changes

- 将右侧事件页签重构为 amis 风格的事件编排面板：
  - 顶部主按钮 `添加事件`。
  - 点击后展开可选事件下拉面板，只展示当前组件 registry 声明且尚未添加到面板的事件。
  - 已添加事件以分组条展示，包含事件名、事件说明 tooltip、添加动作、清空/删除事件、展开/收起等操作。
  - 每个事件下方展示动作条列表，动作条包含拖拽/排序把手、动作名称、动作摘要、设置、复制、删除等操作。
- 重构动作配置弹窗为左右分栏：
  - 左侧是动作分类与搜索，例如页面、弹窗消息、服务、组件联动、数据、逻辑、高级。
  - 右侧展示所选动作的说明、基础设置和高级设置。
  - 常用动作以 pill/tag 形式展示，支持快速选择。
- 保留并补强现有动作能力：`toast`、`url`、`componentAction`、`componentControl`、`confirm`、`condition`、`http`、`setVariable`、`setComponentProps`、`setComponentStyles`、`custom`。
- 针对不同事件按 `allowedActions` 过滤动作类型，避免为事件配置不被允许的动作。
- 组件联动动作需要提供专属配置体验：目标组件、操作类型、值来源/表达式、方法参数等。
- 文档同步事件面板新模型、动作分类、事件添加规则和组件联动配置规则。
- 不引入 breaking change；保存结构仍为 `props.onEvent[eventName].actions`。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `editor-interaction-styling`: 重构设置面板事件页签，从折叠详情列表升级为事件编排面板和动作配置工作流。

## Impact

- 影响代码：
  - `src/editor/components/Setting/ComponentEvent.tsx`
  - `src/editor/components/Setting/ActionModal.tsx`
  - `src/editor/components/Setting/actions/**`
  - `src/editor/settingPanel.css`
  - `e2e/editor-regression.spec.ts`
- 影响文档：
  - `docs/04-编辑器/事件动作规划.md`
  - `docs/04-编辑器/事件能力矩阵.md`
  - 必要时补充 `docs/04-编辑器/事件绑定系统设计.md`
- 不影响后端接口、数据库结构、页面 schema 保存格式、预览运行态动作执行器和公开页 `allowCustomJS=false` 规则。
