import { Input, Select, Typography } from "antd";
import { useEffect, useState } from "react";
import type { ConditionAction, LowcodeAction } from "../../../events/types";
import { NestedActionList } from "./NestedActionList";

export interface ConditionActionProps {
    value?: ConditionAction['args']
    onChange?: (config: ConditionAction) => void
}

export function ConditionActionForm(props: ConditionActionProps) {
    const { value, onChange } = props;
    const [expression, setExpression] = useState(value?.expression || 'event.value');
    const [template, setTemplate] = useState<string>('custom');
    const [compareValue, setCompareValue] = useState('');
    const [trueActions, setTrueActions] = useState<LowcodeAction[]>(value?.trueActions || []);
    const [falseActions, setFalseActions] = useState<LowcodeAction[]>(value?.falseActions || []);

    useEffect(() => {
        setExpression(value?.expression || 'event.value');
        setTemplate('custom');
        setCompareValue('');
        setTrueActions(value?.trueActions || []);
        setFalseActions(value?.falseActions || []);
    }, [value]);

    function emit(
        nextExpression = expression,
        nextTrueActions = trueActions,
        nextFalseActions = falseActions,
    ) {
        onChange?.({
            actionType: 'condition',
            args: {
                expression: nextExpression,
                trueActions: nextTrueActions,
                falseActions: nextFalseActions,
            },
        });
    }

    return <div className="mt-[24px] space-y-[16px]">
        <div>
            <div className="mb-[8px] text-[13px] font-medium text-[#1f2937]">常用条件</div>
            <Select
                className="w-full"
                value={template}
                options={[
                    { label: '自定义表达式', value: 'custom' },
                    { label: 'event.value 有值', value: 'valueTruthy' },
                    { label: 'event.value 等于', value: 'valueEquals' },
                    { label: 'event.checked 为 true', value: 'checkedTrue' },
                    { label: 'event.values 指定字段有值', value: 'valuesFieldTruthy' },
                ]}
                onChange={(nextTemplate) => {
                    setTemplate(nextTemplate);
                    const nextExpression = buildExpression(nextTemplate, compareValue) || expression;
                    setExpression(nextExpression);
                    emit(nextExpression, trueActions, falseActions);
                }}
            />
        </div>
        {(template === 'valueEquals' || template === 'valuesFieldTruthy') && (
            <div>
                <div className="mb-[8px] text-[13px] font-medium text-[#1f2937]">
                    {template === 'valueEquals' ? '比较值' : '字段名'}
                </div>
                <Input value={compareValue} onChange={(event) => {
                    setCompareValue(event.target.value);
                    const nextExpression = buildExpression(template, event.target.value) || expression;
                    setExpression(nextExpression);
                    emit(nextExpression, trueActions, falseActions);
                }} />
            </div>
        )}
        <div>
            <div className="mb-[8px] text-[13px] font-medium text-[#1f2937]">条件表达式</div>
            <Input value={expression} placeholder="例如 event.value === 'admin'" onChange={(event) => {
                setTemplate('custom');
                setExpression(event.target.value);
                emit(event.target.value, trueActions, falseActions);
            }} />
            <Typography.Text type="secondary" className="mt-[6px] block text-[12px]">
                可使用 event、context、args，例如 event.checked 或 event.values.name。
            </Typography.Text>
        </div>
        <NestedActionList
            title="条件为真时执行"
            description="表达式结果为 true 时，按顺序执行这里的动作。"
            actions={trueActions}
            emptyText="条件为真时暂不执行动作"
            onChange={(nextTrueActions) => {
                setTrueActions(nextTrueActions);
                emit(expression, nextTrueActions, falseActions);
            }}
        />
        <NestedActionList
            title="条件为假时执行"
            description="表达式结果为 false 时，按顺序执行这里的动作。"
            actions={falseActions}
            emptyText="条件为假时暂不执行动作"
            onChange={(nextFalseActions) => {
                setFalseActions(nextFalseActions);
                emit(expression, trueActions, nextFalseActions);
            }}
        />
    </div>
}

function buildExpression(template: string, value: string) {
    if (template === 'valueTruthy') {
        return 'Boolean(event.value)';
    }

    if (template === 'valueEquals') {
        return `event.value === ${JSON.stringify(value)}`;
    }

    if (template === 'checkedTrue') {
        return 'event.checked === true';
    }

    if (template === 'valuesFieldTruthy') {
        const fieldName = value.trim();
        return fieldName ? `Boolean(event.values.${fieldName})` : '';
    }

    return '';
}
