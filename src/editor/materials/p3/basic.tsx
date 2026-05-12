import {
  AppstoreOutlined,
  CheckCircleOutlined,
  HomeOutlined,
  PlusOutlined,
  SearchOutlined,
  SettingOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { DraggableInline } from './common';
import type { CommonComponentProps } from '../../interface';

const iconMap = {
  AppstoreOutlined,
  CheckCircleOutlined,
  HomeOutlined,
  PlusOutlined,
  SearchOutlined,
  SettingOutlined,
  UserOutlined,
};

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

function resolveIcon(iconName?: string) {
  const IconComponent = iconMap[(iconName || 'AppstoreOutlined') as keyof typeof iconMap] || AppstoreOutlined;
  return <IconComponent />;
}
