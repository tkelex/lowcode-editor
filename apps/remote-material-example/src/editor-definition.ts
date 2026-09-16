import type { ComponentType } from 'react';
import type { ExampleEditorMaterialDefinition } from './contract';
import type { CustomerMetricCardProps } from './customer-metric-card';
import { exampleMaterial } from './constants';

export function createCustomerMetricCardEditorDefinition(
  devComponent: ComponentType<CustomerMetricCardProps>,
  prodComponent: ComponentType<CustomerMetricCardProps>,
): ExampleEditorMaterialDefinition {
  return {
    name: exampleMaterial.materialName,
    desc: '客户指标卡',
    category: 'data',
    icon: '№',
    keywords: ['customer', 'metric', '客户', '指标'],
    sort: 80,
    defaultProps: {
      title: '客户指标',
      value: 128,
      unit: '人',
      accentColor: '#2563eb',
      actionText: '刷新数据',
    },
    acceptsChildren: true,
    setter: [
      { name: 'title', label: '标题', type: 'input', group: 'basic' },
      { name: 'value', label: '数值', type: 'number', group: 'data', min: 0 },
      { name: 'unit', label: '单位', type: 'input', group: 'data' },
      { name: 'accentColor', label: '强调色', type: 'color', group: 'basic' },
      { name: 'actionText', label: '按钮文案', type: 'input', group: 'advanced' },
    ],
    events: [
      { name: 'action', label: '操作事件', propName: 'onAction' },
    ],
    methods: [
      { name: 'reset', label: '重置刷新次数' },
    ],
    dev: devComponent,
    prod: prodComponent,
  };
}
