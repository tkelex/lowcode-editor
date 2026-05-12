import { createIdFactory, type TemplateConfig, withParentIds } from './model';

export const builtinTemplates: TemplateConfig[] = [
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

