## Why

当前 AI 页面搭建已经能把一次 prompt 生成低代码 schema 草稿，但它仍是“一次性生成器”：不能稳定读取当前页面上下文、不能按计划调用受控工具、不能基于校验错误自我修复，也不能在用户反馈后多轮修改同一页面。将其升级为 agent 编排能力，可以让 AI 从“生成一个初稿”变成“理解当前页面并安全地协助迭代页面”的编辑器助手。

## What Changes

- 新增 AI agent 编排能力，支持基于当前项目、页面、组件树、选中组件、物料 registry、数据源模型和历史对话构建受限上下文。
- 新增 agent run/session 抽象，记录计划、工具调用、校验结果、修复尝试、用户确认状态和审计信息。
- 新增受控工具层，允许 agent 在后端调用只读上下文工具、schema 生成/patch 工具、校验工具和预览摘要工具，不允许直接执行任意代码或绕过现有权限。
- 将现有 AI 页面搭建从单次 `generate` 扩展为多轮 `plan -> tool calls -> validate -> repair -> propose patch -> user confirm -> apply` 流程。
- 支持“修改当前页面”模式，agent 输出结构化 patch 或候选组件树，用户确认后才写入 Zustand 组件树或后端页面 schema。
- 增加校验失败后的受控修复循环，所有修复后的结果仍必须通过 `validateAiGeneratedComponents`、组件树校验、事件动作安全规则和 custom JS 限制。
- 增加前端对话式 agent 面板，展示上下文范围、执行步骤、工具结果摘要、warnings、assumptions、diff/预览和可撤销确认入口。
- 保持 AI 只生成低代码 schema 或 schema patch，不生成任意 React/Vue/HTML 源码，不让前端持有模型 API key。

## Capabilities

### New Capabilities

- `ai-agent-orchestration`: 定义 AI agent 的上下文读取、会话状态、工具调用、计划执行、校验修复、多轮页面修改、权限和审计边界。

### Modified Capabilities

- `ai-page-builder`: 将既有 AI 页面搭建从单次生成扩展为可基于当前页面多轮生成、修改、修复和确认写入的流程。
- `editor-interaction-styling`: 增加对话式 agent 面板、执行轨迹、上下文提示、diff/预览确认和错误反馈的编辑器交互要求。

## Impact

- 前端：新增或扩展 AI 面板、agent run 状态管理、上下文范围选择、执行轨迹展示、diff/预览确认、应用 patch/替换/插入流程。
- 共享 schema：新增 agent 请求、上下文包、工具调用、patch、校验修复、执行事件和结果类型；复用并扩展 `ai-*` 校验与规范化工具。
- 后端：扩展 `server/src/modules/ai`，增加 agent orchestration service、工具 registry、模型调用循环、权限校验、审计日志、错误码和超时/步数限制。
- 安全：后端继续持有模型 key；工具必须白名单化；agent 不得执行任意系统命令、不得生成默认 custom action、不得绕过发布页 `allowCustomJS=false`。
- 验证：需要覆盖 shared agent 类型/工具校验测试、后端 agent API smoke/build、编辑器 e2e、多轮修改和非法工具/非法 schema 拦截。
