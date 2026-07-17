import { Alert, Button, Collapse, ColorPicker, Empty, Form, Input, InputNumber, Select, Typography, message } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { CSSProperties, ReactNode, useEffect, useId, useMemo, useRef, useState } from 'react';
import { shallow } from 'zustand/shallow';
import { ComponentSetter, useComponentConfigStore } from '../../registry/component-config';
import { defaultOpenStyleGroups, styleGroupLabels, styleGroupOrder } from '../../registry/factory';
import { useComponetsStore } from '../../stores/components';
import CssEditor from './CssEditor';
import styleToObject from 'style-to-object';

interface ComponentStyleProps {
  keyword?: string;
}

interface StyleSetterGroupView {
  key: string;
  label: string;
  setters: ComponentSetter[];
}

type DirectionalValueKey = 'all' | 'top' | 'right' | 'bottom' | 'left' | 'row' | 'column';

interface DirectionalValueOption {
  key: DirectionalValueKey;
  label: string;
}

interface DirectionalValueConfig {
  key: string;
  label: string;
  names: Partial<Record<DirectionalValueKey, string>>;
  directions: DirectionalValueOption[];
}

interface SizePairConfig {
  key: string;
  label: string;
  widthName: string;
  heightName: string;
}

const spacingDirections: DirectionalValueOption[] = [
  { key: 'all', label: '全部' },
  { key: 'top', label: '上' },
  { key: 'right', label: '右' },
  { key: 'bottom', label: '下' },
  { key: 'left', label: '左' },
];

const sideDirections: DirectionalValueOption[] = spacingDirections.filter(direction => direction.key !== 'all');

const gapDirections: DirectionalValueOption[] = [
  { key: 'all', label: '全部' },
  { key: 'row', label: '行' },
  { key: 'column', label: '列' },
];

const directionalSpacingConfigs: DirectionalValueConfig[] = [
  {
    key: 'margin',
    label: '外边距',
    directions: spacingDirections,
    names: {
      all: 'margin',
      top: 'marginTop',
      right: 'marginRight',
      bottom: 'marginBottom',
      left: 'marginLeft',
    },
  },
  {
    key: 'padding',
    label: '内边距',
    directions: spacingDirections,
    names: {
      all: 'padding',
      top: 'paddingTop',
      right: 'paddingRight',
      bottom: 'paddingBottom',
      left: 'paddingLeft',
    },
  },
];

const layoutDirectionalConfigs: DirectionalValueConfig[] = [
  {
    key: 'offset',
    label: '定位偏移',
    directions: sideDirections,
    names: {
      top: 'top',
      right: 'right',
      bottom: 'bottom',
      left: 'left',
    },
  },
  {
    key: 'gap',
    label: '内容间距',
    directions: gapDirections,
    names: {
      all: 'gap',
      row: 'rowGap',
      column: 'columnGap',
    },
  },
];

const sizePairConfigs: SizePairConfig[] = [
  { key: 'size', label: '尺寸', widthName: 'width', heightName: 'height' },
  { key: 'minSize', label: '最小尺寸', widthName: 'minWidth', heightName: 'minHeight' },
  { key: 'maxSize', label: '最大尺寸', widthName: 'maxWidth', heightName: 'maxHeight' },
];

const borderStyleNames = new Set(['borderWidth', 'borderStyle', 'borderColor', 'borderRadius']);
const compoundStyleNamesByGroup: Record<string, Set<string>> = {
  layout: new Set(layoutDirectionalConfigs.flatMap(config => Object.values(config.names))),
  size: new Set(sizePairConfigs.flatMap(config => [config.widthName, config.heightName])),
  spacing: new Set(directionalSpacingConfigs.flatMap(config => Object.values(config.names))),
  border: borderStyleNames,
};

function StyleColorPicker({ name }: { name: string }) {
  const form = Form.useFormInstance();

  return (
    <ColorPicker
      size="small"
      value={form.getFieldValue(name)}
      onChange={(_, css) => {
        form.setFieldValue(name, css);
      }}
      onChangeComplete={(value) => {
        form.setFieldValue(name, value.toHexString());
        form.submit();
      }}
    />
  );
}

