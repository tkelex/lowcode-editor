import { COMMON_CHILDREN } from '../materials/commonChildren';
import type { ActionType, EventCategory } from '../events/types';
import type { ComponentEvent, ComponentSetter } from './types';

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

export const commonStyleSetters: ComponentSetter[] = [
  { name: 'width', label: '宽度', type: 'input' },
  { name: 'height', label: '高度', type: 'input' },
  { name: 'margin', label: '外边距', type: 'input' },
  { name: 'padding', label: '内边距', type: 'input' },
];

export const clickEvents = [
  defineEvent('click', '点击事件', 'ui', '用户点击组件时触发', ['args']),
];

export const doubleClickEvent = defineEvent('doubleClick', '双击事件', 'ui', '用户双击组件时触发', ['args'], ['toast', 'componentAction', 'custom']);

export const valueChangeEvent = defineEvent('change', '值变化事件', 'value', '值变化时触发', ['value', 'args']);

export function inputSetter(name: string, label: string): ComponentSetter {
  return { name, label, type: 'input' };
}

export function textareaSetter(name: string, label: string): ComponentSetter {
  return { name, label, type: 'textarea' };
}

export function numberSetter(name: string, label: string): ComponentSetter {
  return { name, label, type: 'inputNumber' };
}

export function selectSetter(name: string, label: string, options: Array<{ label: string; value: any }>): ComponentSetter {
  return { name, label, type: 'select', options };
}

export function baseContainerAccepts() {
  return [...COMMON_CHILDREN, 'Modal'];
}
