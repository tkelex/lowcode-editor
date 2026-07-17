## MODIFIED Requirements

### Requirement: AI agent cooperates with deterministic generators
当用户请求 CRUD、数据源或其它确定性结构生成时，agent SHALL 优先补全意图、字段映射和生成选项，并调用确定性生成器产出 schema，而不是让模型自由拼接复杂 CRUD 结构。

#### Scenario: Use CRUD generator through tool
- **WHEN** 用户在 AI 面板输入“基于 /api/users 生成一个用户管理页，包含列表、新增、编辑、详情”
- **THEN** agent MUST 识别这是 CRUD/数据源类请求
- **AND** agent MUST 先整理数据源模型、字段映射、页面类型和路由
- **AND** 系统 MUST 通过 CRUD 生成工具或等效确定性流程产出候选 schema
- **AND** 候选结果 MUST 包含 summary、warnings、assumptions、预览组件树和 CRUD 元信息
- **AND** 候选结果 MUST 在用户确认前不得写入编辑器 store

#### Scenario: Prefer existing data source model
- **WHEN** agent 上下文中存在与用户请求匹配的数据源模型
- **THEN** CRUD 生成工具 MUST 优先使用已有模型
- **AND** 候选结果 MUST 标明来源为已有数据源模型

#### Scenario: Create temporary data source model draft
- **WHEN** 用户请求包含接口 URL、字段描述或响应示例，但没有匹配的已有数据源模型
- **THEN** CRUD 生成工具 MAY 创建临时数据源模型草稿
- **AND** 临时草稿 MUST 通过数据源模型校验后才能用于生成候选页面
- **AND** 候选结果 MUST 通过 warning 或 assumption 告知用户该模型尚未保存为项目配置

#### Scenario: Reject invalid model
- **WHEN** 匹配到或推导出的数据源模型缺少必需字段或接口配置不合法
- **THEN** CRUD 生成工具 MUST 拒绝生成候选页面
- **AND** agent MUST 返回可读错误或降级 warning
- **AND** 系统 MUST NOT 写入非法 schema
