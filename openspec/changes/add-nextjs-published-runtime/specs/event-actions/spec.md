## ADDED Requirements

### Requirement: Next.js published runtime preserves event action safety

Next.js 公开发布页运行时 SHALL 保持现有公开页事件动作安全语义，并且 MUST 默认禁止执行用户配置的 custom JS。

#### Scenario: Skip custom action in Next.js published page
- **WHEN** Next.js 公开页中触发包含 custom action 的组件事件
- **THEN** 运行时 MUST NOT 执行该 custom action
- **AND** 同一事件中的其它非禁用安全动作 MUST 按既有顺序继续执行

#### Scenario: Execute supported safe actions
- **WHEN** Next.js 公开页中触发 toast、url、componentAction、confirm、condition、http、setComponentProps 或 setComponentStyles 动作
- **THEN** 运行时 MUST 按现有事件动作语义执行
- **AND** 动作执行失败时 MUST 提供可理解的失败反馈或运行时日志

#### Scenario: Enforce HTTP allowed origins
- **WHEN** Next.js 公开页执行 HTTP action 或 runtime data source 请求
- **THEN** 运行时 MUST 使用公开页运行时配置中的 allowed origins 校验目标地址
- **AND** 未被允许的目标地址 MUST 被拒绝

#### Scenario: Do not inject private editor credentials
- **WHEN** Next.js 公开页执行事件动作或运行时数据源请求
- **THEN** 运行时 MUST NOT 默认注入编辑器登录 token
- **AND** 需要鉴权的公开业务接口 MUST 通过显式运行时配置处理
