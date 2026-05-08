export type {
  ActionType,
  ComponentEventLike,
  ComponentControlAction,
  ComponentControlOperation,
  ComponentAction,
  ConditionAction,
  ConfirmAction,
  CustomAction,
  HttpAction,
  HttpAuthType,
  LowcodeAction,
  LowcodeEventConfig,
  LowcodeEvents,
  SetVariableAction,
  SetComponentPropsAction,
  SetComponentStylesAction,
  ToastAction,
  ToastType,
  EventCategory,
  UrlAction,
} from '../../../packages/lowcode-schema/src';

import type { Component } from '../stores/components';

export interface LowcodeEventRuntimeContext {
  component: Component;
  eventName: string;
  eventData: Record<string, any>;
  args: any[];
  components: Component[];
  componentRefs: Record<string, any>;
  allowCustomJS: boolean;
  variables?: Record<string, any>;
  setVariable?: (path: string, value: unknown) => void;
  updateComponentProps?: (componentId: number, props: Record<string, any>) => void;
  updateComponentStyles?: (componentId: number, styles: Record<string, any>) => void;
  getAuthToken?: () => string | undefined;
}
