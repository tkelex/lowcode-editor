# CLAUDE.md

Claude Code 必须先遵循 [AGENTS.md](./AGENTS.md)。项目架构、命令和高风险约束不在本文件重复维护。

## Claude Context

- 领域上下文入口：`CONTEXT-MAP.md`
- 低 token 项目入口：`docs/00-总览/项目上下文索引.md`
- 文件职责：`.claude/context/FILE_MAP.md`
- 刷新上下文索引：`.claude/skills/context-index/SKILL.md`

## Agent skills

### Issue tracker

重构事项使用 GitHub Issues 跟踪。详见 `docs/agents/issue-tracker.md`。

### Triage labels

使用默认五阶段 triage 标签。详见 `docs/agents/triage-labels.md`。

### Domain docs

采用多上下文领域文档布局。详见 `docs/agents/domain.md`。
