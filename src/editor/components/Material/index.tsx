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
    favoriteStorageKey,
    SaveTemplateFormValues,
    serializeComponent,
    TemplateConfig,
    toTemplateConfig,
    MaterialView,
} from './model';
import { builtinTemplates } from './builtinTemplates';

interface MaterialProps {
    projectId?: number;
    projectRole?: ProjectRole;
}

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

                const category = item.category || 'basic';
                return [item.name, item.desc, category, categoryLabels[category], ...(item.keywords || [])]
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
        const allTemplates = [...remoteTemplates, ...builtinTemplates];
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

    return <div className="editor-material-panel h-full overflow-auto px-[12px] pb-[16px]">
        <Space direction="vertical" size={10} className="mb-[14px] w-full">
            <Segmented
                className="editor-material-view-switch"
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
                className="editor-material-search"
                allowClear
                placeholder={view === 'template' ? '搜索模板' : '搜索组件'}
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
            />
        </Space>

        {view === 'template' ? (
            <div className="space-y-[10px]">
                <div className="editor-template-toolbar flex items-center justify-between rounded-[8px] border border-[#e5e7eb] bg-white px-[10px] py-[8px]">
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
                    <div key={template.key} className="editor-template-card rounded-[8px] border border-[#e5e7eb] bg-white p-[12px] shadow-sm">
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

                    return <section key={category} className="editor-material-section mb-[18px]">
                        <Typography.Text className="editor-material-section-title mb-[8px] block text-[12px] font-medium text-[#6b7280]">
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
