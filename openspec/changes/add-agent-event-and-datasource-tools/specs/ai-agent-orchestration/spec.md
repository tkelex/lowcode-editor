## ADDED Requirements

### Requirement: AI agent uses specialized tools for event and data source intents

Agent orchestration SHALL call specialized allowlisted tools when route decision intent is `add-event-action` or `bind-data-source`. The specialized tool result MUST be validated as a candidate patch before it is returned to the frontend.

#### Scenario: Run event action tool
- **WHEN** route decision intent is `add-event-action`
- **THEN** orchestration MUST call the event action patch tool
- **AND** run events MUST show that the event action tool was called
- **AND** the candidate MUST be a patch awaiting user confirmation

#### Scenario: Run data source binding tool
- **WHEN** route decision intent is `bind-data-source`
- **THEN** orchestration MUST call the data source binding patch tool
- **AND** run events MUST show that the data source binding tool was called
- **AND** the candidate MUST be a patch awaiting user confirmation

#### Scenario: Specialized tool failure
- **WHEN** a specialized tool fails or returns an invalid patch
- **THEN** the run MUST fail with a readable error or fall back with an explicit warning
- **AND** the editor component tree MUST remain unchanged
