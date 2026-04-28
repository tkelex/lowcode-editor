# API 说明

## 基础信息

后端框架：NestJS

默认 API 前缀：

```text
/api
```

默认本地地址：

```text
http://localhost:3000/api
```

前端通过 `VITE_API_BASE_URL` 配置 API 地址：

```text
VITE_API_BASE_URL=http://localhost:3000/api
```

## 鉴权方式

登录成功后后端返回 access token。

前端保存到 localStorage key：

```text
lowcode_editor_token
```

请求业务接口时通过 header 传递：

```http
Authorization: Bearer <accessToken>
```

前端封装位置：`src/api/http.ts`

后端鉴权相关文件：

```text
server/src/common/guards/jwt-auth.guard.ts
server/src/common/guards/jwt.strategy.ts
server/src/common/decorators/current-user.decorator.ts
```

## 统一错误格式

后端使用全局异常过滤器：

```text
server/src/common/filters/http-exception.filter.ts
```

错误响应大致形态：

```json
{
  "statusCode": 400,
  "message": "错误信息",
  "timestamp": "2026-04-28T00:00:00.000Z"
}
```

## Auth API

Controller：`server/src/modules/auth/auth.controller.ts`

Service：`server/src/modules/auth/auth.service.ts`

### POST /api/auth/register

注册用户。

请求体：

```json
{
  "email": "user@example.com",
  "username": "username",
  "password": "password123"
}
```

校验：

- `email` 必须是邮箱。
- `username` 长度 3-32。
- `password` 长度 6-64。

响应：

```json
{
  "accessToken": "jwt-token",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "username",
    "nickname": null,
    "avatarUrl": null
  }
}
```

### POST /api/auth/login

登录用户。

请求体：

```json
{
  "account": "username 或 email",
  "password": "password123"
}
```

响应同注册。

### GET /api/auth/me

获取当前登录用户。

需要 JWT。

响应：

```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "username",
  "nickname": null,
  "avatarUrl": null
}
```

## Projects API

Controller：`server/src/modules/projects/projects.controller.ts`

Service：`server/src/modules/projects/projects.service.ts`

所有接口都需要 JWT。

### GET /api/projects

获取当前用户的项目列表。

### POST /api/projects

创建项目。

请求体：

```json
{
  "name": "项目名称",
  "description": "项目描述"
}
```

响应示例：

```json
{
  "id": 1,
  "ownerId": 1,
  "name": "项目名称",
  "description": "项目描述",
  "status": "active",
  "createdAt": "2026-04-28T00:00:00.000Z",
  "updatedAt": "2026-04-28T00:00:00.000Z"
}
```

### GET /api/projects/:id

获取项目详情。

权限：只能获取自己的项目。

### PATCH /api/projects/:id

更新项目。

请求体：

```json
{
  "name": "新项目名称",
  "description": "新描述",
  "status": "active"
}
```

权限：只能更新自己的项目。

### DELETE /api/projects/:id

删除项目。

权限：只能删除自己的项目。

删除项目会 cascade 删除其页面。

## Pages API

Controller：`server/src/modules/pages/pages.controller.ts`

Service：`server/src/modules/pages/pages.service.ts`

所有接口都需要 JWT。

### GET /api/projects/:projectId/pages

获取某个项目下的页面列表。

权限：只能获取自己项目下的页面。

### POST /api/projects/:projectId/pages

创建页面。

请求体：

```json
{
  "name": "首页",
  "routePath": "/home"
}
```

也可以传入初始 schema：

```json
{
  "name": "首页",
  "routePath": "/home",
  "schema": {
    "schemaVersion": "1.0.0",
    "components": [
      {
        "id": 1,
        "name": "Page",
        "props": {},
        "desc": "页面"
      }
    ],
    "metadata": {}
  }
}
```

如果不传 schema，后端会写入默认 Page schema。

`routePath` 当前格式：

```text
必须以 / 开头，只允许字母、数字、下划线、中划线和斜杠
```

### GET /api/pages/:id

获取页面详情。

权限：页面所属项目必须属于当前用户。

响应核心字段：

