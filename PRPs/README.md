# PRP Workflow

PRP means Product Requirement Prompt: a small execution brief for AI coding work.

Use a PRP when a request may touch multiple modules, data contracts, event behavior, persistence, permissions, or editor interactions.

## How To Use

1. Copy one template from `PRPs/templates/`.
2. Save the task under `PRPs/active/<short-task-name>.md` when the work is large enough to track.
3. Fill goal, scope, relevant files, acceptance criteria, and validation commands.
4. Ask the AI agent to implement from the PRP and update completion notes.
5. Move finished PRPs to `PRPs/archive/` if you want to keep the history.

Small one-file fixes do not need a PRP.

## Templates

- `templates/feature.md` for new capabilities or larger improvements.
- `templates/bugfix.md` for reproducible bugs and regressions.

