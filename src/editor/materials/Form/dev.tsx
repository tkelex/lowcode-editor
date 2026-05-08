import { Button, Checkbox, DatePicker, Form as AntdForm, Input, Radio, Rate, Select, Switch } from 'antd';
import React, { useEffect, useMemo, useRef } from 'react';
import { useDrag } from 'react-dnd';
import { useMaterialDrop } from '../../hooks/useMaterialDrop';
import { CommonComponentProps } from '../../interface';

function Form({ id, name, children, title, showActions = true, submitText = '提交', resetText = '重置', styles }: CommonComponentProps) {
    const [form] = AntdForm.useForm();

    const {canDrop, canDropCurrent, isOverCurrent, drop } = useMaterialDrop(['FormItem'], id);
    const divRef = useRef<HTMLDivElement>(null);

    const [, drag] = useDrag({
        type: name,
        item: {
            type: name,
            dragType: 'move',
            id,
        }
    });

    useEffect(() => {
        drop(divRef);
        drag(divRef);
    }, [drop, drag]);

    const formItems = useMemo(() => {
        return React.Children.map(children, (item: any) => {
            return {
                label: item.props?.label,
                name: item.props?.name,
                type: item.props?.type,
                id: item.props?.id,
                placeholder: item.props?.placeholder,
                defaultValue: item.props?.defaultValue,
                optionsText: item.props?.optionsText,
                rules: item.props?.rules,
            }
        }) || [];
    }, [children]);

    return <div
        className={`editor-component editor-panel editor-drop-zone w-full ${canDrop ? 'can-drop' : ''} ${canDropCurrent ? 'is-drop-target' : ''} ${isOverCurrent && !canDropCurrent ? 'is-drop-disabled' : ''}`}
        ref={divRef}
        data-component-id={id}
        style={styles}
    >
        <div className="editor-panel-header">
            <span>{title || '表单'}</span>
            <span className="rounded-[4px] bg-[#f0fdf4] px-[6px] py-[2px] text-[11px] font-medium text-[#16a34a]">Form</span>
        </div>
        <div className="editor-panel-body">
            {formItems.length === 0 ? <div className="editor-empty">拖入表单项</div> : (
                <AntdForm labelCol={{ span: 6 }} wrapperCol={{ span: 18 }} form={form}>
                    {formItems.map((item: any) => {
                        return <AntdForm.Item
                            key={item.name}
                            data-component-id={item.id}
                            name={item.name}
                            label={item.label}
                            initialValue={item.defaultValue}
                            rules={item.rules === 'required' ? [{ required: true, message: '不能为空' }] : []}
                        >
                            {renderControl(item)}
                        </AntdForm.Item>
                    })}
                    {showActions && (
                        <AntdForm.Item wrapperCol={{ offset: 6, span: 18 }}>
                            <Button type="primary" className="mr-[8px]">{submitText}</Button>
                            <Button>{resetText}</Button>
                        </AntdForm.Item>
                    )}
                </AntdForm>
            )}
        </div>
    </div>
}

function renderControl(item: Record<string, any>) {
    const commonProps = {
        placeholder: item.placeholder,
        style: { pointerEvents: 'none' as const },
    };

    if (item.type === 'textarea') {
        return <Input.TextArea {...commonProps} rows={3} />;
    }

    if (item.type === 'date') {
        return <DatePicker className="w-full" style={{ pointerEvents: 'none' }} />;
    }

    if (item.type === 'select') {
        return <Select className="w-full" options={parseOptions(item.optionsText)} open={false} />;
    }

    if (item.type === 'radio') {
        return <Radio.Group options={parseOptions(item.optionsText)} />;
    }

    if (item.type === 'checkbox') {
        return <Checkbox.Group options={parseOptions(item.optionsText)} />;
    }

    if (item.type === 'switch') {
        return <Switch />;
    }

    if (item.type === 'rate') {
        return <Rate />;
    }

    return <Input {...commonProps} />;
}

function parseOptions(optionsText?: string) {
    return (optionsText || '选项一,选项二')
        .split(/[,，\n]/)
        .map(item => item.trim())
        .filter(Boolean)
        .map(item => {
            const [label, value] = item.includes(':') ? item.split(':') : [item, item];
            return {
                label: label.trim(),
                value: (value || label).trim(),
            };
        });
}

export default Form;
