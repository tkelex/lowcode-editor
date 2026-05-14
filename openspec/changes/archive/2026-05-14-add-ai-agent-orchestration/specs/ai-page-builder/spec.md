## ADDED Requirements

### Requirement: AI page builder supports multi-turn agent modifications
AI 页面搭建 SHALL 支持用户在生成初稿后继续通过自然语言多轮修改当前页面。多轮修改 MUST 基于当前组件树和用户确认后的最新状态，不得基于过期候选结果直接写入。

#### Scenario: Modify applied AI draft
- **WHEN** 用户已将 AI 草稿应用到编辑器，并继续要求“把统计卡片改成三列”
- **THEN** 系统 MUST 基于当前组件树创建 agent 修改请求
- **AND** 候选修改 MUST 在用户确认后才写入当前组件树

#### Scenario: Reject stale candidate apply
- **WHEN** 用户生成候选结果后，当前页面已被手动修改或切换到其它页面
- **THEN** 系统 MUST 在应用前检测候选结果的上下文版本或基准摘要
- **AND** 如果基准不匹配，系统 MUST 要求重新生成或重新确认

### Requirement: AI page builder exposes schema patch application modes
AI 页面搭建 SHALL 支持替换整页、插入选中容器和修改当前页面的写入模式。修改当前页面模式 MUST 使用通过校验的 patch 或候选组件树，并保留撤销/重做语义。

#### Scenario: Apply generated patch
- **WHEN** agent 返回合法 schema patch 且用户确认应用
- **THEN** 前端 MUST 将 patch 应用于当前组件树
- **AND** 应用后的组件树 MUST 通过现有组件树校验

#### Scenario: Reject invalid patch target
- **WHEN** patch 引用不存在的组件 id、非法父组件或不兼容的物料关系
- **THEN** 系统 MUST 阻止应用 patch
- **AND** 当前组件树 MUST 保持不变

### Requirement: AI page builder keeps generated changes reversible
AI 生成和 agent 修改 SHALL 保持可放弃、可撤销和可重新生成。系统 MUST 明确区分候选修改、已应用到编辑器的修改和已保存到后端的页面版本。

#### Scenario: Discard candidate change
- **WHEN** 用户查看候选修改后选择放弃
- **THEN** 系统 MUST 丢弃候选结果
- **AND** 当前组件树 MUST 保持候选生成前状态

#### Scenario: Undo applied agent change
- **WHEN** 用户确认应用 agent 修改后触发撤销
- **THEN** 编辑器 MUST 能回到应用前的组件树状态
- **AND** 页面保存状态 MUST 继续由现有保存流程表达
