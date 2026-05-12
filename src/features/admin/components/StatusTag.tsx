import { Tag } from 'antd';
import { statusText } from '../model/display';

export function StatusTag({ status }: { status: 'active' | 'disabled' }) {
  return <Tag color={status === 'active' ? 'green' : 'red'}>{statusText[status]}</Tag>;
}
