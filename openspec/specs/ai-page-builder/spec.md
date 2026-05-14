# ai-page-builder Specification

## Purpose
TBD - created by archiving change add-ai-page-builder. Update Purpose after archive.
## Requirements
### Requirement: AI page generation produces editable low-code schema

系统 SHALL 允许有编辑权限的用户提交自然语言页面描述、接口说明、响应示例或数据源模型，并生成可继续编辑的低代码组件树。AI 生成结果 MUST 使用当前已注册物料和现有 Page schema，不得引入第二套运行时格式。

#### Scenario: Generate full page from natural language
- **WHEN** 有编辑权限的用户提交“生成用户管理页面”一类页面描述
- **THEN** 系统 MUST 返回包含 Page 根节点的低代码组件树
- **AND** 组件树中的组件名称 MUST 来自当前 schema registry

#### Scenario: Generate page from API response sample
- **WHEN** 用户提交列表接口说明和响应示例
- **THEN** 系统 MUST 生成包含表格列、字段标题和基础数据绑定意图的页面草稿
- **AND** 结果 MUST 能继续进入现有编辑器组件树流程

### Requirement: AI generation runs through server-side model gateway

系统 SHALL 通过后端 AI 接口调用模型，前端 MUST NOT 直接持有或发送模型 API key。后端接口 MUST 校验项目或页面编辑权限，并记录生成请求的审计信息。

#### Scenario: Frontend requests AI generation
- **WHEN** 前端向 AI 页面生成接口提交 prompt 和页面上下文
- **THEN** 后端 MUST 使用服务端配置的模型凭据发起模型请求
- **AND** 响应中 MUST NOT 暴露模型 API key

#### Scenario: Viewer requests AI generation
- **WHEN** 只有查看权限的用户请求生成或写入 AI 页面
- **THEN** 后端 MUST 拒绝请求
- **AND** 返回可读的权限错误

### Requirement: AI output is validated before editor write

系统 MUST 在 AI 结果写入编辑器前校验组件树结构、物料白名单、父子关系、组件 id、parentId、事件动作类型和安全规则。校验失败的结果 MUST NOT 替换或插入当前组件树。

#### Scenario: Generated schema contains unknown material
- **WHEN** AI 返回包含未注册组件名的组件树
- **THEN** 系统 MUST 拒绝写入
- **AND** 展示包含非法组件名的错误反馈

#### Scenario: Generated schema has invalid parent-child relation
- **WHEN** AI 返回将 TableColumn 放入非 Table 父组件等非法父子关系
- **THEN** 系统 MUST 拒绝写入或执行受控修复
- **AND** 修复后的结果仍 MUST 通过组件树校验

#### Scenario: Generated schema includes custom JavaScript by default
- **WHEN** AI 返回默认包含 custom action 或可执行脚本的结果
- **THEN** 系统 MUST 移除、拒绝或要求用户显式确认该风险
- **AND** 公开发布页 MUST 继续禁止执行自定义 JS

### Requirement: User confirms AI result before applying it

AI 生成结果 SHALL 先进入可预览、可查看摘要和警告的确认状态。用户确认前，系统 MUST NOT 覆盖当前页面或插入当前组件。

#### Scenario: Preview generated result
- **WHEN** AI 生成成功
- **THEN** 前端 MUST 展示生成摘要、警告信息和可预览的页面草稿
- **AND** 当前编辑器组件树 MUST 保持不变直到用户确认

#### Scenario: Apply generated result to current page
- **WHEN** 用户确认将 AI 结果应用到当前页面
- **THEN** 系统 MUST 通过现有组件树 store 写入结果
- **AND** 写入后的页面 MUST 可预览、可保存并参与 undo/redo 或等效恢复流程

### Requirement: AI can insert generated sections into valid containers

系统 SHALL 支持将 AI 生成的局部区块插入当前选中的合法容器组件。若当前选中组件无法接收生成区块，系统 MUST 给出明确反馈并阻止插入。

#### Scenario: Insert section into container
- **WHEN** 用户选中 Page、Container、Card 或其它可接收子组件的容器并确认插入 AI 区块
- **THEN** 系统 MUST 将生成组件追加或插入到该容器子节点中
- **AND** 生成组件的 parentId MUST 与目标容器保持一致

#### Scenario: Insert section into leaf component
- **WHEN** 用户选中 Button、Text、Input 等不接收子组件的物料并尝试插入 AI 区块
- **THEN** 系统 MUST 阻止插入
- **AND** 展示当前组件不支持插入子内容的反馈

### Requirement: AI generation cooperates with CRUD schema generation

当用户请求生成 CRUD 页面时，系统 SHALL 优先将 AI 输出作为数据源模型、字段映射和生成选项的补全输入，并由确定性 CRUD schema 生成器产出最终组件树。

#### Scenario: Generate CRUD page from model description
- **WHEN** 用户描述“根据用户接口生成列表、新增和编辑表单”
- **THEN** AI MUST 产出或补全数据源模型、字段映射和页面生成选项
- **AND** 最终页面 schema MUST 使用 CRUD 生成器或等效确定性流程创建

#### Scenario: CRUD generator is unavailable
- **WHEN** CRUD 生成器能力尚未启用或无法处理输入
- **THEN** 系统 MUST 返回明确警告
- **AND** 可以降级生成静态表格/表单草稿，但 MUST 标注数据写入能力未完成

### Requirement: AI generation exposes failures and warnings

系统 SHALL 将 AI 生成失败、模型错误、校验错误、降级生成和安全剔除等情况以用户可理解的方式反馈给前端，并保留当前页面状态。

#### Scenario: Model request fails
- **WHEN** 模型服务超时、额度不足或返回错误
- **THEN** 系统 MUST 展示生成失败原因
- **AND** 当前编辑器组件树 MUST 不被修改

#### Scenario: Generation succeeds with assumptions
- **WHEN** AI 因缺少接口字段、页面路由或操作规则而做出假设
- **THEN** 系统 MUST 在结果确认区域展示 assumptions 或 warnings
- **AND** 用户 MUST 能在确认前放弃生成结果

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
