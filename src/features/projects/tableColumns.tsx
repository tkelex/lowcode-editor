import { Button, Popconfirm, Select, Space, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import type { AuditLog, ProjectMember, ProjectRole } from '../../shared/api/types';
import { auditActionText, roleColor, roleText } from './model/display';

interface ProjectTableColumnOptions {
  canManageProject: boolean;
  updatingMemberId: number | null;
  removingMemberId: number | null;
  memberByUserId: Map<number, ProjectMember>;
  onUpdateMember: (member: ProjectMember, role: Exclude<ProjectRole, 'owner'>) => void;
  onRemoveMember: (member: ProjectMember) => void;
}

export function createProjectTableColumns({
  canManageProject,
  updatingMemberId,
  removingMemberId,
  memberByUserId,
  onUpdateMember,
  onRemoveMember,
}: ProjectTableColumnOptions) {
const memberColumns: ColumnsType<ProjectMember> = [
    {
      title: '成员',
      dataIndex: ['user', 'username'],
      render: (_value, member) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{member.user.nickname || member.user.username}</Typography.Text>
          <Typography.Text type="secondary" className="text-[12px]">{member.user.email}</Typography.Text>
        </Space>
      ),
    },
    {
      title: '角色',
      dataIndex: 'role',
      width: 132,
      render: (role: ProjectRole, member) => {
        if (!canManageProject || role === 'owner') {
          return <Tag color={roleColor[role]}>{roleText[role]}</Tag>;
        }

        return (
          <Select
            size="small"
            value={role}
            style={{ width: 96 }}
            loading={updatingMemberId === member.id}
            options={[
              { value: 'editor', label: '编辑者' },
              { value: 'viewer', label: '查看者' },
            ]}
            onChange={(nextRole) => void onUpdateMember(member, nextRole)}
          />
        );
      },
    },
    {
      title: '加入时间',
      dataIndex: 'createdAt',
      width: 156,
      render: (createdAt: string) => dayjs(createdAt).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      width: 92,
      render: (_, member) => {
        if (!canManageProject || member.role === 'owner') {
          return <Typography.Text type="secondary">-</Typography.Text>;
        }

        return (
          <Popconfirm
            title="确认移除该成员？"
            okText="移除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
            onConfirm={() => void onRemoveMember(member)}
          >
            <Button type="link" danger loading={removingMemberId === member.id}>移除</Button>
          </Popconfirm>
        );
      },
    },
  ];

const auditColumns: ColumnsType<AuditLog> = [
    {
      title: '时间',
      dataIndex: 'createdAt',
      width: 168,
      render: (createdAt: string) => dayjs(createdAt).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '动作',
      dataIndex: 'action',
      width: 132,
      render: (action: string) => <Tag color="blue">{auditActionText[action] || action}</Tag>,
    },
    {
      title: '操作者',
      dataIndex: 'actorId',
      width: 96,
      render: (actorId?: number | null) => {
        const member = actorId ? memberByUserId.get(actorId) : undefined;
        return member?.user.username || (actorId ? `用户 ${actorId}` : '-');
      },
    },
    {
      title: '摘要',
      dataIndex: 'summary',
      render: (summary: string | null | undefined, log) => summary || `${log.targetType} ${log.targetId || ''}`,
    },
  ];
  return { memberColumns, auditColumns };
}
