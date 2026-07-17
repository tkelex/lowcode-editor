import { Button, Drawer, List, Popconfirm, Space, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import type { PageVersion } from '../../../shared/api/types';

interface VersionHistoryDrawerProps {
  open: boolean;
  versions: PageVersion[];
  loadingVersions: boolean;
  canWritePage: boolean;
  rollingBack: boolean;
  deletingVersionId: number | null;
  onClose: () => void;
  onRefresh: () => void;
  onRollback: (version: PageVersion) => void;
  onDelete: (version: PageVersion) => void;
  onCompare: (version: PageVersion) => void;
}

export function VersionHistoryDrawer({
  open,
  versions,
  loadingVersions,
  canWritePage,
  rollingBack,
  deletingVersionId,
  onClose,
  onRefresh,
  onRollback,
  onDelete,
  onCompare,
}: VersionHistoryDrawerProps) {
  return <Drawer
    title="版本历史"
    open={open}
    width={420}
    onClose={onClose}
    extra={<Button onClick={onRefresh} loading={loadingVersions}>刷新</Button>}
  >
    <List
      loading={loadingVersions}
      dataSource={versions}
      locale={{ emptyText: '暂无历史版本，请先保存页面' }}
      renderItem={(version) => (
        <List.Item
          actions={[
            <Popconfirm
              key="rollback"
              title={`确认回滚到 v${version.versionNo}？`}
              description="当前页面会恢复为该版本，系统会同时生成一条新的回滚版本。"
              okText="回滚"
              cancelText="取消"
              onConfirm={() => void onRollback(version)}
            >
              <Button type="link" disabled={!canWritePage} loading={rollingBack}>回滚</Button>
            </Popconfirm>,
            <Button key="compare" type="link" onClick={() => onCompare(version)}>对比</Button>,
            <Popconfirm
              key="delete"
              title={`确认删除 v${version.versionNo}？`}
              description="删除后该历史版本不可再回滚，当前页面内容不会受影响。"
              okText="删除"
              cancelText="取消"
              okButtonProps={{ danger: true }}
              onConfirm={() => void onDelete(version)}
            >
              <Button type="link" danger disabled={!canWritePage} loading={deletingVersionId === version.id}>删除</Button>
            </Popconfirm>,
          ]}
        >
          <List.Item.Meta
            title={<Space>
              <Typography.Text strong>v{version.versionNo}</Typography.Text>
              <Tag color={version.source === 'rollback' ? 'purple' : version.source === 'publish' ? 'green' : 'blue'}>
                {version.source === 'rollback' ? '回滚' : version.source === 'publish' ? '发布' : '保存'}
              </Tag>
            </Space>}
            description={<Space direction="vertical" size={2}>
              <span>{dayjs(version.createdAt).format('YYYY-MM-DD HH:mm:ss')}</span>
              {version.message && <Typography.Text type="secondary">{version.message}</Typography.Text>}
            </Space>}
          />
        </List.Item>
      )}
    />
  </Drawer>;
}
