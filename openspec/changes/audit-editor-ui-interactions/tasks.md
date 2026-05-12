## 1. OpenSpec 准备

- [x] 1.1 补齐 `audit-editor-ui-interactions` 的 proposal、design、spec 和 tasks 文档
- [x] 1.2 验证变更 artifacts 满足 apply 阶段要求

## 2. UI/交互巡检

- [x] 2.1 运行现有编辑器 e2e 回归，确认基线状态
- [x] 2.2 扫描控件类物料编辑态实现，找出 styles 可能只作用到外壳的组件
- [x] 2.3 检查画布、右键菜单、设置面板样式输入和物料真实样式生效路径

## 3. 修复与回归

- [x] 3.1 修复巡检发现的真实 UI/交互缺陷
- [x] 3.2 为发现的问题补充 `e2e/editor-regression.spec.ts` 回归测试
- [x] 3.3 确认回归测试覆盖画布、右键菜单、设置面板和物料真实样式生效

## 4. 验证

- [x] 4.1 运行 `npm run lint`
- [x] 4.2 运行 `npm run build`
- [x] 4.3 运行 `npm run test:e2e:editor`
- [x] 4.4 运行 `openspec validate audit-editor-ui-interactions`
