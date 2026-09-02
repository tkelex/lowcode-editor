# Schema 契约

Schema 契约定义页面在编辑器、平台后端和公开发布运行时之间传递时的共同语言。

## Language

**页面 Schema**：
页面结构、属性、样式、事件和运行数据声明的可移植表达，不属于任何单一运行时。
_Avoid_：React 页面、数据库记录

**Schema 迁移**：
把历史页面 schema 转换为当前规范表达，同时保留兼容语义。
_Avoid_：数据库 migration、临时修补

**Schema 校验**：
判断页面 schema 是否满足当前契约并可进入保存、发布或呈现流程。
_Avoid_：TypeScript 类型检查、表单校验
