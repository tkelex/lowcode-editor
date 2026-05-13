import type { ActionType, EventCategory } from '../events/types';

export type ComponentSetterGroup =
  | 'basic'
  | 'data'
  | 'mobile'
  | 'advanced'
  | 'layout'
  | 'size'
  | 'spacing'
  | 'typography'
  | 'background'
  | 'border'
  | 'effect'
  | 'display'
  | 'custom'
  | string;

export type StyleSetterUnit = 'px' | 'number' | 'text';

export type StyleSetterControl = 'input' | 'number' | 'select' | 'color';

export interface ComponentSetterOption {
  label: string;
  value: any;
}

export interface ComponentSetter {
  name: string;
  label: string;
  type: string;
  group?: ComponentSetterGroup;
  groupLabel?: string;
  keywords?: string[];
  unit?: StyleSetterUnit;
  control?: StyleSetterControl;
  help?: string;
  placeholder?: string;
  rows?: number;
  min?: number;
  max?: number;
  step?: number;
  mode?: 'json' | 'text' | 'url' | string;
  options?: ComponentSetterOption[];
  componentProps?: Record<string, any>;
  valuePropName?: string;
  validate?: 'json' | string;
  [key: string]: any;
}

export interface ComponentEvent {
  name: string
  label: string
  propName?: string
  category: EventCategory
  description?: string
  eventDataSchema?: string[]
  allowedActions: ActionType[]
}

export interface ComponentMethod {
  name: string
  label: string
}

export type ComponentCategory = 'layout' | 'basic' | 'form' | 'data' | 'feedback';

export interface ComponentConfig {
  name: string;
  defaultProps: Record<string, any>,
  desc: string;
  acceptsChildren?: string[] | true;
  category?: ComponentCategory;
  icon?: string;
  keywords?: string[];
  sort?: number;
  setter?: ComponentSetter[];
  stylesSetter?: ComponentSetter[];
  events?: ComponentEvent[];
  methods?: ComponentMethod[]
  dev: any;
  prod: any;
}
