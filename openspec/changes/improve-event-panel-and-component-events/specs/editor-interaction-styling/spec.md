## ADDED Requirements

### Requirement: Event panel supports action orchestration

设置面板事件页签 SHALL 以当前组件 registry 声明的事件为来源，清晰展示事件说明、动作数量、事件数据和动作流水线，并允许用户高效管理动作。

#### Scenario: View event summary
- **WHEN** 用户选中一个有事件声明的组件并打开事件页签
- **THEN** 面板展示该组件支持的事件、每个事件的说明、事件类别、动作数量和添加动作入口

#### Scenario: Filter event list
- **WHEN** 用户按关键词、配置状态或事件类别筛选事件
- **THEN** 面板只展示匹配的事件，并且不会修改组件数据

#### Scenario: Copy event data token
- **WHEN** 用户点击事件数据 token
- **THEN** 系统复制形如 `event.value`、`event.args` 或 `event.open` 的引用文本，并展示轻提示

#### Scenario: Add action from event
- **WHEN** 用户从事件头部、空状态或快捷动作入口添加动作
- **THEN** 动作弹窗只允许选择当前事件 `allowedActions` 中声明的动作类型

#### Scenario: Manage action pipeline
- **WHEN** 用户复制、编辑、删除、启用/禁用或调整动作顺序
- **THEN** 面板更新该事件的 `props.onEvent[eventName].actions`，并保持动作执行顺序可见

#### Scenario: Empty event state
- **WHEN** 当前事件没有配置动作
- **THEN** 面板展示空状态和常用动作入口，而不是空白内容

### Requirement: Component events remain registry driven

组件事件规划 SHALL 由物料 registry 中的 `events` 声明驱动，文档 SHALL 与当前已落地事件能力保持一致。

#### Scenario: Render declared events only
- **WHEN** 用户选中任意物料组件
- **THEN** 事件页签只展示该组件 registry 中声明的事件

#### Scenario: Keep structural nodes eventless
- **WHEN** 用户选中 `Page`、`FormItem` 或 `TableColumn` 等不声明事件的结构节点
- **THEN** 事件页签展示暂无可绑定事件的空状态

#### Scenario: Document component event matrix
- **WHEN** 本次事件面板变更完成
- **THEN** 事件能力矩阵和事件动作规划文档记录当前组件事件、事件数据和允许动作策略

### Requirement: Event panel visual design fits the editor workbench

事件页签 SHALL 延续右侧设置区的工具型视觉风格，保持紧凑、可扫读、无横向溢出，并避免新增厚重装饰。

#### Scenario: Display on narrow settings panel
- **WHEN** 事件名称、动作摘要或事件数据较长
- **THEN** 文本截断或换行，不撑开右侧设置面板，也不产生横向滚动

#### Scenario: Use compact icon actions
- **WHEN** 用户查看动作列表
- **THEN** 排序、复制、启用/禁用、编辑和删除等操作使用紧凑图标按钮，并在 hover 或 tooltip 中说明含义

#### Scenario: Preserve existing editor contract
- **WHEN** 用户完成事件配置后保存、预览或发布页面
- **THEN** 现有 schema、预览事件执行和公开页 custom JS 禁用规则保持不变
