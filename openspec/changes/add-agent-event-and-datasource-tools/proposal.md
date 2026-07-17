## Why

自然语言 Agent 已能识别 `add-event-action` 和 `bind-data-source` 意图，但这些意图仍主要走通用 schema/patch 流程，用户说“给按钮接接口”或“把表格绑定接口”时体验不够确定。现在需要把这两类高频开发动作接入专用工具，让 Agent 从“会理解”推进到“会可靠修改页面”。

## What Changes

- 新增事件动作候选工具：根据自然语言和选中组件生成 `props.onEvent[eventName].actions` patch。
- 新增数据源绑定候选工具：生成 Page `dataSources` 配置，并为 Table/List/Select 等组件设置 `dataSourceId`。
- 后端 agent orchestration 在 `add-event-action` 和 `bind-data-source` intent 下优先调用专用工具，而不是通用 schema draft。
- 工具输出仍为候选 patch，必须通过 `applyAiComponentPatch` 校验后展示给前端。
- 前端继续复用现有 Agent 理解、执行轨迹、预览、warnings 和确认应用流程。
- 补充单测，覆盖按钮 URL/HTTP 事件、表格数据源绑定、非法目标组件降级或失败提示。

## Capabilities

### New Capabilities

- `agent-event-action-tool`: 定义 AI agent 如何从自然语言生成低代码事件动作 patch。
- `agent-datasource-binding-tool`: 定义 AI agent 如何从自然语言生成页面数据源和组件数据源绑定 patch。

### Modified Capabilities

- `ai-agent-orchestration`: route decision 为 `add-event-action` 或 `bind-data-source` 时，agent run 应优先调用对应专用工具并返回可校验候选 patch。
- `natural-language-agent-routing`: 已识别的事件动作和数据源绑定意图不再只是降级提示，应在工具可用时进入专用工具流程。

## Impact

- 共享 schema：新增事件动作 patch 和数据源绑定 patch 构造 helper，以及相关类型或测试工具导出。
- 后端 AI 模块：扩展 `AiAgentToolRegistryService` 和 `AiAgentOrchestrationService`，新增 `generateEventActionPatch`、`bindDataSource` 或等效工具。
- 前端：无需新增主流程；继续展示 route decision、执行轨迹、候选预览和确认应用。
- 测试：新增 Node 单测覆盖工具输出、patch 校验和路由到专用工具；必要时补 e2e mock 文案。
- 文档/OpenSpec：更新 agent 工具边界和自然语言开发助手计划。
