import type { Component } from './editor-store';

export const MAX_HISTORY_COUNT = 50;

export function cloneComponents(components: Component[]) {
  return JSON.parse(JSON.stringify(components)) as Component[];
}

export function isSameComponentTree(left: Component[], right: Component[]) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function removeComponentById(components: Component[], componentId: number): Component | null {
  for (let index = 0; index < components.length; index++) {
    const component = components[index];

    if (component.id === componentId) {
      components.splice(index, 1);
      return component;
    }

    if (component.children) {
      const removed = removeComponentById(component.children, componentId);
      if (removed) {
        return removed;
      }
    }
  }

  return null;
}

export function getComponentById(
  id: number | null,
  components: Component[],
): Component | null {
  if (!id) return null;

  for (const component of components) {
    if (component.id === id) return component;
    if (component.children && component.children.length > 0) {
      const result = getComponentById(id, component.children);
      if (result !== null) return result;
    }
  }
  return null;
}

export function updateComponentById(
  components: Component[],
  componentId: number,
  updater: (component: Component) => Component,
): Component[] {
  let changed = false;
  const nextComponents = components.map((component) => {
    if (component.id === componentId) {
      const nextComponent = updater(component);
      changed = changed || nextComponent !== component;
      return nextComponent;
    }

    if (component.children?.length) {
      const nextChildren = updateComponentById(component.children, componentId, updater);
      if (nextChildren !== component.children) {
        changed = true;
        return { ...component, children: nextChildren };
      }
    }

    return component;
  });

  return changed ? nextComponents : components;
}

export function getParentInfo(
  componentId: number,
  components: Component[],
  parent: Component | null = null,
): { component: Component; parent: Component | null; siblings: Component[]; index: number } | null {
  for (let index = 0; index < components.length; index++) {
    const component = components[index];

    if (component.id === componentId) {
      return {
        component,
        parent,
        siblings: components,
        index,
      };
    }

    if (component.children) {
      const result = getParentInfo(componentId, component.children, component);
      if (result) {
        return result;
      }
    }
  }

  return null;
}

export function isDescendantComponent(components: Component[], ancestorId: number, componentId: number) {
  const ancestor = getComponentById(ancestorId, components);
  if (!ancestor?.children) return false;

  return Boolean(getComponentById(componentId, ancestor.children));
}

export function moveComponentInTree(
  components: Component[],
  componentId: number,
  parentId: number,
  index?: number,
): { components: Component[]; component: Component | null } {
  if (componentId === parentId || componentId === 1 || isDescendantComponent(components, componentId, parentId)) {
    return { components, component: null };
  }

  const originalInfo = getParentInfo(componentId, components);
  const parentComponent = getComponentById(parentId, components);
  if (
    !originalInfo?.component
    || !parentComponent
    || isComponentLocked(originalInfo.component)
    || isComponentLocked(parentComponent)
  ) {
    return { components, component: null };
  }

  const removed = removeComponentImmutable(components, componentId);
  if (!removed.component) {
    return { components, component: null };
  }

  const nextIndex = originalInfo.parent?.id === parentId && index !== undefined && index > originalInfo.index
    ? index - 1
    : index;
  const movedComponent = { ...removed.component, parentId };
  const nextComponents = updateComponentById(removed.components, parentId, (parent) => {
    const nextChildren = [...(parent.children || [])];
    nextChildren.splice(normalizeInsertIndex(nextIndex, nextChildren.length), 0, movedComponent);
    return { ...parent, children: nextChildren };
  });

  if (nextComponents === removed.components) {
    return { components, component: null };
  }
  return { components: nextComponents, component: movedComponent };
}

export function normalizeInsertIndex(index: number | undefined, length: number) {
  if (index === undefined) return length;
  return Math.max(0, Math.min(index, length));
}

function removeComponentImmutable(
  components: Component[],
  componentId: number,
): { components: Component[]; component: Component | null } {
  for (let index = 0; index < components.length; index += 1) {
    const component = components[index];
    if (component.id === componentId) {
      return {
        components: [...components.slice(0, index), ...components.slice(index + 1)],
        component,
      };
    }

    if (component.children?.length) {
      const removed = removeComponentImmutable(component.children, componentId);
      if (removed.component) {
        const nextComponents = [...components];
        nextComponents[index] = { ...component, children: removed.components };
        return { components: nextComponents, component: removed.component };
      }
    }
  }

  return { components, component: null };
}

export function setComponentParentIds(component: Component, parentId?: number) {
  if (parentId) {
    component.parentId = parentId;
  } else {
    delete component.parentId;
  }

  component.children?.forEach((child) => setComponentParentIds(child, component.id));
}

export function getMaxComponentId(components: Component[]): number {
  return components.reduce((maxId, component) => {
    return Math.max(maxId, component.id, getMaxComponentId(component.children || []));
  }, 0);
}

export function isComponentLocked(component: Component | null | undefined) {
  return Boolean(component?.props?.locked);
}

export function createComponentIdFactory(components: Component[]) {
  let currentId = Math.max(Date.now(), getMaxComponentId(components));

  return () => {
    currentId += 1;
    return currentId;
  };
}

export function cloneComponentWithFreshIds(
  component: Component,
  nextId: () => number,
  parentId?: number,
  rootDesc?: string,
) {
  let offset = 0;

  const clone = (current: Component, nextParentId?: number): Component => {
    offset += 1;
    const nextComponent: Component = {
      ...cloneComponents([current])[0],
      id: nextId(),
      desc: offset === 1 ? (rootDesc || getCopyDesc(current.desc)) : current.desc,
      parentId: nextParentId,
    };

    if (!nextParentId) {
      delete nextComponent.parentId;
    }

    nextComponent.children = current.children?.map((child) => clone(child, nextComponent.id));
    return nextComponent;
  };

  return clone(component, parentId);
}

export function getCopyDesc(desc: string) {
  const normalizedDesc = desc.trim().replace(/\s*副本(?:\s*\d+)?$/, '');
  return `${normalizedDesc || '未命名组件'} 副本`;
}
