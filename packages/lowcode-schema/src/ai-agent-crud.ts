import { generateCrudPageSchema } from './data-model-crud-generator';
import { decideAiAgentRoute, isCrudRouteDecision } from './ai-agent-routing';
import type {
  CrudGenerationResult,
  CrudPageType,
  DataSourceFieldMapping,
  DataSourceFieldType,
  ProjectDataSourceModelConfig,
} from './data-model-crud-types';
import { validateDataSourceModelConfig } from './data-model-crud-validate';

export interface AiCrudGenerationInput {
  prompt: string;
  apiDescription?: string;
  responseSample?: unknown;
  dataSourceModel?: unknown;
  dataSourceModels?: ProjectDataSourceModelConfig[];
  idStart?: number;
}

export interface AiCrudGenerationToolResult {
  crudResult: CrudGenerationResult;
  model: ProjectDataSourceModelConfig;
  source: 'existingModel' | 'draftModel';
  warnings: string[];
  assumptions: string[];
}

export function isCrudGenerationIntent(input: {
  prompt: string;
  dataSourceModel?: unknown;
  apiDescription?: string;
  responseSample?: unknown;
}) {
  return isCrudRouteDecision(decideAiAgentRoute(input));
}

export function generateAiCrudPageCandidate(input: AiCrudGenerationInput): AiCrudGenerationToolResult {
  const warnings: string[] = [];
  const assumptions: string[] = [];
  const explicitModel = readModel(input.dataSourceModel);
  const matchedModel = explicitModel || matchExistingModel(input.prompt, input.dataSourceModels || []);
  const source = matchedModel ? 'existingModel' : 'draftModel';
  const model = matchedModel || createDraftModel(input, warnings, assumptions);
  const validation = validateDataSourceModelConfig(model);
  if (!validation.valid) {
    throw new Error(validation.errors[0]?.message || '数据源模型配置不合法');
  }

  warnings.push(...validation.warnings.map((issue) => `${issue.path}: ${issue.message}`));
  if (source === 'draftModel') {
    warnings.push('当前使用 AI 推导的临时数据源模型，尚未保存为项目配置。');
  }

  const pageType = inferPageType(input.prompt);
  const routePath = inferRoutePath(model, pageType);
  const crudResult = generateCrudPageSchema(model, {
    pageType,
    pageName: `${model.name}${toPageTypeLabel(pageType)}`,
    routePath,
    listRoutePath: inferRoutePath(model, 'list'),
    detailRoutePath: inferRoutePath(model, 'detail'),
    idStart: input.idStart || 1,
  });

  return {
    crudResult,
    model,
    source,
    warnings: [...warnings, ...crudResult.warnings],
    assumptions,
  };
}

function matchExistingModel(prompt: string, models: ProjectDataSourceModelConfig[]) {
  const promptText = normalizeText(prompt);
  const apiUrl = extractApiUrl(prompt);

  return models.find((model) => {
    const names = [model.key, model.name, model.description || ''].map(normalizeText).filter(Boolean);
    if (names.some((name) => promptText.includes(name))) {
      return true;
    }

    if (!apiUrl) {
      return false;
    }

    return [model.listApi, model.detailApi, model.createApi, model.updateApi, model.deleteApi]
      .some((endpoint) => endpoint?.url && normalizeText(endpoint.url).includes(normalizeText(apiUrl)));
  });
}

function createDraftModel(
  input: AiCrudGenerationInput,
  warnings: string[],
  assumptions: string[],
): ProjectDataSourceModelConfig {
  const apiUrl = extractApiUrl(input.prompt) || extractApiUrl(input.apiDescription || '') || '/api/items';
  const key = inferModelKey(input.prompt, apiUrl);
  const fields = inferFields(input.responseSample, input.prompt);
  const primaryField = fields.some((field) => field.key === 'id') ? 'id' : fields[0]?.key || 'id';

  if (!fields.some((field) => field.key === 'id')) {
    warnings.push(`未识别到 id 字段，临时使用 ${primaryField} 作为主键。`);
  }

  if (apiUrl === '/api/items') {
    assumptions.push('未识别到明确接口地址，临时使用 /api/items 作为列表接口。');
  }

  return {
    name: inferModelName(input.prompt, key),
    key,
    primaryField,
    description: 'AI agent 根据用户请求临时推导的数据源模型草稿。',
    listApi: {
      url: apiUrl,
      method: 'GET',
      responseDataPath: inferResponseDataPath(input.responseSample),
    },
    detailApi: {
      url: `${apiUrl}/{{ variables.recordId }}`,
      method: 'GET',
    },
    createApi: {
      url: apiUrl,
      method: 'POST',
    },
    updateApi: {
      url: `${apiUrl}/{{ variables.recordId }}`,
      method: 'PUT',
    },
    deleteApi: {
      url: `${apiUrl}/{{ variables.recordId }}`,
      method: 'DELETE',
    },
    fields,
  };
}

