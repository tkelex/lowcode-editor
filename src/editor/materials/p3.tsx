import {
  AppstoreOutlined,
  CheckCircleOutlined,
  HomeOutlined,
  PlusOutlined,
  SearchOutlined,
  SettingOutlined,
  UploadOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Button,
  Checkbox,
  DatePicker,
  Descriptions,
  Drawer,
  Empty as AntdEmpty,
  Flex as AntdFlex,
  List,
  Pagination,
  Popover,
  Radio,
  Rate,
  Result,
  Space as AntdSpace,
  Statistic,
  Steps,
  Tabs,
  Tooltip,
  Upload,
  notification,
  Input,
} from 'antd';
import dayjs from 'dayjs';
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useDrag } from 'react-dnd';
import { useMaterialDrop } from '../hooks/useMaterialDrop';
import { CommonComponentProps } from '../interface';
import { COMMON_CHILDREN } from './commonChildren';

const iconMap = {
  AppstoreOutlined,
  CheckCircleOutlined,
  HomeOutlined,
  PlusOutlined,
  SearchOutlined,
  SettingOutlined,
  UserOutlined,
};

interface DropShellProps extends CommonComponentProps {
  accept?: string[];
  className?: string;
  emptyText?: string;
  children?: React.ReactNode;
}

function useEditorDrag(name: string, id: number, ref: React.RefObject<HTMLElement>) {
  const [, drag] = useDrag({
    type: name,
    item: {
      type: name,
      dragType: 'move',
      id,
    },
  });

  useEffect(() => {
    drag(ref);
  }, [drag, ref]);
}

