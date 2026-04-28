# 当前开发进度与学习总结

## 1. GitHub 连接

当前项目已添加远程仓库：

```bash
origin  https://github.com/tkelex/lowcode-editor.git
```

当前本地分支是：

```bash
master
```

远程默认分支查询时网络连接被 reset，所以暂时还没有 push。

如果确认要推送，可以执行：

```bash
git push -u origin master
```

如果远程默认分支是 `main`，可以先改名再推送：

```bash
git branch -M main
git push -u origin main
```

后续不会自动 push，除非明确要求。

补充说明：现在本地 `master` 已经成功关联并推送过 GitHub，后续新增 commit 仍然只会在你明确要求时 push。

## 2. 当前本地提交记录

目前已经按重要板块完成多个本地 commit，核心包括：

```bash
c16e19a docs: record save loop verification summary
993a3cd server: add initial Prisma migration
7f12216 chore: add docker postgres local setup
5cde745 docs: add development progress learning summary
da9e2e9 frontend: add auth dashboard and schema save flow
2c67205 server: add auth and page schema APIs
8b30dc7 docs: add production planning and project guidelines
```

## 3. 提交说明

### 3.1 文档和规范

提交：

```bash
8b30dc7 docs: add production planning and project guidelines
```

包含：

- `CLAUDE.md`
- `docs/backend-database-selection.md`
- `docs/product-requirements.md`
- `docs/project-implementation-plan.md`
- `docs/coding-standards.md`
- `docs/security-guidelines.md`
- `docs/git-workflow.md`
- `docs/backend-local-development.md`
- `.gitignore`

作用：

- 明确项目目标
- 明确技术选型
- 明确产品需求
- 明确实施计划
- 明确编码规范
- 明确安全规范
- 明确 Git 工作流

### 3.2 后端板块

提交：

```bash
2c67205 server: add auth and page schema APIs
```

包含：

- `server/`
- NestJS 后端项目
- Prisma 数据模型
- 用户注册 / 登录
- JWT 鉴权
- 项目 CRUD
- 页面 CRUD
- 页面 schema 保存 / 读取

核心文件：

```text
server/prisma/schema.prisma
server/src/main.ts
server/src/app.module.ts
server/src/modules/auth/
server/src/modules/projects/
server/src/modules/pages/
server/src/prisma/
server/src/common/
```

### 3.3 前端接入板块

提交：

```bash
da9e2e9 frontend: add auth dashboard and schema save flow
```

包含：

- 登录 / 注册页面
- 项目列表页面
- 页面列表页面
- 前端 API 请求层
- 编辑器打开页面时加载后端 schema
- 编辑器 Header 增加保存按钮
- 保存当前组件树到后端
- 修复前端 lint / build 配置

核心文件：

```text
src/App.tsx
src/api/http.ts
src/api/auth.ts
src/api/projects.ts
src/api/pages.ts
src/api/types.ts
src/features/auth/AuthView.tsx
src/features/projects/ProjectDashboard.tsx
src/editor/components/Header/index.tsx
src/editor/stores/components.tsx
```

## 4. 本次新增能力

当前项目已经从纯前端学习 Demo，开始转向具备产品闭环的低代码平台雏形。

本次新增能力包括：

1. 项目有了 Git 管理。
2. 项目连接到了 GitHub remote。
3. 有了产品需求文档。
4. 有了后端技术选型文档。
5. 有了项目实施计划。
6. 有了安全规范和编码规范。
7. 有了 NestJS 后端。
8. 有了 PostgreSQL / Prisma 数据模型。
9. 有了登录注册能力。
10. 有了项目 / 页面管理能力。
11. 有了前端保存 schema 到后端的闭环。
12. 有了 Docker Compose 本地 PostgreSQL。
13. 有了 Prisma migration。
14. 有了上下文索引文档和 `/context-index` skill。

## 5. 已验证内容

已通过以下命令：

