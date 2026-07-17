import {
  Button,
  Card,
  Descriptions,
  Drawer,
  Form,
  Input,
  List,
  Modal,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { createPage, listPages, listPageVersions } from '../../shared/api/pages';
import {
  addProjectMember,
  createProject,
  listProjectAuditLogs,
  listProjectMembers,
  listProjects,
  removeProjectMember,
  updateProject,
  updateProjectMember,
} from '../../shared/api/projects';
import { AuditLog, EditorPage, PageVersion, Project, ProjectMember, ProjectRole } from '../../shared/api/types';
import { roleColor, roleText } from './model/display';
import type { AddMemberFormValues, ProjectDashboardProps } from './model/types';
import { ProjectMemberDrawer } from './components/ProjectMemberDrawer';
import { PublishRecordDrawer } from './components/PublishRecordDrawer';
import { DataSourceModelDrawer } from './components/DataSourceModelDrawer';
import { createProjectTableColumns } from './tableColumns';

export function ProjectDashboard({ user, onOpenPage, onLogout, onOpenAdmin }: ProjectDashboardProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [pages, setPages] = useState<EditorPage[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [publishVersions, setPublishVersions] = useState<PageVersion[]>([]);
  const [publishRecordPage, setPublishRecordPage] = useState<EditorPage | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [pageModalOpen, setPageModalOpen] = useState(false);
  const [projectSettingsOpen, setProjectSettingsOpen] = useState(false);
  const [publishRecordDrawerOpen, setPublishRecordDrawerOpen] = useState(false);
  const [memberDrawerOpen, setMemberDrawerOpen] = useState(false);
  const [auditDrawerOpen, setAuditDrawerOpen] = useState(false);
  const [dataSourceModelDrawerOpen, setDataSourceModelDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingPages, setLoadingPages] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [loadingAuditLogs, setLoadingAuditLogs] = useState(false);
  const [loadingPublishRecords, setLoadingPublishRecords] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [savingProjectSettings, setSavingProjectSettings] = useState(false);
  const [updatingMemberId, setUpdatingMemberId] = useState<number | null>(null);
  const [removingMemberId, setRemovingMemberId] = useState<number | null>(null);
  const [pageForm] = Form.useForm<{ name: string; routePath: string }>();
  const [memberForm] = Form.useForm<AddMemberFormValues>();
  const [projectSettingsForm] = Form.useForm<{ name: string; description?: string }>();

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

  async function loadPublishRecords(page: EditorPage) {
    setLoadingPublishRecords(true);
    try {
      const data = await listPageVersions(page.id);
      setPublishVersions(data.filter((version) => version.source === 'publish'));
    } catch {
      message.error('加载发布记录失败');
    } finally {
      setLoadingPublishRecords(false);
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

  function openDataSourceModelDrawer() {
    if (!selectedProject) return;
    setDataSourceModelDrawerOpen(true);
  }

  function openProjectSettings() {
    if (!selectedProject) return;

    if (!canManageProject) {
      message.warning('只有项目拥有者可以修改项目设置');
      return;
    }

    projectSettingsForm.setFieldsValue({
      name: selectedProject.name,
      description: selectedProject.description || undefined,
    });
    setProjectSettingsOpen(true);
  }

  async function openPublishRecordDrawer(page: EditorPage) {
    setPublishRecordPage(page);
    setPublishRecordDrawerOpen(true);
    await loadPublishRecords(page);
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

  async function handleUpdateProjectSettings(values: { name: string; description?: string }) {
    if (!selectedProject || !canManageProject) return;

    setSavingProjectSettings(true);
    try {
      const updatedProject = await updateProject(selectedProject.id, values);
      setProjects((currentProjects) => currentProjects.map((project) => (
        project.id === updatedProject.id ? updatedProject : project
      )));
      setSelectedProject(updatedProject);
      setProjectSettingsOpen(false);
      message.success('项目设置已更新');
    } catch {
      message.error('更新项目设置失败');
    } finally {
      setSavingProjectSettings(false);
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

  const { memberColumns, auditColumns } = createProjectTableColumns({
    canManageProject,
    updatingMemberId,
    removingMemberId,
    memberByUserId,
    onUpdateMember: handleUpdateMember,
    onRemoveMember: handleRemoveMember,
  });

  return <div className="min-h-screen bg-[#eef2f7] px-4 py-6 sm:px-6">
    <div className="mx-auto max-w-[1240px]">
      <div className="mb-5 flex flex-col gap-4 rounded-lg border border-white/80 bg-white/85 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <Typography.Title level={3} className="!mb-1 !text-[#0f172a]">低代码项目</Typography.Title>
          <Typography.Text className="text-[13px] text-slate-500">当前用户：{user.username}</Typography.Text>
        </div>
        <Space wrap className="justify-start sm:justify-end">
          {user.role === 'admin' && <Button onClick={onOpenAdmin}>管理后台</Button>}
          <Button onClick={() => setProjectModalOpen(true)} type="primary">新建项目</Button>
          <Button onClick={onLogout}>退出登录</Button>
        </Space>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Card
          title={<div className="flex flex-col gap-1">
            <Typography.Text strong className="!text-[16px] !text-slate-900">项目列表</Typography.Text>
            <Typography.Text className="text-[12px] leading-5 !text-slate-500">选择项目后管理页面与协作</Typography.Text>
          </div>}
          loading={loading}
          className="border border-slate-200 shadow-[0_8px_24px_rgba(15,23,42,0.05)] [&_.ant-card-body]:p-5 [&_.ant-card-head]:min-h-[68px] [&_.ant-card-head]:px-7 [&_.ant-card-head-title]:py-4"
        >
          <List
            className="[&_.ant-list-empty-text]:py-10"
            dataSource={projects}
            locale={{ emptyText: '暂无项目，请先新建项目' }}
            renderItem={(project) => <List.Item
              className={`mb-3 cursor-pointer rounded-md border !px-5 !py-4 transition hover:border-blue-200 hover:bg-slate-50 ${
                selectedProject?.id === project.id
                  ? 'border-blue-300 bg-[#eff6ff] shadow-[inset_4px_0_0_#2563eb,0_8px_18px_rgba(37,99,235,0.08)]'
                  : 'border-transparent bg-white'
              }`}
              onClick={() => void handleSelectProject(project)}
            >
              <List.Item.Meta
                title={<div className="flex min-w-0 items-center gap-2">
                  <Typography.Text strong className="min-w-0 truncate !text-slate-900">{project.name}</Typography.Text>
                  {project.currentUserRole && <Tag className="m-0 shrink-0" color={roleColor[project.currentUserRole]}>{roleText[project.currentUserRole]}</Tag>}
                </div>}
                description={<Typography.Text className="mt-2 block truncate text-[12px] leading-5 !text-slate-400">
                  {project.description || '暂无描述'}
                </Typography.Text>}
              />
            </List.Item>}
          />
        </Card>

        <Card
          title={<div className="flex min-w-0 flex-col gap-1">
            <Typography.Text strong className="truncate !text-[16px] !text-slate-900">
              {selectedProject ? `${selectedProject.name} / 页面` : '页面'}
            </Typography.Text>
            <Typography.Text className="text-[12px] leading-5 !text-slate-500">维护页面、发布记录与项目协作信息</Typography.Text>
          </div>}
          extra={<Space wrap className="justify-start sm:justify-end">
            <Tooltip title={canManageProject ? '修改项目名称和描述' : '只有项目拥有者可以修改项目设置'}>
              <Button disabled={!selectedProject || !canManageProject} onClick={openProjectSettings}>项目设置</Button>
            </Tooltip>
            <Button disabled={!selectedProject} onClick={() => void openMemberDrawer()}>成员</Button>
            <Button disabled={!selectedProject} onClick={openDataSourceModelDrawer}>数据源模型</Button>
            <Tooltip title={canManageProject ? '查看项目关键操作记录' : '只有项目拥有者可以查看审计日志'}>
              <Button disabled={!selectedProject || !canManageProject} onClick={() => void openAuditDrawer()}>审计日志</Button>
            </Tooltip>
            <Button type="primary" disabled={!selectedProject || !canCreatePage} onClick={openPageModal}>新建页面</Button>
          </Space>}
          className="min-w-0 border border-slate-200 shadow-[0_8px_24px_rgba(15,23,42,0.05)] [&_.ant-card-extra]:ml-0 [&_.ant-card-extra]:mt-3 [&_.ant-card-head]:min-h-[68px] [&_.ant-card-head]:px-7 [&_.ant-card-head-title]:overflow-visible [&_.ant-card-head-title]:py-4 [&_.ant-card-head-title]:whitespace-normal [&_.ant-card-head-wrapper]:flex-wrap [&_.ant-card-head-wrapper]:items-center"
        >
          {selectedProject && (
            <Descriptions
              size="small"
              column={{ xs: 1, sm: 2, lg: 3 }}
              className="mb-4 rounded-md border border-slate-100 bg-slate-50 px-4 py-3"
            >
              <Descriptions.Item label="当前角色">
                <Tag color={roleColor[currentRole]}>{roleText[currentRole]}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="项目状态">{selectedProject.status}</Descriptions.Item>
              <Descriptions.Item label="更新时间">{dayjs(selectedProject.updatedAt).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
            </Descriptions>
          )}
          <List
            className="[&_.ant-list-empty-text]:py-12"
            loading={loadingPages}
            dataSource={pages}
            locale={{ emptyText: selectedProject ? '暂无页面，请新建页面' : '请先选择项目' }}
            renderItem={(page) => <List.Item className="rounded-md border border-slate-100 px-0 py-0 transition hover:border-blue-100 hover:bg-slate-50">
              <div className="flex w-full flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <div className="mb-1 flex min-w-0 flex-wrap items-center gap-2">
                    <Typography.Text strong className="min-w-0 truncate !text-slate-900">{page.name}</Typography.Text>
                    <Tag className="m-0" color={page.isPublished ? 'green' : 'default'}>
                      {page.isPublished ? '已发布' : '未发布'}
                    </Tag>
                  </div>
                  <Space size={12} wrap className="text-[13px] text-slate-500">
                    <span>路径：{page.routePath}</span>
                    <span>更新：{dayjs(page.updatedAt).format('YYYY-MM-DD HH:mm')}</span>
                  </Space>
                </div>
                <Space wrap className="shrink-0">
                  <Button type="link" onClick={() => void openPublishRecordDrawer(page)}>
                    发布记录
                  </Button>
                  <Button type="link" onClick={() => onOpenPage(page.id, currentRole)}>
                    {canCreatePage ? '打开编辑器' : '查看页面'}
                  </Button>
                </Space>
              </div>
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
      title={selectedProject ? `${selectedProject.name} / 项目设置` : '项目设置'}
      open={projectSettingsOpen}
      width={480}
      onClose={() => setProjectSettingsOpen(false)}
    >
      <Form
        form={projectSettingsForm}
        layout="vertical"
        onFinish={handleUpdateProjectSettings}
      >
        <Form.Item name="name" label="项目名称" rules={[{ required: true, message: '请输入项目名称' }]}>
          <Input maxLength={60} showCount />
        </Form.Item>
        <Form.Item name="description" label="项目描述">
          <Input.TextArea rows={4} maxLength={300} showCount />
        </Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" loading={savingProjectSettings}>保存设置</Button>
          <Button onClick={() => setProjectSettingsOpen(false)}>取消</Button>
        </Space>
      </Form>
    </Drawer>

    <ProjectMemberDrawer
      open={memberDrawerOpen}
      project={selectedProject}
      canManageProject={canManageProject}
      loading={loadingMembers}
      adding={addingMember}
      members={members}
      columns={memberColumns}
      form={memberForm}
      onClose={() => setMemberDrawerOpen(false)}
      onRefresh={loadMembers}
      onAddMember={handleAddMember}
    />

    <DataSourceModelDrawer
      open={dataSourceModelDrawerOpen}
      project={selectedProject}
      pages={pages}
      canEdit={canCreatePage}
      currentRole={currentRole}
      onClose={() => setDataSourceModelDrawerOpen(false)}
      onPagesCreated={(page) => setPages((currentPages) => [page, ...currentPages])}
      onOpenPage={onOpenPage}
    />

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

    <PublishRecordDrawer
      open={publishRecordDrawerOpen}
      page={publishRecordPage}
      versions={publishVersions}
      loading={loadingPublishRecords}
      onClose={() => setPublishRecordDrawerOpen(false)}
      onRefresh={loadPublishRecords}
    />
  </div>;
}
