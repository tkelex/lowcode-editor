## Context

当前项目工作台使用 Ant Design 的 `Card`、`List`、`Descriptions`、`Button`、`Tag` 等组件，并通过 Tailwind class 完成页面布局。截图中的主要问题是页面内容漂浮在大面积浅色背景中，左右面板缺少细腻层级；项目卡片和页面列表的状态、更新时间、路径、操作区没有形成清晰的扫描节奏。

约束：
- 保持现有数据加载、权限判断、抽屉和弹窗逻辑不变。
- 遵守项目视觉标准：工作台式、克制、偏 SaaS 操作界面，不做营销化 hero、不做大渐变装饰。
- 避免全局 CSS 大范围覆盖，优先在 `ProjectDashboard.tsx` 局部使用 Ant Design 与 Tailwind。

## Goals / Non-Goals

**Goals:**

- 提升项目工作台的视觉层级，使标题、用户信息、主操作、项目列表和页面列表更容易扫描。
- 让项目列表的选中态、角色与描述更清晰，避免只靠浅蓝色块表达状态。
- 让页面列表从普通文本列表变为稳定的管理行，突出页面名、发布状态、路径、更新时间和操作。
- 增加响应式约束，小屏下左右面板自然堆叠且不产生明显横向溢出。

**Non-Goals:**

- 不新增项目统计、筛选、排序、搜索或批量操作。
- 不修改项目成员、审计日志和发布记录抽屉的业务行为。
- 不修复现有文件中的编码显示问题，除非当前改动必须触碰对应文本。
- 不调整后端接口、权限模型、路由或发布逻辑。

## Decisions

### Use Ant Design components with local Tailwind composition

项目工作台已经使用 Ant Design 组件，继续使用 `Card`、`List`、`Descriptions`、`Tag`、`Space` 和 `Button`，通过局部 className 调整边框、阴影、间距与响应式。

原因：能保持与管理后台和编辑器 UI 的技术栈一致，减少样式覆盖风险。

### Treat the page as an operational workbench

页面使用浅中性背景、白色面板、细边框、轻阴影和明确的状态标签。主要按钮保持蓝色，其他操作维持次级样式或 link 样式。

原因：用户在这里选择项目、进入编辑器和查看记录，应优先保证扫描效率和重复使用的稳定感。

### Keep behavior unchanged

所有加载函数、权限判断、弹窗、抽屉和 API 调用保持原状。样式改造只重排可视结构，不改变数据契约。

原因：这次需求来自页面“不够美观”，风险应控制在视觉层和布局层。

## Risks / Trade-offs

- 行级布局更丰富后，小屏可能拥挤：通过 `grid-cols-1 lg:grid-cols-[320px_1fr]`、`flex-wrap` 和 `min-w-0` 控制。
- 卡片样式调整可能影响 Ant Design 默认间距：使用局部 className，不写全局覆盖。
- 当前源码存在中文文本编码显示异常，本次只做样式和结构，不扩大到文案修复，以免引入无关 diff。
