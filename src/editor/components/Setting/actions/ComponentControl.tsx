import { Input, Select, TreeSelect, Typography } from "antd";
import { useEffect, useMemo, useState } from "react";
import type { ComponentControlAction, ComponentControlOperation } from "../../../events/types";
import { Component, getComponentById, useComponetsStore } from "../../../stores/components";

export interface ComponentControlProps {
    value?: ComponentControlAction
    onChange?: (config?: ComponentControlAction) => void
}

const operationOptions: Array<{ label: string; value: ComponentControlOperation }> = [
    { label: '显示组件', value: 'show' },
    { label: '隐藏组件', value: 'hide' },
    { label: '启用组件', value: 'enable' },
    { label: '禁用组件', value: 'disable' },
    { label: '设置值', value: 'setValue' },
    { label: '清空值', value: 'clearValue' },
    { label: '打开弹窗', value: 'open' },
    { label: '关闭弹窗', value: 'close' },
    { label: '提交表单', value: 'submit' },
    { label: '重置表单', value: 'reset' },
];

const methodOperations = new Set<ComponentControlOperation>(['open', 'close', 'submit', 'reset']);
const valueOperations = new Set<ComponentControlOperation>(['setValue', 'clearValue']);

export function ComponentControl(props: ComponentControlProps) {
    const { value, onChange } = props;
    const components = useComponetsStore((state) => state.components);
    const [componentId, setComponentId] = useState<number>();
    const [selectedComponent, setSelectedComponent] = useState<Component | null>();
    const [operation, setOperation] = useState<ComponentControlOperation>('show');
    const [valueProp, setValueProp] = useState('value');
    const [valueText, setValueText] = useState('');

    useEffect(() => {
        setComponentId(value?.componentId);
        setSelectedComponent(value?.componentId ? getComponentById(value.componentId, components) : undefined);
        setOperation(value?.args.operation || 'show');
        setValueProp(value?.args.valueProp || 'value');
        setValueText(value?.args.value === undefined ? '' : String(value.args.value));
    }, [value, components]);

    const filteredOperationOptions = useMemo(() => {
        if (!selectedComponent) return operationOptions;

        if (selectedComponent.name === 'Modal' || selectedComponent.name === 'Drawer') {
            return operationOptions.filter((item) => !['submit', 'reset'].includes(item.value));
        }

        if (selectedComponent.name === 'Form') {
            return operationOptions.filter((item) => !['open', 'close'].includes(item.value));
        }

        return operationOptions.filter((item) => !methodOperations.has(item.value));
    }, [selectedComponent]);

    function emit(
        nextComponentId = componentId,
        nextOperation = operation,
        nextValueProp = valueProp,
        nextValueText = valueText,
    ) {
        if (!nextComponentId) {
            onChange?.(undefined);
            return;
        }

        onChange?.({
            actionType: 'componentControl',
            componentId: nextComponentId,
            args: {
                operation: nextOperation,
                valueProp: nextValueProp,
                value: parseValue(nextValueText),
            },
        });
    }

    return <div className="mt-[24px] space-y-[16px]">
        <div>
            <div className="mb-[8px] text-[13px] font-medium text-[#1f2937]">目标组件</div>
            <TreeSelect
                className="w-full"
                treeData={components}
                fieldNames={{ label: 'name', value: 'id' }}
                value={componentId}
                placeholder="请选择要联动的组件"
                onChange={(nextComponentId) => {
                    setComponentId(nextComponentId);
                    const nextComponent = getComponentById(nextComponentId, components);
                    setSelectedComponent(nextComponent);
                    emit(nextComponentId, operation, valueProp, valueText);
                }}
            />
        </div>
        {selectedComponent && (
            <div className="rounded-[6px] bg-[#f8fafc] px-[10px] py-[8px] text-[12px] text-[#64748b]">
                当前选择：{selectedComponent.desc} / {selectedComponent.name}
            </div>
        )}
        <div>
            <div className="mb-[8px] text-[13px] font-medium text-[#1f2937]">联动操作</div>
            <Select<ComponentControlOperation>
                className="w-full"
                value={operation}
                options={filteredOperationOptions}
                onChange={(nextOperation) => {
                    setOperation(nextOperation);
                    emit(componentId, nextOperation, valueProp, valueText);
                }}
            />
        </div>
        {valueOperations.has(operation) && (
            <>
                <div>
                    <div className="mb-[8px] text-[13px] font-medium text-[#1f2937]">值属性</div>
                    <Input value={valueProp} placeholder="例如 value、defaultValue、checked" onChange={(event) => {
                        setValueProp(event.target.value);
                        emit(componentId, operation, event.target.value, valueText);
                    }} />
                    <Typography.Text type="secondary" className="mt-[6px] block text-[12px]">
                        Input 常用 value/defaultValue，Switch 常用 checked。
                    </Typography.Text>
                </div>
                {operation === 'setValue' && (
                    <div>
                        <div className="mb-[8px] text-[13px] font-medium text-[#1f2937]">设置值</div>
                        <Input value={valueText} onChange={(event) => {
                            setValueText(event.target.value);
                            emit(componentId, operation, valueProp, event.target.value);
                        }} />
                    </div>
                )}
            </>
        )}
    </div>
}

function parseValue(value: string) {
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (value.trim() && Number.isFinite(Number(value))) return Number(value);
    return value;
}
