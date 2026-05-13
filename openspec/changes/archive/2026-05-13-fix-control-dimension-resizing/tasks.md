## 1. 现状确认

- [x] 1.1 复查 Button、Input、Select、Textarea、DatePicker、Upload、Popover、Notification 等控件类物料的 `styles` 分发方式
- [x] 1.2 确认外观面板宽度、高度、清空、恢复默认样式的当前行为
- [x] 1.3 明确哪些物料属于控件类尺寸同步范围，哪些属于容器类只作用于自身

## 2. 尺寸同步实现

- [x] 2.1 调整 `splitControlStyles` 或新增辅助逻辑，让控件类物料可以把宽高尺寸同步到真实控件
- [x] 2.2 修复 Button 编辑态宽高，使外壳和真实 `button` 尺寸一致
- [x] 2.3 修复 Input、Select、Textarea、DatePicker 等表单控件编辑态宽高
- [x] 2.4 修复 Upload、Popover、Notification 等按钮型反馈控件编辑态宽高
- [x] 2.5 确保清空宽高字段和恢复默认样式会同时恢复外壳与真实控件尺寸

## 3. 回归测试

- [x] 3.1 在 `e2e/editor-regression.spec.ts` 中补充 Button 宽高真实生效断言
- [x] 3.2 在 `e2e/editor-regression.spec.ts` 中补充 Input 宽高真实生效断言
- [x] 3.3 补充至少一个 Select/DatePicker/Upload 等同类控件尺寸真实生效断言
- [x] 3.4 覆盖清空宽高或恢复默认后的尺寸回退行为

## 4. 验证

- [x] 4.1 运行 `npm run lint`
- [x] 4.2 运行 `npm run build`
- [x] 4.3 运行 `npm run test:e2e:editor`
- [x] 4.4 运行 `openspec validate fix-control-dimension-resizing`
