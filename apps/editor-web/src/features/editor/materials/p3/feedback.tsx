import { Button, Empty as AntdEmpty, Popover, Result, Tooltip } from 'antd';
import { DraggableBlock, DraggableInline, DropShell } from './common';
import type { CommonComponentProps } from '../types';
import { COMMON_CHILDREN } from '../commonChildren';
import { splitControlStyles } from '../style';

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

export function TooltipDev({ title, text, placement, ...props }: CommonComponentProps) {
  return <DraggableInline {...props} className="rounded-[6px] p-[2px]">
    <Tooltip title={title} placement={placement}><span className="cursor-help text-[#1677ff]">{text || '提示文本'}</span></Tooltip>
  </DraggableInline>;
}

export function PopoverDev({ title, content, text, placement, ...props }: CommonComponentProps) {
  const { shellStyles, controlStyles } = splitControlStyles(props.styles);

  return <DraggableInline {...props} styles={shellStyles} className="rounded-[6px]">
    <Popover title={title} content={content} placement={placement}><Button style={controlStyles}>{text || '打开气泡卡片'}</Button></Popover>
  </DraggableInline>;
}

export function NotificationDev({ title, description: _description, buttonText, type, ...props }: CommonComponentProps) {
  const { shellStyles, controlStyles } = splitControlStyles(props.styles);

  return <DraggableInline {...props} styles={shellStyles} className="rounded-[6px]">
    <Button style={controlStyles}>{buttonText || title || type || '通知'}</Button>
  </DraggableInline>;
}

export function ResultDev({ status, title, subTitle, extraText, ...props }: CommonComponentProps) {
  return <DraggableBlock {...props}>
    <Result status={status || 'success'} title={title} subTitle={subTitle} extra={extraText ? <Button type="primary">{extraText}</Button> : undefined} />
  </DraggableBlock>;
}

export function EmptyDev({ description, ...props }: CommonComponentProps) {
  return <DraggableBlock {...props}>
    <AntdEmpty description={description || '暂无数据'} />
  </DraggableBlock>;
}
