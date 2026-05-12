import { Flex as AntdFlex, Space as AntdSpace, Steps, Tabs } from 'antd';
import { DraggableBlock, DropShell } from './common';
import { parseLineItems } from './utils';
import type { CommonComponentProps } from '../../interface';

export function SpaceDev({ children, direction, size, wrap, ...props }: CommonComponentProps) {
  return <DropShell {...props} className="p-[12px]" emptyText="拖入间距项">
    {children ? <AntdSpace direction={direction} size={size} wrap={wrap}>{children}</AntdSpace> : undefined}
  </DropShell>;
}

export function SpaceProd({ id: _id, name: _name, styles, children, direction, size, wrap, ...restProps }: CommonComponentProps) {
  return <AntdSpace style={styles} direction={direction} size={size} wrap={wrap} {...restProps}>{children}</AntdSpace>;
}

export function FlexDev({ children, direction, justify, align, gap, ...props }: CommonComponentProps) {
  return <DropShell {...props} className="p-[12px]" emptyText="拖入 Flex 子组件">
    {children ? <AntdFlex vertical={direction === 'vertical'} justify={justify} align={align} gap={gap}>{children}</AntdFlex> : undefined}
  </DropShell>;
}

export function FlexProd({ id: _id, name: _name, styles, children, direction, justify, align, gap, ...restProps }: CommonComponentProps) {
  return <AntdFlex style={styles} vertical={direction === 'vertical'} justify={justify} align={align} gap={gap} {...restProps}>{children}</AntdFlex>;
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

export function GridProd({ id: _id, name: _name, styles, children, columns, gap, ...restProps }: CommonComponentProps) {
  return <div
    style={{
      ...styles,
      display: 'grid',
      gridTemplateColumns: `repeat(${columns || 3}, minmax(0, 1fr))`,
      gap,
    }}
    {...restProps}
  >
    {children}
  </div>;
}

export function TabsDev({ itemsText, activeKey, ...props }: CommonComponentProps) {
  const items = parseLineItems(itemsText).map(item => ({
    key: item.key,
    label: item.label,
    children: item.children || `${item.label}内容`,
  }));

  return <DraggableBlock {...props}>
    <Tabs activeKey={activeKey} items={items} />
  </DraggableBlock>;
}

export function TabsProd({ id: _id, name: _name, children: _children, itemsText, activeKey, styles, ...restProps }: CommonComponentProps) {
  const items = parseLineItems(itemsText).map(item => ({
    key: item.key,
    label: item.label,
    children: item.children || `${item.label}内容`,
  }));

  return <div style={styles}><Tabs activeKey={activeKey} items={items} {...restProps} /></div>;
}

export function StepsDev({ itemsText, current, ...props }: CommonComponentProps) {
  return <DraggableBlock {...props}>
    <Steps current={Number(current) || 0} items={parseLineItems(itemsText)} />
  </DraggableBlock>;
}

export function StepsProd({ id: _id, name: _name, children: _children, itemsText, current, styles, ...restProps }: CommonComponentProps) {
  return <div style={styles}><Steps current={Number(current) || 0} items={parseLineItems(itemsText)} {...restProps} /></div>;
}
