import { UploadOutlined } from '@ant-design/icons';
import { Button, Checkbox, DatePicker, Input, Radio, Rate, Upload } from 'antd';
import dayjs from 'dayjs';
import { DraggableBlock } from './common';
import { parseOptions } from './utils';
import type { CommonComponentProps } from '../../interface';

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
