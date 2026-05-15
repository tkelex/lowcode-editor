## ADDED Requirements

### Requirement: Project data source models can be managed
系统 SHALL 允许项目成员在项目范围内创建、查看、更新和删除前端数据源模型配置，并且配置 MUST 受项目权限保护。

#### Scenario: Create data source model
- **WHEN** owner 或 editor 提交合法的数据源模型名称、标识、主键字段、接口配置和字段映射
- **THEN** 系统 MUST 在该项目下创建数据源模型配置
- **AND** 系统 MUST 校验模型标识在项目内唯一
- **AND** 系统 MUST 写入审计日志

#### Scenario: Reject invalid data source model
- **WHEN** 用户提交空字段列表、重复字段 key、非法字段类型、非法 URL 或缺少必填模型标识
- **THEN** 系统 MUST 拒绝保存数据源模型配置
- **AND** 系统 MUST 返回可定位到字段或接口配置的错误信息

#### Scenario: Enforce project permissions
- **WHEN** viewer 尝试创建、更新或删除数据源模型配置
- **THEN** 系统 MUST 拒绝该操作
- **AND** owner、editor 和 viewer MUST 只能读取自己有项目访问权的数据源模型配置

### Requirement: Data source models describe external API contracts
数据源模型 SHALL 描述前端 CRUD 页面访问外部 API 所需的列表、详情、新增、更新、删除接口配置。

#### Scenario: Configure list API
- **WHEN** 用户配置列表接口 URL、请求方法、响应列表路径和总数字段路径
- **THEN** 生成器 MUST 能使用该配置生成表格数据源
- **AND** 运行时 MUST 能从响应中读取列表数据

#### Scenario: Configure detail API
- **WHEN** 用户配置详情接口和记录 id 参数模板
- **THEN** 生成器 MUST 能使用该配置生成详情页或编辑页的数据读取配置

#### Scenario: Configure mutation APIs
- **WHEN** 用户配置新增、更新或删除接口
- **THEN** 生成器 MUST 能为表单提交或操作按钮生成对应 HTTP action
- **AND** 生成动作 MUST 保留请求方法、URL 模板、body 模板和成功/失败提示

### Requirement: Field mappings drive display and request generation
字段映射 SHALL 描述外部 API 数据如何显示在表格、表单和详情中，以及表单数据如何写入请求参数。

#### Scenario: Configure field visibility
- **WHEN** 用户为字段配置列表、表单或详情展示状态
- **THEN** CRUD 生成器 MUST 按配置决定该字段是否生成 TableColumn、FormItem 或详情展示节点

#### Scenario: Configure response source path
- **WHEN** 字段配置了响应读取路径
- **THEN** 生成的列表页和详情页 MUST 从该路径读取字段值

#### Scenario: Configure request path
- **WHEN** 字段配置了请求写入路径
- **THEN** 生成的新增或编辑动作 MUST 将表单值写入对应请求 body 路径

#### Scenario: Configure required field
- **WHEN** 字段被配置为必填
- **THEN** 生成表单 MUST 包含必填校验
- **AND** 生成配置 MUST NOT 声称平台会在后端校验该业务字段

### Requirement: CRUD generator creates editable page schemas
CRUD 生成器 SHALL 基于前端数据源模型生成符合现有低代码组件树规则的 Page schema，生成结果 MUST 能被编辑器打开、保存、版本化和发布。

#### Scenario: Generate list page
- **WHEN** 用户选择数据源模型并生成列表页
- **THEN** 生成器 MUST 创建包含 Table、TableColumn 和常用操作按钮的页面 schema
- **AND** Table MUST 绑定该模型的外部列表数据源

#### Scenario: Generate create form page
- **WHEN** 用户选择数据源模型并生成新建表单页
- **THEN** 生成器 MUST 创建包含 Form 和 FormItem 的页面 schema
- **AND** 表单提交事件 MUST 调用配置的外部新增接口

#### Scenario: Generate edit form page
- **WHEN** 用户选择数据源模型并生成编辑表单页
- **THEN** 生成器 MUST 创建可读取外部详情接口并提交外部更新接口的页面 schema
- **AND** 生成页 MUST 保留目标数据源模型 id 和生成元信息

#### Scenario: Generate detail page
- **WHEN** 用户选择数据源模型并生成详情页
- **THEN** 生成器 MUST 创建展示字段详情的页面 schema
- **AND** 详情页 MUST 能根据记录 id 调用外部详情接口

#### Scenario: Validate generated schema
- **WHEN** 生成器输出 CRUD 页面 schema
- **THEN** 输出 MUST 通过现有组件树迁移和校验
- **AND** 输出 MUST NOT 生成非法父子关系或未注册物料

### Requirement: Generated CRUD pages remain editable and publishable
生成的 CRUD 页面 SHALL 作为普通低代码页面参与现有编辑、保存、版本、回滚和发布流程。

#### Scenario: Open generated page in editor
- **WHEN** CRUD 页面生成成功后用户打开页面
- **THEN** 编辑器 MUST 载入生成的组件树
- **AND** 用户 MUST 能继续修改属性、样式和事件配置

#### Scenario: Save generated page
- **WHEN** 用户保存生成后的 CRUD 页面
- **THEN** 系统 MUST 复用现有页面保存、schema 校验和版本创建流程

#### Scenario: Publish generated page
- **WHEN** 用户发布生成后的 CRUD 页面
- **THEN** 系统 MUST 创建发布快照
- **AND** 发布页 MUST 使用发布快照中的 CRUD schema 渲染
- **AND** 发布页 MUST 继续遵守 custom JS 禁用和 HTTP allowed origins 限制

### Requirement: CRUD generation exposes a guided project workflow
项目后台 SHALL 提供数据源模型管理和 CRUD 生成入口，生成流程 MUST 清晰展示模型、页面类型、路由和生成结果。

#### Scenario: Start generation from project dashboard
- **WHEN** 用户在项目后台选择某个数据源模型并启动 CRUD 生成
- **THEN** 系统 MUST 展示生成向导
- **AND** 向导 MUST 允许选择要生成的页面类型

#### Scenario: Resolve route conflicts
- **WHEN** 用户输入的生成页面路由与项目内已有页面冲突
- **THEN** 系统 MUST 阻止创建冲突页面
- **AND** 系统 MUST 提示用户修改路由

#### Scenario: Preview generation summary
- **WHEN** 用户完成生成向导配置
- **THEN** 系统 MUST 展示将创建的页面名称、路由、页面类型和目标数据源模型

#### Scenario: Open generated result
- **WHEN** CRUD 页面创建完成
- **THEN** 系统 MUST 提供打开编辑器继续编辑的入口
- **AND** 系统 MUST 在页面列表中展示新创建的页面

### Requirement: CRUD workflow is covered by validation
项目 SHALL 为数据源模型配置、CRUD 生成器和关键前端流程提供回归验证。

#### Scenario: Run schema generator tests
- **WHEN** 执行 `npm run test`
- **THEN** 测试 MUST 覆盖字段映射校验、CRUD schema 生成和生成 schema 合法性

#### Scenario: Run backend configuration validation
- **WHEN** 执行后端构建和接口测试
- **THEN** 数据源模型配置接口和项目权限边界 MUST 通过验证

#### Scenario: Run editor generation workflow
- **WHEN** 执行编辑器 e2e 或 CRUD 生成流程测试
- **THEN** 测试 MUST 覆盖创建数据源模型、生成页面、打开编辑器、预览和保存的关键路径
