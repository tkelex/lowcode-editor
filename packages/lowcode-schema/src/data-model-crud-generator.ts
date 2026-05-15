import { CURRENT_SCHEMA_VERSION } from './defaults';
import type {
  CrudGenerationOptions,
  CrudGenerationResult,
  CrudPageType,
  DataSourceApiEndpoint,
  DataSourceFieldMapping,
  ProjectDataSourceModelConfig,
} from './data-model-crud-types';
import { validateDataSourceModelConfig } from './data-model-crud-validate';
import type { HttpAction, LowcodeAction, LowcodeComponentSchema, LowcodePageSchema } from './types';

interface ComponentDraft {
  name: string;
  desc: string;
  props?: Record<string, unknown>;
  styles?: Record<string, unknown>;
  children?: ComponentDraft[];
}

export function generateCrudPageSchema(
  model: ProjectDataSourceModelConfig,
  options: CrudGenerationOptions,
): CrudGenerationResult {
  const validation = validateDataSourceModelConfig(model);
  if (!validation.valid) {
    throw new Error(validation.errors[0]?.message || '数据源模型配置不合法');
  }

  const warnings = validation.warnings.map((warning) => `${warning.path}: ${warning.message}`);
  const pageType = options.pageType;
  const dataSources = createRuntimeDataSources(model, pageType, warnings);
  const page = createComponentFactory(options.idStart || 1);
  const pageNode = page({
    name: 'Page',
    desc: '页面',
    props: {
      pageTitle: options.pageName || createDefaultPageName(model, pageType),
      subTitle: `由数据源模型「${model.name}」生成，可继续编辑页面 schema。`,
      showContent: true,
      showHeader: true,
      variables: JSON.stringify(createDefaultVariables(options), null, 2),
      dataSources: JSON.stringify({ items: dataSources }, null, 2),
    },
    children: [createPageContent(model, options, page, warnings)],
  });

  const schema: LowcodePageSchema = {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    components: [pageNode],
    metadata: {
      generatedBy: 'data-model-crud-generation',
      dataSourceModelId: model.id,
      dataSourceModelKey: model.key,
      crudPageType: pageType,
      routePath: options.routePath,
    },
  };

  return {
    pageType,
    pageName: options.pageName,
    routePath: options.routePath,
    dataSourceModelKey: model.key,
    schema,
    warnings,
  };
}

function createPageContent(
  model: ProjectDataSourceModelConfig,
  options: CrudGenerationOptions,
  component: ReturnType<typeof createComponentFactory>,
  warnings: string[],
) {
  if (options.pageType === 'list') {
    return createListContent(model, options, component);
  }

  if (options.pageType === 'detail') {
    return createDetailContent(model, component, warnings);
  }

  return createFormContent(model, options, component, warnings);
}

function createListContent(
  model: ProjectDataSourceModelConfig,
  options: CrudGenerationOptions,
  component: ReturnType<typeof createComponentFactory>,
) {
  const visibleFields = model.fields.filter((field) => field.listVisible !== false);
  const tableColumns: ComponentDraft[] = visibleFields.map((field) => ({
    name: 'TableColumn',
    desc: `${field.label}列`,
    props: {
      title: field.label,
      dataIndex: field.sourcePath || field.key,
      type: field.type === 'date' ? 'date' : 'text',
      width: field.type === 'textarea' ? 240 : undefined,
    },
  }));

  if (options.detailRoutePath) {
    tableColumns.push({
      name: 'TableColumn',
      desc: '操作列',
      props: {
        title: '操作',
        type: 'action',
        actionText: '查看',
        actionUrl: `${options.detailRoutePath}?id={{ record.${model.primaryField} }}`,
        target: '_self',
        width: 120,
      },
    });
  }

  return component({
    name: 'Card',
    desc: '列表卡片',
    props: { title: `${model.name}列表`, bordered: true },
    children: [
      {
        name: 'Space',
        desc: '列表操作区',
        props: { direction: 'horizontal', size: 'middle', wrap: true },
        children: [
          {
            name: 'Button',
            desc: '刷新按钮',
            props: {
              text: '刷新列表',
              type: 'default',
              onEvent: {
                click: {
                  actions: [toastAction('请刷新页面以重新请求外部列表接口', 'info')],
                },
              },
            },
          },
          {
            name: 'Table',
            desc: '数据表格',
            props: {
              dataSourceId: `${model.key}List`,
              rowKey: model.primaryField,
              pagination: true,
              pageSize: 10,
              emptyText: '暂无数据',
            },
            children: tableColumns,
          },
        ],
      },
    ],
  });
}

