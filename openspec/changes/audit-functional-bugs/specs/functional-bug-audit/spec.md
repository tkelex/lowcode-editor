## ADDED Requirements

### Requirement: 审查必须覆盖主要功能工作流
系统 SHALL 对低代码编辑器的主要功能工作流执行功能有效性审查，至少覆盖项目入口、页面加载、物料拖拽、组件选择、大纲操作、属性配置、样式配置、事件配置、预览执行、保存发布和公开访问链路。

#### Scenario: 审查编辑器核心路径
- **WHEN** 执行功能有效性审查
- **THEN** 审查结果 MUST 覆盖编辑态、预览态、物料 dev/prod 实现、组件树 store、拖拽 hook、设置面板、事件运行时和 Header 保存发布流程

#### Scenario: 审查项目与发布路径
- **WHEN** 执行功能有效性审查
- **THEN** 审查结果 MUST 覆盖项目仪表盘入口、页面创建/进入、页面 schema 加载、公开发布页读取和 `allowCustomJS` 安全边界

### Requirement: 审查必须识别无实际作用的界面能力
系统 SHALL 明确检查 UI 控件、菜单项、表单字段、抽屉操作和工具栏按钮是否连接到实际状态更新、API 调用、事件处理或运行态行为。

#### Scenario: 发现未接线控件
- **WHEN** 某个按钮、菜单项、输入项或切换控件只有视觉呈现但没有可观察的状态变化、API 请求或运行态效果
- **THEN** 审查报告 MUST 将其记录为功能有效性问题
- **AND** 审查报告 MUST 标注该控件的代码位置和预期行为缺口

#### Scenario: 发现配置未被消费
- **WHEN** 设置面板写入某个 props、styles 或事件配置，但编辑态、预览态或保存后的运行态没有消费该配置
- **THEN** 审查报告 MUST 将其记录为配置断链问题
- **AND** 审查报告 MUST 指出写入端和消费端之间的断点

### Requirement: 审查报告必须可复现且可执行
系统 SHALL 生成结构化审查报告，报告中的每个确认问题 MUST 包含严重程度、文件位置、触发方式、用户影响和建议修复方向。

#### Scenario: 记录确认问题
- **WHEN** 审查确认一个 bug 或功能缺口
- **THEN** 报告 MUST 按严重程度排序列出问题
- **AND** 每条问题 MUST 包含文件路径、相关代码位置、复现或触发步骤、实际结果、期望结果和建议修复方向

#### Scenario: 记录无法确认的风险
- **WHEN** 审查发现可疑代码但缺少足够证据确认其为 bug
- **THEN** 报告 MUST 将其放入待验证风险或开放问题
- **AND** 报告 MUST 说明需要的复现条件或验证命令

### Requirement: 审查必须给出验证建议
系统 SHALL 为发现的问题提供后续验证建议，并优先复用仓库已有脚本和测试入口。

#### Scenario: 建议现有验证命令
- **WHEN** 审查输出修复建议
- **THEN** 报告 MUST 为相关问题标注建议运行的验证命令，例如 `npm run lint`、`npm run test`、`npm run build`、`npm run check`、`npm run test:e2e:editor` 或 `npm run smoke:api`

#### Scenario: 建议新增回归覆盖
- **WHEN** 问题涉及 schema、事件动作、拖拽、保存发布或权限边界
- **THEN** 报告 MUST 建议最小可行的单元、集成、E2E 或 smoke 覆盖方式
