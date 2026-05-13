import {
  ComponentControlAction,
  ComponentAction,
  HttpAction,
  LowcodeAction,
  LowcodeComponentSchema,
  ToastType,
} from './types';
import {
  buildHttpActionRequestBody,
  buildHttpActionRequestHeaders,
} from './http-action';
import { evaluateSafeExpression } from './safe-expression';
import {
  NormalizeHttpActionUrlOptions,
  isHttpActionUrlAllowed,
  normalizeActionUrl,
  normalizeHttpActionUrl,
} from './url';

export interface LowcodeActionRuntimeContext {
  component: LowcodeComponentSchema;
  eventName: string;
  eventData: Record<string, any>;
  args: any[];
  components: LowcodeComponentSchema[];
  componentRefs: Record<string, any>;
  allowCustomJS: boolean;
  updateComponentProps?: (componentId: number, props: Record<string, any>) => void;
  updateComponentStyles?: (componentId: number, styles: Record<string, any>) => void;
  variables?: Record<string, any>;
  setVariable?: (path: string, value: unknown) => void;
  getAuthToken?: () => string | undefined;
}

export interface LowcodeActionRuntimeAdapters {
  showMessage?: (content: string, type: ToastType) => void;
  showConfirm?: (options: LowcodeConfirmOptions) => void;
  fetch?: (url: string, init?: LowcodeFetchInit) => Promise<LowcodeFetchResponse>;
  navigate?: (url: string, options: { blank?: boolean }) => void;
  onError?: (error: unknown, context?: LowcodeActionRuntimeContext, action?: LowcodeAction) => void;
  normalizeHttpUrlOptions?: NormalizeHttpActionUrlOptions;
}

export interface LowcodeConfirmOptions {
  title: string;
  content?: string;
  okText: string;
  cancelText: string;
  onOk: () => Promise<void>;
  onCancel: () => Promise<void>;
}

export interface LowcodeFetchInit {
  method?: string;
  headers?: Record<string, string>;
  body?: BodyInit | null;
}

export interface LowcodeFetchResponse {
  ok: boolean;
  status: number;
  headers: {
    get(name: string): string | null;
  };
  json(): Promise<unknown>;
  text(): Promise<string>;
}

export async function runLowcodeActions(
  actions: LowcodeAction[],
  context: LowcodeActionRuntimeContext,
  adapters: LowcodeActionRuntimeAdapters = {},
) {
  for (const action of actions) {
    if (action.disabled) {
      continue;
    }

    const shouldContinue = await runLowcodeAction(action, context, adapters);

    if (shouldContinue === false || action.stopPropagation) {
      break;
    }
  }
}

export async function runLowcodeAction(
  action: LowcodeAction,
  context: LowcodeActionRuntimeContext,
  adapters: LowcodeActionRuntimeAdapters = {},
): Promise<boolean | void> {
  if (action.disabled) {
    return;
  }

  applyEventControls(action, context.args);

  if (action.actionType === 'toast') {
    adapters.showMessage?.(action.args?.msg || '', action.args?.msgType || 'info');
    return;
  }

  if (action.actionType === 'confirm') {
    return new Promise<boolean>((resolve) => {
      adapters.showConfirm?.({
        title: action.args?.title || '确认操作？',
        content: action.args?.content,
        okText: '确认',
        cancelText: '取消',
        onOk: async () => {
          await runLowcodeActions(action.args?.actions || [], context, adapters);
          resolve(true);
        },
        onCancel: async () => {
          await runLowcodeActions(action.args?.cancelActions || [], context, adapters);
          resolve(Boolean(action.args?.continueOnCancel));
        },
      });
    });
  }

  if (action.actionType === 'condition') {
    const matched = evaluateCondition(action.args?.expression || '', context, adapters);
    await runLowcodeActions(
      matched ? (action.args?.trueActions || []) : (action.args?.falseActions || []),
      context,
      adapters,
    );
    return;
  }

  if (action.actionType === 'http') {
    await runHttpAction(action, context, adapters);
    return;
  }

  if (action.actionType === 'setVariable') {
    runSetVariableAction(action, context, adapters);
    return;
  }

  if (action.actionType === 'componentControl') {
    runComponentControlAction(action, context);
    return;
  }

  if (action.actionType === 'setComponentProps') {
    if (action.componentId && action.args?.props) {
      context.updateComponentProps?.(action.componentId, action.args.props);
    }
    return;
  }

  if (action.actionType === 'setComponentStyles') {
    if (action.componentId && action.args?.styles) {
      context.updateComponentStyles?.(action.componentId, action.args.styles);
    }
    return;
  }

  if (action.actionType === 'url') {
    const url = normalizeActionUrl(action.args?.url || '');
    if (!url) return;

    adapters.navigate?.(url, action.args?.blank ? { blank: true } : {});
    return;
  }

  if (action.actionType === 'componentAction') {
    runComponentAction(action, context);
    return;
  }

  if (action.actionType === 'custom') {
    await runCustomAction(action, context, adapters);
  }
}