function createFormContent(
  model: ProjectDataSourceModelConfig,
  options: CrudGenerationOptions,
  component: ReturnType<typeof createComponentFactory>,
  warnings: string[],
) {
  const isEdit = options.pageType === 'edit';
  const endpoint = isEdit ? model.updateApi : model.createApi;
  if (!endpoint) {
    warnings.push(isEdit ? '未配置更新接口，生成表单仅包含本地字段。' : '未配置新增接口，生成表单仅包含本地字段。');
  }

  const formFields = model.fields.filter((field) => field.formVisible !== false);
  const actions = endpoint
    ? [
      createHttpAction(endpoint, {
        body: createRequestBody(formFields),
        successMsg: isEdit ? '更新成功' : '创建成功',
        errorMsg: isEdit ? '更新失败' : '创建失败',
        responseKey: 'crudSubmit',
      }),
      ...(options.listRoutePath ? [urlAction(options.listRoutePath)] : []),
    ]
    : [toastAction('请先配置外部写入接口', 'warning')];

  return component({
    name: 'Card',
    desc: '表单卡片',
    props: { title: isEdit ? `编辑${model.name}` : `新建${model.name}`, bordered: true },
    children: [
      {
        name: 'Form',
        desc: isEdit ? '编辑表单' : '新建表单',
        props: {
          title: isEdit ? `编辑${model.name}` : `新建${model.name}`,
          layout: 'horizontal',
          showActions: true,
          submitText: isEdit ? '保存修改' : '提交创建',
          resetText: '重置',
          onEvent: {
            finish: { actions },
            finishFailed: {
              actions: [toastAction('请检查必填字段', 'warning')],
            },
          },
        },
        children: formFields.map((field) => ({
          name: 'FormItem',
          desc: `${field.label}字段`,
          props: {
            name: field.key,
            label: field.label,
            type: toFormItemType(field),
            placeholder: `请输入${field.label}`,
            required: Boolean(field.required),
            rules: field.required ? 'required' : '',
            optionsText: field.optionsText || '',
            defaultValue: isEdit ? `{{ dataSources.${model.key}Detail.data.${field.sourcePath || field.key} }}` : '',
          },
        })),
      },
    ],
  });
}

function createDetailContent(
  model: ProjectDataSourceModelConfig,
  component: ReturnType<typeof createComponentFactory>,
  warnings: string[],
) {
  if (!model.detailApi) {
    warnings.push('未配置详情接口，生成详情页仅包含字段占位。');
  }

  const detailFields = model.fields.filter((field) => field.detailVisible !== false);
  const pairsText = detailFields
    .map((field) => `${field.label}:{{ dataSources.${model.key}Detail.data.${field.sourcePath || field.key} }}`)
    .join('\n');

  return component({
    name: 'Card',
    desc: '详情卡片',
    props: { title: `${model.name}详情`, bordered: true },
    children: [
      {
        name: 'Descriptions',
        desc: '详情信息',
        props: {
          title: `${model.name}详情`,
          pairsText,
          column: 2,
          bordered: true,
        },
      },
    ],
  });
}

