import { Button, Drawer, List, Space, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import type { EditorPage, PageVersion } from '../../../shared/api/types';

interface PublishRecordDrawerProps {
  open: boolean;
  page: EditorPage | null;
  versions: PageVersion[];
  loading: boolean;
  onClose: () => void;
  onRefresh: (page: EditorPage) => void;
}

export function PublishRecordDrawer({
  open,
  page,
  versions,
  loading,
  onClose,
  onRefresh,
}: PublishRecordDrawerProps) {
  return <Drawer
    title={page ? `${page.name} / 发布记录` : '发布记录'}
    open={open}
    width={520}
    onClose={onClose}
    extra={<Button onClick={() => page && void onRefresh(page)} loading={loading}>刷新</Button>}
  >
    <List
      loading={loading}
      dataSource={versions}
      locale={{ emptyText: page?.isPublished ? '暂无发布版本记录' : '当前页面尚未发布' }}
      renderItem={(version) => (
        <List.Item>
          <List.Item.Meta
            title={<Space>
              <Typography.Text strong>v{version.versionNo}</Typography.Text>
              <Tag color="green">发布</Tag>
            </Space>}
            description={<Space direction="vertical" size={2}>
              <Typography.Text>{dayjs(version.createdAt).format('YYYY-MM-DD HH:mm:ss')}</Typography.Text>
              {version.message && <Typography.Text type="secondary">{version.message}</Typography.Text>}
            </Space>}
          />
        </List.Item>
      )}
    />
  </Drawer>;
}