function DirectionalStyleControl({
  config,
  preferredDirection,
  setterMap,
  onChange,
}: {
  config: DirectionalValueConfig;
  preferredDirection: DirectionalValueKey;
  setterMap: Record<string, ComponentSetter>;
  onChange: (changeValues: CSSProperties) => void;
}) {
  const form = Form.useFormInstance();
  const inputId = useId();
  const [direction, setDirection] = useState<DirectionalValueKey>(preferredDirection);
  const activeName = config.names[direction];
  const activeSetter = activeName ? setterMap[activeName] : undefined;

  Form.useWatch(activeName, form);

  useEffect(() => {
    setDirection(preferredDirection);
  }, [config.key, preferredDirection]);

  const handleDirectionChange = (nextDirection: DirectionalValueKey) => {
    setDirection(nextDirection);
  };

  const handleValueChange = (value: number | string | null) => {
    if (!activeName) {
      return;
    }

    form.setFieldValue(activeName, value ?? undefined);
    onChange({ [activeName]: value ?? undefined });
  };

  return (
    <div className="appearance-direction-control">
      <div className="appearance-direction-head">
        <label className="appearance-direction-label" htmlFor={inputId}>{config.label}</label>
        <span className="appearance-direction-active">{config.directions.find(item => item.key === direction)?.label}</span>
      </div>
      <div className="appearance-direction-body">
        <div className="appearance-box-picker" role="radiogroup" aria-label={`${config.label}方向`}>
          {config.directions.map(item => (
            <button
              key={item.key}
              type="button"
              className={`appearance-box-button appearance-box-button-${item.key}${direction === item.key ? ' is-active' : ''}`}
              aria-label={`${config.label}${item.label}`}
              aria-checked={direction === item.key}
              role="radio"
              title={`${config.label}${item.label}`}
              onClick={() => handleDirectionChange(item.key)}
            >
              <span>{item.label}</span>
            </button>
          ))}
        </div>
        <InputNumber
          id={inputId}
          className="style-number-input appearance-direction-input"
          controls={false}
          min={activeSetter?.min}
          max={activeSetter?.max}
          step={activeSetter?.step}
          addonAfter="px"
          value={activeName ? form.getFieldValue(activeName) : undefined}
          onChange={handleValueChange}
        />
      </div>
    </div>
  );
}

