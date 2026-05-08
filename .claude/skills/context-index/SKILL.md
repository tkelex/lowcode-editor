---
name: context-index
description: Generate and maintain concise project context indexes for future Claude Code sessions and other AI tools.
---

# Context Index Skill

Use this skill when the user asks to reduce context usage, prepare the project for another AI/session, refresh project onboarding context, or update the project knowledge index.

## Goal

Generate durable, low-token Markdown indexes that let an AI understand this project before reading source files. The indexes should point to authoritative files and summarize only stable architecture, workflows, and risks.

## Required outputs

Update these files when running the skill:

1. `docs/00-总览/项目上下文索引.md` — first-read project map and recommended reading order.
2. `docs/02-架构/架构说明.md` — stable architecture, data flow, and module boundaries.
3. `docs/03-接口/接口说明.md` — backend API surface, auth behavior, and schema persistence contracts.
4. `docs/02-架构/技术决策记录.md` — important product and technical decisions with rationale.
5. `.claude/context/FILE_MAP.md` — concise key-file map with ownership, purpose, and edit risks.
6. `CLAUDE.md` — keep as a short operational entry and link to detailed context docs.
7. `docs/08-复盘/开发进度与学习总结.md` — append milestone summary, verification, and learning notes when meaningful changes were made.

## Process

1. Read current repo state before writing:
   - `CLAUDE.md`
   - `package.json`
   - `server/package.json`
   - `server/prisma/schema.prisma`
   - `src/App.tsx`
   - `src/editor/stores/components.tsx`
   - `src/editor/stores/component-config.tsx`
   - `src/editor/index.tsx`
   - `server/src/app.module.ts`
   - backend module controllers/services under `server/src/modules/`
   - existing docs under `docs/`
2. Prefer `Glob`, `Grep`, and `Read` over shell commands for exploration.
3. Write concise docs. Do not paste large source snippets.
4. Preserve known misspellings that are part of public project API:
   - `useComponetsStore`
   - `useMaterailDrop`
   - `components/Preivew`
   - `components/Sourse`
5. Verify docs mention current commands and current API routes.
6. Run lightweight validation:
   - `npm run build`
   - `npm run build --prefix server`
7. Commit the generated/updated index files when the user requested project work and the changes are coherent.

## Writing style

- Use Chinese for learning notes and project summaries unless the user asks otherwise.
- Keep each section skimmable.
- Prefer file paths over long explanations.
- Distinguish stable facts from pending/future work.
- If unsure whether something is current, read the source instead of relying on memory.

## What not to do

- Do not turn `CLAUDE.md` into a huge context dump.
- Do not store secrets, `.env` values, tokens, passwords, or private credentials in generated docs.
- Do not describe every file in the repository; only list files that future AI sessions are likely to need.
- Do not invent APIs, routes, scripts, or deployment steps that are not present.

