## Context

项目当前已经形成“页面搭建 + 保存 + 版本 + 发布”的前端低代码闭环，并具备 Table、Form、事件动作、HTTP action、页面变量、运行时数据源和发布页能力。用户重新明确目标后，本项目不应朝 JeecgBoot 式全栈企业开发平台扩张，而应继续强化前端低代码平台的核心能力。

本设计把“数据模型 + CRUD 页面生成”调整为前端视角：平台保存的是“数据源模型配置”和“字段映射”，业务数据仍来自用户自己的外部 API。生成器输出普通 Page schema，用户可继续在编辑器中调整、保存和发布。

## Goals / Non-Goals

**Goals:**

- 提供项目级前端数据源模型配置，描述外部列表、详情、新增、编辑、删除接口。
- 提供字段映射配置，用于生成 TableColumn、FormItem、详情展示和事件动作参数。
- 基于数据源模型生成列表页、表单页、详情页或页面区块。
- 生成内容继续使用现有 Page schema、Form、Table、Button、事件动作、运行时数据源和发布链路。
- 保持后端职责轻量：只保存配置、权限和审计，不托管业务数据。

**Non-Goals:**

- 不新增通用业务记录表，不保存用户业务数据。
- 不按模型生成数据库表、Prisma migration 或后端 CRUD service。
- 不实现工作流、报表、大屏、AI 应用、代码生成器或插件市场。
- 不替换现有编辑器组件树、Preview 运行时或发布架构。
- 不承诺第一版支持复杂联表、字段级权限、批量导入导出或接口编排。

## Decisions

### 1. 使用“前端数据源模型”，而不是后端业务数据模型

新增配置实体建议命名为 `ProjectDataSourceModel` 或 `CrudDataSourceModel`。它归属于 Project，包含模型名称、模型标识、主键字段、字段映射、列表接口、详情接口、新增接口、更新接口、删除接口和认证配置引用。

原因：这符合前端低代码平台定位。平台负责“如何把外部 API 映射成页面”，不负责“替用户存储业务数据”。

备选：`ProjectDataModel + ProjectDataRecord`。已放弃，因为它会把项目带向全栈业务数据托管平台，超出当前目标。

### 2. 后端只保存配置，不代理或托管业务数据

后端提供数据源模型配置的 CRUD API，复用项目成员权限和审计日志。业务数据请求仍由 Preview 运行时通过 HTTP action 或 runtime data source 调用外部 API。

原因：后端保持轻量，避免动态数据接口、安全代理、数据隔离和记录存储复杂度。当前平台仍专注前端编辑和发布。

备选：后端统一代理所有外部 API。暂不采用，后续如果要解决跨域、密钥保护或统一鉴权，可作为单独 change 设计。

### 3. 字段映射作为生成器的核心输入

字段配置示例：

```ts
{
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'boolean' | 'date' | 'select';
  sourcePath?: string;
  requestPath?: string;
  required?: boolean;
  listVisible?: boolean;
  formVisible?: boolean;
  detailVisible?: boolean;
  optionsText?: string;
}
```

`sourcePath` 描述从响应数据中读取字段的位置，`requestPath` 描述提交表单时写入请求 body 的位置。第一版可以默认二者等于 `key`。

原因：CRUD 生成需要的不是完整数据库模型，而是“接口数据如何映射到前端组件”。

### 4. CRUD 生成器输出普通低代码 schema

生成器放在 shared 层或前端可复用模块，输入数据源模型和生成选项，输出 Page schema 或组件树片段。输出必须使用现有物料 registry 支持的组件，例如 Page、Container/Card、Table、TableColumn、Form、FormItem、Button、Text，以及事件动作。

原因：生成页面可以二次编辑、保存、版本化和发布，不形成第二套运行时。

### 5. 数据读取优先复用 runtime data source，数据写入复用 HTTP action

列表和详情读取通过 Page dataSources 或 Table runtimeDataSources 配置；新增、编辑、删除通过表单/按钮事件中的 HTTP action 调用外部接口。生成器负责填充 URL、method、body 模板、成功/失败提示和后续跳转/刷新动作。

原因：最大化复用现有事件系统，避免第一版新增复杂的 CRUD 专用运行时组件。

### 6. 生成向导放在项目后台

用户在 ProjectDashboard 中维护数据源模型，并从模型启动 CRUD 生成。生成完成后创建普通 Page，用户进入编辑器继续调整。

原因：数据源模型是项目级配置，不是画布中的单个组件。后台向导更适合处理接口配置、字段映射、路由冲突和生成摘要。

## Risks / Trade-offs

- [外部 API 形态差异大] -> 第一版只支持常见 REST 形态和简单响应路径配置，复杂接口通过用户手动调整 HTTP action。
- [跨域和密钥保护问题] -> 第一版遵循现有 HTTP action allowed origins 和浏览器限制，不内置密钥代理。
- [生成页面和数据源模型后续偏离] -> 生成页保存模型 id 和生成元信息，但用户二次编辑后不自动同步覆盖。
- [事件动作配置复杂] -> 生成器只生成可编辑的标准动作，并继续用动作面板能力过滤降低误选。
- [公开发布页访问外部 API 的安全边界] -> 发布页仍禁用 custom JS，HTTP 请求遵守 allowed origins；敏感 API 不应直接暴露给公开页面。

## Migration Plan

1. 新增保存数据源模型配置的 Prisma model 和 migration，不新增业务记录表。
2. 新增后端配置管理 API，复用项目访问权限和审计日志。
3. 新增 shared 类型、字段映射校验、CRUD schema 生成器和测试。
4. 新增前端数据源模型管理、生成向导和 API 封装。
5. 将生成结果写入现有页面创建/保存流程，并补充回归验证。

回滚策略：新增配置表不影响现有页面；关闭前端入口后，现有编辑器/发布链路不受影响。已生成页面是普通 Page schema，可继续编辑或删除。

## Open Questions

- 第一版是否只支持 REST JSON API，还是允许用户配置更自由的请求 body 模板？
- 列表刷新动作是否需要新增通用 `refreshDataSource` 能力，还是先通过变量变化/重新进入页面规避？
- 详情页是否第一版必做，还是先完成列表 + 新建/编辑表单闭环？
- 公开发布页是否允许直接调用用户配置的外部 API，还是默认只支持编辑器预览和内部访问场景？
