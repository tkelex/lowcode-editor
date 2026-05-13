import { Input, Select, TreeSelect, Typography } from "antd";
import { useEffect, useMemo, useState } from "react";
import type { ComponentControlAction, ComponentControlOperation } from "../../../events/types";
import { Component, getComponentById, useComponetsStore } from "../../../stores/components";

export interface ComponentControlProps {
    value?: ComponentControlAction
    onChange?: (config?: ComponentControlAction) => void
}

type ValueSource = 'fixed' | 'event' | 'expression';

const operationOptions: Array<{ label: string; value: ComponentControlOperation; description: string }> = [
    { label: '显示组件', value: 'show', description: '移除目标组件 display:none 样式' },
    { label: '隐藏组件', value: 'hide', description: '将目标组件 display 设置为 none' },
    { label: '启用组件', value: 'enable', description: '将目标组件 disabled 设置为 false' },
    { label: '禁用组件', value: 'disable', description: '将目标组件 disabled 设置为 true' },
    { label: '设置值', value: 'setValue', description: '向目标组件写入 value、checked 等属性' },
    { label: '清空值', value: 'clearValue', description: '清空目标组件常见值属性' },
    { label: '打开弹窗', value: 'open', description: '调用弹窗或抽屉的 open 方法' },
    { label: '关闭弹窗', value: 'close', description: '调用弹窗或抽屉的 close 方法' },
    { label: '提交表单', value: 'submit', description: '调用表单 submit 方法' },
    { label: '重置表单', value: 'reset', description: '调用表单 reset 方法' },
];

const methodOperations = new Set<ComponentControlOperation>(['open', 'close', 'submit', 'reset']);
const valueOperations = new Set<ComponentControlOperation>(['setValue', 'clearValue']);
const modalOperations = new Set<ComponentControlOperation>(['open', 'close']);
const formOperations = new Set<ComponentControlOperation>(['submit', 'reset']);

