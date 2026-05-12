# Bugfix PRP Template

Use this template before asking an AI coding agent to fix a bug that may touch multiple files.

## Problem

Describe the observed failure, error message, screenshot, or broken behavior.

## Reproduction

1. 
2. 
3. 

Expected:

Actual:

## Suspected Area

- Relevant docs:
- Relevant source files:
- Recent related changes:

## Constraints

- Do not change unrelated behavior.
- Do not revert unrelated user changes.
- Preserve existing public compatibility names.

## Fix Plan

1. 
2. 
3. 

## Regression Coverage

- Unit/schema test:
- Smoke test:
- E2E/manual check:

## Validation Commands

- `npm run lint`
- `npm run build`
- `npm run test`

Add targeted commands when relevant:

- `npm run build --prefix server`
- `npm run smoke:api`
- `npm run test:e2e:editor`

## Completion Notes

- Root cause:
- Changed files:
- Validation run:
- Remaining risks:

