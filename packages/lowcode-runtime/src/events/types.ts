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
} from '@lowcode/schema';

import type { RuntimeComponent } from '../types';

export interface LowcodeEventRuntimeContext {
  component: RuntimeComponent;
  eventName: string;
  eventData: Record<string, any>;
  args: any[];
  components: RuntimeComponent[];
  componentRefs: Record<string, any>;
  allowCustomJS: boolean;
  variables?: Record<string, any>;
  setVariable?: (path: string, value: unknown) => void;
  updateComponentProps?: (componentId: number, props: Record<string, any>) => void;
  updateComponentStyles?: (componentId: number, styles: Record<string, any>) => void;
  getAuthToken?: () => string | undefined;
}
