import React, { useEffect, useRef, useState } from "react";
import { message } from "antd";
import { createEventData } from "../../events/createEventData";
import { getLowcodeEventName, getReactEventProp } from "../../events/eventNames";
import { getComponentEventConfig } from "../../events/normalize";
import { runLowcodeActions } from "../../events/runtime";
import { useComponentConfigStore } from "../../registry/component-config";
import { Component, useComponetsStore } from "../../stores/components"
import { getStoredToken } from "../../../shared/api/auth";
import {
    formatRuntimeErrorMessage,
    formatRuntimeErrorStack,
    useRuntimeLogsStore,
} from "../../stores/runtime-logs";

interface PreviewProps {
    components?: Component[];
    allowCustomJS?: boolean;
}

interface PreviewComponentBoundaryProps {
    component: Component;
    children: React.ReactNode;
    [metadataProp: string]: unknown;
}

interface PreviewComponentBoundaryState {
    error?: Error;
}

class PreviewComponentBoundary extends React.Component<PreviewComponentBoundaryProps, PreviewComponentBoundaryState> {
    state: PreviewComponentBoundaryState = {};

    static getDerivedStateFromError(error: Error) {
        return { error };
    }

    componentDidCatch(error: Error) {
        useRuntimeLogsStore.getState().addLog({
            level: 'error',
            source: 'render',
            title: '组件渲染失败',
            message: formatRuntimeErrorMessage(error),
            stack: formatRuntimeErrorStack(error),
            componentId: this.props.component.id,
            componentName: this.props.component.name,
            componentDesc: this.props.component.desc,
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

export function Preview({ components: propsComponents, allowCustomJS = true }: PreviewProps) {
    const storeComponents = useComponetsStore((state) => state.components);
    const updateStoreComponentProps = useComponetsStore((state) => state.updateComponentProps);
    const updateStoreComponentStyles = useComponetsStore((state) => state.updateComponentStyles);
    const [runtimeComponents, setRuntimeComponents] = useState<Component[]>(() => cloneComponents(propsComponents || []));
    const usingExternalComponents = propsComponents !== undefined;
    const components = usingExternalComponents ? runtimeComponents : storeComponents;
    const { componentConfig } = useComponentConfigStore();

    const componentRefs = useRef<Record<string, any>>({});

    useEffect(() => {
        if (propsComponents) {
            setRuntimeComponents(cloneComponents(propsComponents));
        }
    }, [propsComponents]);

    function updateRuntimeComponentProps(componentId: number, props: Record<string, any>) {
        setRuntimeComponents((currentComponents) => updateComponents(currentComponents, componentId, (component) => {
            component.props = { ...(component.props || {}), ...props };
            Object.keys(props).forEach((key) => {
                if (props[key] === undefined) {
                    delete component.props[key];
                }
            });
        }));
    }

    function updateRuntimeComponentStyles(componentId: number, styles: Record<string, any>) {
        setRuntimeComponents((currentComponents) => updateComponents(currentComponents, componentId, (component) => {
            component.styles = { ...component.styles, ...styles };
        }));
    }

    function handleEvent(component: Component) {
        const props: Record<string, any> = {};
        const config = componentConfig[component.name];

        if (!config) {
            return props;
        }

        config.events?.forEach((event) => {
            const eventConfig = getComponentEventConfig(component, event.name);
            const actions = eventConfig?.actions || [];

            if (actions.length > 0) {
                props[getReactEventProp(event)] = (...args: any[]) => {
                    void runLowcodeActions(actions, {
                        component,
                        eventName: getLowcodeEventName(event.name),
                        eventData: createEventData(args, getLowcodeEventName(event.name)),
                        args,
                        components,
                        componentRefs: componentRefs.current,
                        allowCustomJS,
                        updateComponentProps: usingExternalComponents ? updateRuntimeComponentProps : updateStoreComponentProps,
                        updateComponentStyles: usingExternalComponents ? updateRuntimeComponentStyles : updateStoreComponentStyles,
                        getAuthToken: () => getStoredToken() || undefined,
                    }).catch(() => {
                        message.error('事件动作执行失败');
                    });
                };
            }
        })
        return props;
    }

    function renderComponents(components: Component[]): React.ReactNode {
        return components.map((component: Component) => {
            const config = componentConfig?.[component.name]

            if (!config?.prod) {
                return <div key={component.id} className="m-2 border border-red-300 bg-red-50 p-2 text-red-600">
                    未找到 {component.name} 的预览组件
                </div>;
            }
            const declaredEventProps = new Set(config.events?.map(getReactEventProp) || []);
            const componentProps = Object.fromEntries(
                Object.entries(component.props || {}).filter(([key]) => {
                    return key !== 'onEvent' && !declaredEventProps.has(key);
                })
            );

            const canRenderChildren = Boolean(config.acceptsChildren);
            const children = canRenderChildren ? renderComponents(component.children || []) : null;
            const props = {
                key: component.id,
                id: component.id,
                name: component.name,
                styles: component.styles,
                ref: (ref: Record<string, any>) => { componentRefs.current[component.id] = ref; },
                ...config.defaultProps,
                ...componentProps,
                ...handleEvent(component)
            };

            const element = canRenderChildren && component.children?.length
                ? React.createElement(config.prod, props, children)
                : React.createElement(config.prod, props);
            const { ref: _componentRef, key: _key, ...boundaryMetadataProps } = props;

            return <PreviewComponentBoundary key={component.id} component={component} {...boundaryMetadataProps}>
                {element}
            </PreviewComponentBoundary>;
        })
    }

    return <div className="h-full bg-slate-50">
        {renderComponents(components)}
    </div>
}

function cloneComponents(components: Component[]) {
    return JSON.parse(JSON.stringify(components)) as Component[];
}

function updateComponents(components: Component[], componentId: number, update: (component: Component) => void) {
    const nextComponents = cloneComponents(components);
    const component = getRuntimeComponentById(componentId, nextComponents);

    if (!component) {
        return components;
    }

    update(component);
    return nextComponents;
}

function getRuntimeComponentById(componentId: number, components: Component[]): Component | null {
    for (const component of components) {
        if (component.id === componentId) {
            return component;
        }

        if (component.children) {
            const result = getRuntimeComponentById(componentId, component.children);
            if (result) {
                return result;
            }
        }
    }

    return null;
}
