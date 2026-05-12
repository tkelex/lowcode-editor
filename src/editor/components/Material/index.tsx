import { Button, Empty, Form, Input, Modal, Segmented, Select, Space, Typography, message } from "antd";
import { useEffect, useMemo, useState } from "react";
import { CURRENT_SCHEMA_VERSION } from "../../../../packages/lowcode-schema/src";
import { createProjectTemplate, listProjectTemplates } from "../../../shared/api/templates";
import type { PageTemplate, ProjectRole } from "../../../shared/api/types";
import { ComponentCategory, ComponentConfig, useComponentConfigStore } from "../../registry/component-config";
import { useComponetsStore } from "../../stores/components";
import { MaterialItem } from "../MaterialItem";
import {
    categoryLabels,
    categoryOrder,
    createIdFactory,
    favoriteStorageKey,
    SaveTemplateFormValues,
    serializeComponent,
    TemplateConfig,
    toTemplateConfig,
    MaterialView,
    withParentIds,
} from './model';

interface MaterialProps {
    projectId?: number;
    projectRole?: ProjectRole;
}

const templates: TemplateConfig[] = [
    {
        key: 'content-section',
        title: '内容展示区',
        description: '标题、说明、提示和操作按钮组合。',
        keywords: ['内容', '展示', '标题', '按钮'],
        create: () => {
            const nextId = createIdFactory();
            const containerId = nextId();

            return withParentIds({
                id: containerId,
                name: 'Container',
                desc: '内容展示区',
                props: {},
                styles: {
                    padding: 24,
                },
                children: [
                    {
                        id: nextId(),
                        name: 'Text',
                        desc: '标题文本',
                        props: {
                            text: '页面标题',
                            level: 'strong',
                        },
                        styles: {
                            fontSize: 24,
                            color: '#0f172a',
                        },
                    },
                    {
                        id: nextId(),
                        name: 'Text',
                        desc: '说明文本',
                        props: {
                            text: '这里可以放一段业务说明，让用户快速理解当前页面。',
                        },
                        styles: {
                            color: '#64748b',
                        },
                    },
                    {
                        id: nextId(),
                        name: 'Alert',
                        desc: '提示',
                        props: {
                            type: 'info',
                            message: '操作提示',
                            description: '你可以继续拖入物料或在右侧调整内容。',
                            showIcon: true,
                        },
                    },
                    {
                        id: nextId(),
                        name: 'Button',
                        desc: '按钮',
                        props: {
                            type: 'primary',
                            text: '开始操作',
                        },
                    },
                ],
            });
        },
    },
    {
        key: 'simple-form',
        title: '基础表单',
        description: '表单容器与两个常见字段。',
        keywords: ['表单', '输入', '提交'],
        create: () => {
            const nextId = createIdFactory();
            const formId = nextId();

            return withParentIds({
                id: formId,
                name: 'Form',
                desc: '基础表单',
                props: {
                    title: '基础表单',
                },
                children: [
                    {
                        id: nextId(),
                        name: 'FormItem',
                        desc: '姓名字段',
                        props: {
                            name: 'name',
                            label: '姓名',
                            type: 'input',
                        },
                    },
                    {
                        id: nextId(),
                        name: 'FormItem',
                        desc: '手机号字段',
                        props: {
                            name: 'phone',
                            label: '手机号',
                            type: 'input',
                        },
                    },
                ],
            });
        },
    },
    {
        key: 'data-card',
        title: '数据卡片',
        description: '适合承载指标说明和后续操作。',
        keywords: ['卡片', '数据', '指标'],
        create: () => {
            const nextId = createIdFactory();
            const cardId = nextId();

            return withParentIds({
                id: cardId,
                name: 'Card',
                desc: '数据卡片',
                props: {
                    title: '业务指标',
                    bordered: true,
                },
                children: [
                    {
                        id: nextId(),
                        name: 'Text',
                        desc: '指标文本',
                        props: {
                            text: '本月新增 128 条记录',
                            level: 'strong',
                        },
                        styles: {
                            fontSize: 20,
                            color: '#0f172a',
                        },
                    },
                    {
                        id: nextId(),
                        name: 'Divider',
                        desc: '分割线',
                        props: {
                            text: '操作',
                            orientation: 'left',
                        },
                    },
                    {
                        id: nextId(),
                        name: 'Button',
                        desc: '查看详情按钮',
                        props: {
                            type: 'default',
                            text: '查看详情',
                        },
                    },
                ],
            });
        },
    },
    {
        key: 'form-page',
        title: '表单页',
        description: '标题、提示、表单字段和提交按钮组合。',
        keywords: ['表单页', '表单', '提交'],
        create: () => {
            const nextId = createIdFactory();
            return withParentIds({
                id: nextId(),
                name: 'Container',
                desc: '表单页',
                props: {},
                styles: { padding: 24 },
                children: [
                    {
                        id: nextId(),
                        name: 'Text',
                        desc: '页面标题',
                        props: { text: '用户信息表单', level: 'strong' },
                        styles: { fontSize: 24, color: '#0f172a' },
                    },
                    {
                        id: nextId(),
                        name: 'Alert',
                        desc: '表单提示',
                        props: { type: 'info', message: '填写提示', description: '请填写必要信息后提交。', showIcon: true },
                    },
                    {
                        id: nextId(),
                        name: 'Form',
                        desc: '用户信息表单',
                        props: { title: '基础信息', showActions: true, submitText: '提交', resetText: '重置' },
                        children: [
                            { id: nextId(), name: 'FormItem', desc: '姓名', props: { name: 'name', label: '姓名', type: 'input', rules: 'required', placeholder: '请输入姓名' } },
                            { id: nextId(), name: 'FormItem', desc: '邮箱', props: { name: 'email', label: '邮箱', type: 'input', rules: 'email', placeholder: '请输入邮箱' } },
                            { id: nextId(), name: 'FormItem', desc: '角色', props: { name: 'role', label: '角色', type: 'select', optionsText: '管理员,运营,访客' } },
                        ],
                    },
                ],
            });
        },
    },
    {
        key: 'detail-page',
        title: '详情页',
        description: '详情描述、状态提示和操作按钮组合。',
        keywords: ['详情页', '详情', '描述列表'],
        create: () => {
            const nextId = createIdFactory();
            return withParentIds({
                id: nextId(),
                name: 'Card',
                desc: '详情页',
                props: { title: '订单详情', bordered: true },
                children: [
                    {
                        id: nextId(),
                        name: 'Descriptions',
                        desc: '订单信息',
                        props: {
                            title: '基础信息',
                            pairsText: '订单号:ORD-20260508\n客户:张三\n状态:处理中\n金额:¥1280',
                            column: 2,
                            bordered: true,
                        },
                    },
                    { id: nextId(), name: 'Divider', desc: '分割线', props: { text: '操作', orientation: 'left' } },
                    {
                        id: nextId(),
                        name: 'Space',
                        desc: '操作区',
                        props: { direction: 'horizontal', size: 'middle', wrap: true },
                        children: [
                            { id: nextId(), name: 'Button', desc: '确认按钮', props: { type: 'primary', text: '确认处理' } },
                            { id: nextId(), name: 'Button', desc: '返回按钮', props: { type: 'default', text: '返回列表' } },
                        ],
                    },
                ],
            });
        },
    },
    {
        key: 'list-page',
        title: '列表页',
        description: '筛选提示、数据表格、分页和操作列组合。',
        keywords: ['列表页', '表格', '分页'],
        create: () => {
            const nextId = createIdFactory();
            return withParentIds({
                id: nextId(),
                name: 'Container',
                desc: '列表页',
                props: {},
                styles: { padding: 24 },
                children: [
                    { id: nextId(), name: 'Text', desc: '列表标题', props: { text: '用户列表', level: 'strong' }, styles: { fontSize: 24 } },
                    {
                        id: nextId(),
                        name: 'Table',
                        desc: '用户表格',
                        props: {
                            pagination: true,
                            pageSize: 10,
                            dataText: '[{"id":1,"name":"张三","status":"启用","createdAt":"2026-05-08"},{"id":2,"name":"李四","status":"停用","createdAt":"2026-05-07"}]',
                        },
                        children: [
                            { id: nextId(), name: 'TableColumn', desc: '姓名列', props: { title: '姓名', dataIndex: 'name', type: 'text' } },
                            { id: nextId(), name: 'TableColumn', desc: '状态列', props: { title: '状态', dataIndex: 'status', type: 'text' } },
                            { id: nextId(), name: 'TableColumn', desc: '日期列', props: { title: '创建时间', dataIndex: 'createdAt', type: 'date' } },
                            { id: nextId(), name: 'TableColumn', desc: '操作列', props: { title: '操作', dataIndex: 'action', type: 'action', actionText: '详情', actionUrl: '/detail/{{record.id}}' } },
                        ],
                    },
                ],
            });
        },
    },
    {
        key: 'modal-form',
        title: '弹窗表单',
        description: '弹窗容器内置表单，适合新增和编辑场景。',
        keywords: ['弹窗', '表单', '新增'],
        create: () => {
            const nextId = createIdFactory();
            return withParentIds({
                id: nextId(),
                name: 'Modal',
                desc: '弹窗表单',
                props: { title: '新增记录' },
                children: [
                    {
                        id: nextId(),
                        name: 'Form',
                        desc: '弹窗内表单',
                        props: { title: '记录信息', showActions: false },
                        children: [
                            { id: nextId(), name: 'FormItem', desc: '名称', props: { name: 'name', label: '名称', type: 'input', rules: 'required' } },
                            { id: nextId(), name: 'FormItem', desc: '日期', props: { name: 'date', label: '日期', type: 'date' } },
                        ],
                    },
                ],
            });
        },
    },
    {
        key: 'dashboard',
        title: '仪表盘',
        description: '指标卡片、图表和列表数据组合。',
        keywords: ['仪表盘', '指标', '图表'],
        create: () => {
            const nextId = createIdFactory();
            return withParentIds({
                id: nextId(),
                name: 'Container',
                desc: '仪表盘',
                props: {},
                styles: { padding: 24 },
                children: [
                    { id: nextId(), name: 'Text', desc: '仪表盘标题', props: { text: '业务仪表盘', level: 'strong' }, styles: { fontSize: 24 } },
                    {
                        id: nextId(),
                        name: 'Grid',
                        desc: '指标网格',
                        props: { columns: 3, gap: 12 },
                        children: [
                            { id: nextId(), name: 'Statistic', desc: '新增指标', props: { title: '新增用户', value: 128, suffix: '人' } },
                            { id: nextId(), name: 'Statistic', desc: '订单指标', props: { title: '订单数', value: 342, suffix: '单' } },
                            { id: nextId(), name: 'Statistic', desc: '转化指标', props: { title: '转化率', value: 18.6, suffix: '%' } },
                        ],
                    },
                    { id: nextId(), name: 'Chart', desc: '趋势图', props: { title: '月度趋势', dataText: '一月:30\n二月:52\n三月:76\n四月:48' } },
                    { id: nextId(), name: 'List', desc: '动态列表', props: { bordered: true, dataText: '[{"id":1,"title":"系统上线","description":"发布新版编辑器"},{"id":2,"title":"数据同步","description":"同步完成 342 条记录"}]' } },
                ],
            });
        },
    },
];

