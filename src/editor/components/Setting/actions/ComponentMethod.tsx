import { useEffect, useState } from "react";
import { Component, getComponentById, useComponetsStore } from "../../../stores/components";
import { Input, Select, TreeSelect } from "antd";
import { useComponentConfigStore } from "../../../registry/component-config";
import { shallow } from 'zustand/shallow';
import { formatJson } from "./utils";

export interface ComponentMethodConfig {
    actionType: 'componentAction',
    componentId: number,
    args: {
        method: string
        params?: any[]
    }
}

export interface ComponentMethodProps {
    value?: {
        componentId: number,
        method: string
        params?: any[]
    }
    onChange?: (config?: ComponentMethodConfig) => void
}

export function ComponentMethod(props: ComponentMethodProps) {

    const { value, onChange} = props;
    const { components, curComponentId } = useComponetsStore((state) => ({
        components: state.components,
        curComponentId: state.curComponentId,
    }), shallow);
    const { componentConfig } = useComponentConfigStore();
    const [selectedComponent, setSelectedComponent] = useState<Component | null>();

    const [curId, setCurId] = useState<number>();
    const [curMethod, setCurMethod] = useState<string>();
    const [paramsText, setParamsText] = useState<string>('[]');

    useEffect(() => {
        if(value) {
            setCurId(value.componentId)
            setCurMethod(value.method)
            setParamsText(formatJson(value.params || []))

            setSelectedComponent(getComponentById(value.componentId, components))
        } else {
            setCurId(undefined);
            setCurMethod(undefined);
            setParamsText('[]');
            setSelectedComponent(undefined);
        }
    }, [value, components]);

    function componentChange(value: number) {
        if (!curComponentId) return;
        const nextComponent = getComponentById(value, components);
        const methods = componentConfig[nextComponent?.name || '']?.methods || [];
        const nextMethod = methods.some((method) => method.name === curMethod) ? curMethod : undefined;
    
        setCurId(value);
        setSelectedComponent(nextComponent)
        setCurMethod(nextMethod);

        if (nextMethod) {
            emit(value, nextMethod, paramsText);
        } else {
            onChange?.(undefined);
        }
    }

    function componentMethodChange(value: string) {
        if (!curComponentId || !selectedComponent) return;

        setCurMethod(value);
        emit(selectedComponent.id, value, paramsText);
    }

    function parseParams(value: string) {
        try {
            const result = JSON.parse(value || '[]');
            return Array.isArray(result) ? result : [];
        } catch (error) {
            return [];
        }
    }

    function emit(componentId: number, method = curMethod, params = paramsText) {
        if (!method) return;

        onChange?.({
            actionType: 'componentAction',
            componentId,
            args: {
                method,
                params: parseParams(params),
            }
        })
    }

    return <div className='mt-[24px] space-y-[16px]'>
        <div>
            <div className="mb-[8px] text-[13px] font-medium text-[#1f2937]">目标组件</div>
                <TreeSelect
                    className="w-full"
                    treeData={components}
                    fieldNames={{
                        label: 'name',
                        value: 'id',
                    }}
                    placeholder="请选择要调用方法的组件"
                    value={curId}
                    onChange={(value) => { componentChange(value) }}
                />
        </div>
        {componentConfig[selectedComponent?.name || ''] && (
            <div>
                <div className="mb-[8px] text-[13px] font-medium text-[#1f2937]">组件方法</div>
                    <Select
                        className="w-full"
                        placeholder="请选择要执行的方法"
                        options={componentConfig[selectedComponent?.name || ''].methods?.map(
                            method => ({ label: method.label, value: method.name })
                        )}
                        value={curMethod}
                        onChange={(value) => { componentMethodChange(value) }}
                    />
            </div>
        )}
        {selectedComponent && curMethod && (
            <div>
                <div className="mb-[8px] text-[13px] font-medium text-[#1f2937]">方法参数 JSON 数组</div>
                <Input.TextArea
                    autoSize={{ minRows: 3, maxRows: 6 }}
                    value={paramsText}
                    onChange={(event) => {
                        setParamsText(event.target.value);
                        emit(selectedComponent.id, curMethod, event.target.value);
                    }}
                />
            </div>
        )}
    </div>
}
