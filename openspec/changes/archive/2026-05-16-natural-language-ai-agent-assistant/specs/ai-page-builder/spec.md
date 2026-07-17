## ADDED Requirements

### Requirement: AI page builder prioritizes natural language agent workflow

AI 页面搭建 SHALL present the natural language agent workflow as the primary user path for building or modifying pages. Existing one-shot page draft generation MAY remain available as a secondary path.

#### Scenario: Start from natural language prompt
- **WHEN** 用户打开编辑器 AI 面板
- **THEN** 面板 MUST provide a primary natural language input for describing page creation or editing goals
- **AND** the primary action MUST start an agent run or equivalent natural language assistant flow

#### Scenario: Preserve advanced context inputs
- **WHEN** 用户需要提供接口说明、响应示例或目标范围
- **THEN** 面板 MUST allow those details without requiring users to understand schema or patch internals
- **AND** those details MUST be sent to the agent run context

### Requirement: AI page builder displays agent understanding before apply

AI 页面搭建 SHALL show what the agent understood and how it plans to handle the request before the user applies generated changes.

#### Scenario: Show route decision card
- **WHEN** agent run returns a route decision
- **THEN** 前端 MUST display the recognized intent, confidence or confidence label, target scope and preferred tool
- **AND** CRUD route MUST visibly indicate that a deterministic CRUD generator was used

#### Scenario: Apply only confirmed candidate
- **WHEN** agent returns a candidate component tree or patch
- **THEN** 前端 MUST continue to show preview, warnings, assumptions and validation messages before applying
- **AND** the candidate MUST NOT be written into editor state until the user confirms

#### Scenario: Explain fallback
- **WHEN** route decision includes fallback
- **THEN** 前端 MUST display the fallback reason in user-readable language
- **AND** the user MUST still be able to cancel the candidate result
