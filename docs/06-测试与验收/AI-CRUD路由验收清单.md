# AI CRUD 路由验收清单

本文用于验证：当 AI agent 识别到 CRUD/数据源类请求时，优先走确定性 CRUD 生成器；非 CRUD 请求继续走通用页面生成路径。

## 验收范围

- 路由判定：`crud` / `free`（或项目中等价命名）
- 生成结果：输出普通 `Page schema`，不输出 React/Vue/HTML 源码
- 契约一致性：`dataSources`、`props.onEvent[eventName].actions`、`http` action
- 安全校验：`validateAiGeneratedComponents` 与 patch 场景 `applyAiComponentPatch`
- 可观测性：日志含 `requestId`、`route`、判定原因、耗时、fallback 原因

## 用例清单

| 编号 | 输入示例 | 预期路由 | 核心断言 |
| --- | --- | --- | --- |
| A1 | 做一个用户管理（列表/新增/编辑/删除） | `crud` | 走 CRUD 生成器，输出 `Page schema` |
| A2 | 基于订单 API 生成列表+详情 | `crud` | 复用页面 `dataSources`，含列表与详情结构 |
| A3 | 做个商品后台，可搜索分页增删改 | `crud` | 混合表述仍命中 CRUD |
| A4 | 生成营销落地页首屏 | `free` | 不走 CRUD 生成器 |
| A5 | 做个管理页面看看 | `free` 或确认分支 | 低置信度按策略处理，不误判为 CRUD |
| A6 | CRUD 结果落库前校验 | `crud` | `validateAiGeneratedComponents` 通过 |
| A7 | CRUD patch 应用 | `crud` | `applyAiComponentPatch` 校验通过 |
| A8 | 写操作事件 | `crud` | 事件写入 `props.onEvent[event].actions`，包含 `http` |
| A9 | 含 custom action 候选 | `crud/free` | 预览安全策略正确，发布态 `allowCustomJS=false` |
| A10 | 生成器失败或校验失败 | fallback | 产生可读 warnings，不静默失败 |

## 自动化最小集（当前已落地）

- T1 正例：`CRUD` 请求命中 `isCrudGenerationIntent === true`
- T2 反例：非 CRUD 请求命中 `isCrudGenerationIntent === false`
- T3 生成契约：`generateAiCrudPageCandidate` 输出可通过 `validateAiGeneratedComponents`

> 对应测试文件：`scripts/test/ai-agent-crud.test.mjs`

## 建议发布门禁

- 本地至少执行：`npm run test -- ai-agent-crud.test.mjs`（或运行 `npm run test` 全量）
- 发布前执行：`npm run check`
