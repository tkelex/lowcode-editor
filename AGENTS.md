# AGENTS.md

本文件是仓库内自动化工具的入口。完整的 AI 上下文统一维护在 `agent-context/`。

## Language

- 自然语言默认使用简体中文。
- 标识符、路径、命令、依赖名和机器解析字段保持原格式。

## Reading Order

1. `agent-context/README.md`：AI 上下文唯一入口（原则、命令、不变量、验证）。
2. `agent-context/routing.md`：按任务类型选择要读的文件。
3. `CONTEXT-MAP.md` 与对应目录的 `CONTEXT.md`：部署单元边界。
4. `docs/`：项目事实的权威文档。

仓库存在 `.codegraph/`，理解或定位代码优先使用 `codegraph explore`。

## Documentation

- 项目事实写入 `docs/`，AI 阅读规则写入 `agent-context/`。
- 个人规划、复盘和学习资料写入 `E:\obsidian notes\笔记`，不提交到仓库。
- 架构、接口、命令或目录变化时，同步更新 `agent-context/` 与相应文档。