function evaluateCondition(
  expression: string,
  context: LowcodeActionRuntimeContext,
  adapters: LowcodeActionRuntimeAdapters,
) {
  if (!expression.trim()) {
    return false;
  }

  try {
    if (!context.allowCustomJS) {
      return Boolean(evaluateSafeExpression(expression, {
        context: buildScriptContext(context),
        event: context.eventData,
        variables: context.variables,
        args: context.args,
      }));
    }

    const fn = new Function('context', 'event', 'args', `return Boolean(${expression});`);
    return Boolean(fn(buildScriptContext(context), context.eventData, context.args));
  } catch (error) {
    adapters.showMessage?.('条件表达式执行失败', 'error');
    adapters.onError?.(error, context, {
      actionType: 'condition',
      args: { expression },
    });
    return false;
  }
}

async function runHttpAction(
  action: HttpAction,
  context: LowcodeActionRuntimeContext,
  adapters: LowcodeActionRuntimeAdapters,
) {
  const fetcher = adapters.fetch;
  const url = normalizeHttpActionUrl(action.args?.url || '', adapters.normalizeHttpUrlOptions);
  if (!url || !fetcher) return;

  try {
    if (!isHttpActionUrlAllowed(url, adapters.normalizeHttpUrlOptions)) {
      throw new Error('HTTP action url is not in allowed origins');
    }

    const templatedHeaders = interpolateTemplates(action.args?.headers, context) as Record<string, string> | undefined;
    const templatedBody = interpolateTemplates(action.args?.body, context);
    const headers = buildHttpActionRequestHeaders(templatedHeaders, templatedBody) || {};
    const authHeader = getHttpAuthHeader(action, context);
    if (authHeader) {
      headers.Authorization = authHeader;
    }

    const response = await fetcher(url, {
      method: action.args?.method || 'GET',
      headers,
      body: buildHttpActionRequestBody(templatedBody) as BodyInit | undefined,
    });
    const data = await parseResponse(response);
    const responseData = {
      ok: response.ok,
      status: response.status,
      data,
    };
    context.eventData.httpResponse = responseData;
    setPath(context.eventData, action.args?.responseKey || '', responseData);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    if (action.args?.successMsg) {
      adapters.showMessage?.(action.args.successMsg, 'success');
    }
  } catch (error) {
    context.eventData.httpError = error;
    setPath(context.eventData, action.args?.errorKey || '', error);
    adapters.showMessage?.(action.args?.errorMsg || '请求失败', 'error');
    adapters.onError?.(error, context, action);
  }
}

function interpolateTemplates(value: unknown, context: LowcodeActionRuntimeContext): unknown {
  if (typeof value === 'string') {
    return value.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, expression: string) => {
      const result = evaluateSafeExpression(expression, {
        context: buildScriptContext(context),
        event: context.eventData,
        variables: context.variables,
        args: context.args,
      });

      return result === undefined || result === null ? '' : String(result);
    });
  }

  if (Array.isArray(value)) {
    return value.map((item) => interpolateTemplates(item, context));
  }

  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>((result, [key, item]) => {
      result[key] = interpolateTemplates(item, context);
      return result;
    }, {});
  }

  return value;
}

function getHttpAuthHeader(action: HttpAction, context: LowcodeActionRuntimeContext) {
  if (action.args?.auth === 'currentUser') {
    const token = context.getAuthToken?.();
    return token ? `Bearer ${token}` : '';
  }

  if (action.args?.auth === 'bearer') {
    const token = action.args?.bearerToken || '';
    return token ? `Bearer ${token}` : '';
  }

  return '';
}

