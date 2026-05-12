import { List, Space, Tag, Typography } from 'antd';
import type { ComponentDiffSummary } from '../../schema/diffComponents';

export function VersionDiffSummary({ summary }: { summary: ComponentDiffSummary }) {
  const hasDiff = summary.added.length > 0 || summary.removed.length > 0 || summary.updated.length > 0;

  if (!hasDiff) {
    return <div className="rounded-[8px] border border-[#dbeafe] bg-[#eff6ff] p-[16px] text-[#1d4ed8]">
      当前草稿和该历史版本没有组件结构、属性或样式差异。
    </div>;
  }

  return <Space direction="vertical" size={16} className="w-full">
    <DiffGroup title="新增组件" color="green" items={summary.added} />
    <DiffGroup title="删除组件" color="red" items={summary.removed} />
    <DiffGroup title="变更组件" color="blue" items={summary.updated} />
  </Space>;
}

function DiffGroup({ title, color, items }: { title: string; color: string; items: ComponentDiffSummary[keyof ComponentDiffSummary] }) {
  return <div>
    <div className="mb-[8px] flex items-center gap-[8px]">
      <Typography.Text strong>{title}</Typography.Text>
      <Tag color={color}>{items.length}</Tag>
    </div>
    <List
      size="small"
      dataSource={items}
      locale={{ emptyText: '无' }}
      renderItem={(item) => (
        <List.Item>
          <List.Item.Meta
            title={<Space>
              <Typography.Text strong>#{item.id}</Typography.Text>
              <Typography.Text>{item.desc || item.name}</Typography.Text>
              <Typography.Text type="secondary">{item.name}</Typography.Text>
            </Space>}
            description={item.changes.join('、')}
          />
        </List.Item>
      )}
    />
  </div>;
}
