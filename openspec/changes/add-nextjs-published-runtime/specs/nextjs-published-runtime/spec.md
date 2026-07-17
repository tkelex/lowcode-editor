## ADDED Requirements

### Requirement: Published pages render through a Next.js public runtime

系统 SHALL 提供独立的 Next.js 公开发布页运行时，用于访问已发布页面，并且 MUST 保留现有 Vite 编辑器和 NestJS 发布快照链路。

#### Scenario: Open published page by public id
- **WHEN** 访问者打开 `/publish/:publicId`
- **THEN** Next.js 公开运行时 MUST 读取对应 publicId 的已发布快照
- **AND** 页面 MUST 使用该快照的 Page schema 渲染公开内容

#### Scenario: Keep editor app unchanged
- **WHEN** 用户登录后进入项目后台或低代码编辑器
- **THEN** 系统 MUST 继续使用现有 Vite 编辑器入口
- **AND** Next.js 公开运行时 MUST NOT 替代编辑器主应用

#### Scenario: Published page does not exist
- **WHEN** 访问者打开不存在、已取消发布或无法读取快照的 publicId
- **THEN** Next.js 公开运行时 MUST 返回明确的不可访问页面
- **AND** 运行时 MUST NOT 暴露内部错误堆栈、数据库信息或服务端密钥

### Requirement: Published page data is loaded on the server

Next.js 公开运行时 SHALL 在服务端读取发布快照，并且 MUST 复用 NestJS 公开读取接口作为数据来源。

#### Scenario: Server loads published snapshot
- **WHEN** Next.js 渲染 `/publish/:publicId`
- **THEN** 服务端 MUST 请求 NestJS `GET /api/public/pages/:publicId` 或等效公开接口
- **AND** 服务端 MUST NOT 直接读取 Prisma、数据库连接或私有页面接口

#### Scenario: Migrate schema before rendering
- **WHEN** 服务端成功读取发布快照
- **THEN** 系统 MUST 使用共享 schema 迁移能力处理快照 schema
- **AND** 迁移失败时 MUST 显示可理解的发布页数据异常状态

#### Scenario: Preserve published snapshot semantics
- **WHEN** 页面草稿在发布后继续被编辑但尚未再次发布
- **THEN** Next.js 公开运行时 MUST 渲染 `publishedVersionId` 指向的发布快照
- **AND** MUST NOT 渲染未发布的 Page 草稿

### Requirement: Published pages expose server generated metadata

Next.js 公开运行时 SHALL 基于发布页信息和 Page props 生成服务端 metadata，使搜索引擎和分享平台无需等待客户端脚本即可读取页面标题和描述。

#### Scenario: Generate basic metadata
- **WHEN** 发布快照包含页面名称、`seoTitle` 或 `seoDescription`
- **THEN** Next.js 公开运行时 MUST 在服务端生成 title 和 description metadata
- **AND** title MUST 优先使用有效的 `seoTitle`，缺失时使用页面名称

#### Scenario: Generate favicon metadata
- **WHEN** Page props 包含有效 favicon 配置
- **THEN** Next.js 公开运行时 MUST 输出对应 icon metadata
- **AND** favicon 配置为空时 MUST 不生成错误的空链接

#### Scenario: Generate share metadata
- **WHEN** 发布页可公开访问
- **THEN** Next.js 公开运行时 SHOULD 生成 canonical URL 和 Open Graph 基础信息
- **AND** 生成内容 MUST 使用公开站点 URL 和当前 publicId

### Requirement: Published runtime keeps client interactions isolated

公开页低代码运行时 SHALL 作为客户端交互层运行，并且 MUST 与编辑器设计态状态隔离。

#### Scenario: Render runtime from server snapshot
- **WHEN** 服务端完成发布快照读取和 schema 迁移
- **THEN** 客户端运行时 MUST 接收迁移后的 components 快照
- **AND** MUST 使用该快照渲染 prod 物料

#### Scenario: Do not subscribe to editor store
- **WHEN** Next.js 公开页渲染客户端运行时
- **THEN** 运行时 MUST NOT 依赖编辑器设计态 Zustand store 中的 components
- **AND** 运行时组件联动 MUST 只修改当前公开页运行时快照

#### Scenario: Use explicit runtime configuration
- **WHEN** 公开页运行时请求数据源或执行 HTTP action
- **THEN** 运行时 MUST 使用显式传入的 apiBaseUrl、allowedOrigins 和 token provider 配置
- **AND** MUST NOT 直接依赖 Vite 专用的 `import.meta.env`

### Requirement: Published pages use cache tags and precise revalidation

Next.js 公开运行时 SHALL 对已发布页面使用按 publicId 区分的缓存策略，并且 MUST 提供受保护的精准失效入口。

#### Scenario: Cache published page by tag
- **WHEN** Next.js 服务端读取 publicId 对应的发布快照
- **THEN** 该读取结果 SHOULD 绑定稳定缓存 tag `published-page:<publicId>`
- **AND** 不同 publicId 的缓存 MUST 相互隔离

#### Scenario: Revalidate after publish
- **WHEN** NestJS 发布或重新发布页面成功
- **THEN** 系统 MUST 触发对应 publicId 的缓存失效
- **AND** 后续访问 MUST 能读取最新发布快照

#### Scenario: Revalidate after unpublish
- **WHEN** NestJS 取消发布页面成功
- **THEN** 系统 MUST 触发对应 publicId 的缓存失效
- **AND** 后续访问 MUST 显示不可访问状态

#### Scenario: Protect revalidation endpoint
- **WHEN** 外部请求 Next.js revalidation route handler
- **THEN** 系统 MUST 校验共享 secret 或等效授权机制
- **AND** 未授权请求 MUST 被拒绝且不得触发缓存失效

### Requirement: Published runtime has verifiable quality checks

Next.js 公开运行时 SHALL 提供面向构建、渲染、metadata、安全和缓存失效的验证方式。

#### Scenario: Build publisher app
- **WHEN** 实现完成后运行发布页应用构建命令
- **THEN** Next.js 应用 MUST 构建通过
- **AND** TypeScript 类型错误 MUST 阻止交付

#### Scenario: Verify published page smoke
- **WHEN** 存在已发布页面 publicId
- **THEN** 自动化验证 MUST 能打开 Next.js 公开页并看到发布内容
- **AND** 验证 MUST 覆盖 metadata 是否由服务端输出

#### Scenario: Verify revalidation
- **WHEN** 页面重新发布或取消发布
- **THEN** 自动化或 smoke 验证 MUST 覆盖缓存失效后的公开访问结果
- **AND** 验证失败时 MUST 在交付说明中记录剩余风险
