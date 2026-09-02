# 顶层目录按部署单元组织

仓库顶层以可独立构建和部署的应用为边界，统一放入 `apps/`：编辑器前端、公开发布站和 API 后端分别拥有自己的依赖、配置与源码；跨应用契约放入 `packages/`。根目录只保留 workspace 编排、跨应用测试、文档和基础设施，不再持有 Vite 编辑器的源码或构建配置。Prisma schema 与 migrations 归 API 后端所有，不拆成独立顶层 `database/`，因为当前没有第二个数据库所有者或独立数据库交付物；按 `frontend/backend/database` 技术层拆分会制造虚假独立性，并让后端构建跨根目录耦合。

前端应用内部按 feature 组织，不设置含义宽泛的 `model/` 或 `state/`。类型、权限和 adapter 直接以职责命名；需要 Zustand 等客户端状态容器时放入 feature 自己的 `stores/`，并使用 `component-tree-store.ts`、`editor-session-store.ts` 这类能说明所有权和内容的文件名。服务端查询结果仍由 `api/` 或查询层管理，不因属于某个 feature 就统一复制进客户端 store。

API 后端内部沿用 NestJS 的业务模块边界，业务代码放入 `src/modules/<feature>/`，每个模块就近维护自己的 controller、service、DTO 和测试，不建立仓库级 `controllers/`、`services/` 或 `repositories/` 技术分层。`src/common/` 只接收确实被多个业务模块复用的 guard、decorator、filter 等横切能力；外部系统和持久化实现归 `src/infrastructure/`，避免 `common/` 演变为无法判断所有权的杂物目录。

Prisma 的 CLI 资产保留其标准约定，放在 `apps/api-server/prisma/`，包含 `schema.prisma` 和 `migrations/`；供 NestJS 运行时使用的 `PrismaModule`、`PrismaService` 等接入代码放在 `apps/api-server/src/infrastructure/database/`。两者都由 `api-server` 部署单元所有，但分别遵循 CLI 发现规则与 TypeScript 源码边界。

测试也按所有权放置：单元测试与被测源码就近；API 应用级集成测试放在 `apps/api-server/test/`；只有需要同时启动或贯穿多个应用的 Playwright 流程放在仓库根 `tests/e2e/`。测试目录的位置表达其验证边界，不能因为使用同一种测试框架就集中到同一顶层目录。

环境变量声明按读取方归属：每个应用在自己的根目录维护 `.env.example`，本地真实 `.env` 也放在对应应用目录并保持 Git 忽略；只有跨应用容器编排使用的变量示例放在 `infra/docker/.env.example`。仓库根目录不再混放编辑器、发布站和 API 后端的应用环境变量。

每个可部署应用在自己的根目录维护 `Dockerfile`，镜像构建仍可使用 workspace 根作为 build context，以便读取共享包。需要同时编排多个应用、数据库、网络或卷的 Compose 文件统一放在 `infra/docker/`，不再使用按应用命名但集中堆放的 `Dockerfile.web`、`Dockerfile.server` 等文件。

GitHub Actions 工作流保留在平台约定的 `.github/workflows/`。根 `package.json` 只提供跨 workspace 的安装、开发、检查和构建编排，各应用及共享包继续拥有自己的脚本；CI 优先调用根编排命令，不重复硬编码各子目录的执行细节。

`editor-web/src` 由 `app/`、`features/` 和 `shared/` 组成：`app/` 只做 provider、路由与顶层装配；`features/` 拥有业务界面、业务类型、权限规则和 API；`shared/` 只放 HTTP 客户端、通用 UI、通用 hooks 与纯工具函数等业务无关的应用内能力。当前集中于 `shared/api/types.ts` 的用户、项目、页面、资产和审计类型必须拆回所属 feature；只有确实跨应用消费的契约才进入 `packages/`。

`editor-web` 首轮只建立 `auth/`、`projects/`、`admin/` 和 `editor/` 四个稳定 feature，对应现有四个主要用户流程。页面管理、发布记录、模板、资产和数据源模型作为 `projects/` 内的子能力，编辑画布、设置、物料和 AI 页面搭建归 `editor/`；不按后端 module 一比一创建只有 API 或类型文件的前端 feature。

每个 feature 只通过自己的 `index.ts` 暴露供外部使用的页面、组件和类型；`app/` 从这些公开入口组合流程。feature 确需复用另一个 feature 的稳定契约时也只能引用其公开入口，禁止深层导入内部 API、组件或 store。首轮不增加额外 `entities/` 层，避免只有转发作用的目录。

删除根 `netlify.toml`：它只描述旧的根目录 Vite 构建和 `dist/` 发布，无法表达新的三个部署单元。未来若某个前端需要 Netlify 等专属托管平台配置，该配置必须放在对应应用内，并只构建该应用。

编辑器专属的 `index.html`、Vite、Tailwind、PostCSS、`tsconfig.app.json` 和 `tsconfig.node.json` 全部迁入 `apps/editor-web/`。仓库根只保留负责 workspace 项目引用的 `tsconfig.json`、统一的 `eslint.config.js` 以及服务于根 build context 的 `.dockerignore`；删除与 flat config 重复的 `.eslintrc.cjs`。

根 `scripts/` 保留为 workspace 验证工具，只承载架构边界检查、契约审计、跨应用 smoke test 和统一测试运行器，并继续按 `architecture/`、`audit/`、`smoke/`、`test/` 分类。只服务单个应用的运维或管理脚本迁入该应用自己的 `scripts/`。

删除未使用的 Vite 模板残留 `public/vite.svg`、`src/assets/react.svg` 和 `src/App.css`，并从迁移后的 `index.html` 移除默认 Vite favicon。生成目录 `dist/` 与各测试报告目录不属于源码，统一清理并由 `.gitignore` 管理。
