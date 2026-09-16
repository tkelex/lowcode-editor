import type { CSSProperties, ReactNode } from 'react';
import type { ExampleMaterialHost } from './contract';

export interface CustomerMetricCardProps {
  title?: string;
  value?: number;
  unit?: string;
  accentColor?: string;
  actionText?: string;
  children?: ReactNode;
  style?: CSSProperties;
  onAction?: (event: { actionCount: number; value: number }) => void;
}

export interface CustomerMetricCardRef {
  reset(): void;
}

export function createCustomerMetricCard(host: ExampleMaterialHost) {
  const { React, antd } = host.shared;
  const { Button, Card, Space, Statistic, Tag } = antd;

  return React.forwardRef<CustomerMetricCardRef, CustomerMetricCardProps>(
    function CustomerMetricCard(props, ref) {
      const {
        accentColor = '#2563eb',
        actionText = '刷新数据',
        children,
        onAction,
        style,
        title = '客户指标',
        unit = '人',
        value = 128,
      } = props;
      const [actionCount, setActionCount] = React.useState(0);

      React.useImperativeHandle(ref, () => ({
        reset() {
          setActionCount(0);
        },
      }), []);

      const handleAction = () => {
        const nextCount = actionCount + 1;
        setActionCount(nextCount);
        onAction?.({ actionCount: nextCount, value });
      };

      return React.createElement(
        Card,
        {
          size: 'small',
          title,
          style: {
            borderColor: '#e2e8f0',
            borderRadius: 8,
            borderTop: `3px solid ${accentColor}`,
            boxShadow: '0 1px 2px rgba(15, 23, 42, 0.06)',
            ...style,
          },
        },
        React.createElement(
          Space,
          { direction: 'vertical', size: 12, style: { width: '100%' } },
          React.createElement(Statistic, { title: '当前数值', value, suffix: unit }),
          actionCount > 0
            ? React.createElement(Tag, { color: 'blue' }, `已刷新 ${actionCount} 次`)
            : null,
          children
            ? React.createElement(
                'div',
                { style: { color: '#64748b', fontSize: 12, lineHeight: 1.6 } },
                children,
              )
            : null,
          React.createElement(
            Button,
            { type: 'primary', onClick: handleAction },
            actionText,
          ),
        ),
      );
    },
  );
}