export function ComponentControl(props: ComponentControlProps) {
    const { value, onChange } = props;
    const components = useComponetsStore((state) => state.components);
    const [componentId, setComponentId] = useState<number>();
    const [selectedComponent, setSelectedComponent] = useState<Component | null>();
    const [operation, setOperation] = useState<ComponentControlOperation>('show');
    const [valueProp, setValueProp] = useState('value');
    const [valueText, setValueText] = useState('');
    const [valueSource, setValueSource] = useState<ValueSource>('fixed');

    useEffect(() => {
        setComponentId(value?.componentId);
        setSelectedComponent(value?.componentId ? getComponentById(value.componentId, components) : undefined);
        setOperation(value?.args.operation || 'show');
        setValueProp(value?.args.valueProp || 'value');
        setValueText(value?.args.value === undefined ? '' : String(value.args.value));
        setValueSource(inferValueSource(value?.args.value));
    }, [value, components]);

    const targetTreeData = useMemo(() => {
        return toTreeSelectData(components, operation);
    }, [components, operation]);

    const selectedOperation = operationOptions.find((item) => item.value === operation);

    function emit(
        nextComponentId = componentId,
        nextOperation = operation,
        nextValueProp = valueProp,
        nextValueText = valueText,
        nextValueSource = valueSource,
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
                value: valueOperations.has(nextOperation) ? parseValue(nextValueText, nextValueSource) : undefined,
            },
        });
    }

    function handleOperationChange(nextOperation: ComponentControlOperation) {
        const nextComponent = componentId ? getComponentById(componentId, components) : undefined;
        const nextComponentId = nextComponent && canUseOperation(nextComponent, nextOperation) ? componentId : undefined;

        setOperation(nextOperation);
        setComponentId(nextComponentId);
        setSelectedComponent(nextComponentId ? nextComponent : undefined);
        emit(nextComponentId, nextOperation, valueProp, valueText, valueSource);
    }

    return <div className="event-linkage-form">
        <div className="event-linkage-section">
            <div className="event-linkage-section-title">操作意图</div>
            <Select<ComponentControlOperation>
                className="w-full"
                value={operation}
                options={operationOptions.map((item) => ({ label: item.label, value: item.value }))}
                onChange={handleOperationChange}
            />
            {selectedOperation && (
                <Typography.Text type="secondary" className="mt-[6px] block text-[12px]">
                    {selectedOperation.description}
                </Typography.Text>
            )}
        </div>
        <div className="event-linkage-section">
            <div className="event-linkage-section-title">目标组件</div>
            <TreeSelect
                className="w-full"
                treeData={targetTreeData}
                value={componentId}
                placeholder="请选择要联动的组件"
                treeDefaultExpandAll
                onChange={(nextComponentId) => {
                    setComponentId(nextComponentId);
                    const nextComponent = getComponentById(nextComponentId, components);
                    setSelectedComponent(nextComponent);
                    emit(nextComponentId, operation, valueProp, valueText, valueSource);
                }}
            />
            {methodOperations.has(operation) && (
                <Typography.Text type="secondary" className="mt-[6px] block text-[12px]">
                    当前操作只展示支持该操作的目标组件。
                </Typography.Text>
            )}
        </div>
        {selectedComponent && (
            <div className="event-linkage-target">
                当前选择：{selectedComponent.desc} / {selectedComponent.name}
            </div>
        )}
        {valueOperations.has(operation) && (
            <>
                <div className="event-linkage-section">
                    <div className="event-linkage-section-title">值属性</div>
                    <Input value={valueProp} placeholder="例如 value、defaultValue、checked" onChange={(event) => {
                        setValueProp(event.target.value);
                        emit(componentId, operation, event.target.value, valueText, valueSource);
                    }} />
                    <Typography.Text type="secondary" className="mt-[6px] block text-[12px]">
                        Input 常用 value/defaultValue，Switch 常用 checked。
                    </Typography.Text>
                </div>
                {operation === 'setValue' && (
                    <>
                        <div className="event-linkage-section">
                            <div className="event-linkage-section-title">值来源</div>
                            <Select<ValueSource>
                                className="w-full"
                                value={valueSource}
                                options={[
                                    { label: '固定值', value: 'fixed' },
                                    { label: '事件数据', value: 'event' },
                                    { label: '表达式', value: 'expression' },
                                ]}
                                onChange={(nextSource) => {
                                    const nextValue = getDefaultValueText(nextSource, valueText);
                                    setValueSource(nextSource);
                                    setValueText(nextValue);
                                    emit(componentId, operation, valueProp, nextValue, nextSource);
                                }}
                            />
                        </div>
                        <div className="event-linkage-section">
                            <div className="event-linkage-section-title">{valueSource === 'event' ? '事件数据引用' : valueSource === 'expression' ? '表达式' : '设置值'}</div>
                            <Input value={valueText} placeholder={getValuePlaceholder(valueSource)} onChange={(event) => {
                                setValueText(event.target.value);
                                emit(componentId, operation, valueProp, event.target.value, valueSource);
                            }} />
                        </div>
                    </>
                )}
            </>
        )}
    </div>
}

function canUseOperation(component: Component, operation: ComponentControlOperation) {
    if (modalOperations.has(operation)) {
        return component.name === 'Modal' || component.name === 'Drawer';
    }

    if (formOperations.has(operation)) {
        return component.name === 'Form';
    }

    return component.name !== 'Page';
}

function toTreeSelectData(components: Component[], operation: ComponentControlOperation): any[] {
    return components
        .map((component) => {
            const children = component.children ? toTreeSelectData(component.children, operation) : [];
            const selectable = canUseOperation(component, operation);

            if (!selectable && children.length === 0) {
                return null;
            }

            return {
                title: `${component.desc} / ${component.name}`,
                value: component.id,
                selectable,
                disabled: !selectable,
                children,
            };
        })
        .filter(Boolean);
}

function parseValue(value: string, source: ValueSource) {
    if (source === 'event') return value || 'event.value';
    if (source === 'expression') return value ? `{{${value.replace(/^\{\{|\}\}$/g, '')}}}` : '';
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (value.trim() && Number.isFinite(Number(value))) return Number(value);
    return value;
}

function inferValueSource(value: unknown): ValueSource {
    if (typeof value === 'string' && value.startsWith('event.')) return 'event';
    if (typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) return 'expression';
    return 'fixed';
}

function getDefaultValueText(source: ValueSource, current: string) {
    if (source === 'event') return current.startsWith('event.') ? current : 'event.value';
    if (source === 'expression') return current.replace(/^\{\{|\}\}$/g, '') || 'event.value';
    return current.startsWith('event.') ? '' : current.replace(/^\{\{|\}\}$/g, '');
}

function getValuePlaceholder(source: ValueSource) {
    if (source === 'event') return '例如 event.value、event.checked、event.args';
    if (source === 'expression') return '例如 event.value || variables.defaultValue';
    return '例如文本、true、123';
}
