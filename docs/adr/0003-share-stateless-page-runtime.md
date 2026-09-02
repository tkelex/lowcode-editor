# 两个前端共享无状态页面运行时

编辑器前端与公开发布站通过 `packages/lowcode-runtime` 共享页面渲染、事件执行、数据源、内置生产物料和运行时注册能力，两个应用不得互相引用源码。运行时不读取 Zustand、编辑器日志或构建工具环境变量，而由宿主 adapter 显式传入组件树、运行时物料注册表和能力策略；设计态物料、setter 和拖拽行为仍归编辑器应用。当前不建立独立 materials package，只有出现多套物料库或第三方物料发布需求时才重新拆分，避免提前增加 package 与注册表装配复杂度。

依赖方向固定为 `lowcode-schema <- lowcode-runtime <- editor-web / publisher-web`；`api-server` 只依赖 `lowcode-schema` 做迁移与校验，不依赖浏览器 runtime。任何 `packages/` 都不得反向导入 `apps/`，两个前端应用也不得直接引用彼此源码。

跨应用导入只允许使用 workspace package 的公开入口 `@lowcode/schema` 和 `@lowcode/runtime`；每个应用可用 `@/` 指向自己的 `src`，但不得用 `@root`、跨应用相对路径或其他根目录 alias 绕过 package exports。

公开页面只由 `publisher-web` 提供。删除编辑器 Vite 应用中的 `/publish/:publicId` 路由和 `features/publish/PublishedPageView.tsx`；编辑器仅保留草稿预览和公开 URL 生成，公开页面获取、SEO、错误边界与匿名策略全部由发布站 adapter 负责。
