# GitHub 与 Netlify 上线指南

## 当前部署结论

这个项目可以先推送到 GitHub，再用 Netlify 部署前端。但当前项目不是纯静态站点：前端是 Vite/React，后端是 NestJS，数据库是 PostgreSQL。

推荐第一版上线结构：

```text
GitHub 仓库
  ↓
Netlify 部署前端 Vite/React
  ↓
独立后端服务 NestJS API
  ↓
PostgreSQL 数据库
```

Netlify 负责构建和托管 `dist` 静态资源；NestJS 后端和 PostgreSQL 需要部署到 Render、Railway、Fly.io、云服务器、Supabase/Neon PostgreSQL 等支持常驻服务和数据库的平台。

## 已加入的 Netlify 配置

项目根目录已加入：

```text
netlify.toml
```

内容负责：

- 使用 `npm run build` 构建。
- 发布 `dist` 目录。
- 使用 Node 20。
- 把所有前端路由 fallback 到 `index.html`，避免刷新 `/publish/:publicId` 或 `/admin` 时 404。

Netlify 官方文档中，Vite 项目默认建议的 build command 是 `npm run build`，publish directory 是 `dist`；SPA 路由需要用 `/* -> /index.html 200` 的 rewrite 规则。

## 推送到 GitHub 前

先在本地确认：

```powershell
npm.cmd run check
```

建议也跑：

```powershell
npm.cmd run test:e2e
```

确认不要提交：

- `.env`
- `server/.env`
- 真实数据库密码
- 真实 `JWT_SECRET`
- 备份文件
- `node_modules`
- `dist`

当前远程仓库已经配置为：

```text
https://github.com/tkelex/lowcode-editor.git
```

常规提交和推送：

```powershell
git status
git add .
git commit -m "chore: prepare netlify deployment"
git push
```

如果是首次推送当前分支：

```powershell
git push -u origin master
```

如果你想使用 GitHub 常见的 `main` 分支：

```powershell
git branch -M main
git push -u origin main
```

## 在 Netlify 创建项目

进入：

```text
https://app.netlify.com/teams/tkelex/projects
```

操作顺序：

1. 选择从 Git 导入项目。
2. 选择 GitHub。
3. 选择 `tkelex/lowcode-editor` 仓库。
4. Build command 填：

```text
npm run build
```

5. Publish directory 填：

```text
dist
```

6. Base directory 留空，因为前端项目就在仓库根目录。

如果 Netlify 读到了 `netlify.toml`，这些配置会自动生效。

## Netlify 环境变量

进入 Netlify 项目设置里的 Environment variables，至少配置：

```text
VITE_API_BASE_URL=https://你的后端域名/api
VITE_LOWCODE_HTTP_ALLOWED_ORIGINS=https://你的后端域名
```

注意：

- 如果前端和后端不是同一个域名，不要把 `VITE_API_BASE_URL` 设成 `/api`。
- Netlify 构建时不会自动读取你本地的 `.env` 文件，生产变量要在 Netlify UI 里配置。
- `VITE_` 开头的变量会被打进前端产物，不要放密钥。

示例：

```text
VITE_API_BASE_URL=https://lowcode-api.example.com/api
VITE_LOWCODE_HTTP_ALLOWED_ORIGINS=https://lowcode-api.example.com
```

## 后端需要单独部署

NestJS 后端需要一个能运行 Node 服务的平台。第一版可选：

- Render Web Service + PostgreSQL。
- Railway Web Service + PostgreSQL。
- Fly.io App + 托管 PostgreSQL。
- 云服务器 Docker Compose。
- 后端放云服务器，数据库用 Neon/Supabase PostgreSQL。

后端生产变量至少需要：

```text
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://...
JWT_SECRET=至少 32 位随机字符串
JWT_EXPIRES_IN=7d
FRONTEND_ORIGIN=https://你的-netlify-域名
UPLOAD_DIR=持久化目录
UPLOAD_MAX_SIZE=5242880
```

关键点：

- `FRONTEND_ORIGIN` 必须填 Netlify 的真实域名或自定义域名。
- 后端必须开启公网 HTTPS 访问，前端才能稳定请求。
- PostgreSQL 不要暴露公网弱密码。
- 生产环境上线前先跑 migration。

## CORS 和 API 地址

上线后常见问题是：

```text
前端打开了，但登录/保存接口请求失败
```

优先检查：

- Netlify 的 `VITE_API_BASE_URL` 是否是后端完整 API 地址。
- 后端 `FRONTEND_ORIGIN` 是否等于 Netlify 域名。
- 后端 `/api/health` 是否能在浏览器直接打开。
- 后端是否已经执行 Prisma migration。

## 上线验收

Netlify 前端部署成功、后端部署成功后，按这个顺序验收：

1. 打开 Netlify 站点首页。
2. 打开 `https://你的后端域名/api/health`。
3. 注册或登录。
4. 创建项目。
5. 创建页面。
6. 打开编辑器。
7. 拖拽组件并保存。
8. 刷新后重新打开页面，确认 schema 恢复。
9. 发布页面。
10. 打开 `/publish/:publicId`，确认公开页刷新不 404。
11. 授予管理员账号并进入 `/admin`。

完整验收清单见：

```text
docs/06-测试与验收/上线验收清单.md
```

## 推荐上线顺序

1. 先把代码推送到 GitHub。
2. 在 Netlify 创建前端项目，确认前端能构建成功。
3. 部署 NestJS 后端和 PostgreSQL。
4. 回到 Netlify 填真实 `VITE_API_BASE_URL`。
5. 回到后端填真实 `FRONTEND_ORIGIN`。
6. 重新触发 Netlify deploy。
7. 按上线验收清单手测。
8. 再绑定正式域名。

## 参考链接

- [Netlify Vite 部署文档](https://docs.netlify.com/frameworks/vite/)
- [Netlify 环境变量文档](https://docs.netlify.com/build/configure-builds/environment-variables/)
- [Netlify SPA rewrite 文档](https://docs.netlify.com/manage/routing/redirects/rewrites-proxies/)
