import { Button, Drawer, Empty as AntdEmpty, Popover, Result, Tooltip, notification } from 'antd';
import { forwardRef, useImperativeHandle, useState } from 'react';
import { DraggableBlock, DraggableInline, DropShell } from './common';
import type { CommonComponentProps } from '../../interface';
import { COMMON_CHILDREN } from '../commonChildren';
import { splitControlStyles } from '../styleSplit';

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
  const { shellStyles, controlStyles } = splitControlStyles(props.styles);

  return <DraggableInline {...props} styles={shellStyles} className="rounded-[6px]">
    <Popover title={title} content={content}><Button style={controlStyles}>{text || '打开气泡卡片'}</Button></Popover>
  </DraggableInline>;
}

export function PopoverProd({ id: _id, name: _name, children: _children, title, content, text, styles, ...restProps }: CommonComponentProps) {
  return <Popover title={title} content={content} {...restProps}>
    <Button style={styles}>{text || '打开气泡卡片'}</Button>
  </Popover>;
}

export function NotificationDev({ title, description: _description, buttonText, type, ...props }: CommonComponentProps) {
  const { shellStyles, controlStyles } = splitControlStyles(props.styles);

  return <DraggableInline {...props} styles={shellStyles} className="rounded-[6px]">
    <Button style={controlStyles}>{buttonText || title || type || '通知'}</Button>
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
