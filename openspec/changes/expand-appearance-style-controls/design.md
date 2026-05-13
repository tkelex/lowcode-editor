## Context

右侧设置面板已经完成一轮 amis 风格改造，当前外观页签由 `ComponentStyle.tsx` 负责读取当前组件、渲染 `stylesSetter`、同步 CSS 源码并写入 Zustand 组件树的 `styles` 字段。现有 `commonStyleSetters` 只有宽度、高度、外边距、内边距四个字段，Text 额外增加了字号和颜色，因此用户在大多数物料上无法通过可视化表单调整字体、颜色、边框、背景、布局、显示、溢出等常用样式。

本次需求参考 amis editor 的外观检查器体验，但项目不应引入 amis 依赖，也不应改变页面 schema。目标是在现有面板、registry 和 store 契约上扩展样式能力，并把字段以更适合扫描和搜索的方式呈现。

## Goals / Non-Goals

**Goals:**

- 把通用外观字段从少量尺寸项扩展为覆盖布局、尺寸、间距、文字、背景、边框、效果和显示状态的样式目录。
- 让外观页签按分组展示字段，而不是把所有字段堆成一个长列表。
- 为不同 CSS 语义选择合适控件：颜色、枚举、px 数字、无单位数字、文本输入等。
- 保持快捷样式、CSS 源码、画布渲染和组件 `styles` 的双向同步。
- 保持 `stylesSetter` 兼容旧写法，已有物料无需一次性全部重写也能工作。
- 对 Button、Input、Select 等真实 Ant Design 控件继续保证样式应用到控件本体，而不是只改变可选中外壳。

**Non-Goals:**

- 不引入 amis、amis-editor 或新的大型样式编辑器依赖。
- 不新增外观专用 schema，不改变组件树保存结构。
- 不实现伪类、媒体查询、复杂选择器、主题变量或全局 CSS 管理。
- 不把所有 CSS 属性都暴露为控件；本次只覆盖页面搭建高频样式。
- 不重构属性页签、事件页签、左侧物料面板或三栏布局。

## Decisions

### 1. 扩展 `ComponentSetter` 元数据而不是新增样式 schema

`ComponentSetter` 当前允许 `[key: string]: any`，可以在保持兼容的前提下补充样式相关元数据，例如：

- `group`: 所属分组，例如 `layout`、`size`、`spacing`、`typography`、`background`、`border`、`effect`。
- `keywords`: 搜索关键词。
- `unit`: `px`、`number`、`percent` 或 `text`。
- `control`: `color`、`select`、`number`、`input` 等更明确的控件语义。
- `min`、`max`、`step`、`placeholder` 等输入辅助信息。

旧字段仍继续支持 `name`、`label`、`type`、`options`。实现时可以先在 `factory.ts` 增加样式 setter 工厂函数和预设数组，再逐步替换 `commonStyleSetters` 的定义。

备选方案是新增独立 `styleGroups` 配置。它更强类型，但会让 registry 同时维护两套样式配置入口，并增加旧物料迁移成本。本次优先保持一个入口。

### 2. 用共享样式目录生成通用外观字段

在 `factory.ts` 中建立统一的样式目录，例如：

- 布局：`display`、`flexDirection`、`justifyContent`、`alignItems`、`gap`、`position`、`top`、`right`、`bottom`、`left`、`zIndex`、`overflow`。
- 尺寸：`width`、`height`、`minWidth`、`minHeight`、`maxWidth`、`maxHeight`。
- 间距：`margin`、`marginTop`、`marginRight`、`marginBottom`、`marginLeft`、`padding`、`paddingTop`、`paddingRight`、`paddingBottom`、`paddingLeft`。
- 文字：`fontSize`、`fontWeight`、`lineHeight`、`color`、`textAlign`、`textDecoration`、`whiteSpace`。
- 背景：`backgroundColor`、`backgroundImage`、`backgroundSize`、`backgroundPosition`、`backgroundRepeat`。
- 边框：`borderWidth`、`borderStyle`、`borderColor`、`borderRadius`。
- 效果：`boxShadow`、`opacity`、`visibility`。

`commonStyleSetters` 可以指向这个扩展后的通用目录。特殊物料可以继续追加或覆盖字段，例如 Image 更重视 `objectFit`，Text 可优先展示文字分组，容器可优先展开布局分组。

备选方案是为每类物料写完全独立的样式数组。它能更精确，但会造成重复和后续维护困难。

