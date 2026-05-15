## ADDED Requirements

### Requirement: Generated CRUD pages use supported event actions
CRUD 生成器 SHALL 只为生成页面写入当前事件系统支持并可执行的动作配置，生成动作 MUST 存储在 `props.onEvent[eventName].actions` 中。

#### Scenario: Generate create submit action
- **WHEN** 生成器创建新建表单页
- **THEN** 表单提交事件 MUST 包含调用外部新增接口所需的 HTTP action
- **AND** 动作配置 MUST 能在事件动作面板中打开和编辑

#### Scenario: Generate edit submit action
- **WHEN** 生成器创建编辑表单页
- **THEN** 表单提交事件 MUST 包含调用外部更新接口所需的 HTTP action
- **AND** 动作 MUST 能读取当前记录 id、页面变量或路由参数

#### Scenario: Generate delete action
- **WHEN** 生成器创建列表页删除操作
- **THEN** 删除操作 SHOULD 使用确认动作包裹外部删除接口调用
- **AND** 删除成功后 MUST 能执行刷新列表或提示用户的后续动作

#### Scenario: Generate list operation actions
- **WHEN** 生成器创建列表页操作列或操作按钮
- **THEN** 操作事件 MUST 只引用生成页面中存在的目标组件、路由或变量
- **AND** 动作选择面板 MUST NOT 要求用户配置当前页面不存在的组件方法

### Requirement: CRUD runtime actions can refresh generated data views
事件运行时 SHALL 支持生成 CRUD 页面在新增、编辑或删除外部记录后刷新列表或跳转到目标页面。

#### Scenario: Refresh list after data mutation
- **WHEN** 用户在生成页面中新增、编辑或删除外部记录
- **THEN** 后续动作 MUST 能触发表格数据刷新、重新请求绑定数据源或给出明确的手动刷新反馈

#### Scenario: Navigate after form submit
- **WHEN** 用户提交生成表单且外部接口返回成功
- **THEN** 后续动作 MUST 能按生成配置返回列表页或打开详情页

#### Scenario: Surface API failure
- **WHEN** 生成页面调用外部接口失败
- **THEN** HTTP action MUST 展示配置的失败提示或默认失败提示
- **AND** 运行时日志 MUST 保留可排查的错误信息
