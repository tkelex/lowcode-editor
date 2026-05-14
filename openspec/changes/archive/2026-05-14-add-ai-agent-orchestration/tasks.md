## 1. 共享协议与校验

- [x] 1.1 定义 AI agent session/run、上下文包、工具调用、工具结果、执行事件、候选 patch、候选组件树和审计摘要的 shared TypeScript 类型。
- [x] 1.2 定义低代码 schema patch 操作类型，覆盖新增、更新 props/styles、移动、删除、替换子树和整页候选。
- [x] 1.3 实现 patch apply/validate 工具，校验目标 id、父子关系、物料白名单、Page 根节点、id 唯一性和范围限制。
- [x] 1.4 扩展 AI 校验结果，支持把校验错误压缩为 agent 修复提示，同时保留用户可读错误。
- [x] 1.5 为 agent 类型、patch apply、patch validate、非法 custom action、非法父子关系和 stale candidate 补充单元测试。

## 2. 后端 agent 编排

- [x] 2.1 在 `server/src/modules/ai` 新增 agent orchestration service，支持创建 run、推进步骤、停止 run 和返回最终候选结果。
- [x] 2.2 实现 agent 上下文构建器，读取项目、页面、当前组件树、选中组件、物料 registry 摘要、事件能力和数据源模型摘要。
- [x] 2.3 实现白名单工具 registry，至少包含页面上下文读取、物料能力读取、schema 生成、schema patch、校验和修复提示工具。
- [x] 2.4 将现有 AI 页面生成逻辑封装为 agent 可调用工具，保留现有生成接口兼容。
- [x] 2.5 实现模型工具调用循环，限制最大步数、最大修复次数、超时、上下文大小和取消状态。
- [x] 2.6 复用 ProjectAccessService 校验项目/页面权限，禁止 viewer 创建写入类 agent run。
- [x] 2.7 增加 agent 审计日志，记录 run 状态、工具调用摘要、耗时、失败原因、warning 数量和候选结果摘要。
- [x] 2.8 增加后端错误码和 API 文档，覆盖权限不足、工具不存在、工具参数非法、校验失败、超时和取消。

## 3. 前端 agent 体验

- [x] 3.1 新增前端 agent API 封装，支持创建/推进 run、取消 run、获取执行状态和获取候选结果。
- [x] 3.2 在编辑器中新增或扩展 AI agent 面板，支持多轮消息、目标范围选择和上下文提示。
- [x] 3.3 展示 agent 执行计划、当前步骤、工具调用摘要、warnings、assumptions、修复摘要和失败原因。
- [x] 3.4 实现候选 patch/diff 展示和预览，区分局部 patch、插入选中和整页替换。
- [x] 3.5 实现确认应用 patch 到 Zustand 组件树，应用后运行组件树校验并保持 undo/redo 语义。
- [x] 3.6 实现 stale candidate 检测，当前页面或组件树基准变化时阻止直接应用旧候选。
- [x] 3.7 确保 agent 面板在编辑器三栏布局中可滚动、可关闭，不遮挡核心画布操作。

## 4. 安全、权限与运行边界

- [x] 4.1 确保所有模型调用仍只走后端 AI 网关，前端不持有或发送模型 API key。
- [x] 4.2 确保 agent 工具不能执行 shell、任意数据库写入、任意外部 HTTP 请求、自动发布或自定义 JS。
- [x] 4.3 确保 agent 候选结果默认禁止 custom action，发布页继续使用 `allowCustomJS=false`。
- [x] 4.4 对 URL、HTTP action、headers、body 和 allowed origins 继续复用现有事件动作安全规则。
- [x] 4.5 增加限流或等效保护，避免单用户或单项目反复触发高成本 agent run。

## 5. 与生成器和数据源协同

- [x] 5.1 为 agent 工具预留 CRUD 生成器调用入口，输入为数据源模型、字段映射和页面生成选项。
- [x] 5.2 当 CRUD 生成器不可用时返回明确 warning，并降级为静态草稿或要求用户补充信息。
- [x] 5.3 支持 agent 根据接口说明或响应示例补全字段映射，但最终 CRUD schema 仍由确定性生成器产出。

## 6. 验证与文档

- [x] 6.1 为 shared agent 类型、patch 校验和 AI 校验修复补充 `npm run test` 覆盖。
- [x] 6.2 为后端 agent API、权限、工具白名单、取消和超时补充 build/API smoke 或单元测试。
- [x] 6.3 添加编辑器 e2e，覆盖打开 agent 面板、多轮修改、查看 diff、确认应用、放弃候选和非法 patch 拦截。
- [x] 6.4 运行 `npm run lint`、`npm run build`、`npm run test` 和相关后端验证。
- [x] 6.5 更新 `docs/03-接口/接口说明.md`、`docs/02-架构/架构说明.md`、`docs/00-总览/项目上下文索引.md` 和 `.claude/context/FILE_MAP.md`，说明 agent 编排、工具边界、权限和验证命令。
- [x] 6.6 更新 AGENTS 或协作上下文中 AI agent 相关约束，明确 AI 只能生成低代码 schema/patch，不能绕过校验和确认。
