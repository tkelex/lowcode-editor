# GitHub Copilot Instructions

`AGENTS.md` 是本仓库跨工具协作规则的唯一事实来源。开始任务前先读取它，不在本文件复制命令、架构或兼容约束。

## Context

1. 从 `CONTEXT-MAP.md` 选择相关领域上下文。
2. 使用 `docs/00-总览/项目上下文索引.md` 定位任务阅读路线。
3. 需要文件职责时读取 `.claude/context/FILE_MAP.md`。
4. 架构、接口和长期决策分别读取 `docs/02-架构`、`docs/03-接口` 和相关 ADR。

## Path Rules

- 编辑器、前端、schema：`.github/instructions/editor.instructions.md`
- NestJS、权限和 Prisma：`.github/instructions/server.instructions.md`
- 文档和 AI 上下文：`.github/instructions/docs.instructions.md`

验证命令、公开发布安全约束、历史兼容名称和文档职责均以 `AGENTS.md` 为准。
