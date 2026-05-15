import type {
  CrudHttpMethod,
  DataSourceFieldType,
  DataSourceModelValidationIssue,
  DataSourceModelValidationResult,
  ProjectDataSourceModelConfig,
} from './data-model-crud-types';

const MODEL_KEY_PATTERN = /^[a-z][a-z0-9_]*$/;
const FIELD_KEY_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
const FIELD_TYPES = new Set<DataSourceFieldType>(['text', 'textarea', 'number', 'boolean', 'date', 'select']);
const HTTP_METHODS = new Set<CrudHttpMethod>(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);

export function validateDataSourceModelConfig(
  model: unknown,
): DataSourceModelValidationResult {
  const errors: DataSourceModelValidationIssue[] = [];
  const warnings: DataSourceModelValidationIssue[] = [];

  if (!isPlainObject(model)) {
    return {
      valid: false,
      errors: [{ path: '$', message: '数据源模型必须是对象' }],
      warnings,
    };
  }

  const value = model as unknown as ProjectDataSourceModelConfig;

  if (!value.name?.trim()) {
    errors.push({ path: 'name', message: '模型名称不能为空' });
  }

  if (!value.key?.trim()) {
    errors.push({ path: 'key', message: '模型标识不能为空' });
  } else if (!MODEL_KEY_PATTERN.test(value.key)) {
    errors.push({ path: 'key', message: '模型标识只能使用小写字母、数字和下划线，并且必须以字母开头' });
  }

  if (!value.primaryField?.trim()) {
    errors.push({ path: 'primaryField', message: '主键字段不能为空' });
  }

  validateEndpoint(value.listApi, 'listApi', errors, warnings, ['GET', 'POST']);
  validateEndpoint(value.detailApi, 'detailApi', errors, warnings, ['GET', 'POST']);
  validateEndpoint(value.createApi, 'createApi', errors, warnings, ['POST', 'PUT', 'PATCH']);
  validateEndpoint(value.updateApi, 'updateApi', errors, warnings, ['PUT', 'PATCH', 'POST']);
  validateEndpoint(value.deleteApi, 'deleteApi', errors, warnings, ['DELETE', 'POST']);

  if (!Array.isArray(value.fields) || value.fields.length === 0) {
    errors.push({ path: 'fields', message: '字段映射至少需要配置一项' });
  } else {
    validateFields(value, errors);
  }

  if (value.primaryField && Array.isArray(value.fields) && value.fields.length > 0) {
    const hasPrimaryField = value.fields.some((field) => field?.key === value.primaryField);
    if (!hasPrimaryField) {
      errors.push({ path: 'primaryField', message: '主键字段必须存在于字段映射中' });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

function validateEndpoint(
  endpoint: unknown,
  path: string,
  errors: DataSourceModelValidationIssue[],
  warnings: DataSourceModelValidationIssue[],
  preferredMethods: CrudHttpMethod[],
) {
  if (endpoint === undefined || endpoint === null) {
    return;
  }

  if (!isPlainObject(endpoint)) {
    errors.push({ path, message: '接口配置必须是对象' });
    return;
  }

  const record = endpoint as Record<string, unknown>;
  const url = typeof record.url === 'string' ? record.url.trim() : '';
  if (!url) {
    errors.push({ path: `${path}.url`, message: '接口 URL 不能为空' });
  } else if (!isSupportedUrlTemplate(url)) {
    errors.push({ path: `${path}.url`, message: '接口 URL 仅支持 http(s)、根路径、相对路径或模板变量' });
  }

  const method = typeof record.method === 'string' ? record.method.toUpperCase() : 'GET';
  if (!HTTP_METHODS.has(method as CrudHttpMethod)) {
    errors.push({ path: `${path}.method`, message: '请求方法不受支持' });
  } else if (!preferredMethods.includes(method as CrudHttpMethod)) {
    warnings.push({ path: `${path}.method`, message: `${path} 通常使用 ${preferredMethods.join('/')} 方法` });
  }

  ['responseDataPath', 'responseTotalPath'].forEach((key) => {
    const pathValue = record[key];
    if (pathValue !== undefined && (typeof pathValue !== 'string' || !isSafeDotPath(pathValue))) {
      errors.push({ path: `${path}.${key}`, message: '响应路径只能使用点号路径' });
    }
  });
}

function validateFields(
  model: ProjectDataSourceModelConfig,
  errors: DataSourceModelValidationIssue[],
) {
  const usedKeys = new Set<string>();

  model.fields.forEach((field, index) => {
    const basePath = `fields[${index}]`;
    if (!isPlainObject(field)) {
      errors.push({ path: basePath, message: '字段配置必须是对象' });
      return;
    }

    if (!field.key?.trim()) {
      errors.push({ path: `${basePath}.key`, message: '字段 key 不能为空' });
    } else if (!FIELD_KEY_PATTERN.test(field.key)) {
      errors.push({ path: `${basePath}.key`, message: '字段 key 只能使用字母、数字和下划线，并且不能以数字开头' });
    } else if (usedKeys.has(field.key)) {
      errors.push({ path: `${basePath}.key`, message: `字段 key 不能重复：${field.key}` });
    } else {
      usedKeys.add(field.key);
    }

    if (!field.label?.trim()) {
      errors.push({ path: `${basePath}.label`, message: '字段标题不能为空' });
    }

    if (!FIELD_TYPES.has(field.type)) {
      errors.push({ path: `${basePath}.type`, message: '字段类型不受支持' });
    }

    if (field.sourcePath !== undefined && !isSafeDotPath(field.sourcePath)) {
      errors.push({ path: `${basePath}.sourcePath`, message: '响应读取路径只能使用点号路径' });
    }

    if (field.requestPath !== undefined && !isSafeDotPath(field.requestPath)) {
      errors.push({ path: `${basePath}.requestPath`, message: '请求写入路径只能使用点号路径' });
    }
  });
}

export function isSafeDotPath(value: string) {
  if (!value.trim()) return false;
  return value.split('.').every((segment) => /^[a-zA-Z_$][\w$]*$/.test(segment));
}

function isSupportedUrlTemplate(value: string) {
  const withoutTemplates = value.replace(/\{\{\s*[\s\S]+?\s*\}\}/g, 'template-value');
  if (/^https?:\/\//.test(withoutTemplates)) {
    try {
      new URL(withoutTemplates);
      return true;
    } catch {
      return false;
    }
  }

  return withoutTemplates.startsWith('/') || /^[\w.-]+(\/|$)/.test(withoutTemplates);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
