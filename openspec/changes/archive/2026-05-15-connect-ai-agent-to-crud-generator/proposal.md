## Why

AI agent 已经能读取页面上下文、生成候选 patch 并等待用户确认，CRUD 生成器也已经能基于数据源模型产出可编辑 Page schema。当前缺口是两者没有真正联动，导致用户在 AI 面板提出 CRUD 页面请求时仍可能得到模型自由拼接的静态草稿。

本变更让 agent 在识别 CRUD/数据源类意图后优先调用确定性 CRUD 生成器，降低复杂后台页 schema 的不稳定性，并保留现有预览、warning、确认后写入的安全边界。

## What Changes

- 扩展 AI agent 工具白名单，新增 CRUD 页面生成工具。
- 扩展 agent 上下文，携带项目数据源模型摘要，供工具匹配已有模型。
- 支持从自然语言、接口描述和响应示例推导临时数据源模型草稿。
- 支持基于已有或临时数据源模型调用 `generateCrudPageSchema`，返回整页候选组件树。
- 前端 AI 面板展示 CRUD 候选来源、模型、页面类型、路由和 warnings。
- 补充单测与 e2e 覆盖 agent 调用 CRUD 生成器、非法模型拒绝和降级 warning。

## Capabilities

### New Capabilities
- 无

### Modified Capabilities
- `ai-agent-orchestration`: agent 在 CRUD/数据源类请求中必须优先调用确定性 CRUD 生成工具，并把候选结果作为可预览、可确认的页面候选返回。
- `data-model-crud-generation`: CRUD 生成结果可被 AI agent 作为候选页面来源使用，并保留模型、页面类型、路由和 warning 元信息。
- `editor-interaction-styling`: AI 面板需要清晰呈现 CRUD 生成候选的结果摘要、风险提示和确认入口。

## Impact

- 后端：`server/src/modules/ai` 的 agent 编排、上下文和工具 registry。
- 共享包：AI agent 类型可能增加 CRUD 候选元信息。
- 前端：`src/editor/components/AiBuilderPanel/index.tsx` 的候选展示。
- 测试：`scripts/test` 中 AI agent/CRUD 相关单测，以及 `e2e/editor-regression.spec.ts` 的 AI tab 回归。
