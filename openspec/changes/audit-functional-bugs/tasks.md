## 1. 审查准备

- [x] 1.1 阅读 `AGENTS.md`、`docs/00-总览/AI快速上手.md`、`.claude/context/FILE_MAP.md` 和本 change 的 `proposal.md`、`design.md`、`specs/functional-bug-audit/spec.md`
- [x] 1.2 检查 `git status --short`，记录已有未提交改动，避免覆盖用户现场
- [x] 1.3 创建或更新 `reports/functional-bug-audit.md`，准备按严重程度记录发现、待验证风险和验证建议

## 2. 静态功能有效性扫描

- [x] 2.1 扫描 `src/editor/components/**` 中按钮、菜单、抽屉、表单项和工具栏控件，确认是否绑定 handler、store 更新或 API 调用
- [x] 2.2 扫描 `src/editor/registry/**` 与 `src/editor/materials/**`，确认 setter 写入的 props/styles 在 dev/prod 物料中被消费
- [x] 2.3 扫描 `src/editor/events/**`、`src/editor/runtime/Preview/index.tsx` 和 `src/editor/components/Setting/**`，确认事件配置、迁移和运行时动作链路一致
- [x] 2.4 扫描 `src/features/projects/**`、`src/shared/api/**`、`src/app/**` 和 `server/src/modules/**`，确认项目入口、保存、发布、公开读取和权限接口链路没有空实现或断链
- [x] 2.5 记录 TODO、空函数、只显示 message 但无实际状态变化、catch 后吞错、未使用配置字段等可疑点，并逐项确认是否构成 bug

## 3. 关键工作流走查

- [x] 3.1 走查页面打开与 schema 迁移链路：项目面板进入编辑器、`useEditorPageLoader`、Zustand store 初始化和保存序列化
- [x] 3.2 走查物料添加与移动链路：MaterialItem 拖拽、`useMaterialDrop`、组件树变更、父子关系校验和大纲同步
- [x] 3.3 走查属性/样式/事件配置链路：设置面板回填、修改、撤销重做、预览消费和保存后恢复
- [x] 3.4 走查预览与公开发布链路：Preview 事件注入、runtime actions、published page `allowCustomJS={false}` 和错误兜底
- [x] 3.5 走查项目仪表盘和后台操作链路：创建项目/页面、成员/发布记录抽屉、管理员操作和 API 错误反馈

## 4. 报告与后续修复队列

- [x] 4.1 在 `reports/functional-bug-audit.md` 中按 P0/P1/P2/P3 记录确认问题，包含文件位置、触发步骤、实际结果、期望结果、影响和建议修复方向
- [x] 4.2 对无法确认的问题单独记录为待验证风险，标注需要的运行条件、账号数据、后端服务或复现命令
- [x] 4.3 将高严重度问题整理为后续修复建议队列，说明建议先修哪些、哪些可延后
- [x] 4.4 为每类问题标注建议验证命令或测试补充点，优先复用 `npm run lint`、`npm run test`、`npm run build`、`npm run check`、`npm run test:e2e:editor`、`npm run smoke:api`

## 5. 验证

- [x] 5.1 运行与审查过程相关的轻量验证命令，至少执行 `npm run lint` 或说明未执行原因
- [x] 5.2 如审查过程中修改了报告以外的代码或测试，运行对应范围的 `npm run test`、`npm run build` 或 `npm run check`
- [x] 5.3 最终确认 OpenSpec 状态为 apply-ready，并在交付说明中列出报告路径、主要发现数量和剩余风险
