import type { LowcodeComponentSchema } from '../../../packages/lowcode-schema/src';

export type ComponentDiffType = 'added' | 'removed' | 'updated';

export interface ComponentDiffItem {
  type: ComponentDiffType;
  id: number;
  name: string;
  desc?: string;
  changes: string[];
}

export interface ComponentDiffSummary {
  added: ComponentDiffItem[];
  removed: ComponentDiffItem[];
  updated: ComponentDiffItem[];
}

export function diffComponentTrees(
  previousComponents: LowcodeComponentSchema[],
  nextComponents: LowcodeComponentSchema[],
): ComponentDiffSummary {
  const previousMap = flattenComponents(previousComponents);
  const nextMap = flattenComponents(nextComponents);
  const added: ComponentDiffItem[] = [];
  const removed: ComponentDiffItem[] = [];
  const updated: ComponentDiffItem[] = [];

  for (const [id, component] of nextMap) {
    const previous = previousMap.get(id);
    if (!previous) {
      added.push(toDiffItem('added', component, ['新增组件']));
      continue;
    }

    const changes = getComponentChanges(previous, component);
    if (changes.length > 0) {
      updated.push(toDiffItem('updated', component, changes));
    }
  }

  for (const [id, component] of previousMap) {
    if (!nextMap.has(id)) {
      removed.push(toDiffItem('removed', component, ['删除组件']));
    }
  }

  return {
    added: sortDiffItems(added),
    removed: sortDiffItems(removed),
    updated: sortDiffItems(updated),
  };
}

function flattenComponents(components: LowcodeComponentSchema[]) {
  const map = new Map<number, LowcodeComponentSchema>();

  function walk(componentList: LowcodeComponentSchema[]) {
    componentList.forEach((component) => {
      map.set(component.id, component);
      if (component.children?.length) {
        walk(component.children);
      }
    });
  }

  walk(components);
  return map;
}

function getComponentChanges(previous: LowcodeComponentSchema, next: LowcodeComponentSchema) {
  const changes: string[] = [];

  if (previous.name !== next.name) {
    changes.push(`类型：${previous.name} -> ${next.name}`);
  }
  if ((previous.desc || '') !== (next.desc || '')) {
    changes.push('描述变更');
  }
  if (previous.parentId !== next.parentId) {
    changes.push('父级位置变更');
  }
  if (stableStringify(previous.props || {}) !== stableStringify(next.props || {})) {
    changes.push('属性变更');
  }
  if (stableStringify(previous.styles || {}) !== stableStringify(next.styles || {})) {
    changes.push('样式变更');
  }
  if (getChildrenIds(previous).join(',') !== getChildrenIds(next).join(',')) {
    changes.push('子组件顺序变更');
  }

  return changes;
}

function getChildrenIds(component: LowcodeComponentSchema) {
  return component.children?.map((child) => child.id) ?? [];
}

function toDiffItem(type: ComponentDiffType, component: LowcodeComponentSchema, changes: string[]): ComponentDiffItem {
  return {
    type,
    id: component.id,
    name: component.name,
    desc: component.desc,
    changes,
  };
}

function sortDiffItems(items: ComponentDiffItem[]) {
  return [...items].sort((first, second) => first.id - second.id);
}

function stableStringify(value: unknown): string {
  return JSON.stringify(sortObject(value));
}

function sortObject(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortObject);
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  return Object.keys(value as Record<string, unknown>)
    .sort()
    .reduce<Record<string, unknown>>((result, key) => {
      result[key] = sortObject((value as Record<string, unknown>)[key]);
      return result;
    }, {});
}
