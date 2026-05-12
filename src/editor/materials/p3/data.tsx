import { Descriptions, List, Pagination, Statistic } from 'antd';
import { DraggableBlock } from './common';
import { parseChartData, parseDescriptions, parseJsonArray } from './utils';
import type { CommonComponentProps } from '../../interface';

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
