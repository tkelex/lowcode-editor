import { evaluateSafeExpression, normalizeHttpActionUrl, isHttpActionUrlAllowed } from '../../../packages/lowcode-schema/src';

export interface RuntimeDataSourceConfig {
  id: string;
  name?: string;
  type?: 'rest' | 'static';
  url?: string;
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  params?: Record<string, unknown>;
  body?: unknown;
  dataPath?: string;
  staticData?: unknown;
}

export interface RuntimeDataSourceResult {
  loading: boolean;
  data: unknown;
  error?: string;
}

export type RuntimeDataSourceState = Record<string, RuntimeDataSourceResult>;

export interface RuntimeExpressionContext {
  variables: Record<string, any>;
  dataSources: RuntimeDataSourceState;
  component?: Record<string, any>;
}

export function parseRuntimeJsonObject(value: unknown) {
  if (!value) return {};
  if (typeof value === 'object' && !Array.isArray(value)) return value as Record<string, any>;

  if (typeof value === 'string') {
    try {
      const data = JSON.parse(value);
      return data && typeof data === 'object' && !Array.isArray(data) ? data as Record<string, any> : {};
    } catch {
      return {};
    }
  }

  return {};
}

export function parseRuntimeDataSources(value: unknown): RuntimeDataSourceConfig[] {
  const data = parseRuntimeJsonObject(value);
  const list = Array.isArray(data.items) ? data.items : Array.isArray(value) ? value : [];

  return list
    .map((item) => normalizeDataSource(item))
    .filter((item): item is RuntimeDataSourceConfig => Boolean(item?.id));
}

export function resolveRuntimeProps<T extends Record<string, any>>(
  props: T,
  context: RuntimeExpressionContext,
) {
  return Object.entries(props).reduce<Record<string, any>>((result, [key, value]) => {
    if (key === 'bindings') {
      return result;
    }

    result[key] = resolveRuntimeValue(value, context);
    return result;
  }, {}) as T;
}

export function resolveRuntimeValue(value: unknown, context: RuntimeExpressionContext): unknown {
  if (typeof value === 'string') {
    const exactExpression = value.match(/^\s*\{\{\s*([^}]+?)\s*\}\}\s*$/);
    if (exactExpression) {
      return evaluateRuntimeExpression(exactExpression[1], context);
    }

    return value.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, expression: string) => {
      const result = evaluateRuntimeExpression(expression, context);
      return result === undefined || result === null ? '' : String(result);
    });
  }

  if (Array.isArray(value)) {
    return value.map((item) => resolveRuntimeValue(item, context));
  }

  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>((result, [key, item]) => {
      result[key] = resolveRuntimeValue(item, context);
      return result;
    }, {});
  }

  return value;
}

export function evaluateRuntimeExpression(expression: string, context: RuntimeExpressionContext) {
  return evaluateSafeExpression(expression, {
    context: {
      component: context.component,
      dataSources: context.dataSources,
    },
    event: {},
    variables: context.variables,
    args: [],
  });
}

export function setPathValue(target: Record<string, any>, path: string, value: unknown) {
  const keys = path.split('.').map((key) => key.trim()).filter(Boolean);
  if (keys.length === 0) return target;

  const next = cloneObject(target);
  let current = next;
  keys.slice(0, -1).forEach((key) => {
    if (!current[key] || typeof current[key] !== 'object' || Array.isArray(current[key])) {
      current[key] = {};
    }

    current = current[key];
  });
  current[keys[keys.length - 1]] = value;

  return next;
}

export async function requestRuntimeDataSource(
  config: RuntimeDataSourceConfig,
  options: {
    apiBaseUrl?: string;
    allowedOrigins?: string[];
    variables: Record<string, any>;
    dataSources: RuntimeDataSourceState;
    getAuthToken?: () => string | undefined;
  },
) {
  if (config.type === 'static') {
    return config.staticData ?? [];
  }

  const url = normalizeHttpActionUrl(resolveRuntimeValue(config.url || '', {
    variables: options.variables,
    dataSources: options.dataSources,
  }) as string, {
    apiBaseUrl: options.apiBaseUrl,
    allowedOrigins: options.allowedOrigins,
  });

  if (!url) return [];
  if (!isHttpActionUrlAllowed(url, { allowedOrigins: options.allowedOrigins })) {
    throw new Error('数据源地址不在允许访问的域名内');
  }

  const headers = resolveRuntimeValue(config.headers || {}, {
    variables: options.variables,
    dataSources: options.dataSources,
  }) as Record<string, string>;
  const token = options.getAuthToken?.();
  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method: config.method || 'GET',
    headers: Object.keys(headers).length ? headers : undefined,
    body: config.method && config.method !== 'GET' && config.body !== undefined
      ? JSON.stringify(resolveRuntimeValue(config.body, {
        variables: options.variables,
        dataSources: options.dataSources,
      }))
      : undefined,
  });

  const data = await readResponse(response);
  if (!response.ok) {
    throw new Error(`数据源请求失败：HTTP ${response.status}`);
  }

  return config.dataPath ? readPath(data, config.dataPath) : data;
}

function normalizeDataSource(item: unknown): RuntimeDataSourceConfig | null {
  if (!item || typeof item !== 'object') return null;

  const dataSource = item as RuntimeDataSourceConfig;
  if (!dataSource.id?.trim()) return null;

  return {
    ...dataSource,
    id: dataSource.id.trim(),
    type: dataSource.type || 'rest',
  };
}

function cloneObject(value: Record<string, any>) {
  return JSON.parse(JSON.stringify(value || {})) as Record<string, any>;
}

function readPath(target: unknown, path: string) {
  return path.split('.').map((key) => key.trim()).filter(Boolean).reduce<any>((result, key) => result?.[key], target);
}

async function readResponse(response: Response) {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }

  return response.text();
}
