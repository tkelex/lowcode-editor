## 1. Next.js 应用骨架

- [x] 1.1 新增 `apps/publisher-next`，配置 Next.js App Router、TypeScript、ESLint、Tailwind 或共享样式入口。
- [x] 1.2 在根 `package.json` 增加发布页应用的 dev、build、lint 或 check 脚本，并确保不会破坏现有 Vite/NestJS 命令。
- [x] 1.3 配置发布页应用环境变量示例，包括 `PUBLISHER_API_BASE_URL`、`PUBLISHER_SITE_URL`、`PUBLISHER_REVALIDATE_SECRET` 和 HTTP allowed origins。
- [x] 1.4 建立 `/publish/[publicId]`、错误页、not-found 页面和基础 layout。

## 2. 公开页服务端取数与 Metadata

- [x] 2.1 实现 Next.js 服务端 `fetchPublishedPage(publicId)`，只调用 NestJS 公开发布页接口。
- [x] 2.2 在服务端复用 `migratePageSchema` 迁移发布快照，并处理迁移失败、404、取消发布和接口异常。
- [x] 2.3 实现 `generateMetadata`，从 Page props 和页面名称生成 title、description、favicon、canonical URL 和基础 Open Graph 信息。
- [x] 2.4 补充 metadata 清洗逻辑，处理空值、过长字符串和不安全 URL。

## 3. 低代码公开运行时适配

- [x] 3.1 梳理 `src/editor/runtime/Preview` 的 Vite、Zustand、浏览器 API 和编辑器 store 耦合点。
- [x] 3.2 新增公开页 runtime adapter，使 Next.js Client Component 能接收服务端传入的 components 快照并渲染 prod 物料。
- [x] 3.3 将 `apiBaseUrl`、allowed origins、token provider 等运行时配置改为可注入，避免公开页依赖 `import.meta.env`。
- [x] 3.4 确保公开页 runtime 默认 `allowCustomJS={false}`，并且无法被页面 schema 绕过。
- [x] 3.5 验证 toast、url、componentAction、confirm、condition、http、setComponentProps、setComponentStyles 在 Next.js 公开页中保持可用。

## 4. 缓存与精准失效

- [x] 4.1 为发布页服务端读取结果绑定 `published-page:<publicId>` 缓存 tag。
- [x] 4.2 新增 Next.js revalidate Route Handler，校验 secret 后按 publicId 失效缓存 tag。
- [x] 4.3 在 NestJS 发布成功后调用 revalidate handler，并记录调用失败时的日志或响应信息。
- [x] 4.4 在 NestJS 取消发布成功后调用同一失效流程，确保公开页下一次访问不可用。
- [x] 4.5 为 revalidate secret、请求超时和失败重试补充配置与文档。

## 5. 链接切换与部署配置

- [x] 5.1 在项目后台和管理员后台中，将公开页链接改为可配置的发布页站点 URL。
- [x] 5.2 保留 Vite `/publish/:publicId` 作为过渡回退入口，直到 Next.js 公开页验证稳定。
- [x] 5.3 更新部署说明，描述 Vite 编辑器、NestJS API、Next.js 发布页运行时三者的部署关系。
- [x] 5.4 更新 Docker、Nginx 或平台部署示例，使公开页应用可以独立构建和访问。

## 6. 验证与回归

- [x] 6.1 新增或扩展自动化测试，覆盖已发布页面在 Next.js 公开运行时可访问。
- [x] 6.2 验证服务端 HTML 或 metadata 中包含页面 title、description 和公开 URL 信息。
- [x] 6.3 验证包含 custom action 的发布页在 Next.js 运行时不执行 custom JS。
- [x] 6.4 验证 HTTP action 和 runtime data source 遵守 allowed origins，未允许目标会被拒绝。
- [x] 6.5 验证重新发布和取消发布后缓存失效行为符合预期。
- [x] 6.6 运行现有 `npm run lint`、`npm run build`、`npm run test`，并运行发布页应用 build/check。

## 7. 文档与简历材料

- [x] 7.1 更新 `docs/02-架构/架构说明.md`，补充 Next.js 公开发布页运行时的数据流和边界。
- [x] 7.2 更新 `docs/03-接口/接口说明.md`，补充 revalidate webhook、公开页站点配置和缓存失效说明。
- [x] 7.3 更新 `docs/00-总览/项目上下文索引.md` 和 `docs/00-总览/AI快速上手.md`，让后续 AI 能正确理解新架构。
- [x] 7.4 更新 `.claude/context/FILE_MAP.md`，记录 Next.js 应用、runtime adapter 和高风险文件。
- [x] 7.5 完善 `docs/09-学习资料/Next.js发布页运行时简历亮点.md`，记录项目亮点、简历表述和面试讲解稿。

