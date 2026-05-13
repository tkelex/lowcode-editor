import { CSSProperties } from 'react';
import { create, StateCreator } from 'zustand';
import { persist } from 'zustand/middleware';
import { migratePageSchema } from '../../../packages/lowcode-schema/src';
import {
  cloneComponentWithFreshIds,
  cloneComponents,
  createComponentIdFactory,
  getComponentById,
  getCopyDesc,
  getParentInfo,
  isComponentLocked,
  isDescendantComponent,
  isSameComponentTree,
  MAX_HISTORY_COUNT,
  normalizeInsertIndex,
  removeComponentById,
  setComponentParentIds,
} from './component-tree';

export interface Component {
  id: number;
  name: string;
  props: any;
  styles?: CSSProperties;
  desc: string;
  children?: Component[];
  parentId?: number;
}

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
  toggleComponentHidden: (componentId: number) => void;
  toggleComponentLocked: (componentId: number) => void;
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

function migrateComponents(components: unknown) {
  return migratePageSchema({ components }).components as Component[];
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
        if (!parentComponent || isComponentLocked(parentComponent)) return state;

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
      const component = getComponentById(componentId, nextComponents);
      if (isComponentLocked(component)) return state;

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

      if (isComponentLocked(component) || isComponentLocked(parentComponent)) {
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

      if (isComponentLocked(component) || isComponentLocked(parentComponent)) {
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
      if (isComponentLocked(info.component)) return state;

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
      if (isComponentLocked(info.component)) return state;

      const siblingNames = new Set(info.siblings.map((component) => component.desc));
      const nextDesc = createUniqueCopyDesc(info.component.desc, siblingNames);
      const nextComponent = cloneComponentWithFreshIds(
        info.component,
        createComponentIdFactory(nextComponents),
        info.parent.id,
        nextDesc,
      );
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
      if (isComponentLocked(component)) return state;

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
      if (isComponentLocked(info.component)) return state;

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
  toggleComponentHidden: (componentId) => {
    if (!componentId || componentId === 1) return;

    set((state) => {
      const nextComponents = cloneComponents(state.components);
      const component = getComponentById(componentId, nextComponents);
      if (!component) return state;

      component.props = {
        ...(component.props || {}),
        hidden: !component.props?.hidden,
      };

      return {
        ...pushHistory(state, nextComponents),
        curComponentId: state.curComponentId === componentId && component.props.hidden ? null : state.curComponentId,
        curComponent: state.curComponentId === componentId
          ? (component.props.hidden ? null : component)
          : state.curComponent,
      };
    });
  },
  toggleComponentLocked: (componentId) => {
    if (!componentId || componentId === 1) return;

    set((state) => {
      const nextComponents = cloneComponents(state.components);
      const component = getComponentById(componentId, nextComponents);
      if (!component) return state;

      component.props = {
        ...(component.props || {}),
        locked: !component.props?.locked,
      };

      return {
        ...pushHistory(state, nextComponents),
        curComponentId: state.curComponentId === componentId && component.props.locked ? null : state.curComponentId,
        curComponent: state.curComponentId === componentId
          ? (component.props.locked ? null : component)
          : state.curComponent,
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

      const nextStyles = replace ? { ...styles } : { ...component.styles, ...styles };
      Object.keys(nextStyles).forEach((key) => {
        if (nextStyles[key as keyof CSSProperties] === undefined) {
          delete nextStyles[key as keyof CSSProperties];
        }
      });
      component.styles = nextStyles;

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

function createUniqueCopyDesc(desc: string, siblingNames: Set<string>) {
  const baseDesc = getCopyDesc(desc);
  if (!siblingNames.has(baseDesc)) {
    return baseDesc;
  }

  let index = 2;
  while (siblingNames.has(`${baseDesc} ${index}`)) {
    index += 1;
  }

  return `${baseDesc} ${index}`;
}

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

export { getComponentById } from './component-tree';
