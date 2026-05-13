## 1. 事件面板布局

- [x] 1.1 将事件页签改为顶部 `添加事件` 主按钮 + 已添加事件分组列表。
- [x] 1.2 实现添加事件下拉面板，按当前组件 registry `events` 展示可添加事件，并阻止重复添加。
- [x] 1.3 从已有 `props.onEvent` 推导已添加事件分组，兼容旧页面打开后的事件渲染。
- [x] 1.4 实现事件分组条操作：展开/收起、添加动作、清空动作、删除事件，并展示事件说明。

## 2. 动作条列表

- [x] 2.1 将事件下的 actions 渲染为动作条，展示动作名称、摘要、启用状态和配置状态。
- [x] 2.2 保留动作排序、复制、删除、启用/禁用和编辑能力。
- [x] 2.3 确保动作列表更新仍写入 `props.onEvent[eventName].actions`，不改变 schema。

## 3. 动作配置弹窗

- [x] 3.1 建立 action catalog，声明动作分类、名称、说明、关键词、常用动作和 actionType 映射。
- [x] 3.2 将 `ActionModal` 重构为左右分栏：左侧分类/搜索/动作列表，右侧动作说明和专属表单。
- [x] 3.3 按当前事件 `allowedActions` 过滤动作 catalog，不展示不可配置动作。
- [x] 3.4 支持常用动作标签快速选择，并保持编辑已有动作时的值初始化。
- [x] 3.5 继续复用现有 `toast`、`url`、`http`、`confirm`、`condition`、`setVariable`、`custom` 等动作表单。

## 4. 组件联动配置

- [x] 4.1 优化 `componentControl` 配置表单，按目标组件和操作类型展示专属字段。
- [x] 4.2 优化 `componentAction` 配置表单，展示目标组件可用方法和参数配置。
- [x] 4.3 将 `setComponentProps` 和 `setComponentStyles` 纳入组件联动分类，并保留 JSON 编辑能力。
- [x] 4.4 对打开/关闭弹窗、提交/重置表单等操作过滤目标组件类型，避免选择不支持操作的组件。

## 5. 样式与文档

- [x] 5.1 更新 `src/editor/settingPanel.css`，实现 amis 式事件分组条、动作条和弹窗分栏视觉。
- [x] 5.2 同步 `docs/04-编辑器/事件动作规划.md`，记录新的事件面板模型和动作分类。
- [x] 5.3 同步 `docs/04-编辑器/事件能力矩阵.md`，补充添加事件、动作过滤和组件联动配置规则。

## 6. 验证

- [x] 6.1 补充或更新 `e2e/editor-regression.spec.ts`，覆盖添加事件、添加动作、动作配置、组件联动和横向溢出。
- [x] 6.2 运行 `npm run lint`、`npm run build` 和 `npm run test:e2e:editor`。
- [x] 6.3 检查 OpenSpec 状态，确认 change 达到可 apply / 可归档前状态。
