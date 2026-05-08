# Git 工作流

## 仓库策略

当前项目采用单仓库管理前端和后端。前端保留在根目录，后端放在 `server/`。

## 分支建议

个人开发阶段可以先使用：

- `main`：稳定可运行版本。
- `feature/<name>`：较大的功能开发。

如果只有一个人开发，也可以在 main 上小步提交，但每次提交都必须保持可解释、可回滚。

## 提交粒度

建议按阶段提交：

1. docs：文档和规范。
2. chore：工程配置、gitignore、脚手架。
3. server：后端基础、认证、项目页面 API。
4. frontend：前端登录、项目页面、保存闭环。
5. fix：问题修复。

## 提交信息

推荐格式：

```text
<type>: <summary>
```

示例：

```text
docs: add production implementation plan
chore: initialize backend scaffold
server: add auth endpoints
frontend: add page schema save flow
fix: handle page load failure state
```

## 提交前检查

根据改动范围运行：

- 前端：`npm run lint`、`npm run build`
- 后端：在 `server/` 下运行 `npm run build`
- 数据库：确认 Prisma schema 和 `.env.example` 同步

## 禁止事项

- 不提交 `.env`。
- 不提交 `node_modules/` 和 `dist/`。
- 不使用 `--no-verify` 跳过检查，除非用户明确要求。
- 不做破坏性 git 操作，例如 `reset --hard`、强推、删除分支，除非用户明确要求。
- 不把临时代码、调试 token、真实账号密码写入提交。

## 回滚原则

- 优先通过新提交修复问题。
- 不直接重写历史，除非确认还没有共享给他人。
- 大功能要小步提交，便于定位和回滚。