function SizePairControl({
  config,
  setterMap,
  onChange,
}: {
  config: SizePairConfig;
  setterMap: Record<string, ComponentSetter>;
  onChange: (changeValues: CSSProperties) => void;
}) {
  const form = Form.useFormInstance();
  const widthId = useId();
  const heightId = useId();
  const widthSetter = setterMap[config.widthName];
  const heightSetter = setterMap[config.heightName];

  Form.useWatch(config.widthName, form);
  Form.useWatch(config.heightName, form);

  const handleValueChange = (name: string, value: number | string | null) => {
    form.setFieldValue(name, value ?? undefined);
    onChange({ [name]: value ?? undefined });
  };

  return (
    <div className="appearance-pair-control">
      <div className="appearance-direction-head">
        <span className="appearance-direction-label">{config.label}</span>
        <span className="appearance-direction-active">宽 / 高</span>
      </div>
      <div className="appearance-pair-grid">
        <label className="appearance-pair-field" htmlFor={widthId}>
          <span>宽</span>
          <InputNumber
            id={widthId}
            aria-label={`${config.label}宽`}
            className="style-number-input appearance-pair-input"
            controls={false}
            min={widthSetter?.min}
            max={widthSetter?.max}
            step={widthSetter?.step}
            addonAfter="px"
            value={form.getFieldValue(config.widthName)}
            onChange={(value) => handleValueChange(config.widthName, value)}
          />
        </label>
        <label className="appearance-pair-field" htmlFor={heightId}>
          <span>高</span>
          <InputNumber
            id={heightId}
            aria-label={`${config.label}高`}
            className="style-number-input appearance-pair-input"
            controls={false}
            min={heightSetter?.min}
            max={heightSetter?.max}
            step={heightSetter?.step}
            addonAfter="px"
            value={form.getFieldValue(config.heightName)}
            onChange={(value) => handleValueChange(config.heightName, value)}
          />
        </label>
      </div>
    </div>
  );
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
  const [css, setCss] = useState<string>(toCSSStr({}));
  const setters = componentConfig[curComponent?.name || '']?.stylesSetter || [];
  const setterMap = useMemo(() => {
    return setters.reduce<Record<string, ComponentSetter>>((result, setter) => {
      result[setter.name] = setter;
      return result;
    }, {});
  }, [setters]);

  useEffect(() => {
    if (previousComponentIdRef.current === curComponentId) {
      return;
    }

    previousComponentIdRef.current = curComponentId;
    form.resetFields();
    form.setFieldsValue(toFormStyleValues(curComponent?.styles || {}, setterMap, setters));
    setCss(toCSSStr(curComponent?.styles || {}));
  }, [curComponent, curComponentId, form, setterMap, setters])

  const searchText = keyword.trim().toLowerCase();
  const filteredStyleGroups = useMemo(() => groupStyleSetters(setters, searchText), [searchText, setters]);
  const filteredSetters = useMemo(() => filteredStyleGroups.flatMap(group => group.setters), [filteredStyleGroups]);
  const quickStyleControlCount = useMemo(() => {
    return filteredStyleGroups.reduce((count, group) => count + getRenderableStyleControlCount(group), 0);
  }, [filteredStyleGroups]);
  const showCssEditor = !searchText || ['css', '样式', '源码', '自定义'].some(item => item.includes(searchText) || searchText.includes(item));
  const showEmptySearch = searchText && filteredSetters.length === 0 && !showCssEditor;

  function applyCssSource(value?: string) {
    if (!curComponentId) return;
    const componentId = curComponentId;
    setCss(value || '');

    const parsedStyles = parseComponentCss(value || '');
    if (!parsedStyles) {
      return;
    }

    updateComponentStyles(componentId, parsedStyles, true);
    form.setFieldsValue(toFormStyleValues(parsedStyles, setterMap, setters));
  }

  function handleEditorChange(value?: string) {
    applyCssSource(value);
  }

  if (!curComponentId || !curComponent) return null;

  function renderFormElement(setting: ComponentSetter) {
    const { control, type, options, min, max, step, placeholder } = setting;

    if (control === 'color') {
      return (
        <Input
          className="appearance-color-input"
          placeholder={placeholder || '#1677ff / rgb(...) / var(...)'}
          addonBefore={<StyleColorPicker name={setting.name} />}
        />
      );
    }
  
    if (control === 'select' || type === 'select') {
      return <Select allowClear options={options} />
    } else if (control === 'number' || type === 'inputNumber') {
      const input = <InputNumber className="w-full style-number-input" controls={false} min={min} max={max} step={step} />;
      return getStyleUnit(setting) === 'px'
        ? <InputNumber className="w-full style-number-input" controls={false} min={min} max={max} step={step} addonAfter="px" />
        : input;
    }

    return <Input placeholder={placeholder} />
  }

  function valueChange(changeValues: CSSProperties) {
    if (curComponentId) {
        const normalizedChanges = normalizeStyleValues(changeValues, setterMap);
        const nextStyles = removeUndefinedStyleValues({ ...(curComponent?.styles || {}), ...normalizedChanges });
        updateComponentStyles(curComponentId, normalizedChanges);
        form.setFieldsValue(toFormStyleValues(nextStyles, setterMap, setters));
        setCss(toCSSStr(nextStyles));
    }
  }

  function resetStyles() {
    if (!curComponentId) return;

    updateComponentStyles(curComponentId, {}, true);
    form.resetFields();
    form.setFieldsValue(toFormStyleValues({}, setterMap, setters));
    setCss(toCSSStr({}));
    message.success('已恢复默认样式');
  }

  function renderStyleGroup(group: StyleSetterGroupView) {
    const children = renderStyleGroupChildren(group);

    return {
      key: group.key,
      label: <div className="appearance-subgroup-title">
        <span>{group.label}</span>
        <span className="appearance-subgroup-count">{getRenderableStyleControlCount(group)}</span>
      </div>,
      children: <div className="appearance-style-grid">
        {children}
      </div>,
    };
  }

  function renderStyleGroupChildren(group: StyleSetterGroupView) {
    const groupRenderers: Record<string, (group: StyleSetterGroupView) => ReactNode[]> = {
      layout: renderLayoutStyleGroup,
      size: renderSizeStyleGroup,
      spacing: renderSpacingStyleGroup,
      border: renderBorderStyleGroup,
    };
    const renderer = groupRenderers[group.key];

    if (renderer) {
      return renderer(group);
    }

    return renderLooseSetters(group);
  }

  function renderLayoutStyleGroup(group: StyleSetterGroupView) {
    return [
      ...renderDirectionalControls(group, layoutDirectionalConfigs),
      ...renderLooseSetters(group),
    ];
  }

  function renderSizeStyleGroup(group: StyleSetterGroupView) {
    const setterNames = new Set(group.setters.map(setter => setter.name));
    const sizePairControls = sizePairConfigs
      .filter(config => setterNames.has(config.widthName) || setterNames.has(config.heightName))
      .map(config => (
        <SizePairControl
          key={config.key}
          config={config}
          setterMap={setterMap}
          onChange={valueChange}
        />
      ));

    return [
      ...sizePairControls,
      ...renderLooseSetters(group),
    ];
  }

  function renderSpacingStyleGroup(group: StyleSetterGroupView) {
    return [
      ...renderDirectionalControls(group, directionalSpacingConfigs),
      ...renderLooseSetters(group),
    ];
  }

  function renderBorderStyleGroup(group: StyleSetterGroupView) {
    const setterNames = new Set(group.setters.map(setter => setter.name));
    const borderSetters = ['borderWidth', 'borderStyle', 'borderColor', 'borderRadius']
      .map(name => setterMap[name])
      .filter((setter): setter is ComponentSetter => Boolean(setter && setterNames.has(setter.name)));

    return [
      borderSetters.length > 0 ? (
        <div key="border-compound" className="appearance-compound-control">
          <div className="appearance-direction-head">
            <span className="appearance-direction-label">边框</span>
            <span className="appearance-direction-active">线条 / 圆角</span>
          </div>
          <div className="appearance-compound-grid appearance-compound-grid-2">
            {borderSetters.map(setter => (
              <Form.Item key={setter.name} name={setter.name} label={setter.label}>
                {renderFormElement(setter)}
              </Form.Item>
            ))}
          </div>
        </div>
      ) : null,
      ...renderLooseSetters(group),
    ].filter(Boolean);
  }

  function renderDirectionalControls(group: StyleSetterGroupView, configs: DirectionalValueConfig[]) {
    const setterNames = new Set(group.setters.map(setter => setter.name));
    return configs
      .filter(config => Object.values(config.names).some(name => setterNames.has(name)))
      .map(config => (
        <DirectionalStyleControl
          key={config.key}
          config={config}
          preferredDirection={getPreferredDirectionalKey(config, setterNames)}
          setterMap={setterMap}
          onChange={valueChange}
        />
      ));
  }

  function renderLooseSetters(group: StyleSetterGroupView) {
    const compoundNames = compoundStyleNamesByGroup[group.key];

    return group.setters
      .filter(setter => !compoundNames?.has(setter.name))
      .map(setter => (
        <Form.Item key={setter.name} name={setter.name} label={setter.label}>
          {renderFormElement(setter)}
        </Form.Item>
      ));
  }

  return (
    <Form
      form={form}
      onFinish={valueChange}
      onValuesChange={valueChange}
      layout="vertical"
      className="setting-form appearance-panel"
    >
      {showEmptySearch ? (
        <div className="appearance-search-empty">
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="没有匹配的外观配置" />
        </div>
      ) : (
      <Collapse
        className="setting-collapse appearance-collapse"
        defaultActiveKey={['quick', 'css']}
        size="small"
        items={[
          {
            key: 'quick',
            label: <div className="appearance-collapse-title">
              <span className="appearance-collapse-title-text">{`快捷样式 (${quickStyleControlCount})`}</span>
              <Button
                size="small"
                type="text"
                className="appearance-reset-title-button"
                icon={<ReloadOutlined />}
                onClick={(event) => {
                  event.stopPropagation();
                  resetStyles();
                }}
              >
                恢复默认
              </Button>
            </div>,
            children: <div className="appearance-section">
              <div className="appearance-sync-card">
                <Typography.Text type="secondary" className="appearance-sync-text">
                  修改后会立即同步到画布。
                </Typography.Text>
                <Button size="small" icon={<ReloadOutlined />} onClick={resetStyles}>
                  恢复默认样式
                </Button>
              </div>
              {filteredSetters.length === 0 && (
                searchText
                  ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="没有匹配的快捷样式" />
                  : <div className="appearance-empty-note">当前组件暂无快捷样式。</div>
              )}
              {filteredStyleGroups.length > 0 && (
                <Collapse
                  className="appearance-sub-collapse"
                  size="small"
                  ghost
                  defaultActiveKey={searchText ? filteredStyleGroups.map(group => group.key) : defaultOpenStyleGroups}
                  items={filteredStyleGroups.map(renderStyleGroup)}
                />
              )}
            </div>,
          },
          {
            key: 'css',
            label: 'CSS 源码',
            children: showCssEditor ? <div className="appearance-section">
              <Alert
                className="appearance-css-alert"
                type="info"
                showIcon
                message="只需要编辑 .comp 选择器内部的 CSS 声明，保存后会同步为组件内联样式。"
              />
              <div className="appearance-css-editor-shell">
                <CssEditor value={ css } onChange={handleEditorChange}/>
              </div>
            </div> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="没有匹配的 CSS 配置" />,
          },
        ]}
      />
      )}
    </Form>
  )
}