function createRuntimeDataSources(
  model: ProjectDataSourceModelConfig,
  pageType: CrudPageType,
  warnings: string[],
) {
  if (pageType === 'list') {
    if (!model.listApi) {
      warnings.push('未配置列表接口，生成列表页不会自动请求外部数据。');
      return [];
    }

    return [createDataSource(`${model.key}List`, `${model.name}列表`, model.listApi)];
  }

  if ((pageType === 'detail' || pageType === 'edit') && model.detailApi) {
    return [createDataSource(`${model.key}Detail`, `${model.name}详情`, model.detailApi)];
  }

  if (pageType === 'detail' || pageType === 'edit') {
    warnings.push('未配置详情接口，生成页面不会自动读取外部详情数据。');
  }

  return [];
}

function createDataSource(id: string, name: string, endpoint: DataSourceApiEndpoint) {
  return {
    id,
    name,
    type: 'rest',
    url: endpoint.url,
    method: endpoint.method || 'GET',
    headers: endpoint.headers || {},
    body: endpoint.body,
    dataPath: endpoint.responseDataPath || '',
  };
}

function createHttpAction(
  endpoint: DataSourceApiEndpoint,
  overrides: Partial<HttpAction['args']>,
): HttpAction {
  return {
    actionType: 'http',
    args: {
      url: endpoint.url,
      method: endpoint.method || 'POST',
      auth: endpoint.auth || 'none',
      headers: endpoint.headers || {},
      body: endpoint.body,
      ...overrides,
    },
  };
}

function createRequestBody(fields: DataSourceFieldMapping[]) {
  return fields.reduce<Record<string, unknown>>((body, field) => {
    setPath(body, field.requestPath || field.key, `{{ event.values.${field.key} }}`);
    return body;
  }, {});
}

function createDefaultVariables(options: CrudGenerationOptions) {
  return {
    recordId: options.recordIdExpression || '',
    form: {},
    table: {},
  };
}

function createDefaultPageName(model: ProjectDataSourceModelConfig, pageType: CrudPageType) {
  const labelMap: Record<CrudPageType, string> = {
    list: '列表',
    create: '新建',
    edit: '编辑',
    detail: '详情',
  };

  return `${model.name}${labelMap[pageType]}`;
}

function toFormItemType(field: DataSourceFieldMapping) {
  if (field.type === 'textarea') return 'textarea';
  if (field.type === 'date') return 'date';
  if (field.type === 'select') return 'select';
  if (field.type === 'boolean') return 'switch';
  return 'input';
}

function toastAction(msg: string, msgType: 'success' | 'error' | 'warning' | 'info' = 'success'): LowcodeAction {
  return {
    actionType: 'toast',
    args: { msgType, msg },
  };
}

function urlAction(url: string): LowcodeAction {
  return {
    actionType: 'url',
    args: {
      url,
      blank: false,
    },
  };
}

function createComponentFactory(idStart: number) {
  let nextId = idStart;

  return function createComponent(draft: ComponentDraft, parentId?: number): LowcodeComponentSchema {
    const id = nextId;
    nextId += 1;
    const component: LowcodeComponentSchema = {
      id,
      name: draft.name,
      desc: draft.desc,
      props: normalizeProps(draft.props || {}),
      styles: draft.styles,
      parentId,
    };

    if (draft.children?.length) {
      component.children = draft.children.map((child) => createComponent(child, id));
    }

    if (component.parentId === undefined) {
      delete component.parentId;
    }

    return component;
  };
}

function normalizeProps(props: Record<string, unknown>) {
  return Object.entries(props).reduce<Record<string, unknown>>((result, [key, value]) => {
    if (value !== undefined) {
      result[key] = value;
    }
    return result;
  }, {});
}

function setPath(target: Record<string, unknown>, path: string, value: unknown) {
  const keys = path.split('.').map((key) => key.trim()).filter(Boolean);
  if (keys.length === 0) return;

  let current = target;
  keys.slice(0, -1).forEach((key) => {
    if (!current[key] || typeof current[key] !== 'object' || Array.isArray(current[key])) {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  });
  current[keys[keys.length - 1]] = value;
}
