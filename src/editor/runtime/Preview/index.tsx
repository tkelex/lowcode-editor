import {
  PageRuntime,
  type ActionType,
  type RuntimeComponent,
  type RuntimeErrorContext,
} from '@lowcode/runtime';
import { useComponetsStore } from '../../stores/components';
import {
  formatRuntimeErrorMessage,
  formatRuntimeErrorStack,
  useRuntimeLogsStore,
} from '../../stores/runtime-logs';
import type { Component } from '../../stores/components';

interface PreviewProps {
  components?: Component[];
  allowCustomJS?: boolean;
  runtimeConfig?: PreviewRuntimeConfig;
}

export interface PreviewRuntimeConfig {
  apiBaseUrl?: string;
  allowedOrigins?: string[];
  getAuthToken?: () => string | undefined;
}

export function Preview({ components, allowCustomJS = true, runtimeConfig }: PreviewProps) {
  const storeComponents = useComponetsStore((state) => state.components);
  const sourceComponents = components ?? storeComponents;

  return <PageRuntime
    components={sourceComponents as RuntimeComponent[]}
    policy={{
      apiBaseUrl: runtimeConfig?.apiBaseUrl ?? import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api',
      allowedOrigins: runtimeConfig?.allowedOrigins ?? parseAllowedOrigins(import.meta.env.VITE_LOWCODE_HTTP_ALLOWED_ORIGINS),
      getAuthToken: runtimeConfig?.getAuthToken ?? getDefaultAuthToken,
      allowCustomJS,
      onError: addRuntimeErrorLog,
    }}
  />;
}

function addRuntimeErrorLog(error: unknown, context: RuntimeErrorContext) {
  useRuntimeLogsStore.getState().addLog({
    level: 'error',
    source: context.source === 'data-source' ? 'event' : context.source,
    title: context.source === 'render' ? '组件渲染失败' : '事件动作执行失败',
    message: formatRuntimeErrorMessage(error),
    stack: formatRuntimeErrorStack(error),
    componentId: context.component?.id,
    componentName: context.component?.name,
    componentDesc: context.component?.desc,
    eventName: context.eventName,
    actionType: context.actionType as ActionType | undefined,
  });
}

function parseAllowedOrigins(value: string | undefined) {
  return (value || '').split(',').map((origin) => origin.trim()).filter(Boolean);
}

function getDefaultAuthToken() {
  return window.localStorage.getItem('lowcode_token') || undefined;
}
