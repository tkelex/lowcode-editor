import type {
  LowcodeComponentSchema,
} from './types';
import type { NormalizeAiGeneratedComponentsOptions } from './ai-types';

interface NormalizeState {
  nextId: number;
  usedIds: Set<number>;
  warnings: string[];
}

const DEFAULT_COMPONENT_DESC: Record<string, string> = {
  Page: '页面',
  Container: '容器',
  Card: '卡片',
  Text: '文本',
  Button: '按钮',
  Table: '表格',
  TableColumn: '表格列',
  Form: '表单',
  FormItem: '表单项',
};

export interface NormalizeAiGeneratedComponentsResult {
  components: LowcodeComponentSchema[];
  warnings: string[];
}

export function normalizeAiGeneratedComponents(
  value: unknown,
  options: NormalizeAiGeneratedComponentsOptions = {},
): NormalizeAiGeneratedComponentsResult {
  const warnings: string[] = [];
  const rawComponents = readComponentArray(value);
  const roots = rawComponents.length > 0 ? rawComponents : [createDefaultPage(options.pageTitle)];

  const hasPageRoot = roots.some((component) => isRecord(component) && component.name === 'Page');
  const normalizedRoots = options.fragment || hasPageRoot
    ? roots
    : [{
        ...createDefaultPage(options.pageTitle),
        children: roots,
      }];

  const state: NormalizeState = {
    nextId: 1,
    usedIds: new Set<number>(),
    warnings,
  };

  const components = normalizedRoots
    .map((component) => normalizeNode(component, undefined, state))
    .filter((component): component is LowcodeComponentSchema => Boolean(component));

  if (!options.fragment && !components.some((component) => component.name === 'Page')) {
    components.unshift(normalizeNode(createDefaultPage(options.pageTitle), undefined, state) as LowcodeComponentSchema);
  }

  return {
    components,
    warnings,
  };
}

function readComponentArray(value: unknown) {
  if (Array.isArray(value)) return value;

  if (isRecord(value)) {
    if (Array.isArray(value.components)) return value.components;
    if (Array.isArray(value.children)) return value.children;
  }

  return [];
}

function normalizeNode(value: unknown, parentId: number | undefined, state: NormalizeState): LowcodeComponentSchema | null {
  if (!isRecord(value)) {
    state.warnings.push('已忽略非对象组件节点');
    return null;
  }

  const name = typeof value.name === 'string' && value.name.trim() ? value.name.trim() : 'Container';
  const id = allocateId(value.id, state);
  const props = isRecord(value.props) ? cloneRecord(value.props) : {};
  const styles = isRecord(value.styles) ? cloneRecord(value.styles) : undefined;
  const desc = typeof value.desc === 'string' ? value.desc : DEFAULT_COMPONENT_DESC[name] || name;
  const children = Array.isArray(value.children)
    ? value.children
        .map((child) => normalizeNode(child, id, state))
        .filter((child): child is LowcodeComponentSchema => Boolean(child))
    : undefined;

  const component: LowcodeComponentSchema = {
    id,
    name,
    props,
    desc,
  };

  if (styles) {
    component.styles = styles;
  }

  if (parentId !== undefined) {
    component.parentId = parentId;
  }

  if (children && children.length > 0) {
    component.children = children;
  }

  return component;
}

function allocateId(value: unknown, state: NormalizeState) {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0 && !state.usedIds.has(value)) {
    state.usedIds.add(value);
    state.nextId = Math.max(state.nextId, Math.floor(value) + 1);
    return Math.floor(value);
  }

  while (state.usedIds.has(state.nextId)) {
    state.nextId += 1;
  }

  const id = state.nextId;
  state.usedIds.add(id);
  state.nextId += 1;
  return id;
}

function createDefaultPage(title?: string): LowcodeComponentSchema {
  return {
    id: 1,
    name: 'Page',
    props: title ? { title } : {},
    desc: '页面',
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function cloneRecord(value: Record<string, unknown>) {
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}
