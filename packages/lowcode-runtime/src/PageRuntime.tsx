'use client';

import React, { useEffect, useRef, useState } from 'react';
import { message } from 'antd';
import { createEventData } from './events/createEventData';
import { getLowcodeEventName, getReactEventProp } from './events/eventNames';
import { getComponentEventConfig } from './events/normalize';
import { runLowcodeActions } from './events/runtime';
import { builtinRuntimeRegistry } from './registry';
import {
  parseRuntimeDataSources,
  parseRuntimeJsonObject,
  requestRuntimeDataSource,
  resolveRuntimeProps,
  setPathValue,
  type RuntimeDataSourceState,
} from './runtimeData';
import type {
  RuntimeComponent,
  RuntimeComponentRegistry,
  RuntimeErrorContext,
  RuntimePolicy,
} from './types';

export interface PageRuntimeProps {
  components: RuntimeComponent[];
  policy?: RuntimePolicy;
  registry?: RuntimeComponentRegistry;
}

interface RuntimeComponentBoundaryProps {
  component: RuntimeComponent;
  children: React.ReactNode;
  onError?: RuntimePolicy['onError'];
  [metadataProp: string]: unknown;
}

interface RuntimeComponentBoundaryState {
  error?: Error;
}

class RuntimeComponentBoundary extends React.Component<RuntimeComponentBoundaryProps, RuntimeComponentBoundaryState> {
  state: RuntimeComponentBoundaryState = {};

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    this.props.onError?.(error, {
      source: 'render',
      component: this.props.component,
    });
  }

  render() {
    if (this.state.error) {
      return <div className="m-2 rounded-[6px] border border-red-300 bg-red-50 p-3 text-[13px] text-red-600">
        {this.props.component.desc || this.props.component.name} 渲染失败：{this.state.error.message}
      </div>;
    }

    return this.props.children;
  }
}

