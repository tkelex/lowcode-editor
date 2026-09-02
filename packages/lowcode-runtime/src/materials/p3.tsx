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
  Input,
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
} from 'antd';
import dayjs from 'dayjs';
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import type { CommonComponentProps } from '../types';
import { splitControlStyles } from './style';

const iconMap = {
  AppstoreOutlined,
  CheckCircleOutlined,
  HomeOutlined,
  PlusOutlined,
  SearchOutlined,
  SettingOutlined,
  UserOutlined,
};

export function LinkProd({ id: _id, name: _name, children: _children, href, text, target, disabled, styles, ...restProps }: CommonComponentProps) {
  return <a href={disabled ? undefined : (href || '#')} target={target} style={styles} aria-disabled={disabled} rel={target === '_blank' ? 'noreferrer' : undefined} {...restProps}>
    {text || '链接'}
  </a>;
}

export function IconProd({ id: _id, name: _name, children: _children, icon, size, color, styles, ...restProps }: CommonComponentProps) {
  const IconComponent = iconMap[(icon || 'AppstoreOutlined') as keyof typeof iconMap] || AppstoreOutlined;
  return <span style={{ ...styles, fontSize: size, color }} {...restProps}><IconComponent /></span>;
}

export function SpaceProd({ id: _id, name: _name, styles, children, direction, size, wrap, ...restProps }: CommonComponentProps) {
  return <AntdSpace style={styles} direction={direction} size={size} wrap={wrap} {...restProps}>{children}</AntdSpace>;
}

export function FlexProd({ id: _id, name: _name, styles, children, direction, justify, align, gap, ...restProps }: CommonComponentProps) {
  return <AntdFlex style={styles} vertical={direction === 'vertical'} justify={justify} align={align} gap={gap} {...restProps}>{children}</AntdFlex>;
}

export function GridProd({ id: _id, name: _name, styles, children, columns, gap, ...restProps }: CommonComponentProps) {
  return <div style={{ ...styles, display: 'grid', gridTemplateColumns: `repeat(${columns || 3}, minmax(0, 1fr))`, gap }} {...restProps}>{children}</div>;
}

export function TabsProd({ id: _id, name: _name, children: _children, itemsText, activeKey, type, styles, ...restProps }: CommonComponentProps) {
  const items = parseLineItems(itemsText).map(item => ({ key: item.key, label: item.label, children: item.children || `${item.label}内容` }));
  const initialActiveKey = getValidTabKey(activeKey, items);
  const [runtimeActiveKey, setRuntimeActiveKey] = useState(initialActiveKey);

  useEffect(() => setRuntimeActiveKey(initialActiveKey), [initialActiveKey]);

  return <div style={styles}><Tabs {...restProps} activeKey={runtimeActiveKey} type={type || 'line'} items={items} onChange={(nextActiveKey) => {
    setRuntimeActiveKey(nextActiveKey);
    restProps.onChange?.(nextActiveKey);
  }} /></div>;
}

export function StepsProd({ id: _id, name: _name, children: _children, itemsText, current, direction, styles, ...restProps }: CommonComponentProps) {
  const initialCurrent = Number(current) || 0;
  const [runtimeCurrent, setRuntimeCurrent] = useState(initialCurrent);

  useEffect(() => setRuntimeCurrent(initialCurrent), [initialCurrent]);

  return <div style={styles}><Steps {...restProps} current={runtimeCurrent} direction={direction} items={parseLineItems(itemsText)} onChange={(nextCurrent) => {
    setRuntimeCurrent(nextCurrent);
    restProps.onChange?.(nextCurrent);
  }} /></div>;
}

export function TextareaProd({ id: _id, name: _name, children: _children, placeholder, defaultValue, rows, disabled, showCount, maxLength, styles, ...restProps }: CommonComponentProps) {
  const { shellStyles, controlStyles } = splitControlStyles(styles);
  return <div style={shellStyles} className="inline-block min-w-[220px]"><Input.TextArea {...restProps} style={controlStyles} placeholder={placeholder} defaultValue={defaultValue} rows={rows} disabled={disabled} showCount={showCount} maxLength={maxLength} /></div>;
}

export function RadioProd({ id: _id, name: _name, children: _children, optionsText, defaultValue, disabled, styles, ...restProps }: CommonComponentProps) {
  const { shellStyles, controlStyles } = splitControlStyles(styles);
  return <div style={shellStyles}><Radio.Group {...restProps} style={controlStyles} options={parseOptions(optionsText)} defaultValue={defaultValue} disabled={disabled} /></div>;
}