function DraggableBlock({ id, name, styles, className = '', children }: CommonComponentProps & { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEditorDrag(name, id, ref);

  return <div ref={ref} data-component-id={id} style={styles} className={`editor-component ${className}`}>
    {children}
  </div>;
}

function DraggableInline({ id, name, styles, className = '', children }: CommonComponentProps & { className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEditorDrag(name, id, ref);

  return <span ref={ref} data-component-id={id} style={styles} className={`editor-component editor-inline-component ${className}`}>
    {children}
  </span>;
}

function DropShell({ id, name, styles, className = '', accept = COMMON_CHILDREN, emptyText = '拖入组件', children }: DropShellProps) {
  const { canDrop, canDropCurrent, isOverCurrent, drop } = useMaterialDrop(accept, id);
  const ref = useRef<HTMLDivElement>(null);
  useEditorDrag(name, id, ref);

  useEffect(() => {
    drop(ref);
  }, [drop]);

  return <div
    ref={ref}
    data-component-id={id}
    style={styles}
    className={`editor-component editor-drop-zone min-h-[88px] ${className} ${canDrop ? 'can-drop' : ''} ${canDropCurrent ? 'is-drop-target' : ''} ${isOverCurrent && !canDropCurrent ? 'is-drop-disabled' : ''}`}
  >
    {children || <div className="editor-empty">{emptyText}</div>}
  </div>;
}

function parseOptions(optionsText?: string) {
  return (optionsText || '')
    .split(/[,，\n]/)
    .map(item => item.trim())
    .filter(Boolean)
    .map(item => {
      const [label, value] = item.includes(':') ? item.split(':') : [item, item];
      return {
        label: label.trim(),
        value: (value || label).trim(),
      };
    });
}

function parseLineItems(value?: string) {
  return (value || '')
    .split('\n')
    .map(item => item.trim())
    .filter(Boolean)
    .map((item, index) => {
      const [title, description] = item.includes(':') ? item.split(':') : [item, ''];
      return {
        key: String(index),
        title: title.trim(),
        label: title.trim(),
        children: (description || '').trim(),
        description: (description || '').trim(),
      };
    });
}

function parseJsonArray(value?: string): Array<Record<string, any>> {
  if (!value) return [];

  try {
    const data = JSON.parse(value);
    return Array.isArray(data) ? data : [];
  } catch {
    return value.split('\n').filter(Boolean).map((item, index) => ({
      id: index + 1,
      title: item,
      description: '',
    }));
  }
}

function parseDescriptions(value?: string) {
  return parseLineItems(value).map(item => ({
    key: item.key,
    label: item.label,
    children: item.children,
  }));
}

function parseChartData(value?: string) {
  return parseLineItems(value).map(item => ({
    label: item.label,
    value: Number(item.children || 0),
  })).filter(item => Number.isFinite(item.value));
}

function resolveIcon(iconName?: string) {
  const IconComponent = iconMap[(iconName || 'AppstoreOutlined') as keyof typeof iconMap] || AppstoreOutlined;
  return <IconComponent />;
}

export function LinkDev({ href, text, target, ...props }: CommonComponentProps) {
  return <DraggableInline {...props} className="rounded-[6px] p-[2px]">
    <a href={href || '#'} target={target} onClick={(event) => event.preventDefault()}>{text || '链接'}</a>
  </DraggableInline>;
}

export function LinkProd({ id: _id, name: _name, children: _children, href, text, target, styles, ...restProps }: CommonComponentProps) {
  return <a href={href || '#'} target={target} style={styles} rel={target === '_blank' ? 'noreferrer' : undefined} {...restProps}>
    {text || '链接'}
  </a>;
}

export function IconDev({ icon, size, color, ...props }: CommonComponentProps) {
  return <DraggableInline {...props} className="rounded-[6px] p-[4px] text-[#1677ff]">
    <span style={{ fontSize: size, color }}>{resolveIcon(icon)}</span>
  </DraggableInline>;
}

export function IconProd({ id: _id, name: _name, children: _children, icon, size, color, styles, ...restProps }: CommonComponentProps) {
  return <span style={{ ...styles, fontSize: size, color }} {...restProps}>{resolveIcon(icon)}</span>;
}

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

export function TextareaDev({ placeholder, defaultValue, rows, disabled, ...props }: CommonComponentProps) {
  return <DraggableBlock {...props} className="min-w-[220px] rounded-[6px] p-[2px]">
    <Input.TextArea placeholder={placeholder} defaultValue={defaultValue} rows={rows} disabled={disabled} />
  </DraggableBlock>;
}

export function TextareaProd({ id: _id, name: _name, children: _children, placeholder, defaultValue, rows, disabled, styles, ...restProps }: CommonComponentProps) {
  return <div style={styles} className="inline-block min-w-[220px]">
    <Input.TextArea {...restProps} placeholder={placeholder} defaultValue={defaultValue} rows={rows} disabled={disabled} />
  </div>;
}

export function RadioDev({ optionsText, defaultValue, disabled, ...props }: CommonComponentProps) {
  return <DraggableBlock {...props} className="rounded-[6px] p-[2px]">
    <Radio.Group options={parseOptions(optionsText)} defaultValue={defaultValue} disabled={disabled} />
  </DraggableBlock>;
}

export function RadioProd({ id: _id, name: _name, children: _children, optionsText, defaultValue, disabled, styles, ...restProps }: CommonComponentProps) {
  return <div style={styles}>
    <Radio.Group {...restProps} options={parseOptions(optionsText)} defaultValue={defaultValue} disabled={disabled} />
  </div>;
}

export function CheckboxDev({ optionsText, defaultValue, disabled, ...props }: CommonComponentProps) {
  return <DraggableBlock {...props} className="rounded-[6px] p-[2px]">
    <Checkbox.Group options={parseOptions(optionsText)} defaultValue={normalizeCheckboxValue(defaultValue)} disabled={disabled} />
  </DraggableBlock>;
}

export function CheckboxProd({ id: _id, name: _name, children: _children, optionsText, defaultValue, disabled, styles, ...restProps }: CommonComponentProps) {
  return <div style={styles}>
    <Checkbox.Group {...restProps} options={parseOptions(optionsText)} defaultValue={normalizeCheckboxValue(defaultValue)} disabled={disabled} />
  </div>;
}

function normalizeCheckboxValue(value: unknown) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    return value.split(/[,，]/).map(item => item.trim()).filter(Boolean);
  }

  return [];
}

export function DatePickerDev({ placeholder, defaultValue, disabled, ...props }: CommonComponentProps) {
  return <DraggableBlock {...props} className="inline-block rounded-[6px] p-[2px]">
    <DatePicker placeholder={placeholder} defaultValue={defaultValue ? dayjs(defaultValue) : undefined} disabled={disabled} />
  </DraggableBlock>;
}

export function DatePickerProd({ id: _id, name: _name, children: _children, placeholder, defaultValue, disabled, styles, ...restProps }: CommonComponentProps) {
  return <div style={styles} className="inline-block">
    <DatePicker {...restProps} placeholder={placeholder} defaultValue={defaultValue ? dayjs(defaultValue) : undefined} disabled={disabled} />
  </div>;
}

export function UploadDev({ buttonText, disabled, ...props }: CommonComponentProps) {
  return <DraggableBlock {...props} className="inline-block rounded-[6px] p-[2px]">
    <Upload disabled={disabled} beforeUpload={() => false}>
      <Button icon={<UploadOutlined />}>{buttonText || '上传文件'}</Button>
    </Upload>
  </DraggableBlock>;
}

