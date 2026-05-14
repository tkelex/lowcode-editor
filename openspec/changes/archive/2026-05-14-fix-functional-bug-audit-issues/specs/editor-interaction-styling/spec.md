## ADDED Requirements

### Requirement: Interactive display materials update visible state
Tabs、Pagination 和可点击 Steps 物料 SHALL 在预览态和发布页响应用户点击并更新可见状态，同时 MUST 保留已配置事件动作的触发能力。

#### Scenario: Switch tabs in runtime
- **WHEN** 用户在预览态或发布页点击 Tabs 的其它标签
- **THEN** 当前激活标签 MUST 切换到用户点击的标签
- **AND** Tabs 的 change 事件动作 MUST 继续收到当前 key

#### Scenario: Switch pagination page in runtime
- **WHEN** 用户在预览态或发布页点击 Pagination 的其它页码
- **THEN** 当前页码 MUST 切换到用户点击的页码
- **AND** Pagination 的 change 事件动作 MUST 继续收到当前页码和页大小

#### Scenario: Switch clickable step in runtime
- **WHEN** Steps 物料允许点击并且用户点击其它步骤
- **THEN** 当前步骤 MUST 切换到用户点击的步骤
- **AND** Steps 的 change 事件动作 MUST 继续收到当前步骤索引

### Requirement: Page settings expose only effective runtime controls
Page 属性面板 SHALL 避免展示没有运行态行为的配置入口；已展示的 Page 配置 MUST 能在编辑态、预览态、发布页或数据配置链路中产生可解释效果。

#### Scenario: Edit effective page settings
- **WHEN** 用户选中 Page 组件
- **THEN** 属性面板 MUST 展示页面标题、副标题、页面头部、内容区、SEO、变量和数据源等有效配置
- **AND** 修改这些配置 MUST 继续写入当前 Page props

#### Scenario: Hide unfinished page settings
- **WHEN** 用户选中 Page 组件
- **THEN** 属性面板 MUST NOT 展示尚未实现运行态行为的工具栏、侧栏、控件提示、下拉刷新、初始化接口和静态组件数据入口

### Requirement: Permission feedback matches the attempted action
编辑器权限提示 SHALL 准确描述用户尝试执行的动作。

#### Scenario: Viewer cannot rollback page version
- **WHEN** 只有查看权限的用户触发页面版本回滚保护逻辑
- **THEN** 系统 MUST 提示当前角色不能回滚页面
- **AND** 提示文本 MUST NOT 误写为不能删除版本