export function CheckboxProd({ id: _id, name: _name, children: _children, optionsText, defaultValue, disabled, styles, ...restProps }: CommonComponentProps) {
  const { shellStyles, controlStyles } = splitControlStyles(styles);
  return <div style={shellStyles}><Checkbox.Group {...restProps} style={controlStyles} options={parseOptions(optionsText)} defaultValue={normalizeCheckboxValue(defaultValue)} disabled={disabled} /></div>;
}

export function DatePickerProd({ id: _id, name: _name, children: _children, placeholder, defaultValue, disabled, format, styles, ...restProps }: CommonComponentProps) {
  const { shellStyles, controlStyles } = splitControlStyles(styles);
  return <div style={shellStyles} className="inline-block"><DatePicker {...restProps} style={controlStyles} placeholder={placeholder} defaultValue={defaultValue ? dayjs(defaultValue) : undefined} disabled={disabled} format={format} /></div>;
}

export function UploadProd({ id: _id, name: _name, children: _children, buttonText, disabled, accept, multiple, styles, ...restProps }: CommonComponentProps) {
  const { shellStyles, controlStyles } = splitControlStyles(styles);
  return <div style={shellStyles} className="inline-block"><Upload {...restProps} disabled={disabled} accept={accept} multiple={multiple} beforeUpload={() => false}><Button style={controlStyles} icon={<UploadOutlined />}>{buttonText || '上传文件'}</Button></Upload></div>;
}

export function RateProd({ id: _id, name: _name, children: _children, defaultValue, count, disabled, allowHalf, styles, ...restProps }: CommonComponentProps) {
  const { shellStyles, controlStyles } = splitControlStyles(styles);
  return <div style={shellStyles} className="inline-block"><Rate {...restProps} style={controlStyles} defaultValue={Number(defaultValue) || 0} count={Number(count) || 5} disabled={disabled} allowHalf={allowHalf} /></div>;
}

export function ListProd({ id: _id, name: _name, children: _children, dataText, bordered, itemLayout, styles, ...restProps }: CommonComponentProps) {
  const data = parseJsonArray(dataText);
  return <div style={styles}><List {...restProps} itemLayout={itemLayout || 'horizontal'} bordered={bordered} dataSource={data} renderItem={(item) => <List.Item><List.Item.Meta title={item.title || item.name} description={item.description} /></List.Item>} /></div>;
}

export function DescriptionsProd({ id: _id, name: _name, children: _children, title, pairsText, column, bordered, size, styles, ...restProps }: CommonComponentProps) {
  return <div style={styles}><Descriptions {...restProps} title={title} column={Number(column) || 2} bordered={bordered} size={size} items={parseDescriptions(pairsText)} /></div>;
}

export function StatisticProd({ id: _id, name: _name, children: _children, title, value, suffix, prefix, precision, styles, ...restProps }: CommonComponentProps) {
  return <div style={styles}><Statistic {...restProps} title={title} value={value} suffix={suffix} prefix={prefix} precision={precision} /></div>;
}

export function PaginationProd({ id: _id, name: _name, children: _children, current, total, pageSize, showSizeChanger, styles, ...restProps }: CommonComponentProps) {
  const initialCurrent = Number(current) || 1;
  const initialPageSize = Number(pageSize) || 10;
  const [runtimeCurrent, setRuntimeCurrent] = useState(initialCurrent);
  const [runtimePageSize, setRuntimePageSize] = useState(initialPageSize);

  useEffect(() => setRuntimeCurrent(initialCurrent), [initialCurrent]);
  useEffect(() => setRuntimePageSize(initialPageSize), [initialPageSize]);

  return <div style={styles}><Pagination {...restProps} current={runtimeCurrent} total={Number(total) || 50} pageSize={runtimePageSize} showSizeChanger={showSizeChanger} onChange={(nextCurrent, nextPageSize) => {
    setRuntimeCurrent(nextCurrent);
    setRuntimePageSize(nextPageSize);
    restProps.onChange?.(nextCurrent, nextPageSize);
  }} /></div>;
}

