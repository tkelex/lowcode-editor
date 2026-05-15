## ADDED Requirements

### Requirement: Data model management follows project dashboard interaction standards
数据模型管理页面 SHALL 使用现有项目后台的工作台式布局，保持表格、表单、抽屉或弹窗的可读性和一致交互。

#### Scenario: Browse data models
- **WHEN** 用户进入项目的数据模型管理入口
- **THEN** 页面 MUST 展示模型列表、搜索或筛选入口、创建入口和空状态
- **AND** 布局 MUST 在桌面和移动宽度下避免横向溢出

#### Scenario: Edit model fields
- **WHEN** 用户创建或编辑数据模型字段
- **THEN** 字段配置 MUST 使用适合类型的控件
- **AND** 必填、展示位置和选项配置 MUST 给出即时可理解的校验反馈

### Requirement: CRUD generation wizard is concise and reversible
CRUD 生成向导 SHALL 引导用户选择模型、页面类型、路由和生成选项，并在真正创建页面前展示可确认的结果摘要。

#### Scenario: Preview generation summary
- **WHEN** 用户完成生成向导配置
- **THEN** 向导 MUST 展示将创建的页面名称、路由、页面类型和目标模型
- **AND** 用户 MUST 能返回上一步修改配置

#### Scenario: Show generation errors
- **WHEN** CRUD 页面生成失败或路由冲突
- **THEN** 向导 MUST 在当前位置展示错误信息
- **AND** 页面 MUST 保留用户已输入的生成配置

### Requirement: Generated CRUD pages match editor canvas conventions
生成的 CRUD 页面 SHALL 使用现有物料的编辑态和预览态约定，避免把运行时弹层或占位外壳误当作常驻页面内容。

#### Scenario: Generate stable list layout
- **WHEN** 生成器创建列表页
- **THEN** 列表页 MUST 使用适合编辑和预览的常驻布局容器
- **AND** Table、筛选区和操作按钮 MUST 在编辑画布中保持可选中、可调整和可保存

#### Scenario: Generate stable form layout
- **WHEN** 生成器创建表单页
- **THEN** 表单页 MUST 使用 Form 和 FormItem 生成真实字段
- **AND** 预览态 MUST 不依赖编辑态拖拽占位文案来表达业务内容
