## 1. 准备与定位

- [x] 1.1 阅读本 change 的 `proposal.md`、`design.md`、`specs/event-actions/spec.md`、`specs/editor-interaction-styling/spec.md` 和 `reports/functional-bug-audit.md`
- [x] 1.2 检查 `git status --short --untracked-files=all`，确认现有未提交改动，避免覆盖用户现场
- [x] 1.3 定位 Preview、action runtime、p3 物料、Page 配置和 Header 文案的当前实现与测试入口

## 2. 事件动作运行态修复

- [x] 2.1 修改 `src/editor/runtime/Preview/index.tsx`，让 Preview 默认使用独立运行态组件快照渲染和执行 `setComponentProps` / `setComponentStyles`
- [x] 2.2 确认编辑器预览态和发布页都不因运行态动作写回设计态 `useComponetsStore`
- [x] 2.3 修改 `packages/lowcode-schema/src/action-runtime.ts`，让 `componentControl.setValue` 支持固定值、事件数据路径和 `{{...}}` 表达式解析
- [x] 2.4 补充或更新 action runtime 测试，覆盖 `event.value`、`{{event.value}}` 和固定值写入

## 3. 物料与设置面板修复

- [x] 3.1 修改 Tabs 运行态物料，使点击标签后更新当前激活项并继续触发 change 事件
- [x] 3.2 修改 Pagination 运行态物料，使点击页码后更新当前页并继续触发 change 事件
- [x] 3.3 修改 Steps 运行态物料，使允许点击时更新当前步骤并继续触发 change 事件
- [x] 3.4 修改 Page registry 配置，隐藏尚未落地运行态行为的工具栏、侧栏、控件提示、下拉刷新、初始化接口和静态组件数据入口
- [x] 3.5 修正 `src/editor/components/Header/index.tsx` 中回滚无权限提示文案

## 4. 验证与收尾

- [x] 4.1 运行针对 action runtime 的测试命令，确认组件联动值解析通过
- [x] 4.2 运行 `npm run check:editor-props`，确认 Page 配置和 setter 消费检查通过
- [x] 4.3 运行 `npm run lint`
- [x] 4.4 根据改动范围运行 `npm run test` 或说明未运行原因
- [x] 4.5 最终运行 `openspec status --change "fix-functional-bug-audit-issues"` 并确认任务完成状态
