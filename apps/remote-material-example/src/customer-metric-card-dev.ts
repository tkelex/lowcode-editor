import type { CSSProperties, ComponentType } from 'react';
import type { ExampleMaterialHost } from './contract';
import type { CustomerMetricCardProps } from './customer-metric-card';
import { exampleMaterial } from './constants';

export interface CustomerMetricCardDevProps extends CustomerMetricCardProps {
  id?: number | string;
  styles?: CSSProperties;
}

export function createCustomerMetricCardDev(
  host: ExampleMaterialHost,
  CustomerMetricCard: ComponentType<CustomerMetricCardProps>,
) {
  const { React } = host.shared;

  return function CustomerMetricCardDev({ id, styles, ...props }: CustomerMetricCardDevProps) {
    return React.createElement(
      'div',
      {
        'data-component-id': id,
        'data-component-name': exampleMaterial.materialName,
        style: {
          minHeight: 120,
          border: '1px dashed #cbd5e1',
          borderRadius: 8,
          background: '#f8fafc',
          padding: 4,
          ...styles,
        },
      },
      React.createElement(CustomerMetricCard, props),
    );
  };
}