```bash
npm run build
npm run lint
npm run prisma:generate --prefix server
npm run build --prefix server
npm run prisma:migrate --prefix server -- --name init
```

说明：

- 前端 TypeScript 构建通过。
- 前端 lint 通过。
- Prisma Client 生成通过。
- Prisma migration 执行通过。
- NestJS 后端构建通过。
- API 保存闭环 smoke test 通过。

## 6. 尚未完成的验证

后端 API 保存闭环已经通过，浏览器端完整人工验证还未完成。

后续需要在浏览器验证：

1. 启动 PostgreSQL。
2. 启动后端。
3. 启动前端。
4. 注册 / 登录。
5. 创建项目。
6. 创建页面。
7. 打开编辑器。
8. 拖拽组件并修改配置。
9. 点击保存。
10. 刷新页面。
11. 重新打开页面并确认组件树恢复。

完整验证路径：

```text
注册 / 登录
  ↓
创建项目
  ↓
创建页面
  ↓
打开编辑器
  ↓
拖拽组件并修改配置
  ↓
点击保存
  ↓
刷新页面
  ↓
重新打开页面并确认组件树恢复
```

## 7. 学习重点

你的当前背景是：主要熟悉 React 前端，对后端、数据库、安全和 Git 工程流程还不熟悉。

因此接下来建议重点学习以下内容。

### 7.1 产品和业务视角

建议先看：

```text
docs/product-requirements.md
docs/project-implementation-plan.md
```

重点理解：

- 为什么低代码编辑器最重要的是“保存、再次打开、发布、回滚”。
- 为什么不是一开始堆组件数量。
- 为什么需要项目、页面、schema、版本这些业务概念。
- 什么叫“产品闭环”。

这部分可以帮助你从“写功能”转向“理解业务场景”。

### 7.2 后端最小业务架构

建议重点看：

```text
server/src/modules/auth/
server/src/modules/projects/
server/src/modules/pages/
```

NestJS 的基本分层：

```text
Controller：接收请求
Service：写业务逻辑
DTO：校验前端传来的数据
Guard：控制接口是否需要登录
Prisma：访问数据库
```

可以类比前端理解：

```text
页面组件        ≈ Controller
业务 hooks      ≈ Service
表单校验规则    ≈ DTO
路由鉴权        ≈ Guard
请求 API 层     ≈ Prisma / 数据库访问层
```

### 7.3 数据库模型

建议重点看：

```text
server/prisma/schema.prisma
server/prisma/migrations/20260428084614_init/migration.sql
```

目前有三个核心模型：

```text
User     用户
Project  项目
Page     页面
```

其中低代码编辑器最核心的是：

```prisma
schema Json
```

它保存的就是前端 Zustand 里的组件树。

核心闭环是：

```text
前端 components 树
        ↓ 保存
后端 Page.schema
        ↓ 读取
前端重新恢复 components 树
```

这就是第一阶段最重要的业务闭环。

### 7.4 前端如何从 Demo 变成产品

建议重点看：

```text
src/App.tsx
src/api/
src/features/
src/editor/components/Header/index.tsx
src/editor/stores/components.tsx
```

以前的流程是：

```text
打开页面 → Zustand 本地状态 → 编辑 / 预览
```

现在的流程是：

```text
登录
  ↓
项目列表
  ↓
页面列表
  ↓
从后端加载 schema
  ↓
写入 Zustand
  ↓
编辑
  ↓
保存到后端
```

这就是从前端 Demo 走向完整产品的第一步。

### 7.5 上下文索引和 token 管理

建议重点看：

```text
.claude/skills/context-index/SKILL.md
docs/CONTEXT_INDEX.md
.claude/context/FILE_MAP.md
docs/ARCHITECTURE.md
docs/API.md
docs/DECISIONS.md
```

你可以这样理解上下文索引：

