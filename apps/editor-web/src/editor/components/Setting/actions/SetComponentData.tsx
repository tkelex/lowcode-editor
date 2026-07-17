import { Select, TreeSelect, Input } from "antd";
import { useEffect, useState } from "react";
import type { SetComponentPropsAction, SetComponentStylesAction } from "../../../events/types";
import { Component, getComponentById, useComponetsStore } from "../../../stores/components";
import { formatJson, parseJsonObject } from "./utils";

type SetDataAction = SetComponentPropsAction | SetComponentStylesAction;

export interface SetComponentDataProps {
    actionType: 'setComponentProps' | 'setComponentStyles'
    value?: SetDataAction
    onChange?: (config?: SetDataAction) => void
}

export function SetComponentData(props: SetComponentDataProps) {
    const { actionType, value, onChange } = props;
    const components = useComponetsStore((state) => state.components);
    const [selectedComponent, setSelectedComponent] = useState<Component | null>();
    const [componentId, setComponentId] = useState<number>();
    const [jsonText, setJsonText] = useState('{}');
    const [jsonError, setJsonError] = useState('');

    useEffect(() => {
        setComponentId(value?.componentId);
        setSelectedComponent(value?.componentId ? getComponentById(value.componentId, components) : undefined);
        if (value?.actionType === 'setComponentProps') {
            setJsonText(formatJson(value.args.props));
        } else if (value?.actionType === 'setComponentStyles') {
            setJsonText(formatJson(value.args.styles));
        } else {
            setJsonText('{}');
        }
        setJsonError('');
    }, [value, components]);

    function emit(nextComponentId = componentId, nextJsonText = jsonText, nextActionType = actionType) {
        if (!nextComponentId) return;

        const data = parseJsonObject(nextJsonText, 'JSON 内容');
        setJsonError(data.error || '');

        if (data.error || !data.value) {
            onChange?.(undefined);
            return;
        }

        if (nextActionType === 'setComponentProps') {
            onChange?.({
                actionType: 'setComponentProps',
                componentId: nextComponentId,
                args: {
                    props: data.value,
                },
            });
            return;
        }

        onChange?.({
            actionType: 'setComponentStyles',
            componentId: nextComponentId,
            args: {
                styles: data.value,
            },
        });
    }

    return <div className="mt-[24px] space-y-[16px]">
        <div>
            <div className="mb-[8px] text-[13px] font-medium text-[#1f2937]">更新类型</div>
            <Select
                className="w-full"
                value={actionType}
                options={[
                    { label: '设置组件属性', value: 'setComponentProps' },
                    { label: '设置组件样式', value: 'setComponentStyles' },
                ]}
                disabled
            />
        </div>
        <div>
            <div className="mb-[8px] text-[13px] font-medium text-[#1f2937]">目标组件</div>
            <TreeSelect
                className="w-full"
                treeData={components}
                fieldNames={{ label: 'name', value: 'id' }}
                value={componentId}
                placeholder="请选择要更新的组件"
                onChange={(nextComponentId) => {
                    setComponentId(nextComponentId);
                    setSelectedComponent(getComponentById(nextComponentId, components));
                    emit(nextComponentId, jsonText);
                }}
            />
        </div>
        {selectedComponent && (
            <div className="rounded-[6px] bg-[#f8fafc] px-[10px] py-[8px] text-[12px] text-[#64748b]">
                当前选择：{selectedComponent.desc} / {selectedComponent.name}
            </div>
        )}
        <div>
            <div className="mb-[8px] text-[13px] font-medium text-[#1f2937]">JSON 内容</div>
            <Input.TextArea
                autoSize={{ minRows: 6, maxRows: 10 }}
                value={jsonText}
                onChange={(event) => {
                    setJsonText(event.target.value);
                    emit(componentId, event.target.value);
                }}
                status={jsonError ? 'error' : undefined}
            />
            {jsonError && <div className="mt-[6px] text-[12px] text-[#dc2626]">{jsonError}</div>}
        </div>
    </div>
}
