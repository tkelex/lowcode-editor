import { Alert, Collapse, Empty, Form, Input, InputNumber, Select, Typography } from 'antd';
import { CSSProperties, useEffect, useMemo, useState } from 'react';
import { shallow } from 'zustand/shallow';
import { ComponentSetter, useComponentConfigStore } from '../../registry/component-config';
import { useComponetsStore } from '../../stores/components';
import CssEditor from './CssEditor';
import { debounce } from 'lodash-es';
import styleToObject from 'style-to-object';

interface ComponentStyleProps {
  keyword?: string;
}

export function ComponentStyle({ keyword = '' }: ComponentStyleProps) {

  const [form] = Form.useForm();

  const { curComponentId, curComponent, updateComponentStyles } = useComponetsStore((state) => ({
    curComponentId: state.curComponentId,
    curComponent: state.curComponent,
    updateComponentStyles: state.updateComponentStyles,
  }), shallow);
  const { componentConfig } = useComponentConfigStore();
  const [css, setCss] = useState<string>(`.comp{\n\n}`);

  useEffect(() => {
    form.resetFields();
    form.setFieldsValue(curComponent?.styles || {});
    setCss(toCSSStr(curComponent?.styles || {}));
  }, [curComponent, form])

  function toCSSStr(css: Record<string, any>) {
    let str = `.comp {\n`;
    for(let key in css) {
        let value = css[key];
        if(!value) {
            continue;
        }
        if(['width', 'height'].includes(key) &&  !value.toString().endsWith('px')) {
            value += 'px';
        }

        str += `\t${key}: ${value};\n`
    }
    str += `}`;
    return str;
  }

  const setters = componentConfig[curComponent?.name || '']?.stylesSetter || [];
  const searchText = keyword.trim().toLowerCase();
  const filteredSetters = useMemo(() => {
    if (!searchText) return setters;

    return setters.filter(setter => {
      return [setter.name, setter.label].join(' ').toLowerCase().includes(searchText);
    });
  }, [searchText, setters]);
  const showCssEditor = !searchText || ['css', '样式', '源码', '自定义'].some(item => item.includes(searchText) || searchText.includes(item));

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

  function valueChange(changeValues: CSSProperties) {
    if (curComponentId) {
        updateComponentStyles(curComponentId, changeValues);
    }
  }

  const handleEditorChange = debounce((value) => {
    setCss(value || '');

    let css: Record<string, any> = {};

    try {
        const cssStr = (value || '').replace(/\/\*.*\*\//, '')
            .replace(/(\.?[^{]+{)/, '')
            .replace('}', '');
        
        styleToObject(cssStr, (name, value) => {
            css[name.replace(/-\w/, (item) => item.toUpperCase().replace('-', ''))] = value;
        });
    
        updateComponentStyles(curComponentId, {...form.getFieldsValue(), ...css}, true);
    } catch(e) {}
  }, 500);

  return (
    <Form
      form={form}
      onValuesChange={valueChange}
      layout="vertical"
      className="setting-form"
    >
      <Collapse
        defaultActiveKey={['quick', 'css']}
        size="small"
        items={[
          {
            key: 'quick',
            label: `快捷样式 ${filteredSetters.length ? `(${filteredSetters.length})` : ''}`,
            children: <div>
              {filteredSetters.length === 0 && (
                searchText
                  ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="没有匹配的快捷样式" />
                  : <Typography.Text type="secondary" className="text-[12px]">当前组件暂无快捷样式。</Typography.Text>
              )}
              {filteredSetters.map(setter => (
                <Form.Item key={setter.name} name={setter.name} label={setter.label}>
                  {renderFormElememt(setter)}
                </Form.Item>
              ))}
            </div>,
          },
          {
            key: 'css',
            label: 'CSS 源码',
            children: showCssEditor ? <div>
              <Alert
                className="mb-[10px]"
                type="info"
                showIcon
                message="只需要编辑 .comp 选择器内部的 CSS 声明，保存后会同步为组件内联样式。"
              />
              <div className='relative z-20 h-[220px] w-full min-w-0 overflow-hidden rounded-[6px] border border-[#d1d5db]'>
                <CssEditor value={ css } onChange={handleEditorChange}/>
              </div>
            </div> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="没有匹配的 CSS 配置" />,
          },
        ]}
      />
    </Form>
  )
}
