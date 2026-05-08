export interface LowcodeComponentSchema {
  id: number;
  name: string;
  props: Record<string, unknown>;
  styles?: Record<string, unknown>;
  desc: string;
  children?: LowcodeComponentSchema[];
  parentId?: number;
}

export interface LowcodePageSchema {
  schemaVersion: string;
  pageId?: number | null;
  components: LowcodeComponentSchema[];
  metadata?: Record<string, unknown>;
}

export interface LowcodeComponentConfig {
  name: string;
  acceptsChildren?: string[] | true;
}

export type LowcodeComponentConfigMap = Record<string, LowcodeComponentConfig>;

export interface ComponentTreeValidationResult {
  valid: boolean;
  errors: string[];
  components?: LowcodeComponentSchema[];
}

export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type ActionType =
  | 'toast'
  | 'url'
  | 'custom'
  | 'componentAction'
  | 'confirm'
  | 'condition'
  | 'http'
  | 'componentControl'
  | 'setComponentProps'
  | 'setComponentStyles';
export type EventCategory = 'ui' | 'value' | 'submit' | 'overlay' | 'lifecycle';
export type HttpAuthType = 'none' | 'currentUser' | 'bearer';
export type ComponentControlOperation =
  | 'show'
  | 'hide'
  | 'enable'
  | 'disable'
  | 'setValue'
  | 'clearValue'
  | 'open'
  | 'close'
  | 'submit'
  | 'reset';

export interface LowcodeActionBase {
  id?: string;
  actionType: ActionType;
  args?: Record<string, unknown>;
  preventDefault?: boolean;
  stopPropagation?: boolean;
  disabled?: boolean;
}

export interface ToastAction extends LowcodeActionBase {
  actionType: 'toast';
  args: {
    msgType: ToastType;
    msg: string;
  };
}

export interface UrlAction extends LowcodeActionBase {
  actionType: 'url';
  args: {
    url: string;
    blank?: boolean;
  };
}

export interface CustomAction extends LowcodeActionBase {
  actionType: 'custom';
  args: {
    script: string;
  };
}

export interface ComponentAction extends LowcodeActionBase {
  actionType: 'componentAction';
  componentId: number;
  args: {
    method: string;
    params?: unknown[];
  };
}

export interface ConfirmAction extends LowcodeActionBase {
  actionType: 'confirm';
  args: {
    title: string;
    content?: string;
    actions?: LowcodeAction[];
    cancelActions?: LowcodeAction[];
    continueOnCancel?: boolean;
  };
}

export interface ConditionAction extends LowcodeActionBase {
  actionType: 'condition';
  args: {
    expression: string;
    trueActions?: LowcodeAction[];
    falseActions?: LowcodeAction[];
  };
}

export interface HttpAction extends LowcodeActionBase {
  actionType: 'http';
  args: {
    url: string;
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    auth?: HttpAuthType;
    bearerToken?: string;
    headers?: Record<string, string>;
    body?: unknown;
    responseKey?: string;
    errorKey?: string;
    successMsg?: string;
    errorMsg?: string;
  };
}

export interface ComponentControlAction extends LowcodeActionBase {
  actionType: 'componentControl';
  componentId: number;
  args: {
    operation: ComponentControlOperation;
    value?: unknown;
    valueProp?: string;
  };
}

export interface SetComponentPropsAction extends LowcodeActionBase {
  actionType: 'setComponentProps';
  componentId: number;
  args: {
    props: Record<string, unknown>;
  };
}

export interface SetComponentStylesAction extends LowcodeActionBase {
  actionType: 'setComponentStyles';
  componentId: number;
  args: {
    styles: Record<string, unknown>;
  };
}

export type LowcodeAction =
  | ToastAction
  | UrlAction
  | CustomAction
  | ComponentAction
  | ConfirmAction
  | ConditionAction
  | HttpAction
  | ComponentControlAction
  | SetComponentPropsAction
  | SetComponentStylesAction;

export interface LowcodeEventConfig {
  actions?: LowcodeAction[];
}

export type LowcodeEvents = Record<string, LowcodeEventConfig>;

export interface ComponentEventLike {
  name: string;
  propName?: string;
}
