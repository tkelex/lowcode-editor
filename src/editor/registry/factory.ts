import { COMMON_CHILDREN } from '../materials/commonChildren';
import type { ActionType, EventCategory } from '../events/types';
import type {
  ComponentEvent,
  ComponentSetter,
  ComponentSetterGroup,
  ComponentSetterOption,
  StyleSetterControl,
  StyleSetterUnit,
} from './types';

type SetterExtra = Omit<ComponentSetter, 'name' | 'label' | 'type' | 'options'>;

export const ACTIONS = {
  ui: ['toast', 'url', 'componentAction', 'componentControl', 'confirm', 'condition', 'http', 'setComponentProps', 'setComponentStyles', 'setVariable', 'custom'] as ActionType[],
  value: ['toast', 'componentAction', 'componentControl', 'condition', 'http', 'setComponentProps', 'setComponentStyles', 'setVariable', 'custom'] as ActionType[],
  submit: ['toast', 'url', 'componentAction', 'componentControl', 'confirm', 'condition', 'http', 'setComponentProps', 'setComponentStyles', 'setVariable', 'custom'] as ActionType[],
  overlay: ['toast', 'componentAction', 'componentControl', 'confirm', 'condition', 'http', 'setComponentProps', 'setComponentStyles', 'setVariable', 'custom'] as ActionType[],
  lifecycle: ['toast', 'componentAction', 'componentControl', 'condition', 'http', 'setComponentProps', 'setComponentStyles', 'setVariable', 'custom'] as ActionType[],
};

export function defineEvent(
  name: string,
  label: string,
  category: EventCategory,
  description: string,
  eventDataSchema: string[],
  allowedActions = ACTIONS[category],
  propName?: string,
): ComponentEvent {
  return {
    name,
    label,
    category,
    description,
    eventDataSchema,
    allowedActions,
    propName,
  };
}

export const boolOptions = [
  { label: '是', value: true },
  { label: '否', value: false },
];

export const openTargetOptions = [
  { label: '当前窗口', value: '_self' },
  { label: '新窗口', value: '_blank' },
];

export const propertyGroupLabels: Record<string, string> = {
  basic: '基本',
  data: '数据',
  mobile: '移动端',
  advanced: '高级',
};

export const propertyGroupOrder = ['basic', 'data', 'mobile', 'advanced'];

export function getSetterGroup(setting: ComponentSetter): ComponentSetterGroup {
  return setting.group || 'basic';
}

export function getSetterGroupLabel(group: ComponentSetterGroup) {
  return propertyGroupLabels[group] || group;
}

interface StyleSetterConfig {
  name: string;
  label: string;
  group: string;
  control?: StyleSetterControl;
  unit?: StyleSetterUnit;
  options?: ComponentSetterOption[];
  keywords?: string[];
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
}

export const styleGroupLabels: Record<string, string> = {
  layout: '布局',
  size: '尺寸',
  spacing: '间距',
  typography: '文字',
  background: '背景',
  border: '边框',
  effect: '效果',
  display: '显示',
  custom: '其他',
};

export const styleGroupOrder = ['layout', 'size', 'spacing', 'typography', 'background', 'border', 'effect', 'display', 'custom'];

export const defaultOpenStyleGroups = ['layout', 'size', 'spacing', 'typography', 'background', 'border'];

export const displayOptions = [
  { label: '默认', value: '' },
  { label: '块级 block', value: 'block' },
  { label: '行内 inline', value: 'inline' },
  { label: '行内块 inline-block', value: 'inline-block' },
  { label: '弹性 flex', value: 'flex' },
  { label: '网格 grid', value: 'grid' },
  { label: '隐藏 none', value: 'none' },
];

export const flexDirectionOptions = [
  { label: '横向', value: 'row' },
  { label: '横向反转', value: 'row-reverse' },
  { label: '纵向', value: 'column' },
  { label: '纵向反转', value: 'column-reverse' },
];

export const justifyContentOptions = [
  { label: '起始', value: 'flex-start' },
  { label: '居中', value: 'center' },
  { label: '结束', value: 'flex-end' },
  { label: '两端', value: 'space-between' },
  { label: '环绕', value: 'space-around' },
  { label: '均分', value: 'space-evenly' },
];

export const alignItemsOptions = [
  { label: '拉伸', value: 'stretch' },
  { label: '起始', value: 'flex-start' },
  { label: '居中', value: 'center' },
  { label: '结束', value: 'flex-end' },
  { label: '基线', value: 'baseline' },
];

export const positionOptions = [
  { label: '默认 static', value: 'static' },
  { label: '相对 relative', value: 'relative' },
  { label: '绝对 absolute', value: 'absolute' },
  { label: '固定 fixed', value: 'fixed' },
  { label: '粘性 sticky', value: 'sticky' },
];

export const overflowOptions = [
  { label: '默认 visible', value: 'visible' },
  { label: '隐藏 hidden', value: 'hidden' },
  { label: '滚动 scroll', value: 'scroll' },
  { label: '自动 auto', value: 'auto' },
];

