## ADDED Requirements

### Requirement: AI builder interaction remains inspectable and reversible

编辑器 SHALL 为 AI 页面搭建提供可读、可检查、可取消和可恢复的交互体验。AI 生成入口、生成中状态、结果预览、警告、错误和确认写入 MUST 与现有编辑器/后台视觉标准保持一致，并避免遮挡画布核心操作。

#### Scenario: Open AI builder panel
- **WHEN** 用户从编辑器中打开 AI 页面搭建入口
- **THEN** 系统 MUST 展示可输入页面描述、接口说明或响应示例的面板
- **AND** 面板 MUST 保持当前画布可见或提供清晰的返回编辑入口

#### Scenario: Show generation progress
- **WHEN** AI 页面生成正在进行
- **THEN** 系统 MUST 展示生成中状态
- **AND** 用户 MUST 能取消或关闭生成流程且当前组件树不被修改

#### Scenario: Inspect AI result before applying
- **WHEN** AI 返回生成结果
- **THEN** 系统 MUST 展示生成摘要、警告、错误或可应用范围
- **AND** 用户确认前 MUST NOT 直接覆盖当前组件树

#### Scenario: Reject invalid AI result visibly
- **WHEN** AI 结果未通过 schema 或安全校验
- **THEN** 系统 MUST 以可读错误反馈说明失败原因
- **AND** 画布、源码面板和设置面板 MUST 保持生成前状态
