## Why

当前 AI 搭建已经能生成页面草稿、运行 agent run，并且 CRUD 请求已接入确定性生成器；但用户视角仍偏“表单工具”，缺少清晰的自然语言开发入口和可解释的意图路由。现在需要把已有能力收束成一个面向用户的自然语言 AI 开发助手，让用户用一句话发起生成、修改、样式优化、事件绑定和数据源绑定，并能看到 agent 理解了什么、使用了什么工具、影响哪里。

## What Changes

- 将编辑器 `AI 搭建` 面板调整为自然语言 Agent 主入口，弱化普通草稿生成表单，强化 `让 Agent 处理` 的主流程。
- 为 AI agent 增加统一意图路由结果，包括 `intent`、`confidence`、`reasons`、`fallback` 和是否使用确定性工具。
- 扩展 agent 执行轨迹和候选结果展示，在前端显示“识别意图”“影响范围”“工具选择”和 CRUD 确定性生成器标记。
- 将现有 CRUD 路由判断纳入统一 route decision，并补充 `crud-page`、`free-page`、`edit-selected`、`style-polish`、`bind-data-source`、`add-event-action` 等意图分类。
- 为自然语言开发助手补充路由单测、候选结果契约测试和最小人工验收路径。
- 保持现有安全边界：AI 不直接保存、发布或绕过编辑器 store；候选结果仍需校验和用户确认。

## Capabilities

### New Capabilities

- `natural-language-agent-routing`: 定义自然语言请求如何被分类为页面生成、局部编辑、样式优化、数据绑定、事件绑定、诊断修复或 CRUD 页面生成，并要求 route decision 对用户可解释。

### Modified Capabilities

- `ai-agent-orchestration`: agent run 需要记录并返回统一 route decision，执行计划和工具调用应基于该决策选择确定性生成器或 patch 流程。
- `ai-page-builder`: 编辑器 AI 面板需要以自然语言 Agent 为主入口，并展示 route decision、工具选择、候选预览和确认应用状态。
- `editor-interaction-styling`: AI/Agent 面板交互需要清楚呈现自然语言助手状态，保持可读、可控、可滚动，并符合现有后台编辑器视觉标准。

## Impact

- 前端：`src/editor/components/AiBuilderPanel/index.tsx`、AI API 类型封装、候选预览和应用交互。
- 共享类型与校验：`packages/lowcode-schema/src/ai-agent-types.ts`、agent route decision 类型、测试工具导出。
- 后端：`server/src/modules/ai/ai-agent-orchestration.service.ts`、`ai-agent-context.service.ts`、`ai-agent-tool-registry.service.ts`，以及相关 DTO/API 响应。
- 测试：`scripts/test/ai-agent-crud.test.mjs` 将扩展或新增通用 agent routing 测试；必要时补编辑器 e2e 覆盖自然语言 CRUD 生成到预览应用。
- 文档：同步 `docs/01-产品/自然语言AI开发助手计划.md`、项目上下文索引和接口/架构文档中的 AI agent 说明。
