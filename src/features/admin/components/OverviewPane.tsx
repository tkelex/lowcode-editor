import { Card, Statistic, Typography } from 'antd';
import type { AdminOverview } from '../../../shared/api/types';
import { formatBytes } from '../model/format';

export function OverviewPane({ overview, loading }: { overview: AdminOverview | null; loading: boolean }) {
  const stats = [
    { title: '用户总数', value: overview?.users.total ?? 0, suffix: `禁用 ${overview?.users.disabled ?? 0}` },
    { title: '项目总数', value: overview?.projects.total ?? 0, suffix: `禁用 ${overview?.projects.disabled ?? 0}` },
    { title: '页面总数', value: overview?.pages.total ?? 0, suffix: `发布 ${overview?.pages.published ?? 0}` },
    { title: '素材数量', value: overview?.assets.total ?? 0, suffix: formatBytes(overview?.assets.totalSize ?? 0) },
  ];

  return <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
    {stats.map((item) => (
      <Card key={item.title} loading={loading}>
        <Statistic title={item.title} value={item.value} />
        <Typography.Text type="secondary" className="text-[12px]">{item.suffix}</Typography.Text>
      </Card>
    ))}
  </div>;
}
