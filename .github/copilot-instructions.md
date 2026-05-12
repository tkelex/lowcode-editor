# Repository AI Coding Instructions

This repository is a Vite + React + TypeScript low-code editor with a NestJS + Prisma backend. Treat `AGENTS.md` as the canonical AI entrypoint, then read only the docs and source files needed for the current task.

## First Read

1. `AGENTS.md`
2. `docs/00-总览/AI快速上手.md`
3. `docs/00-总览/项目上下文索引.md`
4. `.claude/context/FILE_MAP.md`

For architecture, API, or persistence work, also read:

- `docs/02-架构/架构说明.md`
- `docs/03-接口/接口说明.md`
- `docs/02-架构/技术决策记录.md`

## Working Rules

- Preserve existing user changes. Check the task scope before editing and do not revert unrelated files.
- Prefer existing project patterns over new abstractions.
- Keep public compatibility typos unless doing a deliberate cleanup: `useComponetsStore`, `useMaterailDrop`, `components/Preivew`, `components/Sourse`.
- When adding or changing materials, update dev render, prod render, registry metadata, schema rules, and relevant tests together.
- Published pages must not execute custom user JavaScript. Keep `allowCustomJS={false}` for public publish runtime.
- Backend authorization must be enforced in services/guards, not only hidden in the frontend UI.
- Prisma schema changes require a migration and generated client update.

## Validation Matrix

- Frontend component or style change: `npm run lint` and `npm run build`.
- Schema, event, URL, or HTTP action change: `npm run test`.
- Backend API change: `npm run build --prefix server`.
- Permission, save, publish, or version flow: `npm run smoke:api`.
- Editor interaction change: `npm run test:e2e:editor`.
- Release-level confidence: `npm run preflight`.

If a validation command cannot be run, explain why and name the remaining risk.

