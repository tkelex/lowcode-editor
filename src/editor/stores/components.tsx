import { CSSProperties } from 'react';
import { create, StateCreator } from 'zustand';
import { persist } from 'zustand/middleware';
import { migratePageSchema } from '../../../packages/lowcode-schema/src';

export interface Component {
  id: number;
  name: string;
  props: any;
  styles?: CSSProperties;
  desc: string;
  children?: Component[];
  parentId?: number;
}

const MAX_HISTORY_COUNT = 50;

interface State {
  components: Component[];
  pastComponents: Component[][];
  futureComponents: Component[][];
  mode: 'edit' | 'preview';
  curComponentId?: number | null;
  curComponent: Component | null;
}

interface Action {
  addComponent: (component: Component, parentId?: number) => void;
  deleteComponent: (componentId: number) => void;
  moveComponent: (componentId: number, parentId: number) => void;
  moveComponentTo: (componentId: number, parentId: number, index?: number) => void;
  moveComponentSibling: (componentId: number, direction: -1 | 1) => void;
  duplicateComponent: (componentId: number) => void;
  renameComponent: (componentId: number, desc: string) => void;
  wrapComponent: (componentId: number, wrapperComponent: Component) => void;
  updateComponentProps: (componentId: number, props: any) => void;
  updateComponentStyles: (componentId: number, styles: CSSProperties, replace?: boolean) => void;
  setCurComponentId: (componentId: number | null) => void;
  setMode: (mode: State['mode']) => void;
  setComponents: (components: Component[], options?: { recordHistory?: boolean }) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

function cloneComponents(components: Component[]) {
  return JSON.parse(JSON.stringify(components)) as Component[];
}

function migrateComponents(components: unknown) {
  return migratePageSchema({ components }).components as Component[];
}

function isSameComponentTree(left: Component[], right: Component[]) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function pushHistory(state: State & Action, nextComponents: Component[]) {
  if (isSameComponentTree(state.components, nextComponents)) {
    return { components: nextComponents };
  }

  return {
    components: nextComponents,
    pastComponents: [...state.pastComponents, cloneComponents(state.components)].slice(-MAX_HISTORY_COUNT),
    futureComponents: [],
  };
}

function removeComponentById(components: Component[], componentId: number): Component | null {
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

function getParentInfo(
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

function isDescendantComponent(components: Component[], ancestorId: number, componentId: number) {
  const ancestor = getComponentById(ancestorId, components);
  if (!ancestor?.children) return false;

  return Boolean(getComponentById(componentId, ancestor.children));
}

function normalizeInsertIndex(index: number | undefined, length: number) {
  if (index === undefined) return length;
  return Math.max(0, Math.min(index, length));
}

function setComponentParentIds(component: Component, parentId?: number) {
  if (parentId) {
    component.parentId = parentId;
  } else {
    delete component.parentId;
  }

  component.children?.forEach((child) => setComponentParentIds(child, component.id));
}

function getMaxComponentId(components: Component[]): number {
  return components.reduce((maxId, component) => {
    return Math.max(maxId, component.id, getMaxComponentId(component.children || []));
  }, 0);
}

function createComponentIdFactory(components: Component[]) {
  let currentId = Math.max(Date.now(), getMaxComponentId(components));

  return () => {
    currentId += 1;
    return currentId;
  };
}

function cloneComponentWithFreshIds(component: Component, nextId: () => number, parentId?: number) {
  let offset = 0;

  const clone = (current: Component, nextParentId?: number): Component => {
    offset += 1;
    const nextComponent: Component = {
      ...cloneComponents([current])[0],
      id: nextId(),
      desc: offset === 1 ? `${current.desc}副本` : current.desc,
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

const creator: StateCreator<State & Action> = (set, get) => ({
  components: [
    {
      id: 1,
      name: 'Page',
      props: {},
      desc: '页面',
    },
  ],
  pastComponents: [],
  futureComponents: [],
  curComponentId: null,
  curComponent: null,
  mode: 'edit',
  setComponents: (components, options) => {
    set((state) => {
      const nextComponents = cloneComponents(migrateComponents(components));

      if (options?.recordHistory === false) {
        return {
          components: nextComponents,
          pastComponents: [],
          futureComponents: [],
          curComponentId: null,
          curComponent: null,
          mode: 'edit',
        };
      }

      return {
        ...pushHistory(state, nextComponents),
        curComponentId: null,
        curComponent: null,
        mode: 'edit',
      };
    });
  },
  setMode: (mode) => {
    set({ mode });
  },
  setCurComponentId: (componentId) => {
    set((state) => ({
      curComponentId: componentId,
      curComponent: getComponentById(componentId, state.components),
    }));
  },
  addComponent: (component, parentId) => {
    set((state) => {
      const nextComponents = cloneComponents(state.components);
      const nextComponent = cloneComponents([component])[0];

      if (parentId) {
        const parentComponent = getComponentById(parentId, nextComponents);
        if (!parentComponent) return state;

        nextComponent.parentId = parentId;
        parentComponent.children = [...(parentComponent.children || []), nextComponent];

        return pushHistory(state, nextComponents);
      }

      delete nextComponent.parentId;
      return pushHistory(state, [...nextComponents, nextComponent]);
    });
  },
  deleteComponent: (componentId) => {
    if (!componentId || componentId === 1) return;

    set((state) => {
      const nextComponents = cloneComponents(state.components);
      const removed = removeComponentById(nextComponents, componentId);
      if (!removed) return state;

      return {
        ...pushHistory(state, nextComponents),
        curComponentId: state.curComponentId === componentId ? null : state.curComponentId,
        curComponent: state.curComponentId === componentId ? null : state.curComponent,
      };
    });
  },
  moveComponent: (componentId, parentId) => {
    if (!componentId || !parentId || componentId === parentId || componentId === 1) return;

    set((state) => {
      const nextComponents = cloneComponents(state.components);
      if (isDescendantComponent(nextComponents, componentId, parentId)) {
        return state;
      }

      const component = removeComponentById(nextComponents, componentId);
      const parentComponent = getComponentById(parentId, nextComponents);

      if (!component || !parentComponent) {
        return state;
      }

      component.parentId = parentId;
      parentComponent.children = [...(parentComponent.children || []), component];

      return pushHistory(state, nextComponents);
    });
  },
  moveComponentTo: (componentId, parentId, index) => {
    if (!componentId || !parentId || componentId === parentId || componentId === 1) return;

    set((state) => {
      const nextComponents = cloneComponents(state.components);
      if (isDescendantComponent(nextComponents, componentId, parentId)) {
        return state;
      }

      const originalInfo = getParentInfo(componentId, nextComponents);
      const component = removeComponentById(nextComponents, componentId);
      const parentComponent = getComponentById(parentId, nextComponents);

      if (!component || !parentComponent) {
        return state;
      }

      const nextIndex = originalInfo?.parent?.id === parentId && index !== undefined && index > originalInfo.index
        ? index - 1
        : index;

      component.parentId = parentId;
      parentComponent.children = [...(parentComponent.children || [])];
      parentComponent.children.splice(normalizeInsertIndex(nextIndex, parentComponent.children.length), 0, component);
      setComponentParentIds(component, parentId);

      return {
        ...pushHistory(state, nextComponents),
        curComponent: state.curComponentId === componentId ? component : state.curComponent,
      };
    });
  },
  moveComponentSibling: (componentId, direction) => {
    if (!componentId || componentId === 1) return;

    set((state) => {
      const nextComponents = cloneComponents(state.components);
      const info = getParentInfo(componentId, nextComponents);
      if (!info?.parent) return state;

      const targetIndex = info.index + direction;
      if (targetIndex < 0 || targetIndex >= info.siblings.length) return state;

      const [component] = info.siblings.splice(info.index, 1);
      info.siblings.splice(targetIndex, 0, component);

      return {
        ...pushHistory(state, nextComponents),
        curComponent: state.curComponentId === componentId ? component : state.curComponent,
      };
    });
  },
  duplicateComponent: (componentId) => {
    if (!componentId || componentId === 1) return;

    set((state) => {
      const nextComponents = cloneComponents(state.components);
      const info = getParentInfo(componentId, nextComponents);
      if (!info?.parent) return state;

      const nextComponent = cloneComponentWithFreshIds(info.component, createComponentIdFactory(nextComponents), info.parent.id);
      info.siblings.splice(info.index + 1, 0, nextComponent);

      return {
        ...pushHistory(state, nextComponents),
        curComponentId: nextComponent.id,
        curComponent: nextComponent,
      };
    });
  },
  renameComponent: (componentId, desc) => {
    const nextDesc = desc.trim();
    if (!componentId || !nextDesc) return;

    set((state) => {
      const nextComponents = cloneComponents(state.components);
      const component = getComponentById(componentId, nextComponents);
      if (!component || component.desc === nextDesc) return state;

      component.desc = nextDesc;

      return {
        ...pushHistory(state, nextComponents),
        curComponent: state.curComponentId === componentId ? component : state.curComponent,
      };
    });
  },
  wrapComponent: (componentId, wrapperComponent) => {
    if (!componentId || componentId === 1) return;

    set((state) => {
      const nextComponents = cloneComponents(state.components);
      const info = getParentInfo(componentId, nextComponents);
      if (!info?.parent) return state;

      const [component] = info.siblings.splice(info.index, 1);
      const wrapper = cloneComponents([wrapperComponent])[0];
      wrapper.id = createComponentIdFactory([...nextComponents, component])();
      wrapper.parentId = info.parent.id;
      wrapper.children = [component];
      setComponentParentIds(component, wrapper.id);
      info.siblings.splice(info.index, 0, wrapper);

      return {
        ...pushHistory(state, nextComponents),
        curComponentId: wrapper.id,
        curComponent: wrapper,
      };
    });
  },
  updateComponentProps: (componentId, props) => {
    set((state) => {
      const nextComponents = cloneComponents(state.components);
      const component = getComponentById(componentId, nextComponents);
      if (!component) return state;

      component.props = { ...(component.props || {}), ...props };
      Object.keys(props).forEach((key) => {
        if (props[key] === undefined) {
          delete component.props[key];
        }
      });

      return {
        ...pushHistory(state, nextComponents),
        curComponent: state.curComponentId === componentId ? component : state.curComponent,
      };
    });
  },
  updateComponentStyles: (componentId, styles, replace) => {
    set((state) => {
      const nextComponents = cloneComponents(state.components);
      const component = getComponentById(componentId, nextComponents);
      if (!component) return state;

      component.styles = replace ? { ...styles } : { ...component.styles, ...styles };

      return {
        ...pushHistory(state, nextComponents),
        curComponent: state.curComponentId === componentId ? component : state.curComponent,
      };
    });
  },
  undo: () => {
    set((state) => {
      const previousComponents = state.pastComponents[state.pastComponents.length - 1];
      if (!previousComponents) return state;

      const nextComponents = cloneComponents(previousComponents);
      const nextCurComponent = getComponentById(state.curComponentId || null, nextComponents);

      return {
        components: nextComponents,
        pastComponents: state.pastComponents.slice(0, -1),
        futureComponents: [cloneComponents(state.components), ...state.futureComponents].slice(0, MAX_HISTORY_COUNT),
        curComponentId: nextCurComponent ? state.curComponentId : null,
        curComponent: nextCurComponent,
        mode: 'edit',
      };
    });
  },
  redo: () => {
    set((state) => {
      const nextHistoryComponents = state.futureComponents[0];
      if (!nextHistoryComponents) return state;

      const nextComponents = cloneComponents(nextHistoryComponents);
      const nextCurComponent = getComponentById(state.curComponentId || null, nextComponents);

      return {
        components: nextComponents,
        pastComponents: [...state.pastComponents, cloneComponents(state.components)].slice(-MAX_HISTORY_COUNT),
        futureComponents: state.futureComponents.slice(1),
        curComponentId: nextCurComponent ? state.curComponentId : null,
        curComponent: nextCurComponent,
        mode: 'edit',
      };
    });
  },
  canUndo: () => get().pastComponents.length > 0,
  canRedo: () => get().futureComponents.length > 0,
});

export const useComponetsStore = create<State & Action>()(persist(creator, {
  name: 'xxx',
  version: 1,
  migrate: (persistedState) => {
    if (!persistedState || typeof persistedState !== 'object' || Array.isArray(persistedState)) {
      return persistedState;
    }

    const state = persistedState as Partial<State>;

    return {
      ...state,
      components: migrateComponents(state.components),
      pastComponents: [],
      futureComponents: [],
      curComponentId: null,
      curComponent: null,
      mode: 'edit',
    };
  },
  partialize: (state) => ({
    components: state.components,
    mode: state.mode,
    curComponentId: state.curComponentId,
    curComponent: state.curComponent,
  }),
}));

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
