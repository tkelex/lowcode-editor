import type { AiComponentPatch } from './ai-agent-types';
import type {
  HttpAction,
  LowcodeAction,
  LowcodeComponentSchema,
  LowcodeEvents,
  ToastAction,
  UrlAction,
} from './types';

export interface CreateAgentPatchToolInput {
  components: LowcodeComponentSchema[];
  prompt: string;
  selectedComponentId?: number;
  pageFingerprint?: string;
  apiDescription?: string;
}

export interface AgentPatchToolResult {
  patch: AiComponentPatch;
  summary: string;
  warnings: string[];
  assumptions: string[];
  targetComponentId: number;
  targetComponentName: string;
  eventName?: string;
  dataSourceId?: string;
}

type HttpMethod = NonNullable<HttpAction['args']['method']>;

const EVENT_NAME_BY_COMPONENT: Record<string, string> = {
  Button: 'click',
  Link: 'click',
  Container: 'click',
  Card: 'click',
  Space: 'click',
  Flex: 'click',
  Grid: 'click',
  List: 'click',
  Descriptions: 'click',
  Statistic: 'click',
  Chart: 'click',
  Tooltip: 'click',
  Popover: 'click',
  Alert: 'click',
  Result: 'click',
  Empty: 'click',
  Form: 'finish',
  Input: 'change',
  Textarea: 'change',
  Select: 'change',
  Radio: 'change',
  Checkbox: 'change',
  DatePicker: 'change',
  Switch: 'change',
  Upload: 'change',
  Rate: 'change',
  Table: 'change',
  Pagination: 'change',
};

const DATA_SOURCE_COMPONENTS = new Set(['Table', 'List', 'Select']);
const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

export function createAgentEventActionPatch(input: CreateAgentPatchToolInput): AgentPatchToolResult {
  const target = resolveTargetComponent(input.components, input.selectedComponentId, (component) => (
    Boolean(EVENT_NAME_BY_COMPONENT[component.name])
  ));
  if (!target) {
    throw new Error('未找到可配置事件动作的目标组件，请先选中 Button、Form、Link 等支持事件的组件。');
  }

  const eventName = inferEventName(input.prompt, target.name);
  const actions = inferEventActions(input.prompt, input.apiDescription);
  if (actions.length === 0) {
    throw new Error('未能从描述中识别出可执行动作，请补充跳转地址、接口地址或提示文案。');
  }

  const currentOnEvent = readLowcodeEvents(target.props.onEvent);
  const currentEvent = currentOnEvent[eventName] || {};
  const nextOnEvent: LowcodeEvents = {
    ...currentOnEvent,
    [eventName]: {
      ...currentEvent,
      actions: [...(currentEvent.actions || []), ...actions],
    },
  };

  return {
    patch: {
      baselineFingerprint: input.pageFingerprint,
      summary: `为 ${target.name}#${target.id} 配置 ${eventName} 事件动作`,
      operations: [
        {
          type: 'updateProps',
          componentId: target.id,
          props: {
            onEvent: nextOnEvent,
          },
          reason: '根据自然语言请求生成低代码事件动作配置。',
        },
      ],
    },
    summary: `已生成 ${target.name} 的 ${eventName} 事件动作候选修改。`,
    warnings: [],
    assumptions: createEventAssumptions(target.name, eventName, actions),
    targetComponentId: target.id,
    targetComponentName: target.name,
    eventName,
  };
}

