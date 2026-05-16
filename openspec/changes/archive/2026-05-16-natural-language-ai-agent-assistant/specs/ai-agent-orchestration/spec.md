## ADDED Requirements

### Requirement: AI agent runs expose route decisions

AI agent run SHALL expose the route decision used to choose its plan and tools. The route decision MUST be available even when the run fails before producing a candidate.

#### Scenario: Return route decision for CRUD run
- **WHEN** 用户提交 CRUD/数据源类自然语言请求
- **THEN** agent run MUST 返回 `intent=crud-page` 的 route decision
- **AND** run plan MUST include 调用 CRUD 生成器或等效确定性工具
- **AND** candidate metadata MUST continue to include CRUD model, page type, route path and generation source

#### Scenario: Return route decision for non-CRUD run
- **WHEN** 用户提交局部修改、样式优化或普通页面生成请求
- **THEN** agent run MUST 返回对应非 CRUD intent
- **AND** run MUST follow the patch or schema draft flow selected by the route decision

#### Scenario: Failed run keeps route explanation
- **WHEN** agent run 因权限、工具、模型或校验失败
- **THEN** run response MUST retain route decision when it was computed
- **AND** failure audit MUST include intent or fallback summary

### Requirement: AI agent route decisions drive deterministic tool selection

Agent orchestration SHALL use route decision as the single source for choosing between deterministic generators and generic patch/schema generation flows.

#### Scenario: CRUD intent uses CRUD generator
- **WHEN** route decision intent is `crud-page`
- **THEN** orchestration MUST call `generateCrudPage` or an equivalent deterministic CRUD tool
- **AND** orchestration MUST validate generated components before returning a candidate

#### Scenario: Non-CRUD intent uses generic patch flow
- **WHEN** route decision intent is `edit-selected`, `style-polish`, `free-page`, `bind-data-source`, `add-event-action` or `fix-page-issue`
- **THEN** orchestration MUST use an allowed generic schema draft, patch, diagnostic or specialized tool flow
- **AND** orchestration MUST NOT call the CRUD generator unless the route decision is updated with an explicit CRUD fallback reason
