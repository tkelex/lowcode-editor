import { create } from 'zustand';
import type { ComponentConfig } from './types';
export type {
  ComponentCategory,
  ComponentConfig,
  ComponentEvent,
  ComponentMethod,
  ComponentSetter,
  StyleSetterControl,
  StyleSetterUnit,
} from './types';
import { basicComponentConfigs } from './configs/basic';
import { dataComponentConfigs } from './configs/data';
import { feedbackComponentConfigs } from './configs/feedback';
import { formComponentConfigs } from './configs/form';
import { layoutComponentConfigs } from './configs/layout';

interface State {
    componentConfig: Record<string, ComponentConfig>;
}

interface Action {
    registerComponent: (name: string, componentConfig: ComponentConfig) => void
    replaceRemoteComponents: (
        componentConfig: Record<string, ComponentConfig>,
        acceptedChildrenByParent?: Record<string, string[]>,
    ) => void
}

const builtinComponentConfig: Record<string, ComponentConfig> = {
    ...layoutComponentConfigs,
    ...basicComponentConfigs,
    ...formComponentConfigs,
    ...dataComponentConfigs,
    ...feedbackComponentConfigs,
};

export const useComponentConfigStore = create<State & Action>((set) => ({
    componentConfig: { ...builtinComponentConfig },
    registerComponent: (name, componentConfig) => set((state) => {
        return {
            ...state,
            componentConfig: {
                ...state.componentConfig,
                [name]: componentConfig
            }
        }
    }),
    replaceRemoteComponents: (remoteComponentConfig, acceptedChildrenByParent = {}) => set({
        componentConfig: extendAcceptedChildren({
            ...remoteComponentConfig,
            ...builtinComponentConfig,
        }, acceptedChildrenByParent),
    }),
}));

function extendAcceptedChildren(
    componentConfig: Record<string, ComponentConfig>,
    acceptedChildrenByParent: Record<string, string[]>,
) {
    return Object.fromEntries(Object.entries(componentConfig).map(([name, config]) => {
        const remoteChildren = acceptedChildrenByParent[name] || [];
        if (remoteChildren.length === 0 || config.acceptsChildren === true) {
            return [name, config];
        }

        const builtinAcceptedChildren = Array.isArray(config.acceptsChildren)
            ? config.acceptsChildren
            : [];

        return [name, {
            ...config,
            acceptsChildren: [
                ...builtinAcceptedChildren,
                ...remoteChildren.filter((childName) => !builtinAcceptedChildren.includes(childName)),
            ],
        }];
    }));
}