function runSetVariableAction(
  action: LowcodeAction,
  context: LowcodeActionRuntimeContext,
  adapters: LowcodeActionRuntimeAdapters,
) {
  if (action.actionType !== 'setVariable') return;

  const path = action.args?.path?.trim();
  if (!path) return;

  try {
    const value = action.args.expression?.trim()
      ? evaluateSafeExpression(action.args.expression, {
        context: buildScriptContext(context),
        event: context.eventData,
        variables: context.variables,
        args: context.args,
      })
      : action.args.value;

    context.setVariable?.(path, value);
  } catch (error) {
    adapters.showMessage?.('变量表达式执行失败', 'error');
    adapters.onError?.(error, context, action);
  }
}

function runComponentAction(action: ComponentAction, context: LowcodeActionRuntimeContext) {
  const target = context.componentRefs[action.componentId];
  const method = action.args?.method;

  if (target && method) {
    target[method]?.(...(action.args?.params || context.args));
  }
}

function runComponentControlAction(action: ComponentControlAction, context: LowcodeActionRuntimeContext) {
  const operation = action.args?.operation;
  if (!action.componentId || !operation) return;

  if (operation === 'show') {
    context.updateComponentStyles?.(action.componentId, { display: undefined });
    return;
  }

  if (operation === 'hide') {
    context.updateComponentStyles?.(action.componentId, { display: 'none' });
    return;
  }

  if (operation === 'enable') {
    context.updateComponentProps?.(action.componentId, { disabled: false });
    return;
  }

  if (operation === 'disable') {
    context.updateComponentProps?.(action.componentId, { disabled: true });
    return;
  }

  if (operation === 'setValue') {
    context.updateComponentProps?.(action.componentId, {
      [action.args?.valueProp || 'value']: action.args?.value,
    });
    return;
  }

  if (operation === 'clearValue') {
    context.updateComponentProps?.(action.componentId, {
      [action.args?.valueProp || 'value']: undefined,
      defaultValue: undefined,
      checked: undefined,
    });
    return;
  }

  const methodMap: Partial<Record<typeof operation, string>> = {
    open: 'open',
    close: 'close',
    submit: 'submit',
    reset: 'reset',
  };
  const method = methodMap[operation];
  const target = context.componentRefs[action.componentId];
  if (target && method) {
    target[method]?.();
  }
}

async function runCustomAction(
  action: LowcodeAction,
  context: LowcodeActionRuntimeContext,
  adapters: LowcodeActionRuntimeAdapters,
) {
  if (action.actionType !== 'custom' || !context.allowCustomJS) return;

  const script = action.args?.script || '';
  const func = new Function('context', 'event', 'doAction', 'args', script);
  await func(
    {
      ...buildScriptContext(context),
      showMessage(content: string, type: ToastType = 'success') {
        adapters.showMessage?.(content, type);
      },
      doAction(nextAction: LowcodeAction) {
        return runLowcodeAction(nextAction, context, adapters);
      },
    },
    context.eventData,
    (nextAction: LowcodeAction) => runLowcodeAction(nextAction, context, adapters),
    context.args,
  );
}

function buildScriptContext(context: LowcodeActionRuntimeContext) {
  return {
    component: context.component,
    eventName: context.eventName,
    eventData: context.eventData,
    args: context.args,
    components: context.components,
    componentRefs: context.componentRefs,
    variables: context.variables || {},
    updateComponentProps(componentId: number, props: Record<string, any>) {
      context.updateComponentProps?.(componentId, props);
    },
    updateComponentStyles(componentId: number, styles: Record<string, any>) {
      context.updateComponentStyles?.(componentId, styles);
    },
    setVariable(path: string, value: unknown) {
      context.setVariable?.(path, value);
    },
  };
}

function setPath(target: Record<string, any>, path: string, value: unknown) {
  const keys = path.split('.').map((key) => key.trim()).filter(Boolean);
  if (keys.length === 0) return;

  let current = target;
  keys.slice(0, -1).forEach((key) => {
    if (!current[key] || typeof current[key] !== 'object' || Array.isArray(current[key])) {
      current[key] = {};
    }

    current = current[key];
  });

  current[keys[keys.length - 1]] = value;
}

async function parseResponse(response: LowcodeFetchResponse) {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }

  return response.text();
}

function applyEventControls(action: LowcodeAction, args: any[]) {
  const nativeEvent = args[0];

  if (action.preventDefault) {
    nativeEvent?.preventDefault?.();
  }

  if (action.stopPropagation) {
    nativeEvent?.stopPropagation?.();
  }
}
