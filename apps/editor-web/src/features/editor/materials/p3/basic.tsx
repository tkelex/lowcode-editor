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
import type { CommonComponentProps } from '../types';

const iconMap = {
  AppstoreOutlined,
  CheckCircleOutlined,
  HomeOutlined,
  PlusOutlined,
  SearchOutlined,
  SettingOutlined,
  UserOutlined,
};

export function LinkDev({ href, text, target, disabled, ...props }: CommonComponentProps) {
  return <DraggableInline {...props} className="rounded-[6px] p-[2px]">
    <a
      href={disabled ? undefined : (href || '#')}
      target={target}
      className={disabled ? 'pointer-events-none text-[#94a3b8]' : undefined}
      onClick={(event) => event.preventDefault()}
    >
      {text || '链接'}
    </a>
  </DraggableInline>;
}

export function IconDev({ icon, size, color, ...props }: CommonComponentProps) {
  return <DraggableInline {...props} className="rounded-[6px] p-[4px] text-[#1677ff]">
    <span style={{ fontSize: size, color }}>{resolveIcon(icon)}</span>
  </DraggableInline>;
}

function resolveIcon(iconName?: string) {
  const IconComponent = iconMap[(iconName || 'AppstoreOutlined') as keyof typeof iconMap] || AppstoreOutlined;
  return <IconComponent />;
}
