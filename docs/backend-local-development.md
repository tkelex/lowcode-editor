# 后端本地开发说明

## 环境要求

- Node.js 20+
- PostgreSQL 14+

## 初始化

```bash
npm install --prefix server
```

复制环境变量示例：

```bash
cp server/.env.example server/.env
```

修改 `server/.env` 中的：

- `DATABASE_URL`
- `JWT_SECRET`
- `FRONTEND_ORIGIN`

## 数据库

生成 Prisma Client：

```bash
npm run prisma:generate --prefix server
```

开发环境创建表：

```bash
npm run prisma:migrate --prefix server
```

如果只是本地快速同步模型，也可以使用：

```bash
npx prisma db push --prefix server
```

## 启动

后端：

```bash
npm run dev --prefix server
```

前端：

```bash
npm run dev
```

默认前端 API 地址是：

```text
http://localhost:3000/api
```

如果后端地址不同，可在根目录 `.env` 中配置：

```text
VITE_API_BASE_URL=http://localhost:3000/api
```

## 第一阶段验证路径

1. 打开前端。
2. 注册账号或登录。
3. 创建项目。
4. 创建页面。
5. 打开编辑器。
6. 拖拽组件并修改属性。
7. 点击保存。
8. 刷新后重新打开页面，确认组件树恢复。
