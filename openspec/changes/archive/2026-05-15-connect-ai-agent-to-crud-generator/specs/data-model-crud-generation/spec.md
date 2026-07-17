## MODIFIED Requirements

### Requirement: CRUD generator creates editable page schemas
CRUD 生成器 SHALL 基于前端数据源模型生成符合现有低代码组件树规则的 Page schema，生成结果 MUST 能被编辑器打开、保存、版本化和发布。

#### Scenario: Generate schema for AI agent candidate
- **WHEN** AI agent 调用 CRUD 生成工具并传入合法数据源模型和生成选项
- **THEN** CRUD 生成器 MUST 返回普通 Page schema
- **AND** 返回结果 MUST 保留 `generatedBy`、数据源模型标识、CRUD 页面类型和路由元信息
- **AND** agent MUST 能把该 schema 转换为可预览的 components candidate

#### Scenario: Surface generation warnings to agent
- **WHEN** CRUD 生成器因为接口缺失、字段配置不完整或推导结果不确定产生 warning
- **THEN** warning MUST 透传到 agent 候选结果
- **AND** 前端 MUST 在用户确认前展示这些 warning
