## Context

事件系统当前已经形成稳定链路：物料 registry 通过 `events` 声明可绑定事件，右侧设置面板读取当前组件的事件声明，动作内容写入 `props.onEvent[eventName].actions`，预览态统一注入事件 prop 并执行动作。现有设计的风险点不在 schema，而在右侧事件页签的信息密度和可发现性：用户能添加动作，但不容易快速判断哪些事件已配置、每个事件能引用哪些数据、动作将按什么顺序执行。

本变更面向编辑器右侧设置区，遵循现有工具型 UI 规范：紧凑、可扫读、弱装饰、保留 Ant Design 和现有 CSS/Tailwind 混合写法。

## Goals / Non-Goals

**Goals:**

- 让事件页签清晰表达“事件 -> 事件数据 -> 动作流水线”的配置模型。
- 支持按配置状态和事件类别筛选，降低多事件组件的扫读成本。
- 让事件数据以 token 形式呈现并可复制，方便用户在动作配置中引用。
- 保留现有动作能力：新增、编辑、删除、复制、启用/禁用、排序。
- 同步文档中的组件事件策略，确保新增物料时有明确事件规划依据。

**Non-Goals:**

- 不修改 `props.onEvent[eventName].actions` schema。
- 不新增事件 action 类型。
- 不改变预览态事件执行器、安全边界或公开页 `allowCustomJS=false` 行为。
- 不为 `FormItem`、`TableColumn` 等结构节点单独引入事件配置。
- 不引入新的 UI 依赖。

## Decisions

### 1. 保持 registry 驱动，UI 只增强呈现

事件页签继续从 `componentConfig[curComponent.name]?.events` 获取事件声明，从 `getComponentEventConfig` 获取已配置动作。筛选、统计、token 展示均作为 UI 派生状态，不写入组件树。

备选方案是为事件面板建立独立配置模型或缓存索引，但这会引入同步问题，也不符合当前轻量编辑器状态设计。

### 2. 增加面板内筛选，不改变全局搜索入口

现有设置面板顶部已有搜索框，事件页签继续复用该 keyword；新增的状态/类别筛选放在事件面板内部，作为紧凑 segmented control。这样不会打破属性、外观、事件三个页签共用搜索入口的既有约定。

备选方案是在顶部搜索区加入更多筛选控件，但会影响属性和外观页签，并让右侧头部过重。

### 3. 事件数据使用可复制 token

`event.eventDataSchema` 渲染为 `event.xxx` token；没有声明数据时展示 `event.args` 兜底。点击 token 复制文本，并用 message 做轻提示。token 只是展示能力，不改变动作表单数据结构。

备选方案是把 token 插入当前动作表单光标位置，但当前动作表单分散在多个组件里，直接插入会增加耦合。

### 4. 动作添加入口保持一个主路径，空状态增加快捷按钮

事件 header 的加号继续作为统一入口；空状态中增加常用动作快捷入口，点击后打开相同 `ActionModal`，但预选对应 actionType。这样能减少第一次配置动作的摩擦，也避免维护两套动作表单。

备选方案是直接在空状态内嵌常用动作表单，但会让右侧面板过重，且与现有 800px modal 表单体验冲突。

### 5. 文档先同步当前能力，再标注后续事件方向

组件事件矩阵应忠实记录当前 registry 已落地事件；对于 `rowClick`、`loadSuccess`、`Image error` 等后续方向，放在规划文档的优先级和待办中，不提前写入当前能力矩阵。

备选方案是一次性扩展 registry 事件，但会牵涉 prod 物料转发、事件数据生成和回归测试，超出本次 UI 规划范围。

## Risks / Trade-offs

- 筛选控件占用右侧窄面板空间 → 使用紧凑按钮组和横向自动换行，避免固定宽度溢出。
- token 过多导致事件数据区拥挤 → token 使用小尺寸、允许换行，并保持浅灰分组背景。
- 快捷添加动作可能绕过 allowedActions → 所有入口仍基于当前事件的 `allowedActions` 过滤，不允许配置未声明动作。
- 文档与 registry 漂移 → 实现完成后同步 `事件能力矩阵.md` 和 `事件动作规划.md`，并在任务中要求检查 registry。

## Migration Plan

无需数据迁移。已有页面 schema 的 `props.onEvent`、旧事件字段兼容逻辑和预览运行态保持不变。

回滚策略：如果事件页签 UI 出现问题，可回退 `ComponentEvent.tsx`、`ActionModal.tsx` 和 `settingPanel.css` 的本次修改，不影响已有 schema 数据。

## Open Questions

无阻塞问题。本次先完成面板体验和文档同步；数据类高级事件和动作调试能力保留为后续 change。