```text
完整源码        = 信息最多，但 token 成本最高
上下文索引文档  = 信息较少，但足够帮助 AI 定位
按需读取源码    = 需要改哪里，再读哪里
```

这个机制的价值是：

- 新会话不用重新扫全项目。
- 上下文压缩后可以快速恢复项目状态。
- 其它 AI 不支持 Claude Code Skill，也可以直接读 Markdown。
- `CLAUDE.md` 不需要塞太多内容，避免每次会话都浪费 token。

## 8. 后续协作规则

后续每完成一个重要板块，都按以下流程执行：

1. 完成代码。
2. 运行必要验证。
3. 创建一次 git commit。
4. 把总结写入项目文档。
5. 说明本次修改了哪些文件。
6. 说明为什么这样改。
7. 总结你应该学习的知识点。

## 9. 2026-04-28 保存闭环验证记录

本次完成的是第一阶段最关键的后端保存闭环验证：把前端页面 schema 真正写入 PostgreSQL，并再次读取确认数据一致。

### 9.1 本次提交

提交：

```bash
993a3cd server: add initial Prisma migration
```

包含：

```text
server/prisma/migrations/20260428084614_init/migration.sql
server/prisma/migrations/migration_lock.toml
```

作用：

- 把 `server/prisma/schema.prisma` 里的模型转换成数据库建表 SQL。
- 创建 `User`、`Project`、`Page` 三张核心业务表。
- 创建唯一索引和外键约束。
- 让其他环境可以通过 migration 复现相同的数据库结构。

### 9.2 本次验证通过的内容

PostgreSQL Docker 容器已启动并通过健康检查。

Prisma migration 已成功执行：

```bash
npm run prisma:migrate --prefix server -- --name init
```

前后端构建验证通过：

```bash
npm run build
npm run build --prefix server
```

API smoke test 已验证完整闭环：

```text
注册用户
  ↓
登录获取 token
  ↓
调用 /auth/me 验证登录态
  ↓
创建项目
  ↓
创建页面
  ↓
PATCH /api/pages/:id 保存 schema
  ↓
GET /api/pages/:id 读取 schema
  ↓
确认保存的 Button 组件仍然存在
```

验证结果摘要：

```json
{
  "ok": true,
  "userId": 1,
  "projectId": 1,
  "pageId": 1,
  "savedComponent": "Button"
}
```

### 9.3 本次遇到的问题

第一次运行 Prisma migration 时，命令停在交互式输入：

```text
Enter a name for the new migration
```

原因是 `prisma migrate dev` 在首次生成 migration 时需要 migration 名称。

处理方式是改成非交互命令：

```bash
npm run prisma:migrate --prefix server -- --name init
```

中断第一次命令后，PostgreSQL 里残留了一个 Prisma advisory lock，导致下一次迁移短暂超时。

处理方式是终止本地开发库里卡住的 Prisma migration 会话，然后重新运行 migration。

### 9.4 你应该重点学习的点

#### Prisma migration 是什么

`schema.prisma` 是数据库模型设计文件，migration 是 Prisma 根据模型生成的真实 SQL 变更记录。

可以这样理解：

```text
schema.prisma       = 设计图
migration.sql       = 真正施工的 SQL
PostgreSQL tables   = 施工完成后的数据库结构
```

所以 migration 文件需要提交到 Git，否则别人或部署环境不知道应该如何创建数据库表。

#### 为什么低代码 schema 用 JSONB

低代码页面的组件树结构不固定，不同页面可能有不同组件、属性、样式和事件配置。

如果每个组件属性都拆成数据库表，会非常复杂；当前阶段更适合把整棵组件树保存到 `Page.schema`：

```prisma
schema Json
```

在 PostgreSQL 里它会变成 `JSONB` 字段，既能保存灵活 JSON，也比普通文本更适合后续查询和扩展。

#### 保存闭环的核心价值

现在项目已经不只是前端 demo，而是具备了最小产品闭环：

