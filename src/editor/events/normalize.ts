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
    return nextAction as LowcodeAction;
  }

  if (nextAction.type === 'goToLink') {
    return {
      actionType: 'url',
      args: {
        url: nextAction.url || '',
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
