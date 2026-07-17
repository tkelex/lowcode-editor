# Context Map

## Contexts

- [前端编辑器](./src/CONTEXT.md) — 编辑页面草稿并提供编辑器预览
- [公开发布运行时](./apps/publisher-next/CONTEXT.md) — 面向访客呈现公开页面
- [平台后端](./server/CONTEXT.md) — 管理页面草稿、发布快照和访问规则
- [Schema 契约](./packages/lowcode-schema/CONTEXT.md) — 定义跨运行时共享的页面表达

## Relationships

- **前端编辑器 → Schema 契约**：页面草稿使用共享 schema 表达、迁移和校验。
- **平台后端 → Schema 契约**：页面草稿和发布快照写入前使用共享规则规范化。
- **公开发布运行时 → 平台后端**：通过公开读取接口取得发布快照，不读取页面草稿。
- **公开发布运行时 → Schema 契约**：发布快照在呈现前迁移并校验。