```text
用户登录
  ↓
创建项目和页面
  ↓
编辑器生成组件树
  ↓
保存到数据库
  ↓
重新打开页面恢复组件树
```

这是低代码平台能成为产品的基础。后续的版本管理、发布、权限、部署，都是建立在这个闭环之上。

### 9.5 后续总结规则

从现在开始，每次完成重要代码块后，除了简短聊天说明，还要把以下内容写入项目文档：

1. 本次提交。
2. 修改了哪些文件。
3. 每个文件的作用。
4. 执行了哪些验证。
5. 遇到了什么问题以及如何解决。
6. 你应该学习的知识点。

优先更新：

```text
docs/development-progress-summary.md
```

如果某次内容属于专门主题，例如后端、本地开发、部署、安全，再补充到对应专题文档。

## 10. 2026-04-28 上下文索引 Skill 与文档记录

本次完成的是为项目建立“低 token 上下文入口”，解决上下文太多、压缩后恢复困难、其它 AI 接手项目成本高的问题。

### 10.1 本次新增文件

```text
.claude/skills/context-index/SKILL.md
docs/CONTEXT_INDEX.md
docs/ARCHITECTURE.md
docs/API.md
docs/DECISIONS.md
.claude/context/FILE_MAP.md
```

同时更新：

```text
CLAUDE.md
docs/development-progress-summary.md
```

### 10.2 每个文件的作用

`/.claude/skills/context-index/SKILL.md`：定义 `/context-index` skill 的目标、扫描步骤、输出文件和注意事项。

`docs/CONTEXT_INDEX.md`：未来会话和其它 AI 的第一阅读入口，包含项目一句话说明、技术栈、推荐阅读顺序、核心闭环、命令和风险提醒。

`docs/ARCHITECTURE.md`：说明前端、后端、数据库之间如何协作，以及编辑器打开页面和保存页面的完整数据流。

`docs/API.md`：集中记录后端接口、鉴权方式、请求/响应结构、schema contract 和 API smoke test 路径。

`docs/DECISIONS.md`：记录产品和技术决策，例如为什么第一阶段先做保存闭环、为什么用 NestJS/PostgreSQL/Prisma、为什么做上下文索引而不是 MCP。

`.claude/context/FILE_MAP.md`：关键文件地图，说明哪些文件负责什么、修改风险是什么、常见修改路线怎么走。

`CLAUDE.md`：新增 Context Index 入口，避免把所有项目细节塞进每次都会加载的上下文。

### 10.3 为什么这样做

上下文索引的目标不是替代源码，而是帮助 AI 更快判断“接下来该读哪些源码”。

推荐流程是：

```text
先读 CLAUDE.md
  ↓
读 docs/CONTEXT_INDEX.md
  ↓
读 .claude/context/FILE_MAP.md
  ↓
根据任务按需读源码
```

这样比每次重新扫描全项目更省 token，也更适合上下文压缩后的恢复。

### 10.4 你应该学习的点

#### CLAUDE.md 不应该无限变大

`CLAUDE.md` 每次 Claude Code 会话都会读，如果里面放太多细节，会持续浪费 token。

更好的方式是：

```text
CLAUDE.md = 短入口 + 必须遵守的规则
索引文档 = 可按需读取的项目说明
源码     = 真正权威的信息
```

#### Skill 和 Markdown 的分工

Skill 适合定义“如何生成上下文索引”的流程。

Markdown 适合保存“当前项目是什么样”的结果。

其它 AI 可能不能运行 Claude Code Skill，但一般都可以读取 Markdown，所以项目知识应该落到文档里。

#### MCP 不是当前阶段的首选

MCP 适合连接外部系统或做更复杂的跨工具能力，例如数据库管理、部署平台、issue 系统、向量检索等。

当前项目只需要让 AI 更好理解本仓库，所以先用 Skill + 文档索引更轻量。

