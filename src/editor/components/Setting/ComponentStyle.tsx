import { Alert, Button, Collapse, Empty, Form, Input, InputNumber, Select, Typography, message } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import { shallow } from 'zustand/shallow';
import { ComponentSetter, useComponentConfigStore } from '../../registry/component-config';
import { useComponetsStore } from '../../stores/components';
import CssEditor from './CssEditor';
import styleToObject from 'style-to-object';

interface ComponentStyleProps {
  keyword?: string;
}

export function ComponentStyle({ keyword = '' }: ComponentStyleProps) {

  const [form] = Form.useForm();
  const previousComponentIdRef = useRef<number | null>();

  const { curComponentId, curComponent, updateComponentStyles } = useComponetsStore((state) => ({
    curComponentId: state.curComponentId,
    curComponent: state.curComponent,
    updateComponentStyles: state.updateComponentStyles,
  }), shallow);
  const { componentConfig } = useComponentConfigStore();
  const [css, setCss] = useState<string>(`.comp{\n\n}`);

  useEffect(() => {
    if (previousComponentIdRef.current === curComponentId) {
      return;
    }

    previousComponentIdRef.current = curComponentId;
    form.resetFields();
    form.setFieldsValue(toFormStyleValues(curComponent?.styles || {}));
    setCss(toCSSStr(curComponent?.styles || {}));
  }, [curComponent, curComponentId, form])

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

  function applyCssSource(value?: string) {
    if (!curComponentId) return;
    const componentId = curComponentId;
    setCss(value || '');

    let css: Record<string, any> = {};

    try {
        const cssStr = (value || '').replace(/\/\*.*\*\//, '')
            .replace(/(\.?[^{]+{)/, '')
            .replace('}', '');
        
        styleToObject(cssStr, (name, value) => {
            const styleName = name.replace(/-\w/g, (item) => item.toUpperCase().replace('-', ''));
            css[styleName] = value;
        });
        updateComponentStyles(componentId, css, true);
        form.setFieldsValue(toFormStyleValues(css));
    } catch(e) {}
  }

  function handleEditorChange(value?: string) {
    applyCssSource(value);
  }

  if (!curComponentId || !curComponent) return null;

  function renderFormElememt(setting: ComponentSetter) {
    const { type, options } = setting;
  
    if (type === 'select') {
      return <Select options={options} />
    } else if (type === 'input') {
      if (isPxDimensionStyle(setting.name)) {
        return <InputNumber className="w-full" controls={false} addonAfter="px" />
      }

      return <Input />
    } else if (type === 'inputNumber') {
        return <InputNumber className="w-full" />
    }

    return <Input />
  }

  function valueChange(changeValues: CSSProperties) {
    if (curComponentId) {
        const normalizedChanges = normalizeStyleValues(changeValues);
        const nextStyles = removeUndefinedStyleValues({ ...(curComponent?.styles || {}), ...normalizedChanges });
        updateComponentStyles(curComponentId, normalizedChanges);
        form.setFieldsValue(toFormStyleValues(nextStyles));
        setCss(toCSSStr(nextStyles));
    }
  }

  function resetStyles() {
    if (!curComponentId) return;

    updateComponentStyles(curComponentId, {}, true);
    form.resetFields();
    setCss(toCSSStr({}));
    message.success('已恢复默认样式');
  }

  return (
    <Form
      form={form}
      onValuesChange={valueChange}
      layout="vertical"
      className="setting-form"
    >
      <Collapse
        className="setting-collapse"
        defaultActiveKey={['quick', 'css']}
        size="small"
        items={[
          {
            key: 'quick',
            label: <div className="flex min-w-0 items-center justify-between gap-[8px]">
              <span>{`快捷样式 ${filteredSetters.length ? `(${filteredSetters.length})` : ''}`}</span>
              <Button
                size="small"
                type="text"
                icon={<ReloadOutlined />}
                onClick={(event) => {
                  event.stopPropagation();
                  resetStyles();
                }}
              >
                恢复默认
              </Button>
            </div>,
            children: <div>
              <div className="mb-[10px] flex items-center justify-between gap-[8px] rounded-[6px] border border-[#e2e8f0] bg-[#f8fafc] px-[10px] py-[8px]">
                <Typography.Text type="secondary" className="text-[12px]">
                  修改后会立即同步到画布。
                </Typography.Text>
                <Button size="small" icon={<ReloadOutlined />} onClick={resetStyles}>
                  恢复默认样式
                </Button>
              </div>
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

const pxDimensionStyleNames = new Set([
  'width',
  'height',
  'minWidth',
  'minHeight',
  'maxWidth',
  'maxHeight',
  'margin',
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
  'padding',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'fontSize',
  'borderRadius',
  'gap',
  'rowGap',
  'columnGap',
]);

function isPxDimensionStyle(name: string) {
  return pxDimensionStyleNames.has(name);
}

function normalizeStyleValues(styles: CSSProperties) {
  return Object.entries(styles).reduce<Record<string, any>>((result, [name, value]) => {
    result[name] = normalizeStyleValue(name, value);
    return result;
  }, {});
}

function normalizeStyleValue(name: string, value: any) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'number') {
    return isPxDimensionStyle(name) ? `${value}px` : value;
  }

  if (typeof value === 'string' && isPxDimensionStyle(name) && /^-?\d+(\.\d+)?$/.test(value.trim())) {
    return `${value.trim()}px`;
  }

  return value;
}

function toFormStyleValues(styles: Record<string, any>) {
  return Object.entries(styles).reduce<Record<string, any>>((result, [name, value]) => {
    if (isPxDimensionStyle(name)) {
      result[name] = stripPx(value);
      return result;
    }

    result[name] = value;
    return result;
  }, {});
}

function stripPx(value: any) {
  if (typeof value === 'string' && /^-?\d+(\.\d+)?px$/.test(value.trim())) {
    return Number(value.trim().replace(/px$/, ''));
  }

  return value;
}

function removeUndefinedStyleValues(styles: Record<string, any>) {
  return Object.entries(styles).reduce<Record<string, any>>((result, [name, value]) => {
    if (value !== undefined) {
      result[name] = value;
    }

    return result;
  }, {});
}
