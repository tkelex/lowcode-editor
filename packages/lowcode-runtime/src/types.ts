import type { ComponentType, CSSProperties, PropsWithChildren } from 'react';
import type { LowcodeComponentSchema } from '@lowcode/schema';

export interface RuntimeComponent extends Omit<LowcodeComponentSchema, 'props' | 'styles' | 'children'> {
  props: Record<string, any>;
  styles?: CSSProperties;
  children?: RuntimeComponent[];
}

export interface CommonComponentProps extends PropsWithChildren {
  id: number;
  name: string;
  styles?: CSSProperties;
  [key: string]: any;
}

export interface RuntimeComponentDefinition {
  component: ComponentType<any>;
  acceptsChildren?: boolean;
}

export type RuntimeComponentRegistry = Record<string, RuntimeComponentDefinition>;

export interface RuntimeErrorContext {
  source: 'render' | 'event' | 'data-source';
  component?: RuntimeComponent;
  eventName?: string;
  actionType?: string;
}

export interface RuntimePolicy {
  apiBaseUrl?: string;
  allowedOrigins?: string[];
  getAuthToken?: () => string | undefined;
  allowCustomJS?: boolean;
  onError?: (error: unknown, context: RuntimeErrorContext) => void;
}
