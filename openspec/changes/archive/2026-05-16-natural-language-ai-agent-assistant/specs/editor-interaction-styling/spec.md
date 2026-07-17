## ADDED Requirements

### Requirement: Natural language agent panel remains readable and controllable

编辑器 SHALL present the natural language AI agent panel as a compact, readable work surface that fits the existing low-code editor layout. The panel MUST avoid obscuring canvas work and MUST remain scrollable when route details, execution events, warnings or previews are long.

#### Scenario: Display assistant state in AI panel
- **WHEN** agent is idle, running, awaiting confirmation, failed or applied
- **THEN** 面板 MUST show a clear state label or equivalent visual state
- **AND** actions MUST be disabled or enabled according to the current state

#### Scenario: Show route and tool details compactly
- **WHEN** agent run returns route decision and tool metadata
- **THEN** 面板 MUST show those details in a compact section near the candidate summary
- **AND** long reasons or warnings MUST wrap or scroll without overlapping controls

#### Scenario: Keep core editing accessible
- **WHEN** AI 面板 contains prompt input, advanced options, execution trace, preview and action buttons
- **THEN** 面板 MUST remain vertically scrollable
- **AND** preview and action controls MUST not cover the canvas or settings panel

### Requirement: Natural language examples guide users without replacing the main input

编辑器 MAY provide short natural language examples to help users start, but examples MUST not replace the primary prompt input or force users into a rigid wizard.

#### Scenario: Show examples for common tasks
- **WHEN** AI 面板 is empty
- **THEN** 系统 MAY show examples for CRUD page generation, selected component editing, event binding and style polish
- **AND** selecting an example MUST fill or submit the natural language prompt without bypassing agent confirmation