export function Material({ projectId, projectRole = 'owner' }: MaterialProps) {
    const { componentConfig } = useComponentConfigStore();
    const { addComponent, components, curComponent, setCurComponentId } = useComponetsStore((state) => ({
        addComponent: state.addComponent,
        components: state.components,
        curComponent: state.curComponent,
        setCurComponentId: state.setCurComponentId,
    }));
    const [keyword, setKeyword] = useState('');
    const [view, setView] = useState<MaterialView>('all');
    const [projectTemplates, setProjectTemplates] = useState<PageTemplate[]>([]);
    const [loadingTemplates, setLoadingTemplates] = useState(false);
    const [templateModalOpen, setTemplateModalOpen] = useState(false);
    const [savingTemplate, setSavingTemplate] = useState(false);
    const [templateForm] = Form.useForm<SaveTemplateFormValues>();
    const [favoriteNames, setFavoriteNames] = useState<string[]>(() => {
        try {
            return JSON.parse(localStorage.getItem(favoriteStorageKey) || '[]') as string[];
        } catch {
            return [];
        }
    });
    const canSaveTemplate = Boolean(projectId && (projectRole === 'owner' || projectRole === 'editor'));

    useEffect(() => {
        if (view !== 'template' || !projectId) return;

        void loadProjectTemplates();
    }, [projectId, view]);

    const filteredComponents = useMemo(() => {
        const searchText = keyword.trim().toLowerCase();

        return Object.values(componentConfig)
            .filter(item => item.name !== 'Page')
            .filter(item => view !== 'favorite' || favoriteNames.includes(item.name))
            .filter(item => {
                if (!searchText) return true;

                return [item.name, item.desc, ...(item.keywords || [])]
                    .join(' ')
                    .toLowerCase()
                    .includes(searchText);
            })
            .sort((a, b) => (a.sort || 0) - (b.sort || 0));
     }, [componentConfig, favoriteNames, keyword, view]);

    const groupedComponents = useMemo(() => {
        return filteredComponents.reduce<Record<ComponentCategory, ComponentConfig[]>>((result, item) => {
            const category = item.category || 'basic';
            result[category].push(item);
            return result;
        }, {
            layout: [],
            basic: [],
            form: [],
            data: [],
            feedback: [],
        });
    }, [filteredComponents]);

    const filteredTemplates = useMemo(() => {
        const searchText = keyword.trim().toLowerCase();
        const remoteTemplates = projectTemplates.map((template) => toTemplateConfig(template));
        const allTemplates = [...remoteTemplates, ...templates];
        if (!searchText) return allTemplates;

        return allTemplates.filter(template => {
            return [template.title, template.description, ...template.keywords]
                .join(' ')
                .toLowerCase()
                .includes(searchText);
        });
    }, [keyword, projectTemplates]);

    const hasComponents = categoryOrder.some(category => groupedComponents[category].length > 0);

    function toggleFavorite(name: string) {
        const nextNames = favoriteNames.includes(name)
            ? favoriteNames.filter(item => item !== name)
            : [...favoriteNames, name];

        setFavoriteNames(nextNames);
        localStorage.setItem(favoriteStorageKey, JSON.stringify(nextNames));
    }

    function addTemplate(template: TemplateConfig) {
        const component = template.create();
        addComponent(component, 1);
        setCurComponentId(component.id);
        message.success(`${template.title}已添加到画布`);
    }

    async function loadProjectTemplates() {
        if (!projectId) return;

        setLoadingTemplates(true);
        try {
            const data = await listProjectTemplates(projectId);
            setProjectTemplates(data);
        } catch {
            message.error('加载项目模板失败');
        } finally {
            setLoadingTemplates(false);
        }
    }

    function openSaveTemplateModal() {
        if (!canSaveTemplate) {
            message.warning('当前角色不能保存模板');
            return;
        }

        templateForm.setFieldsValue({
            title: curComponent && curComponent.id !== 1 ? curComponent.desc : '页面模板',
            type: curComponent && curComponent.id !== 1 ? 'block' : 'page',
            visibility: 'project',
        });
        setTemplateModalOpen(true);
    }

    async function handleSaveTemplate(values: SaveTemplateFormValues) {
        if (!projectId) return;

        const targetComponents = values.type === 'block' && curComponent && curComponent.id !== 1
            ? [serializeComponent(curComponent)]
            : components.map(serializeComponent);

        setSavingTemplate(true);
        try {
            const template = await createProjectTemplate(projectId, {
                ...values,
                schema: {
                    schemaVersion: CURRENT_SCHEMA_VERSION,
                    pageId: null,
                    components: targetComponents,
                    metadata: {
                        createdFrom: values.type,
                        updatedAt: new Date().toISOString(),
                    },
                },
            });

            setProjectTemplates((currentTemplates) => [template, ...currentTemplates]);
            setTemplateModalOpen(false);
            message.success('模板已保存');
        } catch {
            message.error('保存模板失败');
        } finally {
            setSavingTemplate(false);
        }
    }

    return <div className="h-full overflow-auto px-[12px] pb-[16px]">
        <Space direction="vertical" size={10} className="mb-[14px] w-full">
            <Segmented
                block
                size="small"
                value={view}
                onChange={(value) => setView(value as MaterialView)}
                options={[
                    { label: '全部', value: 'all' },
                    { label: `收藏 ${favoriteNames.length}`, value: 'favorite' },
                    { label: '模板', value: 'template' },
                ]}
            />
            <Input.Search
                allowClear
                placeholder={view === 'template' ? '搜索模板' : '搜索组件'}
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
            />
        </Space>

        {view === 'template' ? (
            <div className="space-y-[10px]">
                <div className="flex items-center justify-between rounded-[8px] border border-[#e5e7eb] bg-white px-[10px] py-[8px]">
                    <Typography.Text type="secondary" className="text-[12px]">
                        {projectId ? `项目模板 ${projectTemplates.length} 个` : '打开页面后可读取项目模板'}
                    </Typography.Text>
                    <Space size={6}>
                        <Button size="small" onClick={() => void loadProjectTemplates()} disabled={!projectId} loading={loadingTemplates}>刷新</Button>
                        <Button size="small" type="primary" disabled={!canSaveTemplate} onClick={openSaveTemplateModal}>保存模板</Button>
                    </Space>
                </div>
                {filteredTemplates.length === 0 && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="没有匹配的模板" />}
                {filteredTemplates.map(template => (
                    <div key={template.key} className="rounded-[8px] border border-[#e5e7eb] bg-white p-[12px] shadow-sm">
                        <div className="mb-[4px] flex items-start justify-between gap-[8px]">
                            <div className="min-w-0">
                                <Typography.Text strong className="block text-[13px] text-[#111827]">
                                    {template.title}
                                </Typography.Text>
                                <Typography.Text type="secondary" className="block text-[12px] leading-[18px]">
                                    {template.description}
                                </Typography.Text>
                            </div>
                            <Button size="small" type="primary" onClick={() => addTemplate(template)}>
                                添加
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <>
                {!hasComponents && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={view === 'favorite' ? '还没有收藏物料' : '没有匹配的物料'} />}

                {categoryOrder.map(category => {
                    const components = groupedComponents[category];
                    if (!components.length) return null;

                    return <section key={category} className="mb-[18px]">
                        <Typography.Text className="mb-[8px] block text-[12px] font-medium text-[#6b7280]">
                            {categoryLabels[category]}
                        </Typography.Text>
                        <div className="grid grid-cols-2 gap-[8px]">
                            {components.map((item) => {
                                return <MaterialItem
                                    key={item.name}
                                    name={item.name}
                                    desc={item.desc}
                                    icon={item.icon}
                                    favorite={favoriteNames.includes(item.name)}
                                    onToggleFavorite={toggleFavorite}
                                />
                            })}
                        </div>
                    </section>
                })}
            </>
        )}

        <Modal
            title="保存为模板"
            open={templateModalOpen}
            footer={null}
            onCancel={() => setTemplateModalOpen(false)}
        >
            <Form form={templateForm} layout="vertical" onFinish={handleSaveTemplate}>
                <Form.Item name="title" label="模板名称" rules={[{ required: true, message: '请输入模板名称' }]}>
                    <Input />
                </Form.Item>
                <Form.Item name="description" label="模板说明">
                    <Input.TextArea rows={3} />
                </Form.Item>
                <Form.Item name="type" label="模板类型" rules={[{ required: true, message: '请选择模板类型' }]}>
                    <Select
                        options={[
                            { value: 'page', label: '页面模板' },
                            { value: 'block', label: '区块模板' },
                        ]}
                    />
                </Form.Item>
                <Form.Item name="visibility" label="可见范围" rules={[{ required: true, message: '请选择可见范围' }]}>
                    <Select
                        options={[
                            { value: 'project', label: '项目内可见' },
                            { value: 'private', label: '仅自己可见' },
                        ]}
                    />
                </Form.Item>
                <Button type="primary" htmlType="submit" loading={savingTemplate}>保存</Button>
            </Form>
        </Modal>
    </div>
}
