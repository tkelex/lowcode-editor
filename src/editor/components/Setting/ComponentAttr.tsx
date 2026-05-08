import { Alert, Collapse, Empty, Form, Input, InputNumber, Select, Typography } from 'antd';
import { useEffect, useMemo } from 'react';
import { shallow } from 'zustand/shallow';
import { ComponentConfig, ComponentSetter, useComponentConfigStore } from '../../registry/component-config';
import { useComponetsStore } from '../../stores/components';

interface ComponentAttrProps {
  keyword?: string;
}

export function ComponentAttr({ keyword = '' }: ComponentAttrProps) {

  const [form] = Form.useForm();

  const { curComponentId, curComponent, updateComponentProps } = useComponetsStore((state) => ({
    curComponentId: state.curComponentId,
    curComponent: state.curComponent,
    updateComponentProps: state.updateComponentProps,
  }), shallow);
  const { componentConfig } = useComponentConfigStore();

  useEffect(() => {
    form.resetFields();
    form.setFieldsValue(curComponent?.props || {});
  }, [curComponent, form])

  const setters = componentConfig[curComponent?.name || '']?.setter || [];
  const searchText = keyword.trim().toLowerCase();
  const filteredSetters = useMemo(() => {
    if (!searchText) return setters;

    return setters.filter(setter => {
      return [setter.name, setter.label].join(' ').toLowerCase().includes(searchText);
    });
  }, [searchText, setters]);

  if (!curComponentId || !curComponent) return null;
  
  function renderFormElememt(setting: ComponentSetter) {
    const { type, options } = setting;
  
    if (type === 'select') {
      return <Select options={options} />
    } else if (type === 'input') {
      return <Input />
    } else if (type === 'inputNumber') {
      return <InputNumber className="w-full" />
    }

    return <Input />
  }

  function valueChange(changeValues: ComponentConfig) {
    if (curComponentId) {
      updateComponentProps(curComponentId, changeValues);
    }
  }

  const hasMatchedConfig = filteredSetters.length > 0 || !searchText;

  return (
    <Form
      form={form}
      onValuesChange={valueChange}
      layout="vertical"
      className="setting-form"
    >
      <Collapse
        defaultActiveKey={['base', 'props']}
        size="small"
        items={[
          {
            key: 'base',
            label: '基础信息',
            children: <div>
              <Form.Item label="组件 ID">
                <Input value={curComponent.id} disabled />
              </Form.Item>
              <Form.Item label="组件类型">
                <Input value={curComponent.name} disabled />
              </Form.Item>
              <Form.Item label="显示名称">
                <Input value={curComponent.desc} disabled/>
              </Form.Item>
            </div>,
          },
          {
            key: 'props',
            label: `属性配置 ${filteredSetters.length ? `(${filteredSetters.length})` : ''}`,
            children: <div>
              <Alert
                className="mb-[10px]"
                type="info"
                showIcon
                message="属性支持 {{variables.xxx}} 表达式；Page 组件可配置页面变量和数据源 JSON。"
              />
              {!hasMatchedConfig && (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="没有匹配的属性配置" />
              )}
              {filteredSetters.length === 0 && !searchText && (
                <Typography.Text type="secondary" className="text-[12px]">
                  当前组件暂无可配置属性。
                </Typography.Text>
              )}
              {filteredSetters.map(setter => (
                <Form.Item key={setter.name} name={setter.name} label={setter.label}>
                  {renderFormElememt(setter)}
                </Form.Item>
              ))}
            </div>,
          },
        ]}
      />
    </Form>
  )
}