## 11. 2026-04-28 多页面创建修复与回滚功能现状

### 11.1 用户发现的问题

在浏览器手测时发现：同一个项目里创建第一个页面成功，但创建第二个页面会报错。

同时，当前编辑器界面只有“保存”按钮，没有“回滚”入口。

### 11.2 问题原因

创建页面弹窗里，页面路径默认值一直是：

```text
/home
```

数据库对页面路径有唯一约束：

```prisma
@@unique([projectId, routePath])
```

这表示同一个项目下不能有两个相同的 `routePath`。

所以第二次创建页面时，如果用户没有手动改路径，仍然提交 `/home`，后端会触发唯一约束错误。

### 11.3 本次修复

前端：

```text
src/features/projects/ProjectDashboard.tsx
```

修改点：

- 新增页面表单实例 `pageForm`。
- 点击“新建页面”时重置表单。
- 根据已有页面路径生成不重复的默认路径：

```text
/page-1
/page-2
/page-3
```

这样用户创建第二个页面时，不会默认继续使用 `/home`。

后端：

```text
server/src/modules/pages/pages.service.ts
```

修改点：

- 捕获 Prisma 唯一约束错误 `P2002`。
- 返回更明确的 `409 Conflict`：

```text
Page route path already exists in this project
```

这样即使用户手动输入了重复路径，后端也会返回更容易理解的错误。

### 11.4 已验证内容

已运行：

```bash
npm run build
npm run build --prefix server
```

并通过 API 验证：同一个项目下可以创建两个不同路径的页面：

```json
{
  "ok": true,
  "pageRoutes": [
    "/page-1",
    "/page-2"
  ]
}
```

### 11.5 关于回滚功能

你没有看到回滚入口是正常的，因为当前阶段还没有实现页面版本管理和回滚。

目前已经实现的是：

```text
保存当前页面 schema
```

还没有实现：

```text
保存历史版本
查看版本列表
选择某个版本回滚
```

下一阶段建议做“页面版本管理”，核心模型会是：

```text
PageVersion
```

大致流程：

```text
每次点击保存
  ↓
保存当前 Page.schema
  ↓
同时生成一条 PageVersion
  ↓
版本列表里展示历史记录
  ↓
点击回滚
  ↓
把某个 PageVersion.schema 恢复到 Page.schema
```

这是低代码平台从“能保存”走向“可放心使用”的关键能力。

### 11.6 你应该学习的点

#### 唯一约束是什么

数据库唯一约束用来保证某些字段组合不能重复。

当前项目里：

```prisma
@@unique([projectId, routePath])
```

意思是：

```text
同一个项目下，页面路径不能重复。
不同项目下，可以都有 /home。
```

这就是业务规则落到数据库层的例子。

#### 前端默认值也属于产品体验

这次 bug 不是后端不能创建第二个页面，而是前端默认值让用户很容易提交重复路径。

所以产品化开发里，表单默认值、错误提示、校验规则都很重要。

#### 保存不等于回滚

保存只代表覆盖当前最新状态。

回滚需要先有历史版本记录，所以必须新增版本表或版本存储机制。


## 12. 2026-04-28 预览模式模块不可见修复

### 12.1 用户发现的问题

点击编辑器顶部“预览”后，页面里看不到对应模块，用户会以为预览没有渲染。

### 12.2 问题原因

预览模式使用的是物料的 `prod.tsx`，不是编辑模式的 `dev.tsx`。

编辑模式下：

```text
src/editor/components/EditArea/index.tsx
  ↓
componentConfig[component.name].dev
```

预览模式下：

```text
src/editor/components/Preivew/index.tsx
  ↓
componentConfig[component.name].prod
```

部分布局组件在编辑态有边框、最小高度和拖拽提示，但在预览态更接近真实页面，没有明显边框。

例如空 `Container` 在预览态没有内容时，即使已经渲染，也可能看起来像什么都没有。