export const textAlignOptions = [
  { label: '左对齐', value: 'left' },
  { label: '居中', value: 'center' },
  { label: '右对齐', value: 'right' },
  { label: '两端对齐', value: 'justify' },
];

export const fontWeightOptions = [
  { label: '正常', value: '400' },
  { label: '中等', value: '500' },
  { label: '加粗', value: '600' },
  { label: '粗体', value: '700' },
];

export const textDecorationOptions = [
  { label: '无', value: 'none' },
  { label: '下划线', value: 'underline' },
  { label: '删除线', value: 'line-through' },
];

export const whiteSpaceOptions = [
  { label: '默认', value: 'normal' },
  { label: '不换行', value: 'nowrap' },
  { label: '保留换行', value: 'pre-wrap' },
];

export const backgroundRepeatOptions = [
  { label: '重复', value: 'repeat' },
  { label: '不重复', value: 'no-repeat' },
  { label: '横向重复', value: 'repeat-x' },
  { label: '纵向重复', value: 'repeat-y' },
];

export const borderStyleOptions = [
  { label: '无', value: 'none' },
  { label: '实线', value: 'solid' },
  { label: '虚线', value: 'dashed' },
  { label: '点线', value: 'dotted' },
  { label: '双线', value: 'double' },
];

export const visibilityOptions = [
  { label: '显示', value: 'visible' },
  { label: '隐藏占位', value: 'hidden' },
];

export const objectFitOptions = [
  { label: '填充', value: 'fill' },
  { label: '适应', value: 'contain' },
  { label: '裁剪覆盖', value: 'cover' },
  { label: '原始尺寸', value: 'none' },
  { label: '等比缩放', value: 'scale-down' },
];

export function styleSetter({
  name,
  label,
  group,
  control = 'input',
  unit,
  options,
  keywords,
  min,
  max,
  step,
  placeholder,
}: StyleSetterConfig): ComponentSetter {
  const type = control === 'select' ? 'select' : control === 'number' ? 'inputNumber' : 'input';

  return {
    name,
    label,
    type,
    group,
    groupLabel: styleGroupLabels[group] || '其他',
    control,
    unit,
    options,
    keywords,
    min,
    max,
    step,
    placeholder,
  };
}

export function pxStyleSetter(name: string, label: string, group: string, keywords?: string[]) {
  return styleSetter({ name, label, group, control: 'number', unit: 'px', keywords });
}

export function numberStyleSetter(name: string, label: string, group: string, config: Partial<StyleSetterConfig> = {}) {
  return styleSetter({ name, label, group, control: 'number', unit: 'number', ...config });
}

export function colorStyleSetter(name: string, label: string, group: string, keywords?: string[]) {
  return styleSetter({ name, label, group, control: 'color', keywords });
}

export function selectStyleSetter(name: string, label: string, group: string, options: ComponentSetterOption[], keywords?: string[]) {
  return styleSetter({ name, label, group, control: 'select', options, keywords });
}