export function createAgentDataSourceBindingPatch(input: CreateAgentPatchToolInput): AgentPatchToolResult {
  const target = resolveTargetComponent(input.components, input.selectedComponentId, (component) => (
    DATA_SOURCE_COMPONENTS.has(component.name)
  ));
  if (!target) {
    throw new Error('未找到可绑定数据源的目标组件，请先选中 Table、List 或 Select。');
  }

  const url = extractUrl(`${input.prompt}\n${input.apiDescription || ''}`);
  if (!url) {
    throw new Error('未识别到接口地址。请在描述中提供 /api/... 或 http(s) 地址，工具不会凭空编造外部 URL。');
  }

  const page = findPageComponent(input.components);
  if (!page) {
    throw new Error('未找到 Page 根节点，无法写入运行态 dataSources 配置。');
  }

  const method = inferHttpMethod(input.prompt) || 'GET';
  const dataSources = readDataSourcesConfig(page.props.dataSources);
  const existingItems = Array.isArray(dataSources.items) ? dataSources.items : [];
  const existing = existingItems.find((item) => isRecord(item) && item.url === url);
  const dataSourceId = String(
    (isRecord(existing) && existing.id)
    || (typeof target.props.dataSourceId === 'string' && target.props.dataSourceId.trim())
    || createDataSourceId(url, target.name, existingItems),
  );
  const dataSourceItem = {
    ...(isRecord(existing) ? existing : {}),
    id: dataSourceId,
    name: createDataSourceName(url, target.name),
    type: 'rest',
    url,
    method,
    headers: isRecord(existing) && isRecord(existing.headers) ? existing.headers : {},
    dataPath: isRecord(existing) && typeof existing.dataPath === 'string' ? existing.dataPath : '',
  };
  const nextItems = existing
    ? existingItems.map((item) => item === existing ? dataSourceItem : item)
    : [...existingItems, dataSourceItem];

  return {
    patch: {
      baselineFingerprint: input.pageFingerprint,
      summary: `将 ${target.name}#${target.id} 绑定到数据源 ${dataSourceId}`,
      operations: [
        {
          type: 'updateProps',
          componentId: page.id,
          props: {
            dataSources: JSON.stringify({
              ...dataSources,
              items: nextItems,
            }, null, 2),
          },
          reason: '为页面追加或更新运行态数据源配置。',
        },
        {
          type: 'updateProps',
          componentId: target.id,
          props: {
            dataSourceId,
          },
          reason: '将目标组件绑定到运行态数据源。',
        },
      ],
    },
    summary: `已生成 ${target.name} 绑定 ${url} 的数据源候选修改。`,
    warnings: target.name === 'Table' ? [] : [`${target.name} 已写入 dataSourceId；运行态字段映射和展示格式可能还需要后续增强。`],
    assumptions: [`接口方法按 ${method} 处理。`, `数据源 ID 使用 ${dataSourceId}。`],
    targetComponentId: target.id,
    targetComponentName: target.name,
    dataSourceId,
  };
}

function inferEventName(prompt: string, componentName: string) {
  const text = prompt.toLowerCase();
  if (/finish|submit|提交|保存/.test(text) && componentName === 'Form') {
    return 'finish';
  }
  if (/change|变化|选择|输入/.test(text) && EVENT_NAME_BY_COMPONENT[componentName] === 'change') {
    return 'change';
  }
  if (/click|点击|点按|打开|跳转/.test(text) && EVENT_NAME_BY_COMPONENT[componentName] === 'click') {
    return 'click';
  }
  return EVENT_NAME_BY_COMPONENT[componentName];
}

function inferEventActions(prompt: string, apiDescription?: string): LowcodeAction[] {
  const text = `${prompt}\n${apiDescription || ''}`;
  const url = extractUrl(text);
  const method = inferHttpMethod(text);
  const shouldUseHttp = Boolean(
    url && (
      method
      || /^\/api(?:\/|$)/i.test(url)
      || /接口|请求|提交|保存|删除|新增|创建|更新|\bapi\b|\bfetch\b|\brequest\b/i.test(text)
    ),
  );
  const baseActions: LowcodeAction[] = [];

  if (shouldUseHttp && url) {
    baseActions.push(createHttpAction(url, method || 'POST', text));
  } else if (url && /跳转|打开|访问|前往|navigate|redirect|href|url|link/i.test(text)) {
    baseActions.push(createUrlAction(url, /新窗口|新标签|blank/i.test(text)));
  } else if (/toast|提示|提醒|message|通知/i.test(text)) {
    baseActions.push(createToastAction(extractQuotedText(text) || '操作已触发', inferToastType(text)));
  }

  if (baseActions.length === 0) {
    return [];
  }

  if (/确认|二次确认|confirm/i.test(text)) {
    return [
      {
        actionType: 'confirm',
        args: {
          title: /删除|delete|destroy/i.test(text) ? '确认删除？' : '请确认操作',
          content: /删除|delete|destroy/i.test(text) ? '该操作可能不可撤销。' : '确认后将继续执行后续动作。',
          actions: baseActions,
        },
      },
    ];
  }

  return baseActions;
}

function createHttpAction(url: string, method: HttpMethod, text: string): HttpAction {
  return {
    actionType: 'http',
    args: {
      url,
      method,
      auth: 'none',
      headers: {},
      responseKey: 'agentHttpResult',
      errorKey: 'agentHttpError',
      successMsg: createHttpSuccessMessage(method, text),
      errorMsg: '请求失败',
    },
  };
}

function createUrlAction(url: string, blank: boolean): UrlAction {
  return {
    actionType: 'url',
    args: {
      url,
      blank,
    },
  };
}

function createToastAction(msg: string, msgType: ToastAction['args']['msgType']): ToastAction {
  return {
    actionType: 'toast',
    args: {
      msg,
      msgType,
    },
  };
}

function inferHttpMethod(text: string): HttpMethod | undefined {
  const explicit = text.match(/\b(GET|POST|PUT|PATCH|DELETE)\b/i)?.[1]?.toUpperCase();
  if (explicit && HTTP_METHODS.includes(explicit as HttpMethod)) {
    return explicit as HttpMethod;
  }
  if (/删除|移除|delete|destroy/i.test(text)) return 'DELETE';
  if (/更新|修改|保存修改|\bput\b/i.test(text)) return 'PUT';
  if (/局部|patch/i.test(text)) return 'PATCH';
  if (/新增|创建|提交|保存|post/i.test(text)) return 'POST';
  return undefined;
}