function inferFields(responseSample: unknown, prompt: string): DataSourceFieldMapping[] {
  const sampleRecord = findSampleRecord(responseSample);
  const entries = sampleRecord ? Object.entries(sampleRecord) : [];
  const fields = entries
    .filter(([key, value]) => isSafeFieldKey(key) && isScalarValue(value))
    .slice(0, 12)
    .map(([key, value]) => ({
      key,
      label: toFieldLabel(key),
      type: inferFieldType(key, value),
      sourcePath: key,
      requestPath: key,
      required: key === 'id' ? false : undefined,
      formVisible: key === 'id' ? false : undefined,
    }));

  if (fields.length > 0) {
    return fields;
  }

  const promptFields = Array.from(prompt.matchAll(/(?:字段|包含|包括|有)\s*[:：]?\s*([\u4e00-\u9fa5\w,，、\s]+)/gi))
    .flatMap((match) => match[1].split(/[,，、\s]+/))
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);

  const inferred = promptFields
    .map((label) => toModelKey(label))
    .filter((key) => isSafeFieldKey(key))
    .map((key): DataSourceFieldMapping => ({
      key,
      label: toFieldLabel(key),
      type: inferFieldType(key, undefined),
      sourcePath: key,
      requestPath: key,
    }));

  return dedupeFields([
    { key: 'id', label: 'ID', type: 'text' as const, sourcePath: 'id', requestPath: 'id', formVisible: false },
    ...inferred,
    ...(inferred.length === 0 ? [
      { key: 'name', label: '名称', type: 'text' as const, sourcePath: 'name', requestPath: 'name', required: true },
      { key: 'status', label: '状态', type: 'text' as const, sourcePath: 'status', requestPath: 'status' },
    ] : []),
  ]);
}

function findSampleRecord(value: unknown): Record<string, unknown> | undefined {
  if (Array.isArray(value)) {
    return findSampleRecord(value[0]);
  }

  if (!isRecord(value)) {
    return undefined;
  }

  if (Array.isArray(value.data)) {
    return findSampleRecord(value.data);
  }

  if (isRecord(value.data)) {
    return findSampleRecord(value.data);
  }

  if (Array.isArray(value.list)) {
    return findSampleRecord(value.list);
  }

  if (Array.isArray(value.items)) {
    return findSampleRecord(value.items);
  }

  if (Array.isArray(value.records)) {
    return findSampleRecord(value.records);
  }

  return value;
}

function inferResponseDataPath(value: unknown) {
  if (!isRecord(value)) return '';
  if (Array.isArray(value.data)) return 'data';
  if (isRecord(value.data)) {
    if (Array.isArray(value.data.list)) return 'data.list';
    if (Array.isArray(value.data.items)) return 'data.items';
    if (Array.isArray(value.data.records)) return 'data.records';
  }
  if (Array.isArray(value.list)) return 'list';
  if (Array.isArray(value.items)) return 'items';
  if (Array.isArray(value.records)) return 'records';
  return '';
}

function inferPageType(prompt: string): CrudPageType {
  if (/详情|detail/i.test(prompt) && !/列表|list|管理|crud|增删改查/i.test(prompt)) return 'detail';
  if (/编辑|修改|edit/i.test(prompt) && !/列表|list|管理|crud|增删改查/i.test(prompt)) return 'edit';
  if (/新增|创建|新建|create/i.test(prompt) && !/列表|list|管理|crud|增删改查/i.test(prompt)) return 'create';
  return 'list';
}

function inferRoutePath(model: ProjectDataSourceModelConfig, pageType: CrudPageType) {
  const suffixMap: Record<CrudPageType, string> = {
    list: '',
    create: '/create',
    edit: '/edit',
    detail: '/detail',
  };
  return `/${model.key.replace(/_/g, '-')}${suffixMap[pageType]}`;
}

function inferModelKey(prompt: string, apiUrl: string) {
  const apiSegments = apiUrl.split('?')[0].split('/').filter(Boolean);
  const fromApi = apiSegments[apiSegments.length - 1];
  const raw = fromApi || prompt.match(/[a-zA-Z][a-zA-Z0-9_-]*(?:\s+management|\s+manager)?/i)?.[0] || 'items';
  return toModelKey(raw);
}

function inferModelName(prompt: string, key: string) {
  const chineseEntity = prompt.match(/(?:生成|创建|基于|做一个|做个)?\s*([\u4e00-\u9fa5]{2,8})(?:管理页|管理页面|列表|增删改查|CRUD|页)/i)?.[1];
  if (chineseEntity) return chineseEntity.replace(/^一个/, '');
  return toFieldLabel(singularize(key));
}

function extractApiUrl(value: string) {
  return value.match(/https?:\/\/[^\s"'，。]+|\/api\/[^\s"'，。]+/i)?.[0]?.replace(/[,.，。]$/, '');
}

function toModelKey(value: string) {
  const normalized = value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[^\w]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
  const fallback = normalized || 'items';
  return /^[a-z]/.test(fallback) ? fallback : `m_${fallback}`;
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[\s_-]+/g, '');
}

function toFieldLabel(key: string) {
  const common: Record<string, string> = {
    id: 'ID',
    name: '名称',
    username: '用户名',
    email: '邮箱',
    phone: '手机号',
    status: '状态',
    created_at: '创建时间',
    updated_at: '更新时间',
  };
  return common[key] || key.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function inferFieldType(key: string, value: unknown): DataSourceFieldType {
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  if (/date|time|created|updated/i.test(key)) return 'date';
  if (typeof value === 'string' && value.length > 80) return 'textarea';
  return 'text';
}

function toPageTypeLabel(pageType: CrudPageType) {
  const labels: Record<CrudPageType, string> = {
    list: '列表',
    create: '新增',
    edit: '编辑',
    detail: '详情',
  };
  return labels[pageType];
}

function dedupeFields(fields: DataSourceFieldMapping[]) {
  const used = new Set<string>();
  return fields.filter((field) => {
    if (used.has(field.key)) return false;
    used.add(field.key);
    return true;
  });
}

function readModel(value: unknown): ProjectDataSourceModelConfig | undefined {
  if (!isRecord(value)) return undefined;
  return value as unknown as ProjectDataSourceModelConfig;
}

function isSafeFieldKey(value: string) {
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value);
}

function isScalarValue(value: unknown) {
  return value === null || ['string', 'number', 'boolean'].includes(typeof value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function singularize(value: string) {
  return value.endsWith('s') ? value.slice(0, -1) : value;
}
