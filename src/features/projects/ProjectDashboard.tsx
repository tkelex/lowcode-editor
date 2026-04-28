import { Button, Card, Form, Input, List, Modal, Space, Typography, message } from 'antd';
import { useEffect, useState } from 'react';
import { createPage, listPages } from '../../api/pages';
import { createProject, listProjects } from '../../api/projects';
import { EditorPage, Project, User } from '../../api/types';

interface ProjectDashboardProps {
  user: User;
  onOpenPage: (pageId: number) => void;
  onLogout: () => void;
}

export function ProjectDashboard({ user, onOpenPage, onLogout }: ProjectDashboardProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [pages, setPages] = useState<EditorPage[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [pageModalOpen, setPageModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

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
      }
    } catch (error) {
      message.error('加载项目失败');
    } finally {
      setLoading(false);
    }
  }

  async function loadPages(projectId: number) {
    try {
      const data = await listPages(projectId);
      setPages(data);
    } catch (error) {
      message.error('加载页面失败');
    }
  }

  async function handleCreateProject(values: { name: string; description?: string }) {
    try {
      const project = await createProject(values);
      setProjects([project, ...projects]);
      setSelectedProject(project);
      setPages([]);
      setProjectModalOpen(false);
      message.success('项目创建成功');
    } catch (error) {
      message.error('项目创建失败');
    }
  }

  async function handleCreatePage(values: { name: string; routePath: string }) {
    if (!selectedProject) return;

    try {
      const page = await createPage(selectedProject.id, values);
      setPages([page, ...pages]);
      setPageModalOpen(false);
      message.success('页面创建成功');
    } catch (error) {
      message.error('页面创建失败，路径可能重复或格式不正确');
    }
  }

  async function handleSelectProject(project: Project) {
    setSelectedProject(project);
    await loadPages(project.id);
  }

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
              <List.Item.Meta title={project.name} description={project.description || '暂无描述'} />
            </List.Item>}
          />
        </Card>

        <Card
          title={selectedProject ? `${selectedProject.name} / 页面` : '页面'}
          extra={<Button type="primary" disabled={!selectedProject} onClick={() => setPageModalOpen(true)}>新建页面</Button>}
        >
          <List
            dataSource={pages}
            locale={{ emptyText: selectedProject ? '暂无页面，请新建页面' : '请先选择项目' }}
            renderItem={(page) => <List.Item actions={[<Button type="link" onClick={() => onOpenPage(page.id)}>打开编辑器</Button>]}>
              <List.Item.Meta title={page.name} description={`路径：${page.routePath}`} />
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
      <Form layout="vertical" onFinish={handleCreatePage} initialValues={{ routePath: '/home' }}>
        <Form.Item name="name" label="页面名称" rules={[{ required: true, message: '请输入页面名称' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="routePath" label="页面路径" rules={[{ required: true, message: '请输入页面路径，例如 /home' }]}>
          <Input />
        </Form.Item>
        <Button type="primary" htmlType="submit">创建</Button>
      </Form>
    </Modal>
  </div>
}