export const commonStyleSetters: ComponentSetter[] = [
  selectStyleSetter('display', '显示方式', 'layout', displayOptions, ['display', '布局', '显示']),
  selectStyleSetter('flexDirection', 'Flex 方向', 'layout', flexDirectionOptions, ['flex', '方向']),
  selectStyleSetter('justifyContent', '主轴对齐', 'layout', justifyContentOptions, ['flex', '对齐']),
  selectStyleSetter('alignItems', '交叉轴对齐', 'layout', alignItemsOptions, ['flex', '对齐']),
  pxStyleSetter('gap', '间距 gap', 'layout', ['gap', '间距']),
  selectStyleSetter('position', '定位方式', 'layout', positionOptions, ['position', '定位']),
  pxStyleSetter('top', '上偏移', 'layout', ['top', '定位']),
  pxStyleSetter('right', '右偏移', 'layout', ['right', '定位']),
  pxStyleSetter('bottom', '下偏移', 'layout', ['bottom', '定位']),
  pxStyleSetter('left', '左偏移', 'layout', ['left', '定位']),
  numberStyleSetter('zIndex', '层级 z-index', 'layout', { step: 1, keywords: ['z-index', '层级'] }),
  selectStyleSetter('overflow', '溢出', 'layout', overflowOptions, ['overflow', '滚动', '裁剪']),

  pxStyleSetter('width', '宽度', 'size'),
  pxStyleSetter('height', '高度', 'size'),
  pxStyleSetter('minWidth', '最小宽度', 'size'),
  pxStyleSetter('minHeight', '最小高度', 'size'),
  pxStyleSetter('maxWidth', '最大宽度', 'size'),
  pxStyleSetter('maxHeight', '最大高度', 'size'),

  pxStyleSetter('margin', '外边距', 'spacing'),
  pxStyleSetter('marginTop', '上外边距', 'spacing'),
  pxStyleSetter('marginRight', '右外边距', 'spacing'),
  pxStyleSetter('marginBottom', '下外边距', 'spacing'),
  pxStyleSetter('marginLeft', '左外边距', 'spacing'),
  pxStyleSetter('padding', '内边距', 'spacing'),
  pxStyleSetter('paddingTop', '上内边距', 'spacing'),
  pxStyleSetter('paddingRight', '右内边距', 'spacing'),
  pxStyleSetter('paddingBottom', '下内边距', 'spacing'),
  pxStyleSetter('paddingLeft', '左内边距', 'spacing'),

  pxStyleSetter('fontSize', '字号', 'typography', ['font-size', '文字']),
  selectStyleSetter('fontWeight', '字重', 'typography', fontWeightOptions, ['font-weight', '文字']),
  numberStyleSetter('lineHeight', '行高', 'typography', { min: 0, step: 0.1, keywords: ['line-height', '文字'] }),
  colorStyleSetter('color', '文字颜色', 'typography', ['color', '颜色', '文字']),
  selectStyleSetter('textAlign', '文本对齐', 'typography', textAlignOptions, ['text-align', '文字']),
  selectStyleSetter('textDecoration', '文本装饰', 'typography', textDecorationOptions, ['text-decoration', '文字']),
  selectStyleSetter('whiteSpace', '换行', 'typography', whiteSpaceOptions, ['white-space', '文字']),

  colorStyleSetter('backgroundColor', '背景色', 'background', ['background-color', '背景', '颜色']),
  styleSetter({ name: 'backgroundImage', label: '背景图片', group: 'background', placeholder: 'url(...)' }),
  styleSetter({ name: 'backgroundSize', label: '背景尺寸', group: 'background', placeholder: 'cover / contain / 100% 100%' }),
  styleSetter({ name: 'backgroundPosition', label: '背景位置', group: 'background', placeholder: 'center / top left' }),
  selectStyleSetter('backgroundRepeat', '背景重复', 'background', backgroundRepeatOptions, ['background-repeat', '背景']),

  pxStyleSetter('borderWidth', '边框宽度', 'border', ['border-width', '边框']),
  selectStyleSetter('borderStyle', '边框样式', 'border', borderStyleOptions, ['border-style', '边框']),
  colorStyleSetter('borderColor', '边框颜色', 'border', ['border-color', '边框', '颜色']),
  pxStyleSetter('borderRadius', '圆角', 'border', ['border-radius', '边框']),

  styleSetter({ name: 'boxShadow', label: '阴影', group: 'effect', placeholder: '0 8px 20px rgba(15,23,42,.12)', keywords: ['shadow', '阴影'] }),
  numberStyleSetter('opacity', '透明度', 'effect', { min: 0, max: 1, step: 0.05, keywords: ['opacity', '透明'] }),
  selectStyleSetter('visibility', '可见性', 'effect', visibilityOptions, ['visibility', '显示']),
];

export const imageStyleSetters: ComponentSetter[] = [
  ...commonStyleSetters,
  selectStyleSetter('objectFit', '图片填充', 'size', objectFitOptions, ['object-fit', '图片']),
];

export const clickEvents = [
  defineEvent('click', '点击事件', 'ui', '用户点击组件时触发', ['args']),
];

export const doubleClickEvent = defineEvent('doubleClick', '双击事件', 'ui', '用户双击组件时触发', ['args'], ['toast', 'componentAction', 'custom']);

export const valueChangeEvent = defineEvent('change', '值变化事件', 'value', '值变化时触发', ['value', 'args']);

export function inputSetter(name: string, label: string, extra: SetterExtra = {}): ComponentSetter {
  return { name, label, type: 'input', ...extra };
}

export function textareaSetter(name: string, label: string, extra: SetterExtra = {}): ComponentSetter {
  return { name, label, type: 'textarea', ...extra };
}

export function numberSetter(name: string, label: string, extra: SetterExtra = {}): ComponentSetter {
  return { name, label, type: 'inputNumber', ...extra };
}

export function selectSetter(name: string, label: string, options: ComponentSetterOption[], extra: SetterExtra = {}): ComponentSetter {
  return { name, label, type: 'select', options, ...extra };
}

export function switchSetter(name: string, label: string, extra: SetterExtra = {}): ComponentSetter {
  return { name, label, type: 'switch', ...extra };
}

export function checkboxSetter(name: string, label: string, extra: SetterExtra = {}): ComponentSetter {
  return { name, label, type: 'checkbox', valuePropName: 'checked', ...extra };
}

export function jsonSetter(name: string, label: string, extra: SetterExtra = {}): ComponentSetter {
  return {
    name,
    label,
    type: 'json',
    mode: 'json',
    validate: 'json',
    rows: 5,
    ...extra,
  };
}

export function urlSetter(name: string, label: string, extra: SetterExtra = {}): ComponentSetter {
  return {
    name,
    label,
    type: 'url',
    mode: 'url',
    placeholder: 'http://',
    ...extra,
  };
}

export function baseContainerAccepts() {
  return [...COMMON_CHILDREN, 'Modal'];
}
