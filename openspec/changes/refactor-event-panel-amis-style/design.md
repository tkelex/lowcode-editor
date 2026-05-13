## Context

当前事件页签经过上一轮增强后，已经具备事件筛选、事件数据 token、快捷添加动作等能力，但整体仍是“事件折叠详情”的结构。用户希望改成更接近 amis editor 的排版：顶部添加事件，事件以分组条出现，动作以可排序条目挂在事件下面，动作配置在大弹窗中完成，并且每个动作有专属配置表单。

项目已有稳定事件 schema：

```ts
component.props.onEvent[eventName].actions
```

运行态也已经支持多种动作类型，因此本次设计重点是重构配置体验，而不是重写事件执行器。

## Goals / Non-Goals

**Goals:**

- 事件页签提供清晰的“添加事件 -> 添加动作 -> 配置动作”的三段流程。
- 事件列表以分组条展示，类似 amis editor 的事件面板，不再把未配置事件全部铺开。
- 动作配置弹窗使用左右分栏：左侧选择动作类型，右侧填写该动作的专属配置。
- 动作类型按业务含义分组，并根据当前事件 `allowedActions` 自动过滤。
- 组件联动动作提供更强的专属配置：目标组件、操作类型、值来源、表达式/参数。
- 继续兼容已有 `props.onEvent` 数据，旧页面打开后能按已配置事件渲染。

**Non-Goals:**

- 不修改事件保存 schema。
- 不新增运行态动作执行能力。
- 不把 amis 的样式或依赖直接引入项目。
- 不实现页面生命周期、数据源自动加载等新事件类型。
- 不改变公开发布页禁用 `custom` 动作的安全规则。

## Decisions

### 1. 事件面板从“全量事件列表”改为“已添加事件列表”

右侧事件页签顶部放置一个全宽描边按钮 `添加事件`。点击后展示下拉面板，列出当前组件 registry 声明的可绑定事件；已添加到 `props.onEvent` 的事件在列表中置灰或隐藏，避免重复添加。

事件添加后，面板渲染事件分组条：

```text
添加事件

点击事件                         +  清空  复制  展开
  ⋮  消息提示     success: 保存成功        设置  删除
  ⋮  HTTP 请求    POST /api/save          设置  删除

双击事件                         +  删除  展开
```

这样比全量折叠面板更接近用户期望，也能让“这个组件已经配置了哪些事件”一眼可见。

### 2. 保留 registry 作为可添加事件来源

事件下拉只读取 `componentConfig[curComponent.name].events`。这保证组件支持哪些事件仍然由 registry 控制，避免 UI 自己创造无法运行的事件。保存时仍写入 `props.onEvent[getLowcodeEventName(event.name)].actions`。

旧页面兼容规则：

- 如果 `props.onEvent` 已有动作，面板自动显示对应事件分组。
- 如果旧字段如 `props.onClick.actions` 被 normalize 读取到，也应在编辑后迁移到 `onEvent`。
- 如果某个历史事件不在当前 registry 中，可作为“未知事件”弱提示展示，但不允许继续新增同类事件。

### 3. 动作配置弹窗改为动作选择器 + 专属表单

`ActionModal` 不再只用一个顶部 Select。弹窗结构改成：

```text
动作配置        常用动作：回退页面 / 消息提醒 / HTTP 请求
┌───────────────┬─────────────────────────────────────┐
│ 搜索执行动作  │  动作说明                            │
│ 页面          │  基础设置                            │
│  跳转链接     │  [页面地址 / URL / 参数 / 新窗口]      │
│  回退页面     │  高级设置                            │
│ 弹窗消息      │                                     │
│ 服务          │                                     │
│  HTTP 请求    │                                     │
│ 组件联动      │                                     │
└───────────────┴─────────────────────────────────────┘
```

