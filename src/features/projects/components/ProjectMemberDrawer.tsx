import { Button, Drawer, Form, Input, Select, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { FormInstance } from 'antd';
import type { Project, ProjectMember } from '../../../shared/api/types';
import type { AddMemberFormValues } from '../model/types';

interface ProjectMemberDrawerProps {
  open: boolean;
  project: Project | null;
  canManageProject: boolean;
  loading: boolean;
  adding: boolean;
  members: ProjectMember[];
  columns: ColumnsType<ProjectMember>;
  form: FormInstance<AddMemberFormValues>;
  onClose: () => void;
  onRefresh: (projectId: number) => void;
  onAddMember: (values: AddMemberFormValues) => void;
}

export function ProjectMemberDrawer({
  open,
  project,
  canManageProject,
  loading,
  adding,
  members,
  columns,
  form,
  onClose,
  onRefresh,
  onAddMember,
}: ProjectMemberDrawerProps) {
  return <Drawer
    title={project ? `${project.name} / 成员` : '成员'}
    open={open}
    width={720}
    onClose={onClose}
    extra={<Button onClick={() => project && void onRefresh(project.id)} loading={loading}>刷新</Button>}
  >
    {canManageProject && (
      <Form
        form={form}
        layout="inline"
        initialValues={{ role: 'viewer' }}
        onFinish={onAddMember}
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
        <Button type="primary" htmlType="submit" loading={adding}>添加成员</Button>
      </Form>
    )}

    <Table
      rowKey="id"
      loading={loading}
      columns={columns}
      dataSource={members}
      pagination={false}
    />
  </Drawer>;
}
