## ADDED Requirements

### Requirement: AI agent panel remains understandable and controllable
编辑器 SHALL 为 AI agent 提供可读、可控、可取消的对话式面板。面板 MUST 展示 agent 正在使用的上下文范围、执行步骤、工具调用摘要、候选修改、warnings、assumptions、错误和确认入口。

#### Scenario: Start agent from editor
- **WHEN** 用户从编辑器打开 AI agent 面板
- **THEN** 面板 MUST 允许输入修改诉求并选择目标范围
- **AND** 面板 MUST 展示当前页面、选中组件或整页范围等上下文提示

#### Scenario: Show agent progress
- **WHEN** agent run 正在执行
- **THEN** 面板 MUST 展示计划、当前步骤或工具调用摘要
- **AND** 用户 MUST 能取消本次 run

#### Scenario: Inspect candidate diff
- **WHEN** agent 返回候选 patch 或候选组件树
- **THEN** 面板 MUST 展示影响范围、摘要、warnings 和 assumptions
- **AND** 用户确认前 MUST NOT 修改当前组件树

#### Scenario: Show validation repair feedback
- **WHEN** agent 候选结果经历校验失败和修复
- **THEN** 面板 MUST 展示修复摘要或最终失败原因
- **AND** 错误信息 MUST 能帮助用户调整 prompt 或目标范围

### Requirement: AI agent UI does not block core editing
AI agent 面板 SHALL 与现有编辑器布局协同，避免遮挡画布核心操作，并在窄屏或面板空间不足时保持可滚动、可关闭和可返回编辑状态。

#### Scenario: Keep canvas accessible
- **WHEN** 用户打开 AI agent 面板
- **THEN** 画布 MUST 保持可见或提供明确的返回编辑入口
- **AND** 未确认的候选修改 MUST 不影响画布选择、源码面板和设置面板状态

#### Scenario: Handle long run details
- **WHEN** agent run 包含多步计划、多个工具调用或较长 warning 列表
- **THEN** 面板 MUST 以可扫描、可折叠或可滚动方式展示
- **AND** 文本 MUST 不与按钮、预览或错误提示重叠