export function UploadProd({ id: _id, name: _name, children: _children, buttonText, disabled, styles, ...restProps }: CommonComponentProps) {
  return <div style={styles} className="inline-block">
    <Upload {...restProps} disabled={disabled} beforeUpload={() => false}>
      <Button icon={<UploadOutlined />}>{buttonText || '上传文件'}</Button>
    </Upload>
  </div>;
}

export function RateDev({ defaultValue, count, disabled, ...props }: CommonComponentProps) {
  return <DraggableBlock {...props} className="inline-block rounded-[6px] p-[2px]">
    <Rate defaultValue={Number(defaultValue) || 0} count={Number(count) || 5} disabled={disabled} />
  </DraggableBlock>;
}

export function RateProd({ id: _id, name: _name, children: _children, defaultValue, count, disabled, styles, ...restProps }: CommonComponentProps) {
  return <div style={styles} className="inline-block">
    <Rate {...restProps} defaultValue={Number(defaultValue) || 0} count={Number(count) || 5} disabled={disabled} />
  </div>;
}

export function ListDev({ dataText, bordered, ...props }: CommonComponentProps) {
  const data = parseJsonArray(dataText);
  return <DraggableBlock {...props}>
    <List bordered={bordered} dataSource={data} renderItem={(item) => (
      <List.Item>
        <List.Item.Meta title={item.title || item.name} description={item.description} />
      </List.Item>
    )} />
  </DraggableBlock>;
}

export function ListProd({ id: _id, name: _name, children: _children, dataText, bordered, styles, ...restProps }: CommonComponentProps) {
  const data = parseJsonArray(dataText);
  return <div style={styles}>
    <List {...restProps} bordered={bordered} dataSource={data} renderItem={(item) => (
      <List.Item>
        <List.Item.Meta title={item.title || item.name} description={item.description} />
      </List.Item>
    )} />
  </div>;
}

export function DescriptionsDev({ title, pairsText, column, bordered, ...props }: CommonComponentProps) {
  return <DraggableBlock {...props}>
    <Descriptions title={title} column={Number(column) || 2} bordered={bordered} items={parseDescriptions(pairsText)} />
  </DraggableBlock>;
}

export function DescriptionsProd({ id: _id, name: _name, children: _children, title, pairsText, column, bordered, styles, ...restProps }: CommonComponentProps) {
  return <div style={styles}>
    <Descriptions {...restProps} title={title} column={Number(column) || 2} bordered={bordered} items={parseDescriptions(pairsText)} />
  </div>;
}

export function StatisticDev({ title, value, suffix, prefix, ...props }: CommonComponentProps) {
  return <DraggableBlock {...props} className="rounded-[8px] border border-[#e5e7eb] bg-white p-[14px]">
    <Statistic title={title} value={value} suffix={suffix} prefix={prefix} />
  </DraggableBlock>;
}

export function StatisticProd({ id: _id, name: _name, children: _children, title, value, suffix, prefix, styles, ...restProps }: CommonComponentProps) {
  return <div style={styles}>
    <Statistic {...restProps} title={title} value={value} suffix={suffix} prefix={prefix} />
  </div>;
}

export function PaginationDev({ current, total, pageSize, ...props }: CommonComponentProps) {
  return <DraggableBlock {...props}>
    <Pagination current={Number(current) || 1} total={Number(total) || 50} pageSize={Number(pageSize) || 10} />
  </DraggableBlock>;
}

export function PaginationProd({ id: _id, name: _name, children: _children, current, total, pageSize, styles, ...restProps }: CommonComponentProps) {
  return <div style={styles}>
    <Pagination {...restProps} current={Number(current) || 1} total={Number(total) || 50} pageSize={Number(pageSize) || 10} />
  </div>;
}

export function ChartDev({ title, dataText, ...props }: CommonComponentProps) {
  return <DraggableBlock {...props} className="rounded-[8px] border border-[#e5e7eb] bg-white p-[14px]">
    <ChartView title={title} data={parseChartData(dataText)} />
  </DraggableBlock>;
}

export function ChartProd({ id: _id, name: _name, children: _children, title, dataText, styles, ...restProps }: CommonComponentProps) {
  return <div style={styles} {...restProps}>
    <ChartView title={title} data={parseChartData(dataText)} />
  </div>;
}

function ChartView({ title, data }: { title?: string; data: Array<{ label: string; value: number }> }) {
  const maxValue = Math.max(...data.map(item => item.value), 1);

  return <div>
    {title && <div className="mb-[12px] text-[14px] font-semibold text-[#0f172a]">{title}</div>}
    <div className="space-y-[8px]">
      {data.map(item => (
        <div key={item.label} className="grid grid-cols-[72px_minmax(0,1fr)_44px] items-center gap-[8px] text-[12px] text-[#475569]">
          <span className="truncate">{item.label}</span>
          <div className="h-[10px] overflow-hidden rounded-full bg-[#e2e8f0]">
            <div className="h-full rounded-full bg-[#1677ff]" style={{ width: `${Math.max(4, (item.value / maxValue) * 100)}%` }} />
          </div>
          <span className="text-right">{item.value}</span>
        </div>
      ))}
    </div>
  </div>;
}

