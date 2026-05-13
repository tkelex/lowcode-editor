import type { Component } from '../stores/components';
import { getLowcodeEventName, getReactEventProp } from './eventNames';
import type { LowcodeAction, LowcodeEventConfig, LowcodeEvents } from './types';

export { normalizeActionUrl, normalizeHttpActionUrl } from '../../../packages/lowcode-schema/src';

export function getComponentEventConfig(component: Component, eventNameOrProp: string): LowcodeEventConfig | undefined {
  const eventName = getLowcodeEventName(eventNameOrProp);
  const props = component.props || {};
  const onEvent = props.onEvent as LowcodeEvents | undefined;
  const currentConfig = onEvent?.[eventName] || onEvent?.[eventNameOrProp];

  if (currentConfig) {
    return normalizeEventConfig(currentConfig);
  }

  const reactPropName = getReactEventProp(eventNameOrProp);
  const legacyConfig = props[reactPropName] || props[eventNameOrProp];

  if (legacyConfig) {
    return normalizeEventConfig(legacyConfig);
  }

  return undefined;
}

export function normalizeEventConfig(config: unknown): LowcodeEventConfig {
  if (!config || typeof config !== 'object') {
    return { actions: [] };
  }

  const actions = (config as { actions?: unknown }).actions;
  if (!Array.isArray(actions)) {
    return { actions: [] };
  }

  return {
    actions: actions
      .map(normalizeAction)
      .filter((action): action is LowcodeAction => Boolean(action)),
  };
}

export function normalizeAction(action: unknown): LowcodeAction | null {
  if (!action || typeof action !== 'object') {
    return null;
  }

  const nextAction = action as Record<string, any>;

  if (nextAction.actionType) {
    if (nextAction.actionType === 'url') {
      const args = isPlainObject(nextAction.args) ? nextAction.args : {};
      const blank = readUrlActionBlank(args, nextAction);

      return {
        ...nextAction,
        actionType: 'url',
        args: {
          url: args.url || '',
          ...(blank === true ? { blank: true } : {}),
        },
      } as LowcodeAction;
    }

    return nextAction as LowcodeAction;
  }

  if (nextAction.type === 'goToLink') {
    const config = isPlainObject(nextAction.config) ? nextAction.config : {};
    const blank = readUrlActionBlank(nextAction, config);

    return {
      actionType: 'url',
      args: {
        url: nextAction.url || config.url || '',
        ...(blank === true ? { blank: true } : {}),
      },
    };
  }

  if (nextAction.type === 'showMessage') {
    return {
      actionType: 'toast',
      args: {
        msgType: nextAction.config?.type || 'success',
        msg: nextAction.config?.text || '',
      },
    };
  }

  if (nextAction.type === 'customJS') {
    return {
      actionType: 'custom',
      args: {
        script: nextAction.code || '',
      },
    };
  }

  if (nextAction.type === 'componentMethod') {
    return {
      actionType: 'componentAction',
      componentId: Number(nextAction.config?.componentId),
      args: {
        method: nextAction.config?.method || '',
      },
    };
  }

  return null;
}

function readUrlActionBlank(...sources: Array<Record<string, any>>) {
  for (const source of sources) {
    const blankValue = readBoolean(source.blank);
    if (blankValue !== undefined) {
      return blankValue;
    }

    const newWindowValue = readBoolean(source.newWindow);
    if (newWindowValue !== undefined) {
      return newWindowValue;
    }

    const targetValue = String(source.target || source.targetType || source.openMode || '').trim().toLowerCase();
    if (['_blank', 'blank', 'new', 'newwindow', 'new-window', '新窗口'].includes(targetValue)) {
      return true;
    }

    if (['_self', 'self', 'current', 'currentwindow', 'current-window', '当前窗口'].includes(targetValue)) {
      return false;
    }
  }

  return undefined;
}

function readBoolean(value: unknown) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'y', '_blank', 'blank'].includes(normalized)) {
      return true;
    }
    if (['false', '0', 'no', 'n', '_self', 'self'].includes(normalized)) {
      return false;
    }
  }

  return undefined;
}

function isPlainObject(value: unknown): value is Record<string, any> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
