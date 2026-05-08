import { CURRENT_SCHEMA_VERSION, defaultPageSchema } from './defaults';
import type { LowcodeComponentSchema, LowcodePageSchema } from './types';

export interface MigratePageSchemaOptions {
  pageId?: number | null;
  now?: string;
}

export function migratePageSchema(value: unknown, options: MigratePageSchemaOptions = {}): LowcodePageSchema {
  const input = isPlainObject(value) ? value : {};
  const allocateComponentId = createComponentIdAllocator(input.components);
  const components = Array.isArray(input.components)
    ? input.components.map((component) => migrateComponent(component, allocateComponentId))
    : cloneComponents(defaultPageSchema.components);
  const metadata = isPlainObject(input.metadata) ? input.metadata : {};
  const nextMetadata: Record<string, unknown> = { ...metadata };

  if (nextMetadata.migratedAt === undefined && options.now) {
    nextMetadata.migratedAt = options.now;
  }

  return {
    ...input,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    pageId: options.pageId !== undefined ? options.pageId : readPageId(input.pageId),
    components,
    metadata: nextMetadata,
  };
}

function migrateComponent(value: unknown, allocateComponentId: () => number): LowcodeComponentSchema {
  const input = isPlainObject(value) ? value : {};
  const component: LowcodeComponentSchema = {
    id: isFiniteNumber(input.id) ? input.id : allocateComponentId(),
    name: typeof input.name === 'string' && input.name.trim() ? input.name.trim() : 'Container',
    props: migrateComponentProps(input.props),
    desc: typeof input.desc === 'string' ? input.desc : '',
  };

  if (isPlainObject(input.styles)) {
    component.styles = { ...input.styles };
  }

  if (isFiniteNumber(input.parentId)) {
    component.parentId = input.parentId;
  }

  if (Array.isArray(input.children)) {
    component.children = input.children.map((child) => migrateComponent(child, allocateComponentId));
  }

  return component;
}

function migrateComponentProps(value: unknown): Record<string, unknown> {
  const props = isPlainObject(value) ? { ...value } : {};
  const onEvent = migrateOnEvent(props.onEvent);

  Object.entries(props).forEach(([key, propValue]) => {
    if (key === 'onEvent' || !isEventConfig(propValue)) {
      return;
    }

    const eventName = getLowcodeEventName(key);

    if (!onEvent[eventName]) {
      onEvent[eventName] = migrateEventConfig(propValue);
    }

    delete props[key];
  });

  if (Object.keys(onEvent).length > 0) {
    props.onEvent = onEvent;
  } else {
    delete props.onEvent;
  }

  return props;
}

function migrateOnEvent(value: unknown): Record<string, unknown> {
  if (!isPlainObject(value)) {
    return {};
  }

  return Object.entries(value).reduce<Record<string, unknown>>((result, [eventName, eventConfig]) => {
    if (isEventConfig(eventConfig)) {
      result[getLowcodeEventName(eventName)] = migrateEventConfig(eventConfig);
    }

    return result;
  }, {});
}

function migrateEventConfig(value: unknown): Record<string, unknown> {
  const config = isPlainObject(value) ? value : {};

  return {
    ...config,
    actions: normalizeActions(config.actions),
  };
}

function normalizeActions(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(migrateAction)
    .filter((action): action is Record<string, unknown> => Boolean(action));
}

function migrateAction(value: unknown): Record<string, unknown> | null {
  if (!isPlainObject(value)) {
    return null;
  }

  if (typeof value.actionType === 'string') {
    const nextAction: Record<string, unknown> = { ...value };

    if (isPlainObject(value.args)) {
      nextAction.args = migrateActionArgs(value.actionType, value.args);
    }

    return nextAction;
  }

  const type = typeof value.type === 'string' ? value.type : '';
  const config = isPlainObject(value.config) ? value.config : {};
  const base = pickActionBase(value);

  if (type === 'goToLink') {
    return {
      ...base,
      actionType: 'url',
      args: {
        url: readString(value.url) || readString(config.url),
      },
    };
  }

  if (type === 'showMessage') {
    return {
      ...base,
      actionType: 'toast',
      args: {
        msgType: readString(config.type) || 'success',
        msg: readString(config.text),
      },
    };
  }

  if (type === 'customJS') {
    return {
      ...base,
      actionType: 'custom',
      args: {
        script: readString(value.code),
      },
    };
  }

  if (type === 'componentMethod') {
    return {
      ...base,
      actionType: 'componentAction',
      componentId: readNumber(config.componentId) ?? 0,
      args: {
        method: readString(config.method),
      },
    };
  }

  return null;
}

function migrateActionArgs(actionType: string, args: Record<string, unknown>) {
  const nextArgs: Record<string, unknown> = { ...args };

  if (actionType === 'confirm') {
    nextArgs.actions = normalizeActions(args.actions);
    nextArgs.cancelActions = normalizeActions(args.cancelActions);
  }

  if (actionType === 'condition') {
    nextArgs.trueActions = normalizeActions(args.trueActions);
    nextArgs.falseActions = normalizeActions(args.falseActions);
  }

  return nextArgs;
}

function pickActionBase(value: Record<string, unknown>) {
  const base: Record<string, unknown> = {};

  ['id', 'preventDefault', 'stopPropagation', 'disabled'].forEach((key) => {
    if (value[key] !== undefined) {
      base[key] = value[key];
    }
  });

  return base;
}

function createComponentIdAllocator(value: unknown) {
  const usedIds = new Set<number>();
  let maxId = 0;

  collectComponentIds(value, usedIds, (id) => {
    maxId = Math.max(maxId, id);
  });

  let nextId = Math.max(0, Math.floor(maxId)) + 1;

  return () => {
    while (usedIds.has(nextId)) {
      nextId += 1;
    }

    const id = nextId;
    usedIds.add(id);
    nextId += 1;
    return id;
  };
}

function collectComponentIds(value: unknown, usedIds: Set<number>, onId: (id: number) => void) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectComponentIds(item, usedIds, onId));
    return;
  }

  if (!isPlainObject(value)) {
    return;
  }

  if (isFiniteNumber(value.id)) {
    usedIds.add(value.id);
    onId(value.id);
  }

  if (Array.isArray(value.children)) {
    value.children.forEach((child) => collectComponentIds(child, usedIds, onId));
  }
}

function cloneComponents(components: LowcodeComponentSchema[]): LowcodeComponentSchema[] {
  return components.map((component) => {
    const nextComponent: LowcodeComponentSchema = {
      ...component,
      props: { ...component.props },
    };

    if (component.styles) {
      nextComponent.styles = { ...component.styles };
    }

    if (component.children) {
      nextComponent.children = cloneComponents(component.children);
    }

    return nextComponent;
  });
}

function getLowcodeEventName(name: string) {
  if (name.startsWith('on') && name.length > 2 && name[2] === name[2].toUpperCase()) {
    const eventName = name.slice(2);
    return eventName.charAt(0).toLowerCase() + eventName.slice(1);
  }

  return name;
}

function isEventConfig(value: unknown) {
  return isPlainObject(value) && Array.isArray(value.actions);
}

function readPageId(value: unknown) {
  return isFiniteNumber(value) ? value : null;
}

function readString(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function readNumber(value: unknown) {
  if (isFiniteNumber(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : undefined;
  }

  return undefined;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