function toCSSStr(css: Record<string, any>) {
  const declarations = Object.entries(css).reduce<string[]>((result, [key, rawValue]) => {
    const value = normalizeStyleValue(key, rawValue);
    if (value === undefined) {
      return result;
    }

    result.push(`  ${toKebabCase(key)}: ${value};`);
    return result;
  }, []);

  return declarations.length > 0
    ? `.comp {\n${declarations.join('\n')}\n}`
    : `.comp {\n\n}`;
}

function parseComponentCss(value: string) {
  const source = stripCssComments(value).trim();
  const declarations = extractComponentDeclarations(source);
  if (declarations === null) {
    return null;
  }

  const css: Record<string, any> = {};

  try {
    if (!declarations.trim()) {
      return {};
    }

    styleToObject(declarations, (name, value) => {
      if (!name || !value) return;
      const styleName = toCamelCase(name);
      css[styleName] = normalizeStyleValue(styleName, value);
    });

    return removeUndefinedStyleValues(css);
  } catch {
    return null;
  }
}

function stripCssComments(value: string) {
  return value.replace(/\/\*[\s\S]*?\*\//g, '');
}

function extractComponentDeclarations(value: string) {
  if (!value) {
    return '';
  }

  const blockMatch = value.match(/^\.comp\s*\{([\s\S]*)\}\s*$/);
  if (blockMatch) {
    const declarations = blockMatch[1].trim();
    return /[{}@]/.test(declarations) ? null : declarations;
  }

  if (/[{}@]/.test(value)) {
    return null;
  }

  return value;
}

function groupStyleSetters(setters: ComponentSetter[], searchText: string): StyleSetterGroupView[] {
  const groups = new Map<string, StyleSetterGroupView>();

  setters.forEach((setter) => {
    const groupKey = setter.group || 'custom';
    const groupLabel = setter.groupLabel || styleGroupLabels[groupKey] || groupKey;

    if (searchText && !matchesStyleSearch(setter, groupLabel, searchText)) {
      return;
    }

    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
        key: groupKey,
        label: groupLabel,
        setters: [],
      });
    }

    groups.get(groupKey)?.setters.push(setter);
  });

  return Array.from(groups.values()).sort((a, b) => {
    const aIndex = styleGroupOrder.indexOf(a.key);
    const bIndex = styleGroupOrder.indexOf(b.key);

    return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
  });
}

