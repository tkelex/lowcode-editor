---
applyTo: "docs/**, AGENTS.md, CLAUDE.md, .claude/context/**, .agents/skills/**"
---

# Documentation And AI Context Instructions

Use these rules for project docs and AI onboarding files.

## Keep Context Layered

- Keep `AGENTS.md` and `CLAUDE.md` short operational entries.
- Put stable architecture in `docs/02-架构/架构说明.md`.
- Put route and persistence contracts in `docs/03-接口/接口说明.md`.
- Put AI reading order and task routing in `docs/00-总览/*`.
- Put file ownership and edit risks in `.claude/context/FILE_MAP.md`.

## Maintenance Rules

- Do not duplicate large source explanations across docs.
- Prefer links to authoritative files and concise summaries.
- Distinguish stable current behavior from planned work.
- Update `/context-index` outputs when project structure, API, or architecture changes.
- Do not document secrets or local-only credentials.