export function ChartProd({ id: _id, name: _name, children: _children, title, dataText, styles, ...restProps }: CommonComponentProps) {
  const data = parseChartData(dataText);
  const maxValue = Math.max(...data.map(item => item.value), 1);
  return <div style={styles} {...restProps}>
    {title && <div className="mb-[12px] text-[14px] font-semibold text-[#0f172a]">{title}</div>}
    <div className="space-y-[8px]">{data.map(item => <div key={item.label} className="grid grid-cols-[72px_minmax(0,1fr)_44px] items-center gap-[8px] text-[12px] text-[#475569]">
      <span className="truncate">{item.label}</span>
      <div className="h-[10px] overflow-hidden rounded-full bg-[#e2e8f0]"><div className="h-full rounded-full bg-[#1677ff]" style={{ width: `${Math.max(4, (item.value / maxValue) * 100)}%` }} /></div>
      <span className="text-right">{item.value}</span>
    </div>)}</div>
  </div>;
}

export interface DrawerRef {
  open: () => void;
  close: () => void;
}

export const DrawerProd = forwardRef<DrawerRef, CommonComponentProps>(function DrawerProd(
  { id: _id, name: _name, title, placement, width, maskClosable, children, styles, onClose, ...restProps },
  ref,
) {
  const [open, setOpen] = useState(false);
  useImperativeHandle(ref, () => ({ open: () => setOpen(true), close: () => setOpen(false) }), []);
  return <Drawer title={title} placement={placement} width={width} maskClosable={maskClosable} style={styles} open={open} onClose={(event) => {
    onClose?.(event);
    setOpen(false);
  }} {...restProps}>{children}</Drawer>;
});

export function TooltipProd({ id: _id, name: _name, children: _children, title, text, placement, styles, ...restProps }: CommonComponentProps) {
  return <Tooltip title={title} placement={placement} {...restProps}><span style={styles} className="cursor-help">{text || '提示文本'}</span></Tooltip>;
}

export function PopoverProd({ id: _id, name: _name, children: _children, title, content, text, placement, styles, ...restProps }: CommonComponentProps) {
  return <Popover title={title} content={content} placement={placement} {...restProps}><Button style={styles}>{text || '打开气泡卡片'}</Button></Popover>;
}

export function NotificationProd({ id: _id, name: _name, children: _children, title, description, buttonText, type, placement, styles, onClick, ...restProps }: CommonComponentProps) {
  return <Button style={styles} onClick={(event) => {
    const notify = notification[(type || 'info') as 'success' | 'info' | 'warning' | 'error'] || notification.info;
    notify({ message: title || '通知', description, placement });
    onClick?.(event);
  }} {...restProps}>{buttonText || '显示通知'}</Button>;
}

export function ResultProd({ id: _id, name: _name, children: _children, status, title, subTitle, extraText, styles, ...restProps }: CommonComponentProps) {
  return <div style={styles}><Result {...restProps} status={status || 'success'} title={title} subTitle={subTitle} extra={extraText ? <Button type="primary">{extraText}</Button> : undefined} /></div>;
}

export function EmptyProd({ id: _id, name: _name, children: _children, description, styles, ...restProps }: CommonComponentProps) {
  return <div style={styles}><AntdEmpty {...restProps} description={description || '暂无数据'} /></div>;
}

function parseOptions(optionsText?: string) {
  return (optionsText || '').split(/[,，\n]/).map(item => item.trim()).filter(Boolean).map(item => {
    const [label, value] = item.includes(':') ? item.split(':') : [item, item];
    return { label: label.trim(), value: (value || label).trim() };
  });
}

function parseLineItems(value?: string) {
  return (value || '').split('\n').map(item => item.trim()).filter(Boolean).map((item, index) => {
    const [title, description] = item.includes(':') ? item.split(':') : [item, ''];
    return { key: String(index), title: title.trim(), label: title.trim(), children: (description || '').trim(), description: (description || '').trim() };
  });
}

function parseJsonArray(value?: string): Array<Record<string, any>> {
  if (!value) return [];
  try {
    const data = JSON.parse(value);
    return Array.isArray(data) ? data : [];
  } catch {
    return value.split('\n').filter(Boolean).map((item, index) => ({ id: index + 1, title: item, description: '' }));
  }
}

function parseDescriptions(value?: string) {
  return parseLineItems(value).map(item => ({ key: item.key, label: item.label, children: item.children }));
}

function parseChartData(value?: string) {
  return parseLineItems(value).map(item => ({ label: item.label, value: Number(item.children || 0) })).filter(item => Number.isFinite(item.value));
}

function normalizeCheckboxValue(value: unknown) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') return value.split(/[,，]/).map(item => item.trim()).filter(Boolean);
  return [];
}

function getValidTabKey(activeKey: unknown, items: Array<{ key: string }>) {
  const key = activeKey === undefined || activeKey === null ? '' : String(activeKey);
  return items.some(item => item.key === key) ? key : items[0]?.key;
}
