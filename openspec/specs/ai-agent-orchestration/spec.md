# ai-agent-orchestration Specification

## Purpose

定义 AI agent 的上下文读取、会话状态、工具调用、计划执行、校验修复、多轮页面修改、权限和审计边界。

## Requirements

### Requirement: AI agent sessions keep scoped editing context
系统 SHALL 为 AI agent 创建受项目权限保护的会话或 run，并基于用户选择的项目、页面、选中组件和目标范围构建受限上下文包。上下文包 MUST 只包含当前用户有权访问且与本次页面修改相关的信息。

#### Scenario: Build context for selected component
- **WHEN** 有编辑权限的用户在编辑器中选中组件并发起 agent 修改请求
- **THEN** 后端 MUST 加载当前页面 schema、选中组件路径、可用物料摘要、事件能力摘要和用户消息
- **AND** 上下文 MUST 标记本次修改目标范围

#### Scenario: Reject unauthorized context access
- **WHEN** 用户请求读取无权访问的项目、页面或数据源模型上下文
- **THEN** 系统 MUST 拒绝创建或推进 agent run
- **AND** 响应 MUST 不泄露目标资源是否包含敏感内容

#### Scenario: Exclude secrets from context
- **WHEN** 系统构建 agent 上下文包
- **THEN** 上下文 MUST NOT 包含模型 API key、JWT、数据库连接串或其它服务端密钥

### Requirement: AI agent tools are explicit and allowlisted
agent SHALL 只能调用服务端注册的白名单工具。每个工具 MUST 声明名称、用途、输入 schema、输出 schema、权限要求、是否产生候选修改以及超时边界。

#### Scenario: Call read-only context tool
- **WHEN** agent 需要了解当前页面结构或物料能力
- **THEN** 系统 MUST 只允许调用对应只读工具
- **AND** 工具结果 MUST 以摘要形式返回给模型

#### Scenario: Block unknown tool
- **WHEN** 模型请求调用未注册工具或工具参数不符合 schema
- **THEN** 系统 MUST 拒绝该工具调用
- **AND** agent run MUST 记录可审计的工具错误

#### Scenario: Prevent direct persistence from tools
- **WHEN** agent 调用生成或修改类工具
- **THEN** 工具 MUST 只返回候选 schema、候选 patch 或校验结果
- **AND** 工具 MUST NOT 直接保存页面、发布页面或修改数据库业务记录

### Requirement: AI agent plans and executes bounded runs
agent SHALL 以有界 run 推进用户请求。每个 run MUST 记录计划、步骤、工具调用、模型输出、校验结果、修复次数、最终候选结果和失败原因。

#### Scenario: Complete a bounded run
- **WHEN** 用户要求 agent 修改当前页面
- **THEN** 系统 MUST 生成或记录执行计划
- **AND** 系统 MUST 在最大步数、最大耗时和最大修复次数内完成、失败或等待用户确认

#### Scenario: Stop runaway execution
- **WHEN** agent 达到配置的最大步数、超时或修复次数上限
- **THEN** 系统 MUST 停止继续调用模型或工具
- **AND** 系统 MUST 返回当前失败原因和已完成步骤摘要

#### Scenario: Cancel running agent
- **WHEN** 用户取消正在执行的 agent run
- **THEN** 系统 MUST 停止后续工具调用和模型调用
- **AND** 当前页面组件树 MUST 保持取消前状态

### Requirement: AI agent validates and repairs candidate changes
agent 输出的候选 schema 或 schema patch MUST 在展示给用户或写入编辑器前经过校验。校验失败时，系统 MAY 执行有限的模型修复或确定性修复；修复后的结果仍 MUST 通过完整校验。

#### Scenario: Repair invalid parent relationships
- **WHEN** agent 候选结果包含非法 parentId、重复 id 或非法父子关系
- **THEN** 系统 MAY 尝试规范化或请求 agent 修复
- **AND** 最终候选结果 MUST 通过组件树校验后才能展示为可应用

#### Scenario: Reject unsafe custom action
- **WHEN** agent 候选结果包含默认 custom action、可执行脚本或绕过发布页安全边界的配置
- **THEN** 系统 MUST 拒绝或剔除该候选内容
- **AND** 返回结果 MUST 包含安全 warning 或错误说明

#### Scenario: Return validation failure
- **WHEN** 候选结果在允许的修复次数后仍未通过校验
- **THEN** 系统 MUST 返回可读校验错误
- **AND** 系统 MUST NOT 将候选结果应用到当前组件树

### Requirement: AI agent produces reviewable page patches
agent 修改当前页面时 SHALL 产出可检查的候选 patch 或候选组件树。候选结果 MUST 包含摘要、影响范围、warnings、assumptions 和用于前端展示 diff/预览的必要数据。

#### Scenario: Propose local component patch
- **WHEN** 用户要求“把当前卡片加一个搜索区”
- **THEN** agent MUST 优先返回只影响选中组件或其子树的候选 patch
- **AND** patch MUST 标明新增、更新、移动或删除的组件

#### Scenario: Propose full page replacement
- **WHEN** 用户要求“重做整个页面布局”
- **THEN** agent MAY 返回完整候选组件树
- **AND** 响应 MUST 标明这是整页级修改并要求用户确认

#### Scenario: Preserve unrelated components
- **WHEN** 用户请求的修改范围限定在选中容器内
- **THEN** agent 候选 patch MUST NOT 修改范围外组件
- **AND** 如需扩大范围 MUST 在 assumptions 或 warnings 中说明

### Requirement: AI agent runs are audited
系统 SHALL 对 agent run 记录审计信息，包括用户、项目、页面、目标范围、模型配置摘要、工具调用摘要、耗时、状态、失败原因和候选结果摘要。

#### Scenario: Audit successful run
- **WHEN** agent 成功生成候选修改
- **THEN** 系统 MUST 记录成功审计事件
- **AND** 审计内容 MUST 包含工具调用数量、warning 数量和是否等待用户确认

#### Scenario: Audit failed run
- **WHEN** agent 因权限、模型、工具、校验或超时失败
- **THEN** 系统 MUST 记录失败审计事件
- **AND** 审计内容 MUST 包含失败类别和脱敏错误摘要

### Requirement: AI agent cooperates with deterministic generators
当用户请求 CRUD、数据源或其它确定性结构生成时，agent SHALL 优先补全意图、字段映射和生成选项，并调用确定性生成器产出 schema，而不是让模型自由拼接复杂 CRUD 结构。

#### Scenario: Use CRUD generator through tool
- **WHEN** 用户要求根据接口生成列表和表单
- **THEN** agent MUST 先整理数据源模型、字段映射和页面类型
- **AND** 系统 MUST 通过 CRUD 生成工具或等效确定性流程产出候选 schema

#### Scenario: Generator unavailable
- **WHEN** 确定性生成器不可用或无法处理输入
- **THEN** agent MUST 返回 warning
- **AND** agent MAY 降级生成静态可编辑草稿，但 MUST 标注数据写入能力未完成
