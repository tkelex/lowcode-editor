# 平台后端

平台后端管理页面草稿与发布快照，确保公开读取只返回明确发布的内容。

## Language

**发布快照**：
发布时选定的不可变页面 schema 版本；在再次发布前，公开页面始终引用该版本。
_Avoid_：页面草稿、当前页面

**页面草稿**：
创作者可持续保存和修改的页面 schema，不直接对匿名访客可见。
_Avoid_：发布快照、公开页面

**页面草稿 revision**：
页面草稿的递增乐观并发版本；PATCH 必须携带读取时的 expectedRevision，冲突请求不能覆盖草稿或创建版本。
_Avoid_：PageVersion.versionNo、发布版本号

**项目远程物料安装**：
由项目 owner 确认可信来源后保存的规范化 manifest 元数据；同一项目、同一包只能有一个启用版本，历史版本记录可以保留。
_Avoid_：任意第三方脚本、运行时 latest、远程源码副本

**页面物料依赖**：
页面保存时根据实际使用的远程组件固定下来的包版本、manifest、entry、integrity 和组件声明；发布版本持有自己的不可变副本。
_Avoid_：项目当前物料、动态 latest、运行时临时解析结果

**AI Agent run**：
围绕一次页面搭建或修改请求形成的、可追踪的候选生成过程，关联项目或页面上下文、工具轨迹和待确认候选结果。
_Avoid_：模型调用、已保存页面、发布快照

**AI Agent candidate**：
Agent run 产出的、等待创作者确认的页面 schema 或 schema patch；它描述建议修改，不等同于页面草稿或已保存版本。
_Avoid_：自动写入、发布版本、模型原始输出

## Agent 执行边界

Agent 任务通过 PostgreSQL 持久化和 API 内带租约 worker 异步执行；创建接口只入队，GET 查询不依赖生成器的内存状态。数据库结构与部分唯一索引以 `prisma/schema.prisma` 和 migration 为准。候选确认/拒绝由服务端行锁事务执行，只允许任务发起者或项目 owner 决策；确认不保存页面或创建版本。SSE 仍未实现，详见 `docs/01-产品/AI页面搭建.md`。
