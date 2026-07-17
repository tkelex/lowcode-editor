import { QuestionCircleOutlined } from '@ant-design/icons';
import { Checkbox, Collapse, Empty, Form, Input, InputNumber, Select, Switch, Tooltip, Typography } from 'antd';
import { useEffect, useMemo, useRef } from 'react';
import { shallow } from 'zustand/shallow';
import { ComponentSetter, useComponentConfigStore } from '../../registry/component-config';
import { getSetterGroup, getSetterGroupLabel, propertyGroupOrder } from '../../registry/factory';
import { useComponetsStore } from '../../stores/components';

interface ComponentAttrProps {
  keyword?: string;
}

export function ComponentAttr({ keyword = '' }: ComponentAttrProps) {

  const [form] = Form.useForm();
  const previousComponentIdRef = useRef<number | null>();

  const { curComponentId, curComponent, updateComponentProps } = useComponetsStore((state) => ({
    curComponentId: state.curComponentId,
    curComponent: state.curComponent,
    updateComponentProps: state.updateComponentProps,
  }), shallow);
  const { componentConfig } = useComponentConfigStore();

  const currentConfig = componentConfig[curComponent?.name || ''];
  const setters = currentConfig?.setter || [];
  const formValues = useMemo(() => ({
    ...(currentConfig?.defaultProps || {}),
    ...(curComponent?.props || {}),
  }), [curComponent?.props, currentConfig?.defaultProps]);

  useEffect(() => {
    if (previousComponentIdRef.current === curComponentId) {
      return;
    }

    previousComponentIdRef.current = curComponentId;
    form.resetFields();
    form.setFieldsValue(formValues);
  }, [curComponentId, form, formValues])

  const searchText = keyword.trim().toLowerCase();
  const groupedSetters = useMemo(() => {
    const filteredSetters = searchText
      ? setters.filter(setter => {
        return [
          setter.name,
          setter.label,
          getSetterGroupLabel(getSetterGroup(setter)),
          setter.help,
        ].filter(Boolean).join(' ').toLowerCase().includes(searchText);
      })
      : setters;

    const groups = filteredSetters.reduce<Array<{ key: string; label: string; setters: ComponentSetter[] }>>((result, setter) => {
      const groupKey = getSetterGroup(setter);
      const groupLabel = getSetterGroupLabel(groupKey);
      const group = result.find(item => item.key === groupKey);

      if (group) {
        group.setters.push(setter);
      } else {
        result.push({ key: groupKey, label: groupLabel, setters: [setter] });
      }

      return result;
    }, []);

    return groups.sort((prev, next) => {
      const prevIndex = propertyGroupOrder.indexOf(prev.key);
      const nextIndex = propertyGroupOrder.indexOf(next.key);
      const normalizedPrev = prevIndex === -1 ? propertyGroupOrder.length : prevIndex;
      const normalizedNext = nextIndex === -1 ? propertyGroupOrder.length : nextIndex;
      return normalizedPrev - normalizedNext;
    });
  }, [searchText, setters]);
  const filteredSetterCount = groupedSetters.reduce((count, group) => count + group.setters.length, 0);

  if (!curComponentId || !curComponent) return null;
  
  function renderFormElememt(setting: ComponentSetter) {
    const { type, options, placeholder, componentProps = {}, rows, min, max } = setting;
  
    if (type === 'select') {
      return <Select options={options} placeholder={placeholder} {...componentProps} />
    } else if (type === 'switch') {
      return <Switch size="small" {...componentProps} />
    } else if (type === 'checkbox') {
      const { children, ...checkboxProps } = componentProps;
      return <Checkbox {...checkboxProps}>{children}</Checkbox>
    } else if (type === 'url') {
      return <Input placeholder={placeholder || 'http://'} {...componentProps} />
    } else if (type === 'json') {
      return <Input.TextArea rows={rows || 5} autoSize={{ minRows: rows || 5, maxRows: 10 }} placeholder={placeholder} {...componentProps} />
    } else if (type === 'textarea') {
      return <Input.TextArea rows={rows || 4} autoSize={{ minRows: rows || 3, maxRows: 8 }} placeholder={placeholder} {...componentProps} />
    } else if (type === 'inputNumber') {
      return <InputNumber className="w-full" min={min} max={max} placeholder={placeholder} {...componentProps} />
    }

    return <Input placeholder={placeholder} {...componentProps} />
  }

  function renderSettingLabel(setting: ComponentSetter) {
    return <span className="property-label">
      <span className="property-label-text">{setting.label}</span>
      {setting.help && (
        <Tooltip title={setting.help} placement="top">
          <QuestionCircleOutlined className="property-help-icon" aria-hidden="true" />
        </Tooltip>
      )}
    </span>
  }

  function valueChange(changeValues: Record<string, unknown>) {
    if (curComponentId) {
      updateComponentProps(curComponentId, changeValues);
    }
  }

  function getJsonRules(setting: ComponentSetter) {
    if (setting.validate !== 'json' && setting.type !== 'json') {
      return undefined;
    }

    return [{
      validator: async (_: unknown, value?: string) => {
        if (!value || !value.trim()) return;

        try {
          JSON.parse(value);
        } catch {
          throw new Error('请输入合法 JSON');
        }
      },
    }];
  }

  const hasMatchedConfig = filteredSetterCount > 0 || !searchText;
  const activeKeys = groupedSetters.map(group => group.key);

  return (
    <Form
      form={form}
      onValuesChange={valueChange}
      layout="vertical"
      className="setting-form property-form"
    >
      <Collapse
        className="setting-collapse property-collapse"
        defaultActiveKey={activeKeys}
        key={`${curComponentId}-${searchText || 'all'}-${activeKeys.join('|')}`}
        size="small"
        items={groupedSetters.map(group => ({
          key: group.key,
          label: `${group.label}${group.setters.length ? ` (${group.setters.length})` : ''}`,
          children: <div className="property-group-fields">
            {group.setters.map(setter => (
              <Form.Item
                key={setter.name}
                name={setter.name}
                label={renderSettingLabel(setter)}
                className={['switch', 'checkbox'].includes(setter.type) ? 'property-inline-item' : undefined}
                valuePropName={setter.valuePropName || (setter.type === 'switch' ? 'checked' : undefined)}
                rules={getJsonRules(setter)}
              >
                {renderFormElememt(setter)}
              </Form.Item>
            ))}
          </div>,
        }))}
      />
      {!hasMatchedConfig && (
        <div className="property-empty">
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="没有匹配的属性配置" />
        </div>
      )}
      {setters.length === 0 && !searchText && (
        <div className="property-empty-note">
          <Typography.Text type="secondary" className="text-[12px]">
            当前组件暂无可配置属性。
          </Typography.Text>
        </div>
      )}
    </Form>
  )
}