```json
{
  "id": 1,
  "projectId": 1,
  "createdById": 1,
  "name": "首页",
  "routePath": "/home",
  "schema": {
    "schemaVersion": "1.0.0",
    "pageId": 1,
    "components": [],
    "metadata": {}
  },
  "createdAt": "2026-04-28T00:00:00.000Z",
  "updatedAt": "2026-04-28T00:00:00.000Z"
}
```

### PATCH /api/pages/:id

更新页面或保存 schema。

请求体：

```json
{
  "name": "首页",
  "routePath": "/home",
  "schema": {
    "schemaVersion": "1.0.0",
    "pageId": 1,
    "components": [
      {
        "id": 1,
        "name": "Page",
        "props": {},
        "desc": "页面",
        "children": []
      }
    ],
    "metadata": {
      "updatedAt": "2026-04-28T00:00:00.000Z"
    }
  }
}
```

前端保存按钮调用位置：`src/editor/components/Header/index.tsx`

前端 API 封装位置：`src/api/pages.ts`

### GET /api/pages/:id/versions

获取页面历史版本列表。

权限：页面所属项目必须属于当前用户。

响应示例：

```json
[
  {
    "id": 1,
    "pageId": 1,
    "createdById": 1,
    "versionNo": 1,
    "schema": {
      "schemaVersion": "1.0.0",
      "pageId": 1,
      "components": [],
      "metadata": {}
    },
    "source": "save",
    "message": null,
    "createdAt": "2026-04-28T00:00:00.000Z"
  }
]
```

`source` 当前含义：

```text
save      用户点击保存生成的版本
rollback  用户执行回滚后生成的新版本
```

### POST /api/pages/:id/rollback

回滚页面到指定历史版本。

权限：页面所属项目必须属于当前用户，并且版本必须属于该页面。

请求体：

```json
{
  "versionId": 1
}
```

响应：更新后的页面。

回滚行为会：

1. 把目标 `PageVersion.schema` 恢复到 `Page.schema`。
2. 新建一条 `source = "rollback"` 的 PageVersion，记录本次回滚结果。

### DELETE /api/pages/:id/versions/:versionId

删除某条页面历史版本记录。

权限：页面所属项目必须属于当前用户，并且版本必须属于该页面。

响应：

```json
{
  "success": true
}
```

删除行为只会删除 `PageVersion` 记录，不会修改当前 `Page.schema`，也不会影响编辑器当前页面内容。删除后的历史版本不能再用于回滚。

### DELETE /api/pages/:id

删除页面。

权限：页面所属项目必须属于当前用户。

## Schema contract

前端编辑器当前组件树来自 Zustand：`src/editor/stores/components.tsx`

单个组件节点：

```ts
{
  id: number;
  name: string;
  props: any;
  styles?: CSSProperties;
  desc: string;
  children?: Component[];
  parentId?: number;
}
```

保存到后端时包装为：

```ts
{
  schemaVersion: '1.0.0',
  pageId,
  components,
  metadata: {
    updatedAt: new Date().toISOString()
  }
}
```

数据库字段：

```prisma
Page.schema Json
```

PostgreSQL 中实际是 JSONB。

## API smoke test 路径

最小验证顺序：

```text
POST /api/auth/register
POST /api/auth/login
GET /api/auth/me
POST /api/projects
POST /api/projects/:projectId/pages
PATCH /api/pages/:id
GET /api/pages/:id
```

确认最后读取出的 `schema.components` 与保存内容一致。

版本回滚和删除验证顺序：

```text
PATCH /api/pages/:id 保存版本一
PATCH /api/pages/:id 保存版本二
GET /api/pages/:id/versions
POST /api/pages/:id/rollback 回滚到版本一
GET /api/pages/:id 确认 schema 恢复
GET /api/pages/:id/versions 确认新增 rollback 版本
DELETE /api/pages/:id/versions/:versionId 删除某条历史版本
GET /api/pages/:id/versions 确认该版本消失
GET /api/pages/:id 确认当前 schema 不受删除影响
```

## 未来 API 方向

尚未实现但产品计划需要：

- 发布记录：`Deployment`
- 上传素材：`Asset`
- 项目成员：`ProjectMember`
- 发布页公开访问 API
