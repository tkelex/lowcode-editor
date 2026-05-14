## Context

`audit-functional-bugs` 报告指出的问题集中在低代码编辑器的运行态边界：配置面板已经提供入口，但 Preview、action runtime 或物料自身没有兑现同等行为。当前 `Preview` 在未传 `propsComponents` 时直接读取并更新 `useComponetsStore`，这会让试运行行为污染设计态 schema；`componentControl.setValue` 直接写入字符串值，无法解析 `event.value` 或 `{{event.value}}`；部分 Ant Design 物料以受控 prop 渲染，却没有运行态状态更新。

本次修复需要保持已有公开 API 和历史 typo 兼容，尤其不能改名 `useComponetsStore`、`useMaterailDrop`、`components/Preivew`、`components/Sourse`。公开发布页仍必须保持 `allowCustomJS={false}`。

## Goals / Non-Goals

**Goals:**

- 让编辑器预览态拥有独立运行态组件快照，事件动作不能直接写回设计态组件树。
- 让组件联动写值支持固定值、事件数据路径和 `{{...}}` 表达式。
- 让 Tabs、Pagination 和可点击 Steps 在预览/发布页点击后产生可见状态变化，并继续触发事件动作。
- 隐藏 Page 中尚未实现运行态行为且容易误导用户的配置入口。
- 修正版本回滚权限文案，并补充关键测试。

**Non-Goals:**

- 不实现完整 Page 工具栏、侧栏、下拉刷新和初始化接口运行态能力。
- 不改变事件动作 schema 的公开字段名和兼容迁移策略。
- 不放开发布页 custom JS。
- 不处理报告中列为“待验证风险”的 Table `url` 安全边界和 ProjectDashboard 刷新选中策略，除非实现中直接暴露相关失败。

## Decisions

1. Preview 使用本地 runtime state 作为默认数据源。

   `Preview` 初始化时从传入 `propsComponents` 或当前设计态 `components` 深拷贝出运行态快照。`setComponentProps` 和 `setComponentStyles` 只更新这份快照；渲染也读取快照。这样编辑器预览和发布页都共享同一套运行态更新语义，且不会污染设计态 store。替代方案是只在编辑器预览传入 `propsComponents`，但这会继续留下默认路径写 store 的风险。

2. 组件联动值解析收敛在 action runtime。

   `componentControl.setValue` 执行时对 `args.value` 做运行态解析：纯 `event.xxx` 或 `variables.xxx` 这类路径读取上下文值，`{{...}}` 使用已有安全表达式能力求值，普通固定值保持原样。配置面板保留现有存储格式，避免迁移历史数据。替代方案是在配置面板存储结构化 value source，但会扩大 schema 迁移范围。

3. 交互物料优先使用组件内部状态兜底。

   Tabs、Pagination、Steps 在运行态根据传入 prop 初始化本地状态，并在 prop 外部变化时同步；用户点击时更新本地状态并继续调用外部事件 handler。这样既让普通点击生效，又保留低代码动作链路。替代方案是强制依赖 `setComponentProps` 写回 runtime props，但会让基础控件不配置动作时仍然不可交互。

4. Page 未落地配置先从 setter 隐藏。

   对没有运行态 UI 或请求行为的 Page 配置项，不再在属性面板中展示，避免“看得到但没效果”。保留 `pageTitle`、`subTitle`、`showHeader`、`showContent`、`dataSources`、`variables`、SEO 等当前运行态或数据配置链路可消费的字段。后续若实现工具栏/侧栏/下拉刷新，再把对应 setter 加回。

## Risks / Trade-offs

- 运行态本地快照可能与外部传入 `propsComponents` 的更新时机不同步 → 使用 effect 在输入组件树变化时重新创建快照。
- 表达式解析如果过度宽松可能执行用户非预期表达式 → 复用现有安全表达式能力，并在解析失败时返回原值或 `undefined`，避免页面崩溃。
- Tabs/Pagination/Steps 增加本地状态后，与通过事件动作修改 `activeKey/current` 的运行态更新可能竞争 → 当 prop 变化时同步本地状态，以外部运行态 props 为最终输入。
- 隐藏 Page 配置会减少可见功能入口 → 这是对未落地能力的降级处理，优先保证界面不误导；真实能力实现可在后续 change 中恢复入口。
