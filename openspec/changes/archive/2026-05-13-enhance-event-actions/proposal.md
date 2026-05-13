## Why

当前事件动作已经支持跳转、提示、组件联动、确认、条件、请求和自定义脚本，但配置体验与运行时语义还不够完整。尤其是跳转链接动作缺少“当前窗口 / 新窗口”选择，用户无法明确控制导航目标，也暴露出其它动作在参数、反馈、兼容性和安全边界上需要统一梳理。

## What Changes

- 为事件动作建立明确的配置与运行时契约，覆盖跳转、消息提示、确认、条件、HTTP 请求、组件方法、组件控制、属性/样式更新、变量设置和自定义脚本。
- 完善跳转动作配置，支持当前窗口与新窗口打开方式，并保持链接归一化、站内路径和外部 URL 的既有兼容行为。
- 统一动作编辑表单的可用性反馈，包括必填项、默认值、摘要展示、嵌套动作、禁用动作、阻止默认行为和阻止冒泡等通用控制。
- 补齐旧 schema 迁移与 normalize 行为，保证历史 `goToLink` / `showMessage` / `componentMethod` 等动作继续可预览、可编辑。
- 增加事件动作相关回归覆盖，验证编辑器配置、预览执行、发布页限制和异常日志不退化。

## Capabilities

### New Capabilities
- `event-actions`: 约束低代码编辑器中事件动作的配置、归一化、预览执行、发布页安全限制和回归验证。

### Modified Capabilities

## Impact

- 主要影响 `src/editor/components/Setting/**` 的事件动作配置 UI、动作摘要和嵌套动作编辑。
- 影响 `src/editor/events/**`、`packages/lowcode-schema/src/**` 和 `src/editor/runtime/**` 中动作 schema、normalize、执行器和运行时适配器。
- 影响 `src/editor/components/Preview/index.tsx`、`src/editor/runtime/Preview/index.tsx` 等预览/发布渲染路径中的事件绑定与动作执行上下文。
- 需要补充或更新单元测试、E2E 测试和本地验证命令，优先覆盖 URL 打开方式、HTTP 请求、组件联动、嵌套动作和自定义 JS 安全边界。