另外，如果某个组件缺少 `prod` 注册，原先预览会直接返回 `null`，用户看不到任何提示。

### 12.3 本次修复

修改：

```text
src/editor/materials/Page/prod.tsx
src/editor/materials/Container/prod.tsx
src/editor/components/Preivew/index.tsx
```

具体改动：

- `Page` 预览态增加最小高度和白色背景。
- `Container` 预览态增加最小高度和虚线边框，让空容器也可见。
- `Preview` 外层增加背景色。
- 如果某个组件没有 `prod` 预览组件，显示“未找到 xxx 的预览组件”提示，而不是静默空白。

### 12.4 已验证内容

已运行：

```bash
npm run build
npm run build --prefix server
```

说明：

- 前端 TypeScript 和生产构建通过。
- 后端构建通过。

### 12.5 你应该学习的点

#### 低代码编辑器通常有两套渲染

编辑器里常见两套组件：

```text
dev  = 编辑态组件，用于拖拽、选中、hover、辅助边框
prod = 运行态组件，用于真实预览或发布页面
```

所以一个组件在编辑态可见，不代表预览态一定可见；预览态要看 `prod.tsx` 是否正确渲染。

#### 空容器需要可视化提示

低代码编辑器里，容器类组件即使没有子节点，也应该让用户知道它存在。

否则用户会误以为：

```text
组件没有保存
组件没有渲染
预览坏了
```

这属于产品体验问题，不只是代码问题。

#### 静默失败不适合编辑器

原来缺少 `prod` 时直接返回 `null`，这对开发者和用户都不友好。

更好的方式是显示明确占位：

```text
未找到 Button 的预览组件
```

这样问题可以被快速定位。

## 13. 2026-04-28 页面版本历史与回滚功能

本次完成的是页面版本管理 MVP：每次保存页面时自动生成历史版本，用户可以在编辑器里打开版本历史，并选择某个版本回滚。

### 13.1 本次新增能力

```text
点击保存
  ↓
更新 Page.schema 当前页面
  ↓
创建 PageVersion 历史版本
  ↓
打开版本历史
  ↓
选择版本并确认回滚
  ↓
恢复旧 schema 到 Page.schema
  ↓
再创建一条 rollback 来源的新版本
```

这让编辑器从“只能覆盖保存”变成“可以恢复历史状态”。

### 13.2 本次修改文件

数据库：

```text
server/prisma/schema.prisma
server/prisma/migrations/20260428120657_add_page_versions/migration.sql
```

作用：

- 新增 `PageVersion` 模型和数据表。
- `PageVersion.schema` 保存某一次保存或回滚时的完整页面 schema。
- `versionNo` 记录页面内递增版本号。
- `source` 区分版本来源：`save` 或 `rollback`。
- 页面删除时，历史版本跟随 cascade 删除。

后端：

```text
server/src/modules/pages/pages.controller.ts
server/src/modules/pages/pages.service.ts
server/src/modules/pages/dto/rollback-page.dto.ts
```

作用：

- 保存页面时同时创建历史版本。
- 新增 `GET /api/pages/:id/versions` 查询版本列表。
- 新增 `POST /api/pages/:id/rollback` 回滚到指定版本。
- 回滚前校验页面归属和版本归属，避免跨用户或跨页面回滚。
- 回滚后再创建一条 `source = rollback` 的版本，保留操作记录。

前端：

```text
src/api/pages.ts
src/api/types.ts
src/editor/components/Header/index.tsx
```

作用：

- 新增 `PageVersion` 类型。
- 新增版本列表和回滚 API 请求方法。
- 编辑器 Header 增加“版本历史”按钮。
- 使用 Drawer 展示版本列表。
- 使用 Popconfirm 防止误点回滚。
- 回滚成功后调用 `setComponents`，让编辑器画布立即恢复旧组件树。

文档：

