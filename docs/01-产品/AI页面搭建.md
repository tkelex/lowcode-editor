# AI 页面搭建

AI 能力只辅助生成和修改低代码 schema，不生成任意 React、Vue 或 HTML 源码。

## 调用边界

- 前端通过 feature API 请求 `api-server`。
- 模型 key 只存在于后端环境变量。
- 未配置 provider key 时，后端返回本地规则生成的可编辑草稿。
- provider 配置使用 `AI_PROVIDER_BASE_URL`、`AI_PROVIDER_API_KEY`、`AI_PROVIDER_MODEL` 和超时变量。

## 输出

- 整页或片段组件树。
- 针对当前页面或选中组件的 schema patch。
- CRUD 页面候选和数据源绑定候选。
- 事件动作候选。

输出必须包含可展示的摘要、warnings、assumptions、路由决策和工具执行信息。

## 校验与确认

1. 读取页面、选中组件、registry 和数据源模型上下文。
2. 路由到生成、patch、事件或数据源工具。
3. 校验物料白名单、组件树、父子关系、事件动作和 custom JS。
4. patch 额外校验 baseline fingerprint 和目标组件。
5. 前端展示候选预览。
6. 用户确认后才调用 `applyAiComponentPatch` 或替换/插入组件树。

AI 不能绕过编辑器 store、页面保存、版本和发布流程。

## 安全

- viewer 无写入权限。
- custom action 默认不进入生成结果。
- 服务端限制步骤数、修复次数、上下文规模、超时和请求频率。
- 模型输出视为不可信输入，必须经过共享 schema 校验。

相关实现位于 `apps/api-server/src/modules/ai`、`apps/editor-web/src/features/editor/components/AiBuilderPanel` 和 `packages/lowcode-schema/src/ai-*`。
