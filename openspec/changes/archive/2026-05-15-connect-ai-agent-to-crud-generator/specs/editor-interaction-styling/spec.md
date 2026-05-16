## MODIFIED Requirements

### Requirement: AI panel shows reviewable agent candidates
AI 面板 SHALL 清晰展示 agent run 的执行步骤、工具调用、候选摘要、warnings、assumptions、预览和确认入口。

#### Scenario: Show CRUD candidate metadata
- **WHEN** agent 返回由 CRUD 生成器产出的候选页面
- **THEN** AI 面板 MUST 展示候选类型为 CRUD 页面
- **AND** AI 面板 MUST 展示数据源模型、页面类型、路由和生成来源
- **AND** AI 面板 MUST 展示 CRUD 生成 warnings
- **AND** 确认按钮 MUST 继续使用现有“确认后应用”流程