function inferToastType(text: string): ToastAction['args']['msgType'] {
  if (/失败|错误|error/i.test(text)) return 'error';
  if (/警告|注意|warning/i.test(text)) return 'warning';
  if (/信息|info/i.test(text)) return 'info';
  return 'success';
}

function extractUrl(text: string) {
  const match = text.match(/https?:\/\/[^\s，。；;,]+|\/[A-Za-z0-9._~:/?#\[\]@!$&'()*+,;=%-]+(?:\s*\{\{\s*[^}]+\s*\}\})?/);
  return match?.[0]?.trim();
}

function extractQuotedText(text: string) {
  return text.match(/[「“"]([^」”"]+)[」”"]/)?.[1]?.trim();
}

function createHttpSuccessMessage(method: HttpMethod, text: string) {
  if (/删除|delete/i.test(text) || method === 'DELETE') return '删除成功';
  if (/更新|修改/i.test(text) || method === 'PUT' || method === 'PATCH') return '保存成功';
  if (/新增|创建/i.test(text) || method === 'POST') return '提交成功';
  return '请求成功';
}

function createEventAssumptions(componentName: string, eventName: string, actions: LowcodeAction[]) {
  const actionLabels = actions.map((action) => action.actionType).join('、');
  return [
    `${componentName} 默认使用 ${eventName} 事件。`,
    `动作类型按 ${actionLabels} 处理。`,
  ];
}

function resolveTargetComponent(
  components: LowcodeComponentSchema[],
  selectedComponentId: number | undefined,
  predicate: (component: LowcodeComponentSchema) => boolean,
) {
  if (selectedComponentId) {
    const selected = findComponent(components, selectedComponentId);
    if (!selected) {
      throw new Error(`未找到选中的组件：${selectedComponentId}`);
    }
    if (!predicate(selected)) {
      throw new Error(`选中的 ${selected.name} 不支持本次操作。`);
    }
    return selected;
  }

  return findFirstComponent(components, predicate);
}

function findPageComponent(components: LowcodeComponentSchema[]) {
  return components.find((component) => component.name === 'Page') || components[0];
}

function findComponent(components: LowcodeComponentSchema[], componentId: number): LowcodeComponentSchema | undefined {
  for (const component of components) {
    if (component.id === componentId) {
      return component;
    }
    const child = findComponent(component.children || [], componentId);
    if (child) {
      return child;
    }
  }
  return undefined;
}

function findFirstComponent(
  components: LowcodeComponentSchema[],
  predicate: (component: LowcodeComponentSchema) => boolean,
): LowcodeComponentSchema | undefined {
  for (const component of components) {
    if (predicate(component)) {
      return component;
    }
    const child = findFirstComponent(component.children || [], predicate);
    if (child) {
      return child;
    }
  }
  return undefined;
}

function readLowcodeEvents(value: unknown): LowcodeEvents {
  return isRecord(value) ? value as LowcodeEvents : {};
}

function readDataSourcesConfig(value: unknown): Record<string, unknown> & { items?: unknown[] } {
  if (isRecord(value)) {
    return { ...value, items: Array.isArray(value.items) ? value.items : [] };
  }

  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (isRecord(parsed)) {
        return { ...parsed, items: Array.isArray(parsed.items) ? parsed.items : [] };
      }
    } catch {
      return { items: [] };
    }
  }

  return { items: [] };
}

function createDataSourceId(url: string, componentName: string, existingItems: unknown[]) {
  const usedIds = new Set(
    existingItems
      .filter(isRecord)
      .map((item) => item.id)
      .filter((id): id is string => typeof id === 'string' && Boolean(id.trim())),
  );
  const lastSegment = getUrlLastSegment(url);
  const base = toCamelId(`agent-${lastSegment || componentName}-data`);
  let id = base;
  let index = 1;
  while (usedIds.has(id)) {
    id = `${base}${index}`;
    index += 1;
  }
  return id;
}

function createDataSourceName(url: string, componentName: string) {
  const lastSegment = getUrlLastSegment(url);
  return `${componentName} ${lastSegment || '数据源'}`;
}

function getUrlLastSegment(url: string) {
  return url
    .replace(/^https?:\/\/[^/]+/i, '')
    .split(/[?#]/)[0]
    .split('/')
    .filter((segment) => segment && !segment.startsWith(':') && !segment.includes('{{'))
    .pop();
}

function toCamelId(value: string) {
  const words = value
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return 'agentData';
  return words
    .map((word, index) => {
      const lower = word.toLowerCase();
      return index === 0 ? lower : `${lower.slice(0, 1).toUpperCase()}${lower.slice(1)}`;
    })
    .join('');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