function matchesStyleSearch(setter: ComponentSetter, groupLabel: string, searchText: string) {
  return [
    setter.name,
    toKebabCase(setter.name),
    setter.label,
    setter.group,
    groupLabel,
    ...(setter.keywords || []),
  ].join(' ').toLowerCase().includes(searchText);
}

function getRenderableStyleControlCount(group: StyleSetterGroupView) {
  const compoundNames = compoundStyleNamesByGroup[group.key];

  if (!compoundNames) {
    return group.setters.length;
  }

  const setterNames = new Set(group.setters.map(setter => setter.name));
  const compoundCount = getStyleCompoundConfigs(group.key).filter(config => config.names.some(name => setterNames.has(name))).length;
  const looseCount = group.setters.filter(setter => !compoundNames.has(setter.name)).length;

  return compoundCount + looseCount;
}

function getStyleCompoundConfigs(groupKey: string) {
  if (groupKey === 'layout') {
    return layoutDirectionalConfigs.map(config => ({ key: config.key, names: Object.values(config.names) }));
  }

  if (groupKey === 'size') {
    return sizePairConfigs.map(config => ({ key: config.key, names: [config.widthName, config.heightName] }));
  }

  if (groupKey === 'spacing') {
    return directionalSpacingConfigs.map(config => ({ key: config.key, names: Object.values(config.names) }));
  }

  if (groupKey === 'border') {
    return [{ key: 'border', names: Array.from(borderStyleNames) }];
  }

  return [];
}

