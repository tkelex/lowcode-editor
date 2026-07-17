## 1. Shared Types and Routing

- [x] 1.1 Define agent route decision types in shared schema, including intent, confidence, reasons, target scope, preferred tool and fallback.
- [x] 1.2 Implement deterministic route decision helper for CRUD, free page, selected edit, style polish, data source binding, event action and issue fixing intents.
- [x] 1.3 Keep existing CRUD intent helper compatible or migrate call sites to the new route decision helper.
- [x] 1.4 Export route decision types and helper functions from shared schema entry points.

## 2. Backend Agent Orchestration

- [x] 2.1 Compute route decision when creating an agent run and attach it to the run result.
- [x] 2.2 Use route decision intent instead of a standalone CRUD boolean to select CRUD generator versus generic patch flow.
- [x] 2.3 Add route decision summary into agent events and audit summary without exposing secrets.
- [x] 2.4 Preserve route decision on failed runs when classification completed before the failure.

## 3. Frontend Natural Language Agent Panel

- [x] 3.1 Update AI panel copy and layout so the natural language agent action is the primary workflow.
- [x] 3.2 Keep advanced inputs for target scope, API description and response sample available without making them the main interaction.
- [x] 3.3 Display route decision card with intent, confidence, target scope, preferred tool and fallback.
- [x] 3.4 Clearly mark CRUD candidates as using the deterministic CRUD generator.
- [x] 3.5 Ensure preview, warnings, assumptions, validation messages and apply/cancel controls remain visible and scrollable.

## 4. Tests and Validation

- [x] 4.1 Add unit tests for route decisions covering `crud-page`, `free-page`, `edit-selected`, `style-polish`, `bind-data-source` and `add-event-action`.
- [x] 4.2 Add negative tests to ensure marketing/homepage prompts do not route to CRUD.
- [x] 4.3 Update existing CRUD agent tests to assert route decision metadata and generator selection.
- [x] 4.4 Run the targeted node tests for AI agent routing and CRUD generation.

## 5. Documentation

- [x] 5.1 Update interface docs to describe route decision fields in agent run responses.
- [x] 5.2 Update architecture docs and project context index with the natural language agent routing flow.
- [x] 5.3 Link this OpenSpec change from the natural language AI development assistant plan if needed.
