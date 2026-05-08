import { Modal, message } from 'antd';
import {
  LowcodeActionRuntimeContext,
  runLowcodeAction as runLowcodeActionCore,
  runLowcodeActions as runLowcodeActionsCore,
} from '../../../packages/lowcode-schema/src';
import type { LowcodeAction, LowcodeEventRuntimeContext, ToastType } from './types';
import {
  formatRuntimeErrorMessage,
  formatRuntimeErrorStack,
  useRuntimeLogsStore,
} from '../stores/runtime-logs';

const runtimeAdapters = {
  showMessage(content: string, type: ToastType) {
    message.open({ type, content });
  },
  showConfirm(options: {
    title: string;
    content?: string;
    okText: string;
    cancelText: string;
    onOk: () => Promise<void>;
    onCancel: () => Promise<void>;
  }) {
    Modal.confirm(options);
  },
  fetch(url: string, init?: Parameters<typeof fetch>[1]) {
    return fetch(url, init);
  },
  navigate(url: string, options: { blank?: boolean }) {
    if (options.blank) {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }

    window.location.href = url;
  },
  onError(error: unknown, runtimeContext?: LowcodeActionRuntimeContext, action?: LowcodeAction) {
    if (runtimeContext) {
      useRuntimeLogsStore.getState().addLog({
        level: 'error',
        source: 'event',
        title: '事件动作执行失败',
        message: formatRuntimeErrorMessage(error),
        stack: formatRuntimeErrorStack(error),
        componentId: runtimeContext.component.id,
        componentName: runtimeContext.component.name,
        componentDesc: runtimeContext.component.desc,
        eventName: runtimeContext.eventName,
        actionType: action?.actionType,
      });
    }

    console.error(error);
  },
  normalizeHttpUrlOptions: {
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api',
    allowedOrigins: parseAllowedOrigins(import.meta.env.VITE_LOWCODE_HTTP_ALLOWED_ORIGINS),
  },
};

export function runLowcodeActions(actions: LowcodeAction[], context: LowcodeEventRuntimeContext) {
  return runLowcodeActionsCore(actions, context as LowcodeActionRuntimeContext, runtimeAdapters).catch((error) => {
    runtimeAdapters.onError(error, context as LowcodeActionRuntimeContext);
    throw error;
  });
}

export function runLowcodeAction(action: LowcodeAction, context: LowcodeEventRuntimeContext) {
  return runLowcodeActionCore(action, context as LowcodeActionRuntimeContext, runtimeAdapters).catch((error) => {
    runtimeAdapters.onError(error, context as LowcodeActionRuntimeContext, action);
    throw error;
  });
}

function parseAllowedOrigins(value: string | undefined) {
  return (value || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}
