## Context

当前项目已经形成 Vite React 编辑器、NestJS API、PostgreSQL/Prisma、共享 schema 包和公开发布页的闭环。编辑器本体依赖 Zustand、React DnD、Monaco、Ant Design 和大量浏览器交互，适合继续作为强交互 SPA 维护。

公开发布页则不同：当前 `/publish/:publicId` 由 Vite SPA 进入后，在浏览器端请求 `GET /api/public/pages/:publicId`，再迁移 schema 并渲染 `Preview`。这导致首屏 HTML 缺少业务内容，SEO metadata 依赖 `useEffect` 修改，分享卡片和搜索引擎抓取效果有限，也难以表达“发布页缓存与精准失效”的工程能力。

Next.js 适合只接管公开访问层。官方 App Router 默认把 page/layout 作为 Server Components，可在服务端取数并预渲染 HTML；需要交互、状态、事件处理和浏览器 API 时，再通过 Client Components 承接。这与低代码公开页的形态吻合：服务端读取发布快照并生成 metadata，客户端运行低代码事件动作。

## Goals / Non-Goals

**Goals:**

- 新增独立 Next.js 发布页运行时应用，承载 `/publish/[publicId]` 公开访问。
- 服务端读取 NestJS 公开发布快照，复用共享 schema 迁移能力。
- 通过 Next.js `generateMetadata` 生成 title、description、favicon、OG metadata 等公开页 SEO 信息。
- 将低代码公开页运行时拆成“服务端取数/metadata”和“客户端交互渲染”两层。
- 公开页继续禁用 custom JS，HTTP action 和运行时数据源继续遵守 allowed origins。
- 引入按 `publicId` 的缓存 tag 和 revalidate route handler，发布、取消发布和重新发布后可精准失效。
- 保留 Vite 编辑器、项目后台、NestJS API、PageVersion 发布快照和现有权限审计链路。

**Non-Goals:**

- 不把编辑器主应用整体迁移到 Next.js。
- 不用 Next.js Route Handlers 替代 NestJS 的用户、项目、权限、页面、版本和 AI API。
- 不改变 Page schema、PageVersion schema、物料 registry 的业务语义。
- 不允许公开页执行 custom JS。
- 不在第一版实现多租户域名绑定、边缘运行时、静态导出、商业 CDN 配置或完整性能监控平台。
- 不保证所有编辑器物料都能服务端组件化；第一版允许低代码运行时作为客户端组件水合。

## Decisions

### 1. 新增 `apps/publisher-next`，不迁移 Vite 编辑器

新增独立 Next.js App Router 应用，例如：

```text
apps/publisher-next/
  app/
    publish/[publicId]/page.tsx
    publish/[publicId]/error.tsx
    api/revalidate/published-page/route.ts
    sitemap.ts
    robots.ts
  src/
    published-pages/
      fetchPublishedPage.ts
      metadata.ts
      PublishedPageRuntime.tsx
```

原因：编辑器是强交互 SPA，Next.js 对编辑器本体的 SSR/SEO 收益低；公开页是外部访问页面，更需要首屏 HTML、metadata 和缓存能力。独立应用还能降低迁移风险，让 Vite 和 Next.js 在同一仓库中各司其职。

备选方案：整体迁移到 Next.js。放弃原因是编辑器依赖拖拽、Monaco、Zustand 和大量浏览器状态，迁移成本高，简历亮点反而容易变成框架替换而不是架构优化。

### 2. NestJS 继续是业务 API 源，Next.js 只做公开页渲染网关

Next.js 页面通过服务端 `fetch` 请求 NestJS 公开接口：

```text
Next /publish/[publicId]
  -> GET ${API_BASE_URL}/public/pages/:publicId
  -> migratePageSchema
  -> generateMetadata
  -> <PublishedPageRuntime components={...} allowCustomJS={false} />
```

原因：NestJS 已经承载页面发布、版本快照、权限和审计，公开页读取也已稳定存在。Next.js 不应该复制页面查询、权限判断或 Prisma 访问逻辑，避免形成第二套后端。

备选方案：Next.js 直连数据库读取 PageVersion。放弃原因是会绕过 NestJS 的发布边界，也会让 Next 应用依赖 Prisma schema 和数据库连接，增加部署耦合。

### 3. 服务端负责发布快照读取和 metadata，客户端负责低代码交互

`page.tsx` 和 `generateMetadata` 在服务端读取发布快照。低代码运行时作为 Client Component，例如 `PublishedPageRuntime.tsx` 顶部声明 `"use client"`，接收迁移后的 components、运行时配置和安全开关。

原因：公开页首屏与 SEO 信息应由服务端产出；事件动作、组件联动、runtime variables、Ant Design 消息提示和浏览器导航属于客户端职责。这样能利用 Next.js Server Components，又不强迫现有运行时立即改成纯服务端组件。

备选方案：把所有物料都改造成 Server Components。放弃原因是当前 prod 物料和事件运行时依赖 React state、refs、浏览器事件和 Ant Design 交互，不适合第一版一次性服务端化。

