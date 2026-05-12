import { Button, Popconfirm, Space, Tag, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { AdminProject, AdminPublishedPage, AdminUser, AuditLog, User } from '../../shared/api/types';
import { StatusTag } from './components/StatusTag';
import { auditActionText } from './model/display';
import { formatDateTime } from './model/format';

interface AdminTableColumnOptions {
  currentUser: User;
  actionKey: string | null;
  onUserStatusChange: (record: AdminUser) => void;
  onProjectStatusChange: (record: AdminProject) => void;
  onUnpublish: (record: AdminPublishedPage) => void;
}

export function createAdminTableColumns({
  currentUser,
  actionKey,
  onUserStatusChange,
  onProjectStatusChange,
  onUnpublish,
}: AdminTableColumnOptions) {
const userColumns: ColumnsType<AdminUser> = [
    {
      title: '用户',
      dataIndex: 'username',
      render: (_value, record) => <Space direction="vertical" size={0}>
        <Space>
          <Typography.Text strong>{record.nickname || record.username}</Typography.Text>
          {record.role === 'admin' && <Tag color="gold">管理员</Tag>}
        </Space>
        <Typography.Text type="secondary" className="text-[12px]">{record.email}</Typography.Text>
      </Space>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 92,
      render: (status: AdminUser['status']) => <StatusTag status={status} />,
    },
    {
      title: '项目数',
      dataIndex: 'projectCount',
      width: 90,
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      width: 156,
      render: formatDateTime,
    },
    {
      title: '操作',
      width: 112,
      render: (_, record) => {
        const nextStatus = record.status === 'active' ? '禁用' : '启用';
        const disabled = record.id === currentUser.id && record.status === 'active';

        return <Tooltip title={disabled ? '不能禁用当前登录的管理员账号' : undefined}>
          <Popconfirm
            title={`确认${nextStatus}该用户？`}
            okText={nextStatus}
            cancelText="取消"
            okButtonProps={{ danger: record.status === 'active' }}
            disabled={disabled}
            onConfirm={() => void onUserStatusChange(record)}
          >
            <Button
              type="link"
              danger={record.status === 'active'}
              disabled={disabled}
              loading={actionKey === `user-${record.id}`}
            >
              {nextStatus}
            </Button>
          </Popconfirm>
        </Tooltip>;
      },
    },
  ];

const projectColumns: ColumnsType<AdminProject> = [
    {
      title: '项目',
      dataIndex: 'name',
      render: (_value, record) => <Space direction="vertical" size={0}>
        <Typography.Text strong>{record.name}</Typography.Text>
        <Typography.Text type="secondary" className="text-[12px]">{record.description || '暂无描述'}</Typography.Text>
      </Space>,
    },
    {
      title: '拥有者',
      dataIndex: ['owner', 'username'],
      width: 160,
      render: (_value, record) => record.owner.nickname || record.owner.username,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 92,
      render: (status: AdminProject['status']) => <StatusTag status={status} />,
    },
    {
      title: '页面 / 素材',
      width: 118,
      render: (_, record) => `${record.pageCount} / ${record.assetCount}`,
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      width: 156,
      render: formatDateTime,
    },
    {
      title: '操作',
      width: 112,
      render: (_, record) => {
        const nextStatus = record.status === 'active' ? '禁用' : '启用';

        return <Popconfirm
          title={`确认${nextStatus}该项目？`}
          description={record.status === 'active' ? '禁用项目会让普通用户无法继续访问，并取消该项目下公开发布页。' : undefined}
          okText={nextStatus}
          cancelText="取消"
          okButtonProps={{ danger: record.status === 'active' }}
          onConfirm={() => void onProjectStatusChange(record)}
        >
          <Button type="link" danger={record.status === 'active'} loading={actionKey === `project-${record.id}`}>
            {nextStatus}
          </Button>
        </Popconfirm>;
      },
    },
  ];

const publishedPageColumns: ColumnsType<AdminPublishedPage> = [
    {
      title: '页面',
      dataIndex: 'name',
      render: (_value, record) => <Space direction="vertical" size={0}>
        <Typography.Text strong>{record.name}</Typography.Text>
        <Typography.Text type="secondary" className="text-[12px]">{record.projectName} / {record.routePath}</Typography.Text>
      </Space>,
    },
    {
      title: '拥有者',
      dataIndex: ['owner', 'username'],
      width: 140,
      render: (_value, record) => record.owner.nickname || record.owner.username,
    },
    {
      title: '发布时间',
      dataIndex: 'publishedAt',
      width: 156,
      render: formatDateTime,
    },
    {
      title: '公开链接',
      dataIndex: 'publicId',
      width: 112,
      render: (publicId?: string | null) => publicId
        ? <Button type="link" href={`/publish/${publicId}`} target="_blank">打开</Button>
        : <Typography.Text type="secondary">-</Typography.Text>,
    },
    {
      title: '操作',
      width: 112,
      render: (_, record) => <Popconfirm
        title="确认取消发布？"
        okText="取消发布"
        cancelText="返回"
        okButtonProps={{ danger: true }}
        onConfirm={() => void onUnpublish(record)}
      >
        <Button type="link" danger loading={actionKey === `page-${record.id}`}>取消发布</Button>
      </Popconfirm>,
    },
  ];

const auditColumns: ColumnsType<AuditLog> = [
    {
      title: '时间',
      dataIndex: 'createdAt',
      width: 168,
      render: formatDateTime,
    },
    {
      title: '动作',
      dataIndex: 'action',
      width: 148,
      render: (action: string) => <Tag color={action.startsWith('admin.') ? 'purple' : 'blue'}>
        {auditActionText[action] || action}
      </Tag>,
    },
    {
      title: '操作者',
      dataIndex: 'actor',
      width: 132,
      render: (actor?: User | null, record?: AuditLog) => actor?.username || (record?.actorId ? `用户 ${record.actorId}` : '-'),
    },
    {
      title: '摘要',
      dataIndex: 'summary',
      render: (summary: string | null | undefined, record) => summary || `${record.targetType} ${record.targetId || ''}`,
    },
  ];

  return { userColumns, projectColumns, publishedPageColumns, auditColumns };
}
