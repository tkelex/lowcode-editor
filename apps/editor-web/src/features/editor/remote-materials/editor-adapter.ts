import type {
  RemoteEditorMaterialDefinition,
  RemoteMaterialLoadResult,
} from '@lowcode/runtime/client';
import type { PageMaterialDependency } from '@lowcode/schema';
import { ACTIONS } from '../registry/factory';
import type {
  ComponentCategory,
  ComponentConfig,
  ComponentEvent,
  ComponentSetter,
} from '../registry/types';

const componentCategories = new Set<ComponentCategory>([
  'layout',
  'basic',
  'form',
  'data',
  'feedback',
]);

export function createRemoteEditorComponentConfigs(
  results: readonly RemoteMaterialLoadResult[],
) {
  const configs: Record<string, ComponentConfig> = {};

  for (const result of results) {
    for (const [name, definition] of Object.entries(result.editorMaterials || {})) {
      configs[name] = toComponentConfig(definition);
    }
  }

  return configs;
}

export function createRemoteParentAccepts(
  dependencies: ReadonlyArray<Pick<PageMaterialDependency, 'materials'>>,
) {
  const acceptedChildrenByParent: Record<string, string[]> = {};

  for (const dependency of dependencies) {
    for (const material of dependency.materials) {
      for (const parentName of material.allowedParents || []) {
        const acceptedChildren = acceptedChildrenByParent[parentName] || [];
        if (!acceptedChildren.includes(material.name)) {
          acceptedChildren.push(material.name);
        }
        acceptedChildrenByParent[parentName] = acceptedChildren;
      }
    }
  }

  return acceptedChildrenByParent;
}

function toComponentConfig(definition: RemoteEditorMaterialDefinition): ComponentConfig {
  return {
    name: definition.name,
    desc: definition.desc,
    category: normalizeCategory(definition.category),
    defaultProps: { ...definition.defaultProps },
    ...(definition.icon ? { icon: definition.icon } : {}),
    ...(definition.keywords ? { keywords: [...definition.keywords] } : {}),
    ...(definition.sort === undefined ? {} : { sort: definition.sort }),
    ...(definition.acceptsChildren
      ? {
          acceptsChildren: Array.isArray(definition.acceptsChildren)
            ? [...definition.acceptsChildren]
            : true,
        }
      : {}),
    setter: definition.setter?.map(normalizeSetter) || [],
    stylesSetter: definition.stylesSetter?.map(normalizeSetter),
    events: definition.events?.map(normalizeEvent) || [],
    methods: definition.methods?.map((method) => ({
      name: String(method.name || ''),
      label: String(method.label || method.name || ''),
    })) || [],
    dev: definition.dev,
    prod: definition.prod,
  };
}

function normalizeCategory(value: string | undefined): ComponentCategory {
  return value && componentCategories.has(value as ComponentCategory)
    ? value as ComponentCategory
    : 'basic';
}

function normalizeSetter(setter: Record<string, unknown>): ComponentSetter {
  const type = setter.type === 'number' ? 'inputNumber' : String(setter.type || 'input');
  return {
    ...setter,
    name: String(setter.name || ''),
    label: String(setter.label || setter.name || ''),
    type,
  } as ComponentSetter;
}

function normalizeEvent(event: Record<string, unknown>): ComponentEvent {
  return {
    name: String(event.name || ''),
    label: String(event.label || event.name || ''),
    ...(event.propName ? { propName: String(event.propName) } : {}),
    category: 'ui',
    description: String(event.description || `${event.label || event.name || '远程事件'}触发时执行`),
    eventDataSchema: Array.isArray(event.eventDataSchema)
      ? event.eventDataSchema.map(String)
      : ['args'],
    allowedActions: ACTIONS.ui,
  };
}
