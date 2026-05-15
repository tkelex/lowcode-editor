import {
  Button,
  Drawer,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import { useEffect, useMemo, useState } from 'react';
import {
  CrudPageType,
  DataSourceApiEndpoint,
  DataSourceFieldMapping,
  ProjectDataSourceModelConfig,
  generateCrudPageSchema,
  validateDataSourceModelConfig,
} from '../../../../packages/lowcode-schema/src';
import {
  createDataSourceModel,
  deleteDataSourceModel,
  listDataSourceModels,
  updateDataSourceModel,
} from '../../../shared/api/data-source-models';
import { createPage } from '../../../shared/api/pages';
import type { EditorPage, Project, ProjectRole } from '../../../shared/api/types';

interface DataSourceModelDrawerProps {
  open: boolean;
  project: Project | null;
  pages: EditorPage[];
  canEdit: boolean;
  currentRole: ProjectRole;
  onClose: () => void;
  onPagesCreated: (page: EditorPage) => void;
  onOpenPage: (pageId: number, role: ProjectRole) => void;
}

interface DataSourceModelFormValues {
  name: string;
  key: string;
  primaryField: string;
  description?: string;
  listApi?: EndpointFormValue;
  detailApi?: EndpointFormValue;
  createApi?: EndpointFormValue;
  updateApi?: EndpointFormValue;
  deleteApi?: EndpointFormValue;
  fields: Array<Partial<DataSourceFieldMapping>>;
}

type EndpointFormValue = Pick<DataSourceApiEndpoint, 'url' | 'method' | 'responseDataPath' | 'responseTotalPath'>;

interface GenerateFormValues {
  pageType: CrudPageType;
  pageName: string;
  routePath: string;
  listRoutePath?: string;
  detailRoutePath?: string;
}

const FIELD_TYPE_OPTIONS = [
  { label: '文本', value: 'text' },
  { label: '多行文本', value: 'textarea' },
  { label: '数字', value: 'number' },
  { label: '布尔', value: 'boolean' },
  { label: '日期', value: 'date' },
  { label: '下拉', value: 'select' },
];

const METHOD_OPTIONS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((method) => ({ label: method, value: method }));

export function DataSourceModelDrawer({
  open,
  project,
  pages,
  canEdit,
  currentRole,
  onClose,
  onPagesCreated,
  onOpenPage,
}: DataSourceModelDrawerProps) {
  const [models, setModels] = useState<ProjectDataSourceModelConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [creatingPage, setCreatingPage] = useState(false);
  const [modelModalOpen, setModelModalOpen] = useState(false);
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<ProjectDataSourceModelConfig | null>(null);
  const [generatingModel, setGeneratingModel] = useState<ProjectDataSourceModelConfig | null>(null);
  const [generatedPage, setGeneratedPage] = useState<EditorPage | null>(null);
  const [modelForm] = Form.useForm<DataSourceModelFormValues>();
  const [generateForm] = Form.useForm<GenerateFormValues>();

  const existingRoutePaths = useMemo(() => new Set(pages.map((page) => page.routePath)), [pages]);

  useEffect(() => {
    if (open && project) {
      void loadModels(project.id);
    }
  }, [open, project?.id]);

  async function loadModels(projectId: number) {
    setLoading(true);
    try {
      setModels(await listDataSourceModels(projectId));
    } catch {
      message.error('加载数据源模型失败');
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    if (!canEdit) {
      message.warning('当前角色只有查看权限，不能维护数据源模型');
      return;
    }

    setEditingModel(null);
    modelForm.setFieldsValue({
      name: '',
      key: '',
      primaryField: 'id',
      listApi: { method: 'GET' },
      detailApi: { method: 'GET' },
      createApi: { method: 'POST' },
      updateApi: { method: 'PATCH' },
      deleteApi: { method: 'DELETE' },
      fields: [
        {
          key: 'id',
          label: 'ID',
          type: 'text',
          listVisible: true,
          formVisible: false,
          detailVisible: true,
        },
        {
          key: 'name',
          label: '名称',
          type: 'text',
          required: true,
          listVisible: true,
          formVisible: true,
          detailVisible: true,
        },
      ],
    });
    setModelModalOpen(true);
  }

  function openEditModal(model: ProjectDataSourceModelConfig) {
    setEditingModel(model);
    modelForm.setFieldsValue(toFormValues(model));
    setModelModalOpen(true);
  }

  function openGenerateModal(model: ProjectDataSourceModelConfig) {
    if (!project || !canEdit) return;

    setGeneratingModel(model);
    setGeneratedPage(null);
    generateForm.setFieldsValue({
      pageType: 'list',
      pageName: `${model.name}列表`,
      routePath: nextRoutePath(`/${model.key}`),
      listRoutePath: `/${model.key}`,
      detailRoutePath: `/${model.key}/detail`,
    });
    setGenerateModalOpen(true);
  }

  async function handleSaveModel(values: DataSourceModelFormValues) {
    if (!project || !canEdit) return;

    const input = normalizeModelInput(values);
    const validation = validateDataSourceModelConfig(input);
    if (!validation.valid) {
      message.error(validation.errors[0]?.message || '数据源模型配置不合法');
      return;
    }

    setSaving(true);
    try {
      const saved = editingModel?.id
        ? await updateDataSourceModel(editingModel.id, input)
        : await createDataSourceModel(project.id, input);
      setModels((current) => editingModel?.id
        ? current.map((item) => item.id === saved.id ? saved : item)
        : [saved, ...current]);
      setModelModalOpen(false);
      message.success(editingModel ? '数据源模型已更新' : '数据源模型已创建');
    } catch {
      message.error('保存数据源模型失败，请检查标识是否重复');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteModel(model: ProjectDataSourceModelConfig) {
    if (!model.id || !canEdit) return;

    try {
      await deleteDataSourceModel(model.id);
      setModels((current) => current.filter((item) => item.id !== model.id));
      message.success('数据源模型已删除');
    } catch {
      message.error('删除数据源模型失败');
    }
  }

  async function handleGeneratePage(values: GenerateFormValues) {
    if (!project || !generatingModel || !canEdit) return;

    if (existingRoutePaths.has(values.routePath)) {
      message.error('页面路径已存在，请修改后再生成');
      return;
    }

    setCreatingPage(true);
    try {
      const result = generateCrudPageSchema(generatingModel, {
        pageType: values.pageType,
        pageName: values.pageName,
        routePath: values.routePath,
        listRoutePath: values.listRoutePath,
        detailRoutePath: values.detailRoutePath,
      });
      const page = await createPage(project.id, {
        name: values.pageName,
        routePath: values.routePath,
        schema: result.schema,
      });
      onPagesCreated(page);
      setGeneratedPage(page);
      message.success('CRUD 页面已生成');
    } catch {
      message.error('生成页面失败，请检查模型配置和页面路径');
    } finally {
      setCreatingPage(false);
    }
  }

  function nextRoutePath(prefix: string) {
    let route = prefix;
    let index = 2;
    while (existingRoutePaths.has(route)) {
      route = `${prefix}-${index}`;
      index += 1;
    }
    return route;
  }

  const columns = [
    {
      title: '模型',
      dataIndex: 'name',
      render: (_: string, model: ProjectDataSourceModelConfig) => <div className="min-w-0">
        <Typography.Text strong>{model.name}</Typography.Text>
        <div className="mt-1 text-[12px] text-slate-500">{model.key} / 主键：{model.primaryField}</div>
      </div>,
    },
    {
      title: '字段',
      dataIndex: 'fields',
      width: 90,
      render: (fields: DataSourceFieldMapping[]) => fields?.length || 0,
    },
    {
      title: '接口',
      width: 260,
      render: (_: unknown, model: ProjectDataSourceModelConfig) => <Space size={[4, 6]} wrap>
        {model.listApi && <Tag color="blue">列表</Tag>}
        {model.detailApi && <Tag color="cyan">详情</Tag>}
        {model.createApi && <Tag color="green">新增</Tag>}
        {model.updateApi && <Tag color="gold">更新</Tag>}
        {model.deleteApi && <Tag color="red">删除</Tag>}
      </Space>,
    },
    {
      title: '操作',
      width: 240,
      render: (_: unknown, model: ProjectDataSourceModelConfig) => <Space wrap>
        <Button size="small" onClick={() => openGenerateModal(model)} disabled={!canEdit}>生成</Button>
        <Button size="small" onClick={() => openEditModal(model)} disabled={!canEdit}>编辑</Button>
        <Popconfirm title="删除数据源模型？" onConfirm={() => void handleDeleteModel(model)}>
          <Button size="small" danger disabled={!canEdit}>删除</Button>
        </Popconfirm>
      </Space>,
    },
  ];

  return <>
    <Drawer
      title={project ? `${project.name} / 数据源模型` : '数据源模型'}
      open={open}
      width={980}
      onClose={onClose}
      extra={<Space>
        <Button onClick={() => project && void loadModels(project.id)} loading={loading}>刷新</Button>
        <Button type="primary" onClick={openCreateModal} disabled={!canEdit}>新建模型</Button>
      </Space>}
    >
      <Table
        rowKey={(record) => record.id || record.key}
        loading={loading}
        columns={columns}
        dataSource={models}
        pagination={{ pageSize: 8 }}
        scroll={{ x: 760 }}
        locale={{ emptyText: '暂无数据源模型' }}
      />
    </Drawer>

    <Modal
      title={editingModel ? '编辑数据源模型' : '新建数据源模型'}
      open={modelModalOpen}
      width={920}
      footer={null}
      onCancel={() => setModelModalOpen(false)}
      destroyOnClose
    >
      <Form form={modelForm} layout="vertical" onFinish={handleSaveModel}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Form.Item name="name" label="模型名称" rules={[{ required: true, message: '请输入模型名称' }]}>
            <Input placeholder="用户" />
          </Form.Item>
          <Form.Item name="key" label="模型标识" rules={[{ required: true, message: '请输入模型标识' }]}>
            <Input placeholder="user" />
          </Form.Item>
          <Form.Item name="primaryField" label="主键字段" rules={[{ required: true, message: '请输入主键字段' }]}>
            <Input placeholder="id" />
          </Form.Item>
        </div>
        <Form.Item name="description" label="说明">
          <Input.TextArea rows={2} maxLength={500} showCount />
        </Form.Item>

        <Typography.Text strong>外部 API</Typography.Text>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          {renderEndpoint('listApi', '列表接口', 'data.items')}
          {renderEndpoint('detailApi', '详情接口', 'data')}
          {renderEndpoint('createApi', '新增接口')}
          {renderEndpoint('updateApi', '更新接口')}
          {renderEndpoint('deleteApi', '删除接口')}
        </div>

        <div className="mt-5 flex items-center justify-between">
          <Typography.Text strong>字段映射</Typography.Text>
          <Typography.Text className="text-[12px] !text-slate-500">控制表格列、表单项、详情展示和请求 body 写入路径</Typography.Text>
        </div>
        <Form.List name="fields">
          {(fields, { add, remove }) => <div className="mt-3 space-y-3">
            {fields.map((field) => <div key={field.key} className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
                <Form.Item {...field} name={[field.name, 'key']} label="key" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
                <Form.Item {...field} name={[field.name, 'label']} label="标题" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
                <Form.Item {...field} name={[field.name, 'type']} label="类型" rules={[{ required: true }]}>
                  <Select options={FIELD_TYPE_OPTIONS} />
                </Form.Item>
                <Form.Item {...field} name={[field.name, 'sourcePath']} label="响应路径">
                  <Input placeholder="默认同 key" />
                </Form.Item>
                <Form.Item {...field} name={[field.name, 'requestPath']} label="请求路径">
                  <Input placeholder="默认同 key" />
                </Form.Item>
                <Form.Item {...field} name={[field.name, 'optionsText']} label="选项">
                  <Input placeholder="启用:enabled" />
                </Form.Item>
              </div>
              <Space wrap>
                <Form.Item {...field} name={[field.name, 'required']} valuePropName="checked" noStyle>
                  <Switch checkedChildren="必填" unCheckedChildren="可选" />
                </Form.Item>
                <Form.Item {...field} name={[field.name, 'listVisible']} valuePropName="checked" noStyle>
                  <Switch checkedChildren="列表" unCheckedChildren="列表" />
                </Form.Item>
                <Form.Item {...field} name={[field.name, 'formVisible']} valuePropName="checked" noStyle>
                  <Switch checkedChildren="表单" unCheckedChildren="表单" />
                </Form.Item>
                <Form.Item {...field} name={[field.name, 'detailVisible']} valuePropName="checked" noStyle>
                  <Switch checkedChildren="详情" unCheckedChildren="详情" />
                </Form.Item>
                <Button size="small" danger onClick={() => remove(field.name)}>移除字段</Button>
              </Space>
            </div>)}
            <Button onClick={() => add({
              key: '',
              label: '',
              type: 'text',
              listVisible: true,
              formVisible: true,
              detailVisible: true,
            })}>添加字段</Button>
          </div>}
        </Form.List>

        <Space className="mt-5">
          <Button type="primary" htmlType="submit" loading={saving}>保存模型</Button>
          <Button onClick={() => setModelModalOpen(false)}>取消</Button>
        </Space>
      </Form>
    </Modal>

    <Modal
      title={generatingModel ? `从「${generatingModel.name}」生成 CRUD 页面` : '生成 CRUD 页面'}
      open={generateModalOpen}
      footer={null}
      onCancel={() => setGenerateModalOpen(false)}
      destroyOnClose
    >
      <Form form={generateForm} layout="vertical" onFinish={handleGeneratePage}>
        <Form.Item name="pageType" label="页面类型" rules={[{ required: true }]}>
          <Select
            options={[
              { label: '列表页', value: 'list' },
              { label: '新建表单页', value: 'create' },
              { label: '编辑表单页', value: 'edit' },
              { label: '详情页', value: 'detail' },
            ]}
            onChange={(value: CrudPageType) => {
              if (!generatingModel) return;
              const labelMap = { list: '列表', create: '新建', edit: '编辑', detail: '详情' };
              generateForm.setFieldsValue({
                pageName: `${generatingModel.name}${labelMap[value]}`,
                routePath: nextRoutePath(`/${generatingModel.key}${value === 'list' ? '' : `/${value}`}`),
              });
            }}
          />
        </Form.Item>
        <Form.Item name="pageName" label="页面名称" rules={[{ required: true, message: '请输入页面名称' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="routePath" label="页面路径" rules={[{ required: true, message: '请输入页面路径' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="listRoutePath" label="列表页路径">
          <Input placeholder="/users" />
        </Form.Item>
        <Form.Item name="detailRoutePath" label="详情页路径">
          <Input placeholder="/users/detail" />
        </Form.Item>
        {generatedPage && (
          <div className="mb-4 rounded-md border border-green-200 bg-green-50 p-3 text-[13px] text-green-700">
            已创建页面：{generatedPage.name}（{generatedPage.routePath}）
          </div>
        )}
        <Space>
          <Button type="primary" htmlType="submit" loading={creatingPage}>生成页面</Button>
          {generatedPage && <Button onClick={() => onOpenPage(generatedPage.id, currentRole)}>打开编辑器</Button>}
          <Button onClick={() => setGenerateModalOpen(false)}>关闭</Button>
        </Space>
      </Form>
    </Modal>
  </>;
}

function renderEndpoint(name: keyof DataSourceModelFormValues, title: string, placeholderDataPath?: string) {
  return <div className="rounded-md border border-slate-200 bg-white p-3">
    <Typography.Text strong>{title}</Typography.Text>
    <div className="mt-3 grid grid-cols-[110px_minmax(0,1fr)] gap-2">
      <Form.Item name={[name, 'method']} label="方法" className="mb-0">
        <Select options={METHOD_OPTIONS} />
      </Form.Item>
      <Form.Item name={[name, 'url']} label="URL" className="mb-0">
        <Input placeholder="/api/users/{{ variables.recordId }}" />
      </Form.Item>
    </div>
    <Form.Item name={[name, 'responseDataPath']} label="响应数据路径" className="mb-0 mt-2">
      <Input placeholder={placeholderDataPath || '可选'} />
    </Form.Item>
  </div>;
}

function normalizeModelInput(values: DataSourceModelFormValues) {
  const input = {
    name: values.name?.trim(),
    key: values.key?.trim(),
    primaryField: values.primaryField?.trim(),
    description: values.description?.trim() || undefined,
    listApi: normalizeEndpoint(values.listApi),
    detailApi: normalizeEndpoint(values.detailApi),
    createApi: normalizeEndpoint(values.createApi),
    updateApi: normalizeEndpoint(values.updateApi),
    deleteApi: normalizeEndpoint(values.deleteApi),
    fields: (values.fields || []).map((field) => ({
      key: field.key?.trim() || '',
      label: field.label?.trim() || '',
      type: field.type || 'text',
      sourcePath: field.sourcePath?.trim() || undefined,
      requestPath: field.requestPath?.trim() || undefined,
      required: Boolean(field.required),
      listVisible: field.listVisible !== false,
      formVisible: field.formVisible !== false,
      detailVisible: field.detailVisible !== false,
      optionsText: field.optionsText?.trim() || undefined,
    })),
  };

  return input as ProjectDataSourceModelConfig;
}

function normalizeEndpoint(endpoint?: EndpointFormValue) {
  if (!endpoint?.url?.trim()) return undefined;

  return {
    url: endpoint.url.trim(),
    method: endpoint.method || 'GET',
    responseDataPath: endpoint.responseDataPath?.trim() || undefined,
    responseTotalPath: endpoint.responseTotalPath?.trim() || undefined,
  } as DataSourceApiEndpoint;
}

function toFormValues(model: ProjectDataSourceModelConfig): DataSourceModelFormValues {
  return {
    ...model,
    listApi: toEndpointFormValue(model.listApi),
    detailApi: toEndpointFormValue(model.detailApi),
    createApi: toEndpointFormValue(model.createApi),
    updateApi: toEndpointFormValue(model.updateApi),
    deleteApi: toEndpointFormValue(model.deleteApi),
  };
}

function toEndpointFormValue(endpoint?: DataSourceApiEndpoint | null): EndpointFormValue | undefined {
  if (!endpoint) return undefined;

  return {
    url: endpoint.url,
    method: endpoint.method,
    responseDataPath: endpoint.responseDataPath,
    responseTotalPath: endpoint.responseTotalPath,
  };
}
