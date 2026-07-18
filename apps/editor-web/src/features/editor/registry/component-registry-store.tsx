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
}

export const useComponentConfigStore = create<State & Action>((set) => ({
    componentConfig: {
        ...layoutComponentConfigs,
        ...basicComponentConfigs,
        ...formComponentConfigs,
        ...dataComponentConfigs,
        ...feedbackComponentConfigs,
    },
    registerComponent: (name, componentConfig) => set((state) => {
        return {
            ...state,
            componentConfig: {
                ...state.componentConfig,
                [name]: componentConfig
            }
        }
    })
}));
