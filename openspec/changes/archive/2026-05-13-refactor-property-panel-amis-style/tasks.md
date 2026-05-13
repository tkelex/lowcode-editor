## 1. Setter 元信息与工厂函数

- [x] 1.1 扩展 `ComponentSetter` 类型，补充 `group`、`help`、`placeholder`、`rows`、`min`、`max`、`mode`、`componentProps` 等可选字段，并保持旧 setter 兼容。
- [x] 1.2 在 `src/editor/registry/factory.ts` 增加 `switchSetter`、`checkboxSetter`、`jsonSetter`、`urlSetter` 等工厂函数，统一分组、占位和帮助说明写法。
- [x] 1.3 梳理属性分组常量和排序规则，确保未声明分组的旧字段默认进入“基本”分组。

## 2. 属性页签结构重构

- [x] 2.1 重构 `ComponentAttr.tsx`，将当前组件 setter 按分组归并，并按“基本”“数据”“移动端”“高级”等顺序渲染 Collapse 分组。
- [x] 2.2 实现属性页签搜索过滤：按 setter `name`、`label`、`group`、`help` 匹配，只显示包含匹配项的分组。
- [x] 2.3 为无属性、搜索无匹配、当前组件缺失等情况补齐明确空状态，避免属性页签出现空白区域。
- [x] 2.4 保持组件切换时表单值同步，表单初始值应合并 registry `defaultProps` 与当前组件 `props`。

## 3. 属性控件渲染与校验

- [x] 3.1 在 `renderFormElement` 中支持 `switch`、`checkbox`、`json`、`url`、`textarea`、`inputNumber`、`select` 等控件类型。
- [x] 3.2 为布尔属性使用紧凑开关或复选框控件，确认值变化仍通过 `updateComponentProps` 写入当前组件 `props`。
- [x] 3.3 为 JSON 类属性提供多行文本、格式提示和轻量校验，格式错误时展示反馈但不清空用户输入。
- [x] 3.4 支持 setter 的 `placeholder`、`help`、`componentProps` 等元信息传递到 Ant Design 控件或 Form.Item。

## 4. Registry 属性扩充

- [x] 4.1 扩充 Page 的属性配置，覆盖区域展示、页面标题、副标题、控件提示、侧栏宽度可调节、侧栏固定、组件静态数据、初始化接口、移动端下拉刷新等字段。
- [x] 4.2 扩充 Button、Text、Image、Container、Card 等基础/布局物料的常用属性，并为布尔项、URL、尺寸、文本等选择合适控件类型。
- [x] 4.3 扩充 Form、FormItem、Input、Textarea、Select、Switch 等表单物料的状态、默认值、占位、校验、选项和布局属性。
- [x] 4.4 扩充 Table、TableColumn、List、Descriptions、Statistic 等数据物料的数据、空状态、分页、字段映射和展示属性。
- [x] 4.5 确认新增属性不会破坏已有默认值、拖拽创建组件和历史页面加载。

## 5. Material 同步与运行时表现

- [x] 5.1 检查常用物料 `dev.tsx` / `prod.tsx` 对新增 props 的消费情况，补齐会影响画布或预览可见结果的属性。
- [x] 5.2 让 Page 的页面标题、副标题等基础展示属性在编辑画布中有可见反馈；初始化接口等暂不执行的属性保留为配置。
- [x] 5.3 确认 Button、Input、Select、Table 等组件新增属性在编辑模式和预览模式行为一致。

## 6. 样式与视觉还原

- [x] 6.1 更新 `src/editor/settingPanel.css`，让属性页签接近参考截图的紧凑检查器风格：浅灰分组头、细边框、白底、蓝色活动态和稳定控件高度。
- [x] 6.2 调整分组标题、字段标签、帮助文本、空状态、开关/复选框行距，确保右侧窄面板中不溢出、不遮挡。
- [x] 6.3 保持属性、外观、事件三个页签视觉一致，避免属性页签引入孤立的卡片式装饰。

## 7. 验证

- [x] 7.1 补充或更新编辑器回归测试，覆盖属性分组展示、搜索过滤、布尔开关、JSON 属性、Page 属性和常用物料属性编辑。
- [x] 7.2 运行 `npm run lint` 和 `npm run build`，确认 TypeScript、React 和样式改动可构建。
- [x] 7.3 如环境允许，运行 `npm run test:e2e:editor` 并检查右侧属性面板实际效果。
- [x] 7.4 运行 OpenSpec 状态或校验命令，确认本 change 处于可 apply 状态。
