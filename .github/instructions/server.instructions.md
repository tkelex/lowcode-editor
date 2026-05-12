---
applyTo: "server/**, scripts/smoke/**, scripts/test/**, infra/**, docker-compose.yml"
---

# Backend And Infrastructure Instructions

Use these rules for NestJS, Prisma, API, auth, deployment, and smoke-test work.

## Backend Shape

- Backend code lives under `server/src`.
- Modules should keep controller, service, DTO, and guard responsibilities separated.
- Persisted page schema flows through pages services and shared schema validation.
- Project/page/member permissions must be enforced server-side.

## Prisma And Data Safety

- Changes to `server/prisma/schema.prisma` require a Prisma migration.
- Keep existing migrations intact.
- Do not store secrets, `.env` values, tokens, passwords, or private credentials in docs or examples.
- Prefer explicit DTO validation over accepting loose request payloads.

## API Contract Changes

When adding or changing an API:

- Update the controller/service/DTO together.
- Update frontend API wrappers under `src/shared/api/*` or `src/api/*` when the frontend consumes it.
- Update `docs/03-接口/接口说明.md` if the route, auth behavior, or payload contract changes.
- Add or adjust smoke coverage for permission, save, publish, or version behavior when relevant.

## Validation

- Backend build: `npm run build --prefix server`.
- Prisma client: `npm run prisma:generate --prefix server`.
- Migration deploy check: `npm run prisma:deploy --prefix server`.
- API smoke: `npm run smoke:api`.