```text
docs/API.md
docs/ARCHITECTURE.md
docs/CONTEXT_INDEX.md
.claude/context/FILE_MAP.md
docs/development-progress-summary.md
```

作用：

- 同步记录版本接口、架构数据流、上下文索引和关键文件地图。

### 13.3 已验证内容

已运行：

```bash
npm run prisma:migrate --prefix server -- --name add_page_versions
npm run prisma:generate --prefix server
npm run build
npm run build --prefix server
```

API smoke test 已验证完整版本回滚闭环：

```text
注册用户
  ↓
创建项目
  ↓
创建页面
  ↓
第一次保存 schema，生成 v1
  ↓
第二次保存不同 schema，生成 v2
  ↓
查询版本列表
  ↓
回滚到 v1
  ↓
读取页面，确认 schema 恢复
  ↓
再次查询版本列表，确认新增 rollback 版本
```

验证结果摘要：

```json
{
  "ok": true,
  "pageId": 12,
  "versionCount": 3,
  "restoredText": "版本一",
  "rollbackVersionNo": 3
}
```

说明：

- 保存会生成 `source = save` 的版本。
- 回滚会恢复旧 schema。
- 回滚行为本身会生成 `source = rollback` 的新版本。
- 前端和后端生产构建均通过。

### 13.4 本次遇到的问题

#### Prisma Client 没有及时更新

新增 `PageVersion` 后，第一次后端构建报错：

```text
Property 'pageVersion' does not exist on type 'PrismaService'
```

原因是修改了 `schema.prisma`，但 Prisma Client 还没有重新生成。

处理方式：

```bash
npm run prisma:generate --prefix server
```

#### Windows 下 Prisma query engine DLL 被占用

第一次执行 Prisma generate 时遇到 DLL rename 权限错误。

原因是本地 Nest dev server 或残留 Prisma migration 进程占用了 Prisma query engine 文件。

处理方式：

- 停止后端 dev server 和残留 Prisma 进程。
- 保留前端 Vite 进程。
- 重新执行 Prisma generate。

#### 进度文档不能整文件覆盖

记录本次总结时曾误把进度文档改成简短版本，可能丢失之前的学习记录。

处理方式：

```bash
git restore -- docs/development-progress-summary.md
```

恢复后改为只追加第 13 节。

### 13.5 你应该学习的点

#### 保存版本和当前页面为什么要分开

当前页面：

```text
Page.schema
```

表示用户现在打开编辑器看到的最新状态。

历史版本：

```text
PageVersion.schema
```

表示某一次保存或回滚时的快照。

这样设计的好处是：

- 读取当前页面很简单，只查 `Page`。
- 历史记录不会覆盖当前状态。
- 回滚只是把某个历史快照复制回当前页面。

#### 回滚不是删除历史

回滚不是把版本列表倒退，也不是删除后面的版本。

更合理的做法是：

```text
旧版本 v1
新版本 v2
用户回滚到 v1
系统生成 v3，内容等于 v1，source = rollback
```

这样历史是完整的，后续可以知道用户什么时候执行过回滚。

#### 权限校验不能只查 versionId

回滚接口不能只根据 `versionId` 查版本，否则可能出现用户拿到别人版本 ID 后跨页面回滚。

正确逻辑是：

```text
先确认 page 属于当前用户
再确认 version 属于这个 page
最后才允许回滚
```

这就是后端业务接口必须做 owner 校验的原因。

#### 版本号和并发

当前 MVP 使用：

```text
当前最大 versionNo + 1
```

这对单人编辑和本地开发足够。以后如果要做多人协作或高并发保存，需要考虑事务冲突、重试或更严格的版本生成策略。

#### 前端回滚后要更新 Zustand

后端回滚成功只代表数据库已经恢复。编辑器画布要立即变化，还必须把返回的 schema 写回前端状态：

```text
page.schema.components → useComponetsStore.setComponents
```

否则用户会以为回滚没有生效。