### 4. 抽离发布页运行时适配层

现有 `Preview` 需要适配以下耦合点：

- `propsComponents` 存在时不应订阅编辑器 Zustand store，避免 Next 公开页引入编辑器状态。
- Vite 的 `import.meta.env` 需要替换为显式 runtime config 或跨应用环境读取封装。
- `getStoredToken` 在公开页通常无登录态，应允许注入 `getAuthToken`，默认返回 `undefined`。
- `message`、事件动作、HTTP action、runtime data source 仍在客户端执行。
- `allowCustomJS={false}` 必须是公开页不可绕过的默认值。

建议新增 runtime adapter，而不是把所有 Next 细节塞进现有 `Preview`：

```text
packages/lowcode-runtime/ 或 src/editor/runtime/public
  createRuntimeConfig
  PublishedPreview
  shared render/runtimeData/event bridge
```

第一版可以先在仓库内抽离最小适配层，等边界稳定后再物理移动到 package。

### 5. 使用 cache tag 做发布页精准失效

Next 侧读取公开页时使用稳定 tag，例如：

```text
published-page:${publicId}
```

新增 Route Handler：

```text
POST /api/revalidate/published-page
body: { publicId: string }
header: x-revalidate-secret
```

NestJS 在 `publish`、`unpublish` 成功后调用该 handler。重新发布时失效对应 `publicId`；取消发布时同样失效，使下一次访问进入 404/错误态。

原因：发布页天然适合缓存，但发布动作要求“用户发布后看到新版本”。tag-based revalidation 能把性能和准确性放在同一条链路里。

备选方案：完全不缓存。放弃原因是无法体现 Next.js 在公开页上的核心价值。备选方案二是固定短 TTL，缺点是发布后可能等待 TTL 到期，体验不确定。

### 6. 保留 Vite 公开页作为过渡回退

第一版可以让 Next.js 公开页使用新的访问域名或路径，例如：

```text
https://pages.example.com/publish/:publicId
```

Vite 原 `/publish/:publicId` 在迁移验证期保留，作为 fallback。验证通过后，后台“打开发布页”按钮和公开链接再切到 Next.js 站点 URL。

原因：减少一次性切换风险，也方便对比首屏 HTML、metadata 和运行时行为。

## Risks / Trade-offs

- [运行时复用时引入编辑器依赖过多] -> 先做最小 runtime adapter，明确禁止公开页依赖编辑器 store、编辑器设置面板和 dev 物料。
- [Client Component 导致首屏仍有大量水合成本] -> 第一版先获得 SSR HTML 和 metadata，后续再逐步把纯展示物料拆成可服务端渲染的静态渲染层。
- [Next.js 与 Vite 环境变量模型不同] -> 通过 runtime config 显式注入 `apiBaseUrl`、`allowedOrigins`、`siteUrl`，避免在共享运行时直接读框架专有环境变量。
- [缓存失效失败导致公开页 stale] -> revalidate webhook 使用 secret、日志和失败重试；发布接口返回结果时记录 revalidate 状态，必要时后台提示。
- [取消发布后缓存仍可访问] -> `unpublish` 必须触发同一个 publicId tag 失效；Next 页面每次重新取数时以 NestJS 公开接口为准。
- [SEO 字段来自用户输入，可能污染 metadata] -> metadata 生成时 trim、限制长度、过滤空值，favicon/OG URL 只接受安全 URL 或站点内资源。
- [公开页 HTTP action 暴露外部 API 风险] -> 延续现有 allowed origins 和 custom JS 禁用边界；公开页不注入用户登录 token，敏感接口不得直接配置到公开页。

## Migration Plan

1. 建立 `apps/publisher-next`，完成 Next.js 基础构建、App Router、共享 TypeScript 配置和工作区脚本。
2. 实现发布页服务端 fetch、schema 迁移、404/错误态、`generateMetadata`。
3. 抽离或适配公开页 runtime，使 `Preview` 可在 Next Client Component 中渲染并保持 `allowCustomJS={false}`。
4. 接入缓存 tag 和 revalidate Route Handler，NestJS 发布/取消发布后调用失效接口。
5. 增加公开页 smoke/e2e：已发布页可访问、取消发布不可访问、metadata 正确、custom JS 不执行、HTTP action 安全边界不变。
6. 更新后台公开链接、部署文档、架构文档、API 文档和简历亮点文档。

回滚策略：保留 Vite `/publish/:publicId` 作为旧公开页入口；如果 Next.js 发布页异常，后台公开链接回退到 Vite 路径，NestJS 发布/版本链路不受影响。

## Open Questions

- Next.js 发布页第一版是否使用独立域名，还是与 Vite 前端共享同一域名后由网关转发？
- 第一版是否需要生成动态 OG 图片，还是先只生成标准 metadata？
- 公开页缓存应使用 stale-while-revalidate 还是发布后同步等待新内容生成？
- 是否需要在后台发布结果中展示 revalidate 成功/失败状态？
- `packages/lowcode-runtime` 是否现在就物理拆包，还是先以 `src/editor/runtime/public` 形式稳定边界？
