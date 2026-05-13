## Context

当前右侧设置面板由 `Setting/index.tsx` 统一承载属性、外观、事件三个页签。“属性”页签的 `ComponentAttr.tsx` 读取当前选中组件 registry 中的 `setter` 数组，并以单个 Collapse 分组渲染 input、textarea、select、inputNumber 等少量控件。这个实现足够简单，但带来几个问题：属性数量少、所有字段平铺、布尔项只能用 Select 表达、页面级和数据级配置不够接近 amis editor 的配置密度。

项目现有约束是组件节点继续使用 `{ id, name, props, styles, desc, children?, parentId? }`，属性编辑继续通过 `useComponetsStore.updateComponentProps` 写入 `props`。本次重构只增强编辑器配置体验，不改变后端保存协议、预览事件协议或公开运行时安全规则。

## Goals / Non-Goals

**Goals:**

- 将属性页签整理为 amis editor 风格的分组式检查器，支持基础、数据、移动端等常见分组。
- 扩充常用物料的 `setter` 覆盖范围，让 Page、Button、Text、Image、Container、Card、Form、Input、Select、Table 等组件展示更多可编辑属性。
- 兼容现有 setter 数组，新增元信息必须是可选字段，旧配置无需迁移即可继续渲染。
- 提供更合适的属性控件：布尔开关、JSON 文本、多行文本、URL 输入、数字输入、选择器、帮助说明和占位提示。
- 保持设置面板搜索、空状态、即时更新和当前选中组件同步行为稳定。

**Non-Goals:**

- 不引入 amis editor 作为依赖，也不照搬其 schema。
- 不改变组件树、页面保存格式、后端 API 或事件动作数据结构。
- 不在本次变更中实现完整数据源请求编排；新增“初始化接口”等属性先作为组件 props 暴露，具体运行时拉取能力另行设计。
- 不重写外观页签或事件页签，除非为了共享样式类名做极小调整。

## Decisions

1. **以兼容扩展 `ComponentSetter` 的方式承载属性元信息。**

   `ComponentSetter` 当前已经允许 `[key: string]: any`，实现时可补充显式可选字段，例如 `group`、`help`、`placeholder`、`componentProps`、`rows`、`min`、`max`、`mode`、`collapsible`。旧 setter 没有这些字段时默认进入“基本”分组。相比新增独立属性 schema，这个方案改动小，也能复用 registry 和表单更新链路。

2. **属性面板负责分组和控件渲染，registry 负责声明“该展示什么”。**

   `ComponentAttr.tsx` 应从 setter 中归并分组，按照预设顺序展示“基本”“数据”“移动端”“高级”等分组，并在每个分组标题中显示当前搜索后的字段数量。registry 只声明字段类型、标签、分组和辅助信息，不直接关心布局样式。

3. **布尔属性优先用 Switch 或 Checkbox，不再用 Select 模拟。**

   对截图中的“控件提示”“侧栏固定”“下拉刷新”等二值项，应使用 Ant Design `Switch` 或 `Checkbox`，以减少点击成本。已有 `selectSetter(..., boolOptions)` 保持兼容，新增配置优先使用 `switchSetter` 或 `checkboxSetter` 工厂函数。

4. **JSON 属性使用受控文本域加轻量校验，不在输入中破坏数据。**

   `variables`、`dataSources`、`dataText`、`componentData` 等属性仍以字符串存储，编辑器可在文本域失焦或值变化时做 JSON 格式提示。校验失败时展示错误反馈，但不自动覆盖用户输入，也不阻断其他属性编辑。

5. **新增 props 必须被 material 有选择地消费。**

   对会影响画布可见结果的属性，例如 Button 的文本/类型/禁用、Page 的标题/副标题、Image 的地址/宽高、Table 的数据/分页，应确保 dev/prod 已消费或在实现任务中补齐。对先行暴露但尚无运行时能力的配置，例如初始化接口，可作为 props 保存和展示，不假装完成真实请求能力。

6. **样式保持项目设置面板体系。**

   视觉上参考用户截图和 amis editor demo：白底、浅灰分组头、细边框、蓝色活动页签、紧凑表单、12px 标签。实现仍放在 `src/editor/settingPanel.css`，避免把属性页签做成独立的外观体系。

## Risks / Trade-offs

- 属性数量增加导致面板过长 -> 通过分组折叠、搜索过滤、紧凑控件高度和清晰空状态降低浏览成本。
- 新增 props 没有被 material 消费会造成“可编辑但无效果” -> 任务中逐项核对常用物料 dev/prod，对暂不具备运行时能力的属性在帮助说明中标明配置用途。
- JSON 文本校验过严会打断输入 -> 采用提示型校验，保留原始输入，避免在用户编辑半截 JSON 时清空字段。
- registry 元信息变多后维护成本提高 -> 通过 `factory.ts` 增加工厂函数和分组选项复用，减少散落的重复对象。
- 旧页面没有新增 props -> material 继续使用默认值兜底，表单加载时用当前 props 合并默认展示，不需要迁移历史数据。

## Migration Plan

- 先扩展 setter 类型和工厂函数，再改造 `ComponentAttr.tsx` 分组渲染。
- 逐个扩充 registry 配置，并同步必要 material 的默认值和 props 消费逻辑。
- 旧组件节点无需数据迁移；新增属性缺省时使用 registry `defaultProps` 或 material 内部默认值。
- 若实现中发现新增属性影响运行时稳定性，可仅回滚对应 registry 字段或 material 消费逻辑，不影响页面 schema。

## Open Questions

- “初始化接口”在本次是否只作为页面配置保存，还是需要立即触发请求并写入页面数据域？本提案默认只展示和保存配置。
- Page 的“区域展示”是否需要真实控制内容区、标题栏、工具栏、边栏显隐？本提案默认至少在属性面板保存配置，并在后续实现中优先让标题/副标题可见。
