## Context

事件配置当前统一存储在组件 `props.onEvent[eventName].actions` 中，旧版 `props.onClick.actions`、`goToLink`、`showMessage`、`componentMethod` 等 schema 通过 normalize / migrate 兼容。运行时由 `packages/lowcode-schema/src/action-runtime.ts` 顺序执行动作，编辑器预览和公开发布页共用 `src/editor/runtime/Preview/index.tsx`，公开发布页通过 `allowCustomJS={false}` 禁用自定义 JS。

现有 `UrlAction` 类型已经有 `args.blank?: boolean`，运行时也能按 `blank` 决定 `window.open` 或 `window.location.href`，但设置面板的 `GoToLink` 表单只编辑 URL，用户无法选择当前窗口或新窗口。AMIS 事件动作中 `url` 动作也使用 `blank` 表达新 tab 打开，这与当前 schema 可以自然对齐；OpenSpec 的变更制品拆分也适合把这次动作完善沉淀成独立能力。

## Goals / Non-Goals

**Goals:**
- 让跳转动作在配置时明确支持“当前窗口”和“新窗口”，并在新增、编辑、复制、嵌套动作和旧 schema 迁移中保持一致。
- 完善动作配置表单的默认值、必填校验、JSON 校验、摘要展示和通用控制，避免用户保存半成品动作后预览才发现无效。
- 保持动作运行时顺序执行、嵌套执行、错误日志、HTTP 安全限制、发布页禁用自定义 JS 等现有安全边界。
- 补充回归测试，覆盖编辑器配置、schema 迁移、runtime 执行和公开发布页限制。

**Non-Goals:**
- 不引入完整工作流引擎，不新增循环、并行、浏览器后退、复制、下载、刷新等新动作类型。
- 不更换状态管理、物料注册表或事件存储结构。
- 不为 HTTP 动作增加服务端代理或绕过浏览器 CORS/allowed origin 限制。
- 不让公开发布页执行自定义 JS。

## Decisions

1. 跳转打开方式继续使用 `args.blank?: boolean` 作为 canonical schema。

   理由：当前共享类型和运行时已支持 `blank`，AMIS 的 `url` 动作也使用 `blank` 表达新 tab 打开。UI 可以展示为“当前窗口 / 新窗口”的 segmented control 或 select，但保存时仍写入 `blank`，避免引入 `target`、`targetType`、`openMode` 等平行字段。旧动作没有 `blank` 时按当前窗口处理；如果旧数据里存在 `blank`、`target: "_blank"` 或类似配置，迁移时保留为 `blank: true`。

2. 动作配置默认值、校验和摘要应沉淀为可复用纯函数。

   理由：`ComponentEvent` 与 `NestedActionList` 当前重复维护动作摘要，多个 action form 也各自决定何时 `onChange(undefined)`。新增 `actionModel` / `actionSummary` / `actionValidation` 一类的轻量工具，可以统一默认动作、配置有效性和摘要文案，并减少主事件列表与嵌套动作列表行为不一致。替代方案是在每个表单内继续局部处理，但会让后续动作扩展更容易漏掉嵌套场景。

3. `ActionModal` 负责组合动作类型表单与通用动作控制。

   理由：`disabled` 已可在动作列表切换，`preventDefault`、`stopPropagation`、`stopPropagation` 后中断后续动作等通用控制属于动作 base schema，不应散落到单个动作表单。弹窗内统一展示通用控制，可以保证 URL、HTTP、条件、确认等动作都能配置基础事件行为，同时保持每个动作表单只负责自己的 `args`。

4. 运行时保持顺序执行和同一上下文传递，优先补齐边界行为而不是改执行模型。

   理由：当前 `runLowcodeActions` 已按数组顺序执行，并支持 `disabled`、`stopPropagation`、确认/条件嵌套、HTTP 结果写入、组件联动和变量写入。本次应强化 URL target、参数归一化、错误日志和可测试性，不改变用户已依赖的执行顺序。后续若要引入并行、等待或循环动作，应作为单独变更。

5. 发布页安全策略保持默认拒绝自定义 JS。

   理由：公开页面运行用户配置的脚本风险很高。编辑器预览仍可用于验证自定义 JS；发布页遇到 custom 动作应跳过或记录运行日志，但不得执行脚本。HTTP 动作仍通过 `VITE_LOWCODE_HTTP_ALLOWED_ORIGINS` 控制允许访问的外部域名。

## Risks / Trade-offs

- 跳转动作选择“当前窗口”会让编辑器预览离开编辑器页面 → 保持真实运行态语义，同时在动作摘要中展示打开方式，必要时由测试使用新窗口模式验证不离开编辑器。
- 新窗口动作如果排在异步动作之后，可能被浏览器弹窗策略拦截 → 覆盖直接点击触发的主场景，并在设计中保留后续优化空间，例如预开窗口或给用户提示。
- 旧 schema 字段来源不一致，可能存在 `target`、`targetType`、`blank` 混用 → normalize / migrate 统一收敛到 `args.blank`，并增加迁移测试。
- 统一校验可能让历史半成品动作在编辑时不能直接确认 → normalize 仍允许旧数据运行；只有用户打开编辑弹窗并修改时，按新校验规则提示并阻止保存无效配置。
- HTTP 动作仍受 CORS 和 allowed origin 限制 → 不新增后端代理，错误写入 `event.httpError` 并记录运行日志，让用户能定位问题。

## Migration Plan

1. 扩展共享 action normalize / migrate：把旧跳转动作中的 `blank`、`target`、`targetType` 等可识别打开方式迁移为 `UrlAction.args.blank`。
2. 更新设置面板 URL 表单和动作弹窗：新增打开方式控件，编辑已有动作时回填当前配置，保存时保留通用 action base 字段。
3. 抽取并替换动作摘要、默认值和校验工具，让主事件列表与嵌套动作列表复用同一逻辑。
4. 补齐 runtime 与 Preview 的回归测试，确认 URL target、嵌套动作、HTTP 错误、自定义 JS 禁用和旧 schema 迁移不退化。
5. 回滚策略：若实现后发现兼容问题，可先保留迁移和 runtime 兼容，仅隐藏新 UI 控件；旧 schema 与 `args.blank` 不需要数据库结构变更。

## Open Questions

- 是否需要在后续变更中新增更多浏览器动作，例如刷新、返回、复制文本、等待、并行或循环？本次先不纳入。
- 是否需要为“当前窗口跳转”在编辑器预览中提供二次确认？当前设计保持真实运行态，避免预览和发布行为分叉。
