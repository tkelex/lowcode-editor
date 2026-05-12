## Context

编辑器是 Vite + React + TypeScript 工作区的一部分，编辑模式由 Material/Outline/Source、EditArea 和 Setting 三类区域组成。组件树由 `useComponetsStore` 管理，编辑态由 `components/EditArea` 渲染，预览/发布态由 `runtime/Preview` 渲染。

项目已经在 `docs/04-编辑器/编辑器体验优化说明.md` 中记录了目标编辑器体验：响应式画布宽度、hover/selected 遮罩、结构快捷操作、物料搜索/收藏/模板、设置面板搜索/空状态、源码 JSON 校验，以及大纲树选择/拖拽。本次 change 把这些既有目标沉淀成稳定的 OpenSpec capability，并作为一次聚焦实现任务推进。

约束：

- 保持已持久化组件 schema 和共享 `packages/lowcode-schema` 契约不变。
- 保留兼容导出和历史拼写，如 `useComponetsStore`、`useMaterailDrop`、`components/Preivew`、`components/Sourse`。
- 保持公开发布页使用 `Preview(allowCustomJS=false)`。
- 避免修改后端、数据库、鉴权和发布链路。

## Goals / Non-Goals

**Goals:**

- 稳定画布 hover、选中、响应式宽度切换、拖拽反馈和结构快捷操作，并保持视觉一致。
- 让物料面板在分类、搜索结果、收藏和模板场景下更易扫描和使用。
- 让设置面板中的属性、样式、事件配置更清晰可预期，并覆盖搜索和空状态。
- 保持现有编辑器工作流：添加物料、选择组件、配置 props/styles/events、编辑源码 JSON、预览、保存和发布。
- 用现有编辑器回归套件覆盖受影响路径。

**Non-Goals:**

- 不新增物料类型。
- 不修改 schema 结构。
- 不修改后端 API 或数据库。
- 不修改生产环境自定义 JavaScript 行为。
- 不重设计项目面板、管理后台、鉴权页或发布页。

## Decisions

### Keep the work inside editor presentation and interaction modules

实现聚焦在 `src/editor/index.tsx`、编辑器 CSS，以及 `EditArea`、`Material`、`MaterialItem`、`MaterialWrapper`、`Outline`、`Source`、`Setting` 等编辑器组件。

原因：这次问题集中在编辑器工作区内部的交互和样式。保持改动局部化，可以降低对保存、发布、权限和 schema 迁移的影响。

备选方案：重构编辑器状态 store 或 registry，引入新的设计系统层。本次只是稳定性修复，不需要扩大到该层级，否则会增加回归风险。

### Treat existing documented behavior as the contract

`docs/04-编辑器/编辑器体验优化说明.md` 作为响应式画布、遮罩、快捷操作、源码面板、物料面板、设置面板和大纲面板的起始行为契约。

原因：项目已经有清晰的编辑器体验要求。OpenSpec 应该捕获并约束这些要求，而不是发明另一套交互模型。

备选方案：只创建视觉改版 spec。但这不足以覆盖拖拽、选择、源码校验或设置搜索等验收标准。

### Prefer CSS and component-level polish over data model changes

样式修复应尽量使用现有 class name、Ant Design/Tailwind 约定和编辑器局部 CSS。组件改动应保留 props、store actions、registry 查询和事件 schema。

原因：大部分预期改进属于视觉一致性、布局稳定性、操作感知和空/加载/搜索状态，最适合在组件和 CSS 边界内处理。

备选方案：引入新的 UI 框架或全局主题。项目已经使用 Ant Design 和 Tailwind，再增加一层样式体系会提高维护成本。

### Extend existing e2e regression coverage

现有 `e2e/editor-regression.spec.ts` 只应补充本次 change 触及的行为，例如面板可见性、设置搜索、画布宽度切换、物料交互和预览渲染。

原因：用户可见的编辑器回归最适合通过浏览器级工作流捕获。

备选方案：只依赖 `npm run build`。构建能捕获 TypeScript 错误，但无法覆盖交互状态和布局回归。

## Risks / Trade-offs

- 滚动或 resize 时遮罩定位可能回归 -> 在编辑器回归测试和手动预览中验证选中/hover 遮罩。
- CSS 改动可能影响嵌套 Ant Design 控件 -> 将样式限定到编辑器 class，避免宽泛全局选择器。
- 拖拽状态改动可能破坏物料创建或组件移动 -> 保持 drag item payload 和 `useMaterialDrop` 契约不变。
- 设置面板在小屏下可能过于拥挤 -> 使用响应式约束和稳定控件尺寸，不用视口宽度缩放字体。
- 当前工作区已有未提交编辑器改动，可能和本次实现重叠 -> 实现前检查当前 diff，不回滚用户改动。
