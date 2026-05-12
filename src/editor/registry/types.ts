import type { ActionType, EventCategory } from '../events/types';

export interface ComponentSetter {
  name: string;
  label: string;
  type: string;
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
