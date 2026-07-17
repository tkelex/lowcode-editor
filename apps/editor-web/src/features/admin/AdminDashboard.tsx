import {
  Button,
  Card,
  Empty,
  Input,
  Select,
  Space,
  Table,
  Tabs,
  Typography,
  message,
} from 'antd';
import { useEffect, useMemo, useState } from 'react';
import {
  adminUnpublishPage,
  getAdminOverview,
  listAdminAuditLogs,
  listAdminProjects,
  listAdminPublishedPages,
  listAdminUsers,
  updateAdminProjectStatus,
  updateAdminUserStatus,
} from '../../shared/api/admin';
import { AdminOverview, AdminProject, AdminPublishedPage, AdminUser, AuditLog, User } from '../../shared/api/types';
import { OverviewPane } from './components/OverviewPane';
import { TableToolbar } from './components/TableToolbar';
import { auditActionText, StatusFilter } from './model/display';
import { normalizeKeyword } from './model/format';
import { createAdminTableColumns } from './tableColumns';

interface AdminDashboardProps {
  user: User;
  onBack: () => void;
  onLogout: () => void;
}

export function AdminDashboard({ user, onBack, onLogout }: AdminDashboardProps) {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [publishedPages, setPublishedPages] = useState<AdminPublishedPage[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [userKeyword, setUserKeyword] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState<StatusFilter>('all');
  const [projectKeyword, setProjectKeyword] = useState('');
  const [projectStatusFilter, setProjectStatusFilter] = useState<StatusFilter>('all');
  const [publishedPageKeyword, setPublishedPageKeyword] = useState('');
  const [auditKeyword, setAuditKeyword] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [actionKey, setActionKey] = useState<string | null>(null);

  const isAdmin = user.role === 'admin';

  useEffect(() => {
    if (!isAdmin) return;
    void loadAll();
  }, [isAdmin]);

  async function loadAll() {
    setLoading(true);
    try {
      const [overviewData, usersData, projectsData, publishedPagesData, auditLogsData] = await Promise.all([
        getAdminOverview(),
        listAdminUsers(),
        listAdminProjects(),
        listAdminPublishedPages(),
        listAdminAuditLogs(),
      ]);

      setOverview(overviewData);
      setUsers(usersData);
      setProjects(projectsData);
      setPublishedPages(publishedPagesData);
      setAuditLogs(auditLogsData);
    } catch {
      message.error('加载管理员后台数据失败');
    } finally {
      setLoading(false);
    }
  }

  async function handleUserStatusChange(record: AdminUser) {
    const nextStatus = record.status === 'active' ? 'disabled' : 'active';
    setActionKey(`user-${record.id}`);
    try {
      const updatedUser = await updateAdminUserStatus(record.id, nextStatus);
      setUsers((currentUsers) => currentUsers.map((item) => item.id === record.id
        ? updatedUser
        : item));
      await reloadOverviewAndAudit();
      message.success(`${updatedUser.username} 已${nextStatus === 'active' ? '启用' : '禁用'}`);
    } catch {
      message.error('更新用户状态失败');
    } finally {
      setActionKey(null);
    }
  }

  async function handleProjectStatusChange(record: AdminProject) {
    const nextStatus = record.status === 'active' ? 'disabled' : 'active';
    setActionKey(`project-${record.id}`);
    try {
      const updatedProject = await updateAdminProjectStatus(record.id, nextStatus);
      setProjects((currentProjects) => currentProjects.map((item) => item.id === record.id
        ? updatedProject
        : item));
      if (nextStatus === 'disabled') {
        setPublishedPages((currentPages) => currentPages.filter((page) => page.projectId !== record.id));
      }
      await reloadOverviewAndAudit();
      message.success(`${record.name} 已${nextStatus === 'active' ? '启用' : '禁用'}`);
    } catch {
      message.error('更新项目状态失败');
    } finally {
      setActionKey(null);
    }
  }

  async function handleUnpublish(record: AdminPublishedPage) {
    setActionKey(`page-${record.id}`);
    try {
      await adminUnpublishPage(record.id);
      setPublishedPages((currentPages) => currentPages.filter((page) => page.id !== record.id));
      await reloadOverviewAndAudit();
      message.success(`${record.name} 已取消发布`);
    } catch {
      message.error('取消发布失败');
    } finally {
      setActionKey(null);
    }
  }

  async function reloadOverviewAndAudit() {
    const [overviewData, auditLogsData] = await Promise.all([
      getAdminOverview(),
      listAdminAuditLogs(),
    ]);
    setOverview(overviewData);
    setAuditLogs(auditLogsData);
  }

  const filteredUsers = useMemo(() => {
    const keyword = normalizeKeyword(userKeyword);
    return users.filter((item) => {
      const matchesStatus = userStatusFilter === 'all' || item.status === userStatusFilter;
      const matchesKeyword = !keyword || [
        item.username,
        item.nickname,
        item.email,
        item.role === 'admin' ? '管理员' : '普通用户',
      ].some((value) => normalizeKeyword(value).includes(keyword));

      return matchesStatus && matchesKeyword;
    });
  }, [userKeyword, userStatusFilter, users]);

  const filteredProjects = useMemo(() => {
    const keyword = normalizeKeyword(projectKeyword);
    return projects.filter((item) => {
      const matchesStatus = projectStatusFilter === 'all' || item.status === projectStatusFilter;
      const matchesKeyword = !keyword || [
        item.name,
        item.description,
        item.owner.username,
        item.owner.nickname,
        item.owner.email,
      ].some((value) => normalizeKeyword(value).includes(keyword));

      return matchesStatus && matchesKeyword;
    });
  }, [projectKeyword, projectStatusFilter, projects]);

  const filteredPublishedPages = useMemo(() => {
    const keyword = normalizeKeyword(publishedPageKeyword);
    if (!keyword) return publishedPages;

    return publishedPages.filter((item) => [
      item.name,
      item.routePath,
      item.publicId,
      item.projectName,
      item.owner.username,
      item.owner.nickname,
      item.owner.email,
    ].some((value) => normalizeKeyword(value).includes(keyword)));
  }, [publishedPageKeyword, publishedPages]);

  const auditActionOptions = useMemo(() => {
    const actions = [...new Set(auditLogs.map((log) => log.action))].sort();
    return [
      { value: 'all', label: '全部动作' },
      ...actions.map((action) => ({
        value: action,
        label: auditActionText[action] || action,
      })),
    ];
  }, [auditLogs]);

  const filteredAuditLogs = useMemo(() => {
    const keyword = normalizeKeyword(auditKeyword);
    return auditLogs.filter((item) => {
      const matchesAction = auditActionFilter === 'all' || item.action === auditActionFilter;
      const matchesKeyword = !keyword || [
        auditActionText[item.action],
        item.action,
        item.actor?.username,
        item.actor?.nickname,
        item.actor?.email,
        item.summary,
        item.targetType,
        item.targetId,
      ].some((value) => normalizeKeyword(value).includes(keyword));

      return matchesAction && matchesKeyword;
    });
  }, [auditActionFilter, auditKeyword, auditLogs]);

  const { userColumns, projectColumns, publishedPageColumns, auditColumns } = createAdminTableColumns({
    currentUser: user,
    actionKey,
    onUserStatusChange: handleUserStatusChange,
    onProjectStatusChange: handleProjectStatusChange,
    onUnpublish: handleUnpublish,
  });

  if (!isAdmin) {
    return <div className="flex min-h-screen items-center justify-center bg-[#eef2f7] p-6">
      <Card className="w-full max-w-[420px] text-center">
        <Empty description="当前账号没有管理员权限" />
        <Space className="mt-[16px]">
          <Button type="primary" onClick={onBack}>返回项目</Button>
          <Button onClick={onLogout}>退出登录</Button>
        </Space>
      </Card>
    </div>;
  }

  return <div className="min-h-screen bg-[#eef2f7] p-6">
    <div className="mx-auto max-w-[1280px]">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Typography.Title level={3} className="!mb-1">平台管理后台</Typography.Title>
          <Typography.Text type="secondary">当前管理员：{user.username}</Typography.Text>
        </div>
        <Space>
          <Button onClick={() => void loadAll()} loading={loading}>刷新</Button>
          <Button onClick={onBack}>返回项目</Button>
          <Button onClick={onLogout}>退出登录</Button>
        </Space>
      </div>

      <Tabs
        defaultActiveKey="overview"
        items={[
          {
            key: 'overview',
            label: '总览',
            children: <OverviewPane overview={overview} loading={loading} />,
          },
          {
            key: 'users',
            label: '用户管理',
            children: <Card>
              <TableToolbar>
                <Input.Search
                  allowClear
                  placeholder="搜索用户名、邮箱或角色"
                  value={userKeyword}
                  onChange={(event) => setUserKeyword(event.target.value)}
                  className="max-w-[320px]"
                />
                <Select
                  value={userStatusFilter}
                  onChange={setUserStatusFilter}
                  className="w-[132px]"
                  options={[
                    { value: 'all', label: '全部状态' },
                    { value: 'active', label: '正常' },
                    { value: 'disabled', label: '禁用' },
                  ]}
                />
              </TableToolbar>
              <Table
                rowKey="id"
                loading={loading}
                columns={userColumns}
                dataSource={filteredUsers}
                pagination={{ pageSize: 10, showSizeChanger: true }}
                scroll={{ x: 860 }}
              />
            </Card>,
          },
          {
            key: 'projects',
            label: '项目管理',
            children: <Card>
              <TableToolbar>
                <Input.Search
                  allowClear
                  placeholder="搜索项目、拥有者或描述"
                  value={projectKeyword}
                  onChange={(event) => setProjectKeyword(event.target.value)}
                  className="max-w-[320px]"
                />
                <Select
                  value={projectStatusFilter}
                  onChange={setProjectStatusFilter}
                  className="w-[132px]"
                  options={[
                    { value: 'all', label: '全部状态' },
                    { value: 'active', label: '正常' },
                    { value: 'disabled', label: '禁用' },
                  ]}
                />
              </TableToolbar>
              <Table
                rowKey="id"
                loading={loading}
                columns={projectColumns}
                dataSource={filteredProjects}
                pagination={{ pageSize: 10, showSizeChanger: true }}
                scroll={{ x: 960 }}
              />
            </Card>,
          },
          {
            key: 'published',
            label: '发布页',
            children: <Card>
              <TableToolbar>
                <Input.Search
                  allowClear
                  placeholder="搜索页面、项目、路径或 publicId"
                  value={publishedPageKeyword}
                  onChange={(event) => setPublishedPageKeyword(event.target.value)}
                  className="max-w-[360px]"
                />
              </TableToolbar>
              <Table
                rowKey="id"
                loading={loading}
                columns={publishedPageColumns}
                dataSource={filteredPublishedPages}
                pagination={{ pageSize: 10, showSizeChanger: true }}
                scroll={{ x: 820 }}
              />
            </Card>,
          },
          {
            key: 'audit',
            label: '审计日志',
            children: <Card>
              <TableToolbar>
                <Input.Search
                  allowClear
                  placeholder="搜索操作者、动作或摘要"
                  value={auditKeyword}
                  onChange={(event) => setAuditKeyword(event.target.value)}
                  className="max-w-[320px]"
                />
                <Select
                  value={auditActionFilter}
                  onChange={setAuditActionFilter}
                  className="w-[180px]"
                  options={auditActionOptions}
                />
              </TableToolbar>
              <Table
                rowKey="id"
                loading={loading}
                columns={auditColumns}
                dataSource={filteredAuditLogs}
                pagination={{ pageSize: 12, showSizeChanger: true }}
                scroll={{ x: 760 }}
              />
            </Card>,
          },
        ]}
      />
    </div>
  </div>;
}
