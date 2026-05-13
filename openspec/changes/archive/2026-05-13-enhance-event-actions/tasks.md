## 1. Schema and Migration

- [x] 1.1 Extend shared `UrlAction` handling so legacy `goToLink`, `target`, `targetType`, `blank`, and equivalent old fields normalize to `actionType: "url"` with `args.blank` when needed.
- [x] 1.2 Add or update schema migration tests for URL open target preservation and legacy event action conversion.
- [x] 1.3 Review shared action types and editor compatibility exports so no new parallel URL target field is introduced.

## 2. Action Model Utilities

- [x] 2.1 Add reusable utilities for action defaults, action validation, action base-field merging, and action summaries.
- [x] 2.2 Replace duplicated summary logic in `ComponentEvent` and `NestedActionList` with the shared summary utility.
- [x] 2.3 Ensure copied and edited actions preserve compatible unknown fields, `disabled`, `preventDefault`, and `stopPropagation`.

## 3. Settings Panel UI

- [x] 3.1 Update the URL action form to edit both link address and open target, saving current-window as absent/false `args.blank` and new-window as `args.blank: true`.
- [x] 3.2 Update `ActionModal` to keep existing action configuration when switching/editing, block invalid confirms, and display validation feedback.
- [x] 3.3 Add common action controls for `disabled`, `preventDefault`, and `stopPropagation` without duplicating per-action form state.
- [x] 3.4 Verify top-level and nested action modals share the same configuration, validation, and summary behavior.

## 4. Runtime Behavior

- [x] 4.1 Verify URL runtime uses normalized URLs and passes `{ blank: true }` only for new-window actions.
- [x] 4.2 Verify disabled actions, stop controls, confirm branches, condition branches, HTTP success/failure, component updates, and variable writes keep the existing sequential execution contract.
- [x] 4.3 Ensure published pages still pass `allowCustomJS={false}` and custom actions do not execute there.
- [x] 4.4 Improve runtime error logging or messages only where current behavior leaves users without actionable feedback.

## 5. Regression Coverage

- [x] 5.1 Add or update Node tests under `scripts/test` for action runtime and migration edge cases.
- [x] 5.2 Update `e2e/editor-regression.spec.ts` to cover URL open target configuration, action editing, summary text, and preview trigger behavior.
- [x] 5.3 Run `npm run test` and fix failures.
- [x] 5.4 Run `npm run lint` and `npm run build`, then run `npm run test:e2e:editor` when the local dev/test environment is available.

## 6. Documentation and Handoff

- [x] 6.1 Update relevant project docs or context indexes only if implementation changes event architecture, validation strategy, or user-facing workflow.
- [x] 6.2 Record any skipped validation command and remaining risk in the implementation handoff.