export function PageRuntime({ components: sourceComponents, policy = {}, registry = builtinRuntimeRegistry }: PageRuntimeProps) {
  const [runtimeComponents, setRuntimeComponents] = useState<RuntimeComponent[]>(() => cloneComponents(sourceComponents));
  const [variables, setVariables] = useState<Record<string, any>>({});
  const [dataSourceState, setDataSourceState] = useState<RuntimeDataSourceState>({});
  const componentRefs = useRef<Record<string, any>>({});
  const components = runtimeComponents;

  useEffect(() => {
    setRuntimeComponents(cloneComponents(sourceComponents));
  }, [sourceComponents]);

  const pageProps = components[0]?.name === 'Page' ? components[0].props || {} : {};
  const dataSources = parseRuntimeDataSources(pageProps.dataSources);

  useEffect(() => {
    setVariables(parseRuntimeJsonObject(pageProps.variables));
  }, [pageProps.variables]);

  useEffect(() => {
    if (dataSources.length === 0) {
      setDataSourceState({});
      return;
    }

    let disposed = false;
    dataSources.forEach((dataSource) => {
      setDataSourceState((current) => ({
        ...current,
        [dataSource.id]: {
          loading: true,
          data: current[dataSource.id]?.data,
        },
      }));

      requestRuntimeDataSource(dataSource, {
        apiBaseUrl: policy.apiBaseUrl,
        allowedOrigins: policy.allowedOrigins,
        variables,
        dataSources: dataSourceState,
        getAuthToken: policy.getAuthToken,
      })
        .then((data) => {
          if (disposed) return;
          setDataSourceState((current) => ({
            ...current,
            [dataSource.id]: { loading: false, data },
          }));
        })
        .catch((error) => {
          if (disposed) return;
          setDataSourceState((current) => ({
            ...current,
            [dataSource.id]: {
              loading: false,
              data: current[dataSource.id]?.data,
              error: error instanceof Error ? error.message : '数据源请求失败',
            },
          }));
          reportError(error, { source: 'data-source' });
        });
    });

    return () => {
      disposed = true;
    };
  }, [pageProps.dataSources, variables]);

  function updateRuntimeComponentProps(componentId: number, props: Record<string, any>) {
    setRuntimeComponents((currentComponents) => updateComponents(currentComponents, componentId, (component) => {
      component.props = { ...(component.props || {}), ...props };
      Object.keys(props).forEach((key) => {
        if (props[key] === undefined) delete component.props[key];
      });
    }));
  }

  function updateRuntimeComponentStyles(componentId: number, styles: Record<string, any>) {
    setRuntimeComponents((currentComponents) => updateComponents(currentComponents, componentId, (component) => {
      component.styles = { ...component.styles, ...styles };
    }));
  }

  function setRuntimeVariable(path: string, value: unknown) {
    setVariables((currentVariables) => setPathValue(currentVariables, path, value));
  }

  function eventProps(component: RuntimeComponent) {
    const props: Record<string, any> = {};

    for (const eventName of getConfiguredEventNames(component)) {
      const eventConfig = getComponentEventConfig(component, eventName);
      const actions = eventConfig?.actions || [];
      if (actions.length === 0) continue;

      const reactEventProp = getReactEventProp(eventName);
      props[reactEventProp] = (...args: any[]) => {
        void runLowcodeActions(actions, {
          component,
          eventName: getLowcodeEventName(eventName),
          eventData: createEventData(args, getLowcodeEventName(eventName)),
          args,
          components,
          componentRefs: componentRefs.current,
          allowCustomJS: policy.allowCustomJS === true,
          variables,
          setVariable: setRuntimeVariable,
          updateComponentProps: updateRuntimeComponentProps,
          updateComponentStyles: updateRuntimeComponentStyles,
          getAuthToken: policy.getAuthToken,
        }, {
          apiBaseUrl: policy.apiBaseUrl,
          allowedOrigins: policy.allowedOrigins,
          onError: (error, runtimeContext, action) => reportError(error, {
            source: 'event',
            component,
            eventName: runtimeContext?.eventName,
            actionType: action?.actionType,
          }),
        }).catch(() => {
          message.error('事件动作执行失败');
        });
      };
    }

    return props;
  }

  function renderComponents(nodes: RuntimeComponent[]): React.ReactNode {
    return nodes.map((component) => {
      const definition = registry[component.name];
      if (component.id !== 1 && component.props?.hidden) return null;

      if (!definition) {
        return <div key={component.id} className="m-2 border border-red-300 bg-red-50 p-2 text-red-600">
          未找到 {component.name} 的运行时组件
        </div>;
      }

      const configuredEventProps = new Set(getConfiguredEventNames(component).map(getReactEventProp));
      const componentProps = Object.fromEntries(Object.entries(component.props || {}).filter(([key]) => {
        return key !== 'onEvent' && !configuredEventProps.has(key);
      }));
      const resolvedComponentProps = resolveRuntimeProps(componentProps, {
        variables,
        dataSources: dataSourceState,
        component,
      });
      const children = definition.acceptsChildren ? renderComponents(component.children || []) : null;
      const props: Record<string, any> = {
        key: component.id,
        id: component.id,
        name: component.name,
        styles: component.styles,
        ref: (ref: Record<string, any>) => { componentRefs.current[component.id] = ref; },
        ...resolvedComponentProps,
        ...getInternalRuntimeProps(component.name),
        ...eventProps(component),
      };
      const element = definition.acceptsChildren && component.children?.length
        ? React.createElement(definition.component, props, children)
        : React.createElement(definition.component, props);
      const { ref: _componentRef, key: _key, ...boundaryMetadataProps } = props;

      return <RuntimeComponentBoundary
        key={component.id}
        component={component}
        onError={policy.onError}
        {...boundaryMetadataProps}
      >
        {element}
      </RuntimeComponentBoundary>;
    });
  }

  function reportError(error: unknown, context: RuntimeErrorContext) {
    if (policy.onError) {
      policy.onError(error, context);
      return;
    }
    console.error(error);
  }

  function getInternalRuntimeProps(componentName: string) {
    if (componentName === 'Table') {
      return { runtimeVariables: variables, runtimeDataSources: dataSourceState };
    }
    return {};
  }

  return <div className="h-full bg-slate-50">{renderComponents(components)}</div>;
}

function getConfiguredEventNames(component: RuntimeComponent) {
  const names = new Set<string>();
  const onEvent = component.props?.onEvent;

  if (onEvent && typeof onEvent === 'object' && !Array.isArray(onEvent)) {
    Object.keys(onEvent).forEach((name) => names.add(name));
  }

  Object.entries(component.props || {}).forEach(([name, value]) => {
    if (name.startsWith('on') && value && typeof value === 'object' && Array.isArray((value as { actions?: unknown }).actions)) {
      names.add(name);
    }
  });

  return [...names];
}

function cloneComponents(components: RuntimeComponent[]) {
  return JSON.parse(JSON.stringify(components)) as RuntimeComponent[];
}

function updateComponents(components: RuntimeComponent[], componentId: number, update: (component: RuntimeComponent) => void) {
  const nextComponents = cloneComponents(components);
  const component = getRuntimeComponentById(componentId, nextComponents);
  if (!component) return components;
  update(component);
  return nextComponents;
}

function getRuntimeComponentById(componentId: number, components: RuntimeComponent[]): RuntimeComponent | null {
  for (const component of components) {
    if (component.id === componentId) return component;
    if (component.children) {
      const result = getRuntimeComponentById(componentId, component.children);
      if (result) return result;
    }
  }
  return null;
}
