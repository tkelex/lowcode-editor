## Why

当前公开发布页由 Vite SPA 在浏览器端请求发布快照、迁移 schema 并渲染，首屏 HTML、SEO metadata 和分享预览都依赖客户端执行后补齐。Next.js 更适合承担公开访问层：在不强行迁移编辑器本体的前提下，把发布页做成服务端渲染、可缓存、可精准失效的独立运行时，能补足项目的工程亮点。

## What Changes

- 新增 Next.js 发布页运行时应用，面向 `/publish/[publicId]` 公开访问路径渲染已发布 PageVersion 快照。
- 公开页服务端读取 NestJS 公开接口返回的发布快照，复用现有 `migratePageSchema` 和低代码运行时渲染能力。
- 使用 Next.js metadata 能力从 Page props 和发布页信息生成 title、description、favicon、OG metadata 等 SEO 信息。
- 将公开页运行时拆成服务端取数层和客户端交互层，客户端继续执行低代码事件动作，并保持 `allowCustomJS={false}`。
- 引入发布页缓存策略和精准失效入口：发布、取消发布或重新发布后能够按 `publicId` 使缓存失效。
- 保留现有 Vite 编辑器、项目后台、NestJS 权限/版本/发布链路，不把编辑器主应用整体迁移到 Next.js。

## Capabilities

### New Capabilities

- `nextjs-published-runtime`: 定义 Next.js 公开发布页运行时的 SSR 渲染、metadata 生成、缓存失效、安全边界和与现有发布链路的集成要求。

### Modified Capabilities

- `event-actions`: 公开发布页迁移到 Next.js 后，事件运行时仍必须保持 custom JS 禁用、HTTP action allowed origins、变量和组件联动等既有安全语义。

## Impact

- 前端/运行时：需要抽离或适配 `src/editor/runtime/Preview` 中与 Vite、Zustand 编辑器 store、`import.meta.env` 和浏览器 API 强耦合的部分，使其可被 Next.js 客户端组件复用。
- 新应用：新增 Next.js App Router 应用，例如 `apps/publisher-next`，负责公开页路由、server data fetching、metadata、错误页和缓存失效 route handler。
- 后端：NestJS 继续负责鉴权、页面保存、发布快照和公开读取；必要时在发布/取消发布后调用 Next.js revalidate webhook。
- 配置：新增公开 API base URL、发布页站点 URL、revalidate secret、HTTP allowed origins 等环境变量。
- 文档：更新架构/API/上下文文档，并新增简历亮点说明，明确“编辑器仍是 Vite SPA，Next.js 只承担公开发布页运行时”。
- 验证：需要覆盖 Next.js build、公开页 SSR smoke、metadata 输出、customJS 禁用、发布缓存失效和现有 `npm run check` 主链路。
