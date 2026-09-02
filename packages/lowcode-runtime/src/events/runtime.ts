import { Modal, message } from 'antd';
import {
  type LowcodeActionRuntimeContext,
  runLowcodeAction as runLowcodeActionCore,
  runLowcodeActions as runLowcodeActionsCore,
} from '@lowcode/schema';
import type { LowcodeAction, LowcodeEventRuntimeContext, ToastType } from './types';

export interface LowcodeRuntimeAdapterOptions {
  apiBaseUrl?: string;
  allowedOrigins?: string[];
  onError?: (
    error: unknown,
    runtimeContext?: LowcodeActionRuntimeContext,
    action?: LowcodeAction,
  ) => void;
}

function createRuntimeAdapters(options: LowcodeRuntimeAdapterOptions = {}) {
  return {
    showMessage(content: string, type: ToastType) {
      message.open({ type, content });
    },
    showConfirm(confirmOptions: {
      title: string;
      content?: string;
      okText: string;
      cancelText: string;
      onOk: () => Promise<void>;
      onCancel: () => Promise<void>;
    }) {
      Modal.confirm(confirmOptions);
    },
    fetch(url: string, init?: Parameters<typeof fetch>[1]) {
      return fetch(url, init);
    },
    navigate(url: string, navigateOptions: { blank?: boolean }) {
      if (navigateOptions.blank) {
        window.open(url, '_blank', 'noopener,noreferrer');
        return;
      }
      window.location.href = url;
    },
    onError(error: unknown, runtimeContext?: LowcodeActionRuntimeContext, action?: LowcodeAction) {
      if (options.onError) {
        options.onError(error, runtimeContext, action);
        return;
      }
      console.error(error);
    },
    normalizeHttpUrlOptions: {
      apiBaseUrl: options.apiBaseUrl,
      allowedOrigins: options.allowedOrigins,
    },
  };
}

export function runLowcodeActions(
  actions: LowcodeAction[],
  context: LowcodeEventRuntimeContext,
  options?: LowcodeRuntimeAdapterOptions,
) {
  const runtimeAdapters = createRuntimeAdapters(options);
  return runLowcodeActionsCore(actions, context as LowcodeActionRuntimeContext, runtimeAdapters).catch((error) => {
    runtimeAdapters.onError(error, context as LowcodeActionRuntimeContext);
    throw error;
  });
}

export function runLowcodeAction(
  action: LowcodeAction,
  context: LowcodeEventRuntimeContext,
  options?: LowcodeRuntimeAdapterOptions,
) {
  const runtimeAdapters = createRuntimeAdapters(options);
  return runLowcodeActionCore(action, context as LowcodeActionRuntimeContext, runtimeAdapters).catch((error) => {
    runtimeAdapters.onError(error, context as LowcodeActionRuntimeContext, action);
    throw error;
  });
}