function getPreferredDirectionalKey(config: DirectionalValueConfig, setterNames: Set<string>): DirectionalValueKey {
  const availableDirections = config.directions.filter(item => {
    const name = config.names[item.key];
    return name && setterNames.has(name);
  });

  return availableDirections[0]?.key || 'all';
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

function getStyleUnit(setting?: ComponentSetter, name?: string) {
  if (setting?.unit) {
    return setting.unit;
  }

  return name && isPxDimensionStyle(name) ? 'px' : undefined;
}

function normalizeStyleValues(styles: CSSProperties, setterMap: Record<string, ComponentSetter> = {}) {
  return Object.entries(styles).reduce<Record<string, any>>((result, [name, value]) => {
    result[name] = normalizeStyleValue(name, value, setterMap[name]);
    return result;
  }, {});
}

function normalizeStyleValue(name: string, value: any, setting?: ComponentSetter) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const unit = getStyleUnit(setting, name);

  if (typeof value === 'number') {
    return unit === 'px' ? `${value}px` : value;
  }

  if (typeof value === 'string' && unit === 'px' && /^-?\d+(\.\d+)?$/.test(value.trim())) {
    return `${value.trim()}px`;
  }

  return value;
}

function toFormStyleValues(styles: Record<string, any>, setterMap: Record<string, ComponentSetter> = {}, setters: ComponentSetter[] = []) {
  const initialValues = setters.reduce<Record<string, any>>((result, setter) => {
    result[setter.name] = undefined;
    return result;
  }, {});

  return Object.entries(styles).reduce<Record<string, any>>((result, [name, value]) => {
    if (getStyleUnit(setterMap[name], name) === 'px') {
      result[name] = stripPx(value);
      return result;
    }

    result[name] = value;
    return result;
  }, initialValues);
}

function stripPx(value: any) {
  if (typeof value === 'string' && /^-?\d+(\.\d+)?px$/.test(value.trim())) {
    return Number(value.trim().replace(/px$/, ''));
  }

  return value;
}

function toCamelCase(value: string) {
  return value.trim().replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

function toKebabCase(value: string) {
  return value.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

function removeUndefinedStyleValues(styles: Record<string, any>) {
  return Object.entries(styles).reduce<Record<string, any>>((result, [name, value]) => {
    if (value !== undefined) {
      result[name] = value;
    }

    return result;
  }, {});
}