### 3. 外观面板按分组渲染，搜索跨分组过滤

`ComponentStyle.tsx` 应先把当前组件的 `stylesSetter` 归类为分组数据，再渲染嵌套或连续的分组块。建议保持外层仍是“快捷样式”和“CSS 源码”两个主分组，在“快捷样式”内部使用二级分组：

- 高频分组默认展开，例如尺寸、间距、文字。
- 低频分组默认收起，例如定位、效果、背景图片。
- 分组标题展示当前可见字段数。
- 搜索时匹配字段 `name`、`label`、`keywords`、`groupLabel`，隐藏无匹配字段的二级分组。

这样保留截图中的检查器结构，也避免右侧面板出现过长的无序表单。

### 4. 样式值规范化由字段元数据驱动

现有 `isPxDimensionStyle` 靠固定字段名判断是否加 `px`。扩展后应逐步改为使用 setter 元数据：

- `unit: 'px'`：表单显示数字，写入 `Npx`，清空时删除 style。
- `unit: 'number'`：写入数字或数字字符串，适用于 `opacity`、`zIndex`、`lineHeight` 等。
- `control: 'color'`：允许颜色选择和手动输入十六进制、rgb、var 等合法 CSS 值。
- `control: 'select'`：只写入选项值，清空时删除 style。
- 默认文本输入：原样写入非空字符串，清空时删除 style。

为了兼容已有配置，缺少元数据时仍回退到当前字段名判断逻辑。

### 5. 真实控件样式落点继续由 `splitControlStyles` 保护

布局、定位、外边距等影响编辑器选中外壳的样式应留在 shell；字体、颜色、边框、背景、内边距等视觉样式应传给真实控件。`splitControlStyles` 需要从“宽高双写、外边距 shell-only”扩展为更完整的分类规则。

实现时优先覆盖现有单控件物料：Button、Input、Select、Textarea、DatePicker、Upload、Switch 等。容器类、文字类和图片类物料可以直接将样式应用到根节点或对应真实元素。

## Risks / Trade-offs

- [Risk] 外观字段一次性增加太多，右侧面板可能变得拥挤。  
  → Mitigation: 使用二级分组、默认展开高频项、搜索过滤和 CSS 源码兜底。

- [Risk] 部分 CSS 属性对 Ant Design 组件内部 DOM 不一定完全生效。  
  → Mitigation: 对单控件物料维护样式落点分类，并在回归测试中覆盖 Button、Input、Select 等代表组件。

- [Risk] `px`、无单位数字和字符串值转换不一致会导致表单与 CSS 源码显示不同步。  
  → Mitigation: 统一从 setter 元数据读取单位规则，并保留字段名回退逻辑。

- [Risk] 扩展 `commonStyleSetters` 后所有物料都会出现更多字段，测试面变大。  
  → Mitigation: 先用共享目录和分组控制信息架构，特殊物料只做必要追加，避免每个物料手工复制配置。

- [Risk] CSS 源码能输入表单目录之外的合法内联样式。  
  → Mitigation: 允许保存并渲染这些样式；可视化表单只同步已声明 setter 的字段，CSS 源码作为高级入口保留完整声明。

## Migration Plan

不需要数据迁移。已有页面仍从组件节点的 `styles` 字段读取样式。

实施顺序：

1. 扩展 `ComponentSetter` 的样式元数据约定和共享样式 setter 工厂。
2. 扩展 `commonStyleSetters`，并为必要物料补充专属样式字段。
3. 重构 `ComponentStyle.tsx`，把快捷样式渲染为二级分组，并改造搜索、字段计数和空状态。
4. 将样式值规范化逻辑改为优先读取 setter 元数据。
5. 扩展 `splitControlStyles` 和代表物料的样式落点。
6. 更新外观面板 CSS，确保分组、控件、颜色输入和紧凑布局稳定。
7. 补充回归测试并运行 `npm run lint`、`npm run build`、`npm run test:e2e:editor`。

回滚策略：因为不改变保存结构，可回退 `factory.ts`、`ComponentStyle.tsx`、`settingPanel.css` 和物料样式落点改动；已有页面数据不受影响。

## Open Questions

- 是否需要在后续 change 中引入可视化盒模型控件，把四方向 margin/padding 合并成一个更直观的编辑器？本次先以常规字段分组实现。
- 是否需要对不同物料隐藏不适用字段，例如表格列不展示定位，图片额外展示 `objectFit`？本次先支持通用目录加少量专属字段。