export function DrawerDev({ title, children, ...props }: CommonComponentProps) {
  return <DropShell {...props} className="p-[14px]" accept={COMMON_CHILDREN} emptyText="拖入抽屉内容">
    <div className="mb-[10px] flex items-center justify-between border-b border-[#eef2f7] pb-[8px]">
      <span className="font-semibold text-[#0f172a]">{title || '抽屉'}</span>
      <span className="rounded-[4px] bg-[#eff6ff] px-[6px] py-[2px] text-[11px] text-[#2563eb]">Drawer</span>
    </div>
    {children}
  </DropShell>;
}

export interface DrawerRef {
  open: () => void;
  close: () => void;
}

export const DrawerProd = forwardRef<DrawerRef, CommonComponentProps>(function DrawerProd(
  { id: _id, name: _name, title, placement, width, children, styles, onClose, ...restProps },
  ref,
) {
  const [open, setOpen] = useState(false);

  useImperativeHandle(ref, () => ({
    open: () => setOpen(true),
    close: () => setOpen(false),
  }), []);

  return <Drawer
    title={title}
    placement={placement}
    width={width}
    style={styles}
    open={open}
    onClose={(event) => {
      onClose?.(event);
      setOpen(false);
    }}
    {...restProps}
  >
    {children}
  </Drawer>;
});

export function TooltipDev({ title, text, ...props }: CommonComponentProps) {
  return <DraggableInline {...props} className="rounded-[6px] p-[2px]">
    <Tooltip title={title}><span className="cursor-help text-[#1677ff]">{text || '提示文本'}</span></Tooltip>
  </DraggableInline>;
}

export function TooltipProd({ id: _id, name: _name, children: _children, title, text, styles, ...restProps }: CommonComponentProps) {
  return <Tooltip title={title} {...restProps}>
    <span style={styles} className="cursor-help">{text || '提示文本'}</span>
  </Tooltip>;
}

export function PopoverDev({ title, content, text, ...props }: CommonComponentProps) {
  return <DraggableInline {...props} className="rounded-[6px] p-[2px]">
    <Popover title={title} content={content}><Button>{text || '打开气泡卡片'}</Button></Popover>
  </DraggableInline>;
}

export function PopoverProd({ id: _id, name: _name, children: _children, title, content, text, styles, ...restProps }: CommonComponentProps) {
  return <Popover title={title} content={content} {...restProps}>
    <Button style={styles}>{text || '打开气泡卡片'}</Button>
  </Popover>;
}

export function NotificationDev({ title, description: _description, buttonText, type, ...props }: CommonComponentProps) {
  return <DraggableInline {...props} className="rounded-[6px] p-[2px]">
    <Button>{buttonText || title || type || '通知'}</Button>
  </DraggableInline>;
}

export function NotificationProd({ id: _id, name: _name, children: _children, title, description, buttonText, type, styles, onClick, ...restProps }: CommonComponentProps) {
  return <Button
    style={styles}
    onClick={(event) => {
      const notify = notification[(type || 'info') as 'success' | 'info' | 'warning' | 'error'] || notification.info;
      notify({
        message: title || '通知',
        description,
      });
      onClick?.(event);
    }}
    {...restProps}
  >
    {buttonText || '显示通知'}
  </Button>;
}

export function ResultDev({ status, title, subTitle, ...props }: CommonComponentProps) {
  return <DraggableBlock {...props}>
    <Result status={status || 'success'} title={title} subTitle={subTitle} />
  </DraggableBlock>;
}

export function ResultProd({ id: _id, name: _name, children: _children, status, title, subTitle, styles, ...restProps }: CommonComponentProps) {
  return <div style={styles}>
    <Result {...restProps} status={status || 'success'} title={title} subTitle={subTitle} />
  </div>;
}

export function EmptyDev({ description, ...props }: CommonComponentProps) {
  return <DraggableBlock {...props}>
    <AntdEmpty description={description || '暂无数据'} />
  </DraggableBlock>;
}

export function EmptyProd({ id: _id, name: _name, children: _children, description, styles, ...restProps }: CommonComponentProps) {
  return <div style={styles}>
    <AntdEmpty {...restProps} description={description || '暂无数据'} />
  </div>;
}
