# Lowcode Editor

一个面向中后台场景的全栈低代码平台作品集。项目以 Page Schema 为核心，覆盖页面搭建、未保存草稿恢复、并发保存保护、版本管理、发布快照、匿名访问、AI 候选确认和可信远程物料加载。

主链路为：登录并创建项目/页面 → 拖拽和配置组件生成 Page Schema → 恢复或保存本地未提交草稿 → 携带 `expectedRevision` 保存并生成 PageVersion → 发布不可变快照 → 独立 Publisher 通过 `publishedVersionId` 匿名读取并渲染。发布后继续编辑不会改变访客页面，只有再次发布才会更新公开内容。

## 已实现能力

- React 18、TypeScript、Vite、React DnD、Zustand 驱动的可视化编辑器。
- 属性、样式、事件、运行变量、外部 API 数据源和 CRUD Schema 生成。
- 按用户、项目、页面隔离的未保存草稿恢复，以及基于 `revision` 的乐观并发控制。
- NestJS、Prisma、PostgreSQL 提供 JWT、项目角色、页面版本、发布、回滚和审计。
- Next.js App Router 独立发布站只呈现不可变发布快照，不读取编辑器草稿。
- AI Agent 持久化任务、租约 worker、整页或局部 Patch 候选、确认/拒绝和过期控制。
- 可信远程物料 manifest、全局宿主注册、共享 React/ReactDOM/Ant Design、固定版本和 SRI 校验。
- 500/1000 节点编辑器状态基准、API smoke、PostgreSQL 集成测试和 Playwright E2E。

## 系统结构

```text
editor-web ──HTTP──> api-server ──Prisma──> PostgreSQL
publisher-web ─HTTP─> api-server

editor-web ───────┐
publisher-web ────┼──> lowcode-runtime ──> lowcode-schema
api-server ───────┘                     └─> lowcode-schema

remote-material-example ──IIFE/register──> browser material host
```

| 目录 | 职责 |
| --- | --- |
| `apps/editor-web` | 页面搭建、项目后台和设计态预览 |
| `apps/api-server` | 身份、权限、持久化、版本、发布和审计 |
| `apps/publisher-web` | 匿名读取并呈现发布快照 |
| `apps/remote-material-example` | 独立构建的远程物料 IIFE 与 manifest |
| `packages/lowcode-schema` | 跨应用 Schema、迁移和校验契约 |
| `packages/lowcode-runtime` | 无状态页面运行时和远程物料客户端宿主 |

## 远程物料闭环

1. owner 安装固定版本 manifest，API 只持久化规范化元数据，不执行远程 JavaScript。
2. 页面保存根据实际使用组件固定 `Page.materialDependencies`，发布版本保存不可变副本。
3. 编辑器与 Publisher 浏览器客户端复核 manifest、origin allowlist、HTTPS/本地协议和 SRI。
4. IIFE 从宿主取得唯一 React、ReactDOM 和 Ant Design 实例，通过全局协议注册 dev/prod 组件。
5. 依赖未就绪或失败时，编辑器保留组件树并显示占位；公开页显示访客可理解的错误状态。

远程物料属于项目 owner 明确信任并安装、在浏览器执行的客户端代码。固定 manifest、origin allowlist、SRI 和共享依赖校验用于供应链与版本约束，不构成任意第三方脚本沙箱。生产 CSP 仍需在实际 CDN、Nginx 或托管平台响应头中部署和验收。

## 本地运行

要求 Node.js 22、npm 和 Docker Desktop。

```powershell
npm install
docker compose -f infra/docker/docker-compose.yml up -d postgres
npm run prisma:generate
npm run prisma:deploy
```

分别启动三个应用：

```powershell
npm run dev
npm run dev:server
npm run dev:publisher
```

构建并启动示例远程物料静态服务：

```powershell
npm run build:remote-material-example
npm run serve:remote-material-example -- --host 127.0.0.1 --port 4174
```

详细环境变量和容器运行方式见 `docs/05-开发/项目运行指南.md`。

## 验证

```powershell
npm run check
npm run build:publisher
npm run build:remote-material-example
npm run check:editor-props
npm run benchmark:editor-state -- --sizes 500,1000 --iterations 5 --assert
npm run test:e2e
npm run test:e2e:editor
```

启动已迁移的 PostgreSQL 与 API 后运行：

```powershell
npm run smoke:api
npm run smoke:remote-material
npm run test:e2e:remote-material
```

`test:e2e:remote-material` 会同时启动编辑器、生产构建后的 Publisher 和示例物料静态服务，验证同一固定物料从安装、编辑、保存、发布到匿名渲染的真实跨应用链路。

Agent 的租约、并发抢占和候选决策需使用独立 PostgreSQL 测试库，按 `docs/06-测试与验收/Agent数据库集成验收.md` 配置后运行 `npm run test:agent:postgres`，不要复用个人开发库。

## 文档入口

- `docs/00-总览/项目上下文索引.md`：快速接手与文件路由。
- `docs/01-产品/需求文档.md`：当前产品范围与验收边界。
- `docs/02-架构/架构说明.md`：部署单元、数据流和状态模型。
- `docs/03-接口/接口说明.md`：HTTP 与 Schema 契约。
- `docs/04-编辑器/物料体系说明.md`：内置和远程物料体系。
- `docs/06-测试与验收/验收说明.md`：自动化与真实环境验收。
- `docs/07-安全/安全规范.md`：身份、运行时和远程代码边界。

## 非目标

- 不实现多人实时协同、OT 或 CRDT。
- 不执行未经 owner 信任的任意第三方脚本。
- 不建设完整商业化物料市场、计费和审核生态。
- AI 候选确认后只写入编辑器草稿，仍需用户手动保存或发布。
