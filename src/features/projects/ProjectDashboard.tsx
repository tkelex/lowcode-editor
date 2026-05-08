import {
  Button,
  Card,
  Descriptions,
  Drawer,
  Form,
  Input,
  List,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { createPage, listPages } from '../../shared/api/pages';
import {
  addProjectMember,
  createProject,
  listProjectAuditLogs,
  listProjectMembers,
  listProjects,
  removeProjectMember,
  updateProjectMember,
} from '../../shared/api/projects';
import { AuditLog, EditorPage, Project, ProjectMember, ProjectRole, User } from '../../shared/api/types';

interface ProjectDashboardProps {
  user: User;
  onOpenPage: (pageId: number, projectRole?: ProjectRole) => void;
  onLogout: () => void;
}

type AddMemberFormValues = {
  email: string;
  role: Exclude<ProjectRole, 'owner'>;
};

const roleText: Record<ProjectRole, string> = {
  owner: '拥有者',
  editor: '编辑者',
  viewer: '查看者',
};

const roleColor: Record<ProjectRole, string> = {
  owner: 'gold',
  editor: 'blue',
  viewer: 'default',
};

const auditActionText: Record<string, string> = {
  'project.create': '创建项目',
  'project.update': '更新项目',
  'project.delete': '删除项目',
  'project.member.add': '添加成员',
  'project.member.update': '变更成员角色',
  'project.member.remove': '移除成员',
  'page.create': '创建页面',
  'page.update': '保存页面',
  'page.publish': '发布页面',
  'page.unpublish': '取消发布',
  'page.rollback': '回滚页面',
  'page.delete': '删除页面',
  'page.version.delete': '删除版本',
};

export function ProjectDashboard({ user, onOpenPage, onLogout }: ProjectDashboardProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [pages, setPages] = useState<EditorPage[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [pageModalOpen, setPageModalOpen] = useState(false);
  const [memberDrawerOpen, setMemberDrawerOpen] = useState(false);
  const [auditDrawerOpen, setAuditDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingPages, setLoadingPages] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [loadingAuditLogs, setLoadingAuditLogs] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [updatingMemberId, setUpdatingMemberId] = useState<number | null>(null);
  const [removingMemberId, setRemovingMemberId] = useState<number | null>(null);
  const [pageForm] = Form.useForm<{ name: string; routePath: string }>();
  const [memberForm] = Form.useForm<AddMemberFormValues>();

  const currentRole = selectedProject?.currentUserRole ?? 'viewer';
  const canManageProject = currentRole === 'owner';
  const canCreatePage = currentRole === 'owner' || currentRole === 'editor';

  const memberByUserId = useMemo(() => {
    return new Map(members.map((member) => [member.userId, member]));
  }, [members]);

  useEffect(() => {
    void loadProjects();
  }, []);

  async function loadProjects() {
    setLoading(true);
    try {
      const data = await listProjects();
      setProjects(data);
      if (data.length > 0) {
        setSelectedProject(data[0]);
        await loadPages(data[0].id);
      } else {
        setSelectedProject(null);
        setPages([]);
      }
    } catch {
      message.error('加载项目失败');
    } finally {
      setLoading(false);
    }
  }

  async function loadPages(projectId: number) {
    setLoadingPages(true);
    try {
      const data = await listPages(projectId);
      setPages(data);
    } catch {
      message.error('加载页面失败');
    } finally {
      setLoadingPages(false);
    }
  }

  async function loadMembers(projectId: number) {
    setLoadingMembers(true);
    try {
      const data = await listProjectMembers(projectId);
      setMembers(data);
    } catch {
      message.error('加载成员失败');
    } finally {
      setLoadingMembers(false);
    }
  }

  async function loadAuditLogs(projectId: number) {
    setLoadingAuditLogs(true);
    try {
      const data = await listProjectAuditLogs(projectId);
      setAuditLogs(data);
    } catch {
      message.error('加载审计日志失败');
    } finally {
      setLoadingAuditLogs(false);
    }
  }

  function getNextPageRoutePath() {
    const existingRoutePaths = new Set(pages.map((page) => page.routePath));
    let index = pages.length + 1;

    while (existingRoutePaths.has(`/page-${index}`)) {
      index += 1;
    }

    return `/page-${index}`;
  }

  function openPageModal() {
    if (!canCreatePage) {
      message.warning('当前角色只有查看权限，不能新建页面');
      return;
    }

    pageForm.resetFields();
    pageForm.setFieldsValue({ routePath: getNextPageRoutePath() });
    setPageModalOpen(true);
  }

  async function openMemberDrawer() {
    if (!selectedProject) return;

    setMemberDrawerOpen(true);
    await loadMembers(selectedProject.id);
  }

  async function openAuditDrawer() {
    if (!selectedProject) return;

    if (!canManageProject) {
      message.warning('只有项目拥有者可以查看审计日志');
      return;
    }

    setAuditDrawerOpen(true);
    await loadAuditLogs(selectedProject.id);
  }

  async function handleCreateProject(values: { name: string; description?: string }) {
    try {
      const project = await createProject(values);
      setProjects([project, ...projects]);
      setSelectedProject(project);
      setPages([]);
      setMembers([]);
      setAuditLogs([]);
      setProjectModalOpen(false);
      message.success('项目创建成功');
    } catch {
      message.error('项目创建失败');
    }
  }

  async function handleCreatePage(values: { name: string; routePath: string }) {
    if (!selectedProject || !canCreatePage) return;

    try {
      const page = await createPage(selectedProject.id, values);
      setPages([page, ...pages]);
      setPageModalOpen(false);
      message.success('页面创建成功');
    } catch {
      message.error('页面创建失败，路径可能重复或格式不正确');
    }
  }

  async function handleSelectProject(project: Project) {
    setSelectedProject(project);
    setMembers([]);
    setAuditLogs([]);
    await loadPages(project.id);
  }

  async function handleAddMember(values: AddMemberFormValues) {
    if (!selectedProject) return;

    setAddingMember(true);
    try {
      const member = await addProjectMember(selectedProject.id, values);
      setMembers((currentMembers) => [...currentMembers, member]);
      memberForm.resetFields();
      message.success('成员已添加');
    } catch {
      message.error('添加成员失败，请确认用户邮箱存在且未重复加入');
    } finally {
      setAddingMember(false);
    }
  }

  async function handleUpdateMember(member: ProjectMember, role: Exclude<ProjectRole, 'owner'>) {
    if (!selectedProject) return;

    setUpdatingMemberId(member.id);
    try {
      const updatedMember = await updateProjectMember(selectedProject.id, member.id, { role });
      setMembers((currentMembers) => currentMembers.map((item) => item.id === member.id ? updatedMember : item));
      message.success('成员角色已更新');
    } catch {
      message.error('更新成员角色失败');
    } finally {
      setUpdatingMemberId(null);
    }
  }

  async function handleRemoveMember(member: ProjectMember) {
    if (!selectedProject) return;

    setRemovingMemberId(member.id);
    try {
      await removeProjectMember(selectedProject.id, member.id);
      setMembers((currentMembers) => currentMembers.filter((item) => item.id !== member.id));
      message.success('成员已移除');
    } catch {
      message.error('移除成员失败');
    } finally {
      setRemovingMemberId(null);
    }
  }

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
            onChange={(nextRole) => void handleUpdateMember(member, nextRole)}
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
            onConfirm={() => void handleRemoveMember(member)}
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

  return <div className="min-h-screen bg-slate-100 p-6">
    <div className="mx-auto max-w-[1180px]">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Typography.Title level={3} className="!mb-1">低代码项目</Typography.Title>
          <Typography.Text type="secondary">当前用户：{user.username}</Typography.Text>
        </div>
        <Space>
          <Button onClick={() => setProjectModalOpen(true)} type="primary">新建项目</Button>
          <Button onClick={onLogout}>退出登录</Button>
        </Space>
      </div>

      <div className="grid grid-cols-[320px_1fr] gap-4">
        <Card title="项目列表" loading={loading}>
          <List
            dataSource={projects}
            locale={{ emptyText: '暂无项目，请先新建项目' }}
            renderItem={(project) => <List.Item
              className={`cursor-pointer rounded px-2 ${selectedProject?.id === project.id ? 'bg-blue-50' : ''}`}
              onClick={() => void handleSelectProject(project)}
            >
              <List.Item.Meta
                title={<Space>
                  <span>{project.name}</span>
                  {project.currentUserRole && <Tag color={roleColor[project.currentUserRole]}>{roleText[project.currentUserRole]}</Tag>}
                </Space>}
                description={project.description || '暂无描述'}
              />
            </List.Item>}
          />
        </Card>

        <Card
          title={selectedProject ? `${selectedProject.name} / 页面` : '页面'}
          extra={<Space>
            <Button disabled={!selectedProject} onClick={() => void openMemberDrawer()}>成员</Button>
            <Tooltip title={canManageProject ? '查看项目关键操作记录' : '只有项目拥有者可以查看审计日志'}>
              <Button disabled={!selectedProject || !canManageProject} onClick={() => void openAuditDrawer()}>审计日志</Button>
            </Tooltip>
            <Button type="primary" disabled={!selectedProject || !canCreatePage} onClick={openPageModal}>新建页面</Button>
          </Space>}
        >
          {selectedProject && (
            <Descriptions size="small" column={3} className="mb-4">
              <Descriptions.Item label="当前角色">
                <Tag color={roleColor[currentRole]}>{roleText[currentRole]}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="项目状态">{selectedProject.status}</Descriptions.Item>
              <Descriptions.Item label="更新时间">{dayjs(selectedProject.updatedAt).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
            </Descriptions>
          )}
          <List
            loading={loadingPages}
            dataSource={pages}
            locale={{ emptyText: selectedProject ? '暂无页面，请新建页面' : '请先选择项目' }}
            renderItem={(page) => <List.Item actions={[
              <Button type="link" onClick={() => onOpenPage(page.id, currentRole)}>
                {canCreatePage ? '打开编辑器' : '查看页面'}
              </Button>,
            ]}>
              <List.Item.Meta
                title={<Space>
                  <span>{page.name}</span>
                  {page.isPublished && <Tag color="green">已发布</Tag>}
                </Space>}
                description={`路径：${page.routePath}`}
              />
            </List.Item>}
          />
        </Card>
      </div>
    </div>

    <Modal title="新建项目" open={projectModalOpen} footer={null} onCancel={() => setProjectModalOpen(false)}>
      <Form layout="vertical" onFinish={handleCreateProject}>
        <Form.Item name="name" label="项目名称" rules={[{ required: true, message: '请输入项目名称' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="description" label="项目描述">
          <Input.TextArea rows={3} />
        </Form.Item>
        <Button type="primary" htmlType="submit">创建</Button>
      </Form>
    </Modal>

    <Modal title="新建页面" open={pageModalOpen} footer={null} onCancel={() => setPageModalOpen(false)}>
      <Form form={pageForm} layout="vertical" onFinish={handleCreatePage}>
        <Form.Item name="name" label="页面名称" rules={[{ required: true, message: '请输入页面名称' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="routePath" label="页面路径" rules={[{ required: true, message: '请输入页面路径，例如 /home' }]}>
          <Input />
        </Form.Item>
        <Button type="primary" htmlType="submit">创建</Button>
      </Form>
    </Modal>

    <Drawer
      title={selectedProject ? `${selectedProject.name} / 成员` : '成员'}
      open={memberDrawerOpen}
      width={720}
      onClose={() => setMemberDrawerOpen(false)}
      extra={<Button onClick={() => selectedProject && void loadMembers(selectedProject.id)} loading={loadingMembers}>刷新</Button>}
    >
      {canManageProject && (
        <Form
          form={memberForm}
          layout="inline"
          initialValues={{ role: 'viewer' }}
          onFinish={handleAddMember}
          className="mb-4"
        >
          <Form.Item name="email" rules={[{ required: true, type: 'email', message: '请输入成员邮箱' }]}>
            <Input placeholder="成员邮箱" className="w-[260px]" />
          </Form.Item>
          <Form.Item name="role" rules={[{ required: true, message: '请选择角色' }]}>
            <Select
              className="w-[120px]"
              options={[
                { value: 'editor', label: '编辑者' },
                { value: 'viewer', label: '查看者' },
              ]}
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={addingMember}>添加成员</Button>
        </Form>
      )}

      <Table
        rowKey="id"
        loading={loadingMembers}
        columns={memberColumns}
        dataSource={members}
        pagination={false}
      />
    </Drawer>

    <Drawer
      title={selectedProject ? `${selectedProject.name} / 审计日志` : '审计日志'}
      open={auditDrawerOpen}
      width={860}
      onClose={() => setAuditDrawerOpen(false)}
      extra={<Button onClick={() => selectedProject && void loadAuditLogs(selectedProject.id)} loading={loadingAuditLogs}>刷新</Button>}
    >
      <Table
        rowKey="id"
        loading={loadingAuditLogs}
        columns={auditColumns}
        dataSource={auditLogs}
        pagination={{ pageSize: 12 }}
      />
    </Drawer>
  </div>;
}
