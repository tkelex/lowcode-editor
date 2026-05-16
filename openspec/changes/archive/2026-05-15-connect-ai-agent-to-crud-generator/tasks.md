## 1. Implementation

- [x] 1.1 扩展 AI agent shared 类型，支持 CRUD 候选元信息。
- [x] 1.2 扩展 agent context，读取并摘要项目数据源模型列表。
- [x] 1.3 扩展 agent tool registry，新增 CRUD generation tool。
- [x] 1.4 实现 CRUD 意图识别、已有模型匹配和临时 model draft 推导。
- [x] 1.5 调用 `generateCrudPageSchema` 生成 components candidate，并透传 warnings。
- [x] 1.6 前端 AI 面板展示 CRUD 候选元信息和 warnings。

## 2. Validation

- [x] 2.1 补单测：agent CRUD 请求调用 CRUD generator。
- [x] 2.2 补单测：非法数据源模型被拒绝并返回可读错误。
- [x] 2.3 补单测：无已有模型时生成临时 draft 并展示 warning。
- [x] 2.4 补 e2e：AI tab 输入 CRUD 请求后展示候选页面。
- [x] 2.5 运行 `npm run check`。
