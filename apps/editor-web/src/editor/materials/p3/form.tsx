import { UploadOutlined } from '@ant-design/icons';
import { Button, Checkbox, DatePicker, Input, Radio, Rate, Upload } from 'antd';
import dayjs from 'dayjs';
import { DraggableBlock } from './common';
import { parseOptions } from './utils';
import type { CommonComponentProps } from '../../interface';
import { splitControlStyles } from '../styleSplit';

export function TextareaDev({ placeholder, defaultValue, rows, disabled, showCount, maxLength, ...props }: CommonComponentProps) {
  const { shellStyles, controlStyles } = splitControlStyles(props.styles);

  return <DraggableBlock {...props} styles={shellStyles} className="min-w-[220px] rounded-[6px]">
    <Input.TextArea style={controlStyles} placeholder={placeholder} defaultValue={defaultValue} rows={rows} disabled={disabled} showCount={showCount} maxLength={maxLength} />
  </DraggableBlock>;
}

export function TextareaProd({ id: _id, name: _name, children: _children, placeholder, defaultValue, rows, disabled, showCount, maxLength, styles, ...restProps }: CommonComponentProps) {
  const { shellStyles, controlStyles } = splitControlStyles(styles);

  return <div style={shellStyles} className="inline-block min-w-[220px]">
    <Input.TextArea {...restProps} style={controlStyles} placeholder={placeholder} defaultValue={defaultValue} rows={rows} disabled={disabled} showCount={showCount} maxLength={maxLength} />
  </div>;
}

export function RadioDev({ optionsText, defaultValue, disabled, ...props }: CommonComponentProps) {
  const { shellStyles, controlStyles } = splitControlStyles(props.styles);

  return <DraggableBlock {...props} styles={shellStyles} className="rounded-[6px] p-[2px]">
    <Radio.Group style={controlStyles} options={parseOptions(optionsText)} defaultValue={defaultValue} disabled={disabled} />
  </DraggableBlock>;
}

export function RadioProd({ id: _id, name: _name, children: _children, optionsText, defaultValue, disabled, styles, ...restProps }: CommonComponentProps) {
  const { shellStyles, controlStyles } = splitControlStyles(styles);

  return <div style={shellStyles}>
    <Radio.Group {...restProps} style={controlStyles} options={parseOptions(optionsText)} defaultValue={defaultValue} disabled={disabled} />
  </div>;
}

export function CheckboxDev({ optionsText, defaultValue, disabled, ...props }: CommonComponentProps) {
  const { shellStyles, controlStyles } = splitControlStyles(props.styles);

  return <DraggableBlock {...props} styles={shellStyles} className="rounded-[6px] p-[2px]">
    <Checkbox.Group style={controlStyles} options={parseOptions(optionsText)} defaultValue={normalizeCheckboxValue(defaultValue)} disabled={disabled} />
  </DraggableBlock>;
}

export function CheckboxProd({ id: _id, name: _name, children: _children, optionsText, defaultValue, disabled, styles, ...restProps }: CommonComponentProps) {
  const { shellStyles, controlStyles } = splitControlStyles(styles);

  return <div style={shellStyles}>
    <Checkbox.Group {...restProps} style={controlStyles} options={parseOptions(optionsText)} defaultValue={normalizeCheckboxValue(defaultValue)} disabled={disabled} />
  </div>;
}

function normalizeCheckboxValue(value: unknown) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    return value.split(/[,，]/).map(item => item.trim()).filter(Boolean);
  }

  return [];
}

export function DatePickerDev({ placeholder, defaultValue, disabled, format, ...props }: CommonComponentProps) {
  const { shellStyles, controlStyles } = splitControlStyles(props.styles);

  return <DraggableBlock {...props} styles={shellStyles} className="inline-block rounded-[6px]">
    <DatePicker style={controlStyles} placeholder={placeholder} defaultValue={defaultValue ? dayjs(defaultValue) : undefined} disabled={disabled} format={format} />
  </DraggableBlock>;
}

export function DatePickerProd({ id: _id, name: _name, children: _children, placeholder, defaultValue, disabled, format, styles, ...restProps }: CommonComponentProps) {
  const { shellStyles, controlStyles } = splitControlStyles(styles);

  return <div style={shellStyles} className="inline-block">
    <DatePicker {...restProps} style={controlStyles} placeholder={placeholder} defaultValue={defaultValue ? dayjs(defaultValue) : undefined} disabled={disabled} format={format} />
  </div>;
}

export function UploadDev({ buttonText, disabled, accept, multiple, ...props }: CommonComponentProps) {
  const { shellStyles, controlStyles } = splitControlStyles(props.styles);

  return <DraggableBlock {...props} styles={shellStyles} className="inline-block rounded-[6px]">
    <Upload disabled={disabled} accept={accept} multiple={multiple} beforeUpload={() => false}>
      <Button style={controlStyles} icon={<UploadOutlined />}>{buttonText || '上传文件'}</Button>
    </Upload>
  </DraggableBlock>;
}

export function UploadProd({ id: _id, name: _name, children: _children, buttonText, disabled, accept, multiple, styles, ...restProps }: CommonComponentProps) {
  const { shellStyles, controlStyles } = splitControlStyles(styles);

  return <div style={shellStyles} className="inline-block">
    <Upload {...restProps} disabled={disabled} accept={accept} multiple={multiple} beforeUpload={() => false}>
      <Button style={controlStyles} icon={<UploadOutlined />}>{buttonText || '上传文件'}</Button>
    </Upload>
  </div>;
}

export function RateDev({ defaultValue, count, disabled, allowHalf, ...props }: CommonComponentProps) {
  const { shellStyles, controlStyles } = splitControlStyles(props.styles);

  return <DraggableBlock {...props} styles={shellStyles} className="inline-block rounded-[6px] p-[2px]">
    <Rate style={controlStyles} defaultValue={Number(defaultValue) || 0} count={Number(count) || 5} disabled={disabled} allowHalf={allowHalf} />
  </DraggableBlock>;
}

export function RateProd({ id: _id, name: _name, children: _children, defaultValue, count, disabled, allowHalf, styles, ...restProps }: CommonComponentProps) {
  const { shellStyles, controlStyles } = splitControlStyles(styles);

  return <div style={shellStyles} className="inline-block">
    <Rate {...restProps} style={controlStyles} defaultValue={Number(defaultValue) || 0} count={Number(count) || 5} disabled={disabled} allowHalf={allowHalf} />
  </div>;
}