左侧动作树由本地 action catalog 派生，每个 actionType 有分类、名称、说明、是否常用、搜索关键词。右侧仍复用现有 `actions/*` 表单组件，缺口较大的 `componentControl` 单独增强。

### 4. 动作分类以低代码使用场景命名

建议动作分类：

| 分类 | 动作 |
| --- | --- |
| 页面 | `url`，后续可映射“回退页面/刷新页面”等内置动作 |
| 弹窗消息 | `toast`，`confirm` |
| 服务 | `http` |
| 组件联动 | `componentAction`，`componentControl`，`setComponentProps`，`setComponentStyles` |
| 数据 | `setVariable` |
| 逻辑 | `condition` |
| 高级 | `custom` |

当前运行态没有“刷新页面、回退页面”原生 actionType。本次可以把它们先作为 `url` 或 `custom` 的常用模板处理，或仅在 catalog 中预留但不开放，避免 UI 暗示已支持但运行态无法执行。

### 5. 组件联动配置要像专属动作，而不是泛 JSON 表单

组件联动配置应按操作类型展示不同字段：

- 显示/隐藏、启用/禁用：目标组件 + 操作类型。
- 设置/清空值：目标组件 + 值来源，支持固定值、事件数据、表达式。
- 打开/关闭弹窗：目标 Modal/Drawer + open/close。
- 提交/重置表单：目标 Form + submit/reset。
- 调用方法：目标组件 + 方法 + 参数列表。
- 设置属性/样式：目标组件 + JSON 编辑或字段辅助输入。

实现上可以保留 `componentControl`、`componentAction`、`setComponentProps`、`setComponentStyles` 四种 actionType，但在 UI 中归到“组件联动”分类。

### 6. 视觉风格参考 amis，但落到本项目设置面板规范

参考 amis editor 的信息结构，不照搬大面积灰底和图标体系。右侧面板仍使用项目现有工具型视觉：白底、细边框、紧凑分组条、图标按钮、蓝色主按钮。动作配置弹窗可以比右侧面板更宽，承载复杂表单。

## Risks / Trade-offs

- [Risk] 当前 `ActionModal` 表单已经很多，重构弹窗可能影响已有动作编辑。
  → Mitigation: 先建立 action catalog 和 shell，再逐个迁移表单；保留每个 action 的原始 value/onChange 契约。

- [Risk] 添加事件后如果没有动作，用户可能误以为事件已经生效。
  → Mitigation: 事件分组条显示 `0 个动作` 或空动作区，并提供醒目的 `添加动作`。

- [Risk] 常用动作名称如“回退页面”可能没有直接运行态支持。
  → Mitigation: 只开放已有 actionType 能稳定表达的动作；需要新 runtime 能力时另开 change。

- [Risk] 未添加事件不再全量展示，用户可能不知道组件支持哪些事件。
  → Mitigation: 顶部 `添加事件` 下拉中展示事件名称和说明，并在空状态提示“从添加事件开始配置”。

- [Risk] 动作排序/拖拽增加复杂度。
  → Mitigation: 第一阶段可用上移/下移按钮实现排序，拖拽作为后续增强。

## Migration Plan

无需数据迁移。实现时按以下顺序渐进替换：

1. 从 `props.onEvent` 和 registry 推导已添加事件分组。
2. 增加 `添加事件` 下拉与事件分组条。
3. 保留旧动作列表能力，改造为动作条。
4. 重构 `ActionModal` 为左右分栏动作选择器。
5. 增强组件联动专属配置。
6. 更新 E2E 覆盖和事件文档。

回滚策略：保留 `ComponentEvent` 与 `ActionModal` 的边界，出现问题时可以回退到上一版事件页签，不影响已保存的 `props.onEvent`。

## Open Questions

- “回退页面、刷新页面”是否要在本次实现为正式 runtime action，还是先作为后续能力规划？
- 是否需要支持事件分组拖拽排序？目前事件执行顺序只在事件内动作列表有意义，事件之间没有运行顺序。
