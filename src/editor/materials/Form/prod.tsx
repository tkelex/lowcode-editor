import { Button, Checkbox, DatePicker, Form as AntdForm, Input, Radio, Rate, Select, Switch } from 'antd';
import dayjs from 'dayjs';
import React, { ForwardRefRenderFunction, forwardRef, useImperativeHandle, useMemo } from 'react';
import { CommonComponentProps } from '../../interface';

type FormProps = Omit<CommonComponentProps, 'ref'>;

export interface FormRef {
    submit: () => void
    reset: () => void
    getValues: () => Record<string, unknown>
    setValues: (values: Record<string, unknown>) => void
}

const Form: ForwardRefRenderFunction<FormRef, FormProps> = ({
    children,
    onFinish,
    onFinishFailed,
    onValuesChange,
    title,
    layout = 'horizontal',
    showActions = true,
    submitText = '提交',
    resetText = '重置',
    disabled,
    styles,
}, ref)  => {
    const [form] = AntdForm.useForm();

    useImperativeHandle(ref, () => {
        return {
            submit: () => {
                form.submit();
            },
            reset: () => {
                form.resetFields();
            },
            getValues: () => form.getFieldsValue(true),
            setValues: (values) => form.setFieldsValue(values),
        }
    }, [form]);

    const formItems = useMemo(() => {
        return React.Children.map(children, (item: any) => {
            return {
                label: item.props?.label,
                name: item.props?.name,
                type: item.props?.type,
                id: item.props?.id,
                rules: item.props?.rules,
                placeholder: item.props?.placeholder,
                defaultValue: item.props?.defaultValue,
                optionsText: item.props?.optionsText,
                required: item.props?.required,
            }
        }) || [];
    }, [children]);

    const initialValues = useMemo(() => {
        const result: Record<string, unknown> = {};
        formItems.forEach((item: any) => {
            if (item.name && item.defaultValue !== undefined && item.defaultValue !== '') {
                result[item.name] = normalizeInitialValue(item.type, item.defaultValue);
            }
        });
        return result;
    }, [formItems]);

    async function save(values: any) {
        const nextValues = formatValues(values);
        onFinish?.(nextValues);
    }

    return <div style={styles}>
        {title && <div className="mb-[12px] text-[16px] font-semibold leading-[24px] text-[#0f172a]">{title}</div>}
        <AntdForm
            name='form'
            labelCol={layout === 'horizontal' ? { span: 5 } : undefined}
            wrapperCol={layout === 'horizontal' ? { span: 18 } : undefined}
            layout={layout}
            disabled={disabled}
            form={form}
            initialValues={initialValues}
            onFinish={save}
            onFinishFailed={onFinishFailed}
            onValuesChange={(changedValues, allValues) => {
                onValuesChange?.(formatValues(changedValues), formatValues(allValues));
            }}
        >
            {formItems.map((item: any) => {
                return (
                    <AntdForm.Item
                        key={item.name}
                        name={item.name}
                        label={item.label}
                        valuePropName={item.type === 'switch' ? 'checked' : undefined}
                        rules={getRules(item.rules, item.required)}
                    >
                        {renderControl(item)}
                    </AntdForm.Item>
                )
            })}
            {showActions && (
                <AntdForm.Item wrapperCol={{ offset: 5, span: 18 }}>
                    <Button type="primary" htmlType="submit" className="mr-[8px]">{submitText}</Button>
                    <Button htmlType="button" onClick={() => form.resetFields()}>{resetText}</Button>
                </AntdForm.Item>
            )}
        </AntdForm>
    </div>
}

function renderControl(item: Record<string, any>) {
    if (item.type === 'textarea') {
        return <Input.TextArea placeholder={item.placeholder} rows={3} />;
    }

    if (item.type === 'date') {
        return <DatePicker className="w-full" placeholder={item.placeholder} />;
    }

    if (item.type === 'select') {
        return <Select options={parseOptions(item.optionsText)} placeholder={item.placeholder} />;
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

    return <Input placeholder={item.placeholder} />;
}

function getRules(ruleType?: string, required?: boolean | string) {
    if (ruleType === 'required' || required === true || required === 'true') {
        return [{ required: true, message: '不能为空' }];
    }

    if (ruleType === 'email') {
        return [{ type: 'email' as const, message: '请输入正确的邮箱' }];
    }

    return [];
}

function normalizeInitialValue(type: string, value: unknown) {
    if (type === 'date' && typeof value === 'string') {
        return dayjs(value);
    }

    if (type === 'checkbox' && typeof value === 'string') {
        return value.split(/[,，]/).map(item => item.trim()).filter(Boolean);
    }

    if (type === 'switch') {
        return value === true || value === 'true';
    }

    return value;
}

function formatValues(values: Record<string, any>) {
    return Object.keys(values || {}).reduce<Record<string, unknown>>((result, key) => {
        const value = values[key];
        result[key] = dayjs.isDayjs(value) ? value.format('YYYY-MM-DD') : value;
        return result;
    }, {});
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

export default forwardRef(Form);
