# Domain Docs

采用 multi-context 布局。开始分析前先读取根目录 `CONTEXT-MAP.md`，再读取任务相关上下文及 ADR。

建议上下文：

- `src/CONTEXT.md`：低代码编辑器与管理前端
- `apps/publisher-next/CONTEXT.md`：发布页面运行时
- `server/CONTEXT.md`：后端平台、权限、持久化与数据库
- `packages/lowcode-schema/CONTEXT.md`：跨运行时 schema 契约
- `docs/adr/`：跨上下文技术决策
- 各上下文的 `docs/adr/`：局部技术决策

上下文文件按需创建，不预先填充未经确认的领域术语。

输出中应使用上下文词汇，并明确标注与既有 ADR 的冲突。
