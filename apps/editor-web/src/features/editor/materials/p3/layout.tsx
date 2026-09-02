import { Flex as AntdFlex, Space as AntdSpace, Steps, Tabs } from 'antd';
import { DraggableBlock, DropShell } from './common';
import { parseLineItems } from './utils';
import type { CommonComponentProps } from '../types';

export function SpaceDev({ children, direction, size, wrap, ...props }: CommonComponentProps) {
  return <DropShell {...props} className="p-[12px]" emptyText="拖入间距项">
    {children ? <AntdSpace direction={direction} size={size} wrap={wrap}>{children}</AntdSpace> : undefined}
  </DropShell>;
}

export function FlexDev({ children, direction, justify, align, gap, ...props }: CommonComponentProps) {
  return <DropShell {...props} className="p-[12px]" emptyText="拖入 Flex 子组件">
    {children ? <AntdFlex vertical={direction === 'vertical'} justify={justify} align={align} gap={gap}>{children}</AntdFlex> : undefined}
  </DropShell>;
}

export function GridDev({ children, columns, gap, ...props }: CommonComponentProps) {
  return <DropShell
    {...props}
    className="grid p-[12px]"
    emptyText="拖入网格子组件"
    styles={{
      ...props.styles,
      gridTemplateColumns: `repeat(${columns || 3}, minmax(0, 1fr))`,
      gap,
    }}
  >
    {children}
  </DropShell>;
}

export function TabsDev({ itemsText, activeKey, type, ...props }: CommonComponentProps) {
  const items = parseLineItems(itemsText).map(item => ({
    key: item.key,
    label: item.label,
    children: item.children || `${item.label}内容`,
  }));

  return <DraggableBlock {...props}>
    <Tabs activeKey={activeKey} type={type || 'line'} items={items} />
  </DraggableBlock>;
}

export function StepsDev({ itemsText, current, direction, ...props }: CommonComponentProps) {
  return <DraggableBlock {...props}>
    <Steps current={Number(current) || 0} direction={direction} items={parseLineItems(itemsText)} />
  </DraggableBlock>;
}
