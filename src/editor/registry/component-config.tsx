import { create } from 'zustand';
import ContainerDev from '../materials/Container/dev';
import ContainerProd from '../materials/Container/prod';
import ButtonDev from '../materials/Button/dev';
import ButtonProd from '../materials/Button/prod';
import PageDev from '../materials/Page/dev';
import PageProd from '../materials/Page/prod';
import ModalProd from '../materials/Modal/prod';
import ModalDev from '../materials/Modal/dev';
import TableDev from '../materials/Table/dev';
import TableProd from '../materials/Table/prod';
import TableColumnDev from '../materials/TableColumn/dev';
import TableColumnProd from '../materials/TableColumn/prod';
import FormDev from '../materials/Form/dev';
import FormProd from '../materials/Form/prod';
import FormItemDev from '../materials/FormItem/dev';
import FormItemProd from '../materials/FormItem/prod';
import TextDev from '../materials/Text/dev';
import TextProd from '../materials/Text/prod';
import ImageDev from '../materials/Image/dev';
import ImageProd from '../materials/Image/prod';
import DividerDev from '../materials/Divider/dev';
import DividerProd from '../materials/Divider/prod';
import CardDev from '../materials/Card/dev';
import CardProd from '../materials/Card/prod';
import AlertDev from '../materials/Alert/dev';
import AlertProd from '../materials/Alert/prod';
import InputDev from '../materials/Input/dev';
import InputProd from '../materials/Input/prod';
import SelectDev from '../materials/Select/dev';
import SelectProd from '../materials/Select/prod';
import SwitchDev from '../materials/Switch/dev';
import SwitchProd from '../materials/Switch/prod';
import {
    ChartDev,
    ChartProd,
    CheckboxDev,
    CheckboxProd,
    DatePickerDev,
    DatePickerProd,
    DescriptionsDev,
    DescriptionsProd,
    DrawerDev,
    DrawerProd,
    EmptyDev,
    EmptyProd,
    FlexDev,
    FlexProd,
    GridDev,
    GridProd,
    IconDev,
    IconProd,
    LinkDev,
    LinkProd,
    ListDev,
    ListProd,
    NotificationDev,
    NotificationProd,
    PaginationDev,
    PaginationProd,
    PopoverDev,
    PopoverProd,
    RadioDev,
    RadioProd,
    RateDev,
    RateProd,
    ResultDev,
    ResultProd,
    SpaceDev,
    SpaceProd,
    StatisticDev,
    StatisticProd,
    StepsDev,
    StepsProd,
    TabsDev,
    TabsProd,
    TextareaDev,
    TextareaProd,
    TooltipDev,
    TooltipProd,
    UploadDev,
    UploadProd,
} from '../materials/p3';
import { COMMON_CHILDREN } from '../materials/commonChildren';
import type { ActionType, EventCategory } from '../events/types';

export interface ComponentSetter {
    name: string;
    label: string;
    type: string;
    [key: string]: any;
}

export interface ComponentEvent {
    name: string
    label: string
    propName?: string
    category: EventCategory
    description?: string
    eventDataSchema?: string[]
    allowedActions: ActionType[]
}

export interface ComponentMethod {
    name: string
    label: string
}

export type ComponentCategory = 'layout' | 'basic' | 'form' | 'data' | 'feedback';

export interface ComponentConfig {
    name: string;
    defaultProps: Record<string, any>,
    desc: string;
    acceptsChildren?: string[] | true;
    category?: ComponentCategory;
    icon?: string;
    keywords?: string[];
    sort?: number;
    setter?: ComponentSetter[];
    stylesSetter?: ComponentSetter[];
    events?: ComponentEvent[];
    methods?: ComponentMethod[]
    dev: any;
    prod: any;
}

interface State {
    componentConfig: Record<string, ComponentConfig>;
}

interface Action {
    registerComponent: (name: string, componentConfig: ComponentConfig) => void
}

const ACTIONS = {
    ui: ['toast', 'url', 'componentAction', 'componentControl', 'confirm', 'condition', 'http', 'setComponentProps', 'setComponentStyles', 'custom'] as ActionType[],
    value: ['toast', 'componentAction', 'componentControl', 'condition', 'http', 'setComponentProps', 'setComponentStyles', 'custom'] as ActionType[],
    submit: ['toast', 'url', 'componentAction', 'componentControl', 'confirm', 'condition', 'http', 'setComponentProps', 'setComponentStyles', 'custom'] as ActionType[],
    overlay: ['toast', 'componentAction', 'componentControl', 'confirm', 'condition', 'http', 'setComponentProps', 'setComponentStyles', 'custom'] as ActionType[],
    lifecycle: ['toast', 'componentAction', 'componentControl', 'condition', 'http', 'setComponentProps', 'setComponentStyles', 'custom'] as ActionType[],
};

function defineEvent(
    name: string,
    label: string,
    category: EventCategory,
    description: string,
    eventDataSchema: string[],
    allowedActions = ACTIONS[category],
    propName?: string,
): ComponentEvent {
    return {
        name,
        label,
        category,
        description,
        eventDataSchema,
        allowedActions,
        propName,
    };
}

const boolOptions = [
    { label: '是', value: true },
    { label: '否', value: false },
];

const openTargetOptions = [
    { label: '当前窗口', value: '_self' },
    { label: '新窗口', value: '_blank' },
];

const commonStyleSetters: ComponentSetter[] = [
    { name: 'width', label: '宽度', type: 'input' },
    { name: 'height', label: '高度', type: 'input' },
    { name: 'margin', label: '外边距', type: 'input' },
    { name: 'padding', label: '内边距', type: 'input' },
];

const clickEvents = [
    defineEvent('click', '点击事件', 'ui', '用户点击组件时触发', ['args']),
];

const doubleClickEvent = defineEvent('doubleClick', '双击事件', 'ui', '用户双击组件时触发', ['args'], ['toast', 'componentAction', 'custom']);

const valueChangeEvent = defineEvent('change', '值变化事件', 'value', '值变化时触发', ['value', 'args']);

function inputSetter(name: string, label: string): ComponentSetter {
    return { name, label, type: 'input' };
}

function numberSetter(name: string, label: string): ComponentSetter {
    return { name, label, type: 'inputNumber' };
}

function selectSetter(name: string, label: string, options: Array<{ label: string; value: any }>): ComponentSetter {
    return { name, label, type: 'select', options };
}

function baseContainerAccepts() {
    return [...COMMON_CHILDREN, 'Modal'];
}

export const useComponentConfigStore = create<State & Action>((set) => ({
    componentConfig: {
        Container: {
            name: 'Container',
            defaultProps: {},
            desc: '容器',
            acceptsChildren: baseContainerAccepts(),
            category: 'layout',
            icon: '▣',
            keywords: ['layout', 'container', '布局', '容器'],
            sort: 10,
            events: [
                defineEvent('click', '点击事件', 'ui', '用户点击容器时触发', ['args']),
                doubleClickEvent,
            ],
            stylesSetter: commonStyleSetters,
            dev: ContainerDev,
            prod: ContainerProd
        },
        Card: {
            name: 'Card',
            defaultProps: {
                title: '卡片标题',
                bordered: true,
            },
            desc: '卡片',
            acceptsChildren: baseContainerAccepts(),
            category: 'layout',
            icon: '▤',
            keywords: ['card', 'panel', '卡片', '容器'],
            sort: 20,
            setter: [
                inputSetter('title', '标题'),
                selectSetter('bordered', '显示边框', boolOptions),
            ],
            stylesSetter: commonStyleSetters,
            events: [
                defineEvent('click', '点击事件', 'ui', '用户点击卡片区域时触发', ['args']),
                doubleClickEvent,
            ],
            dev: CardDev,
            prod: CardProd,
        },
        Space: {
            name: 'Space',
            defaultProps: {
                direction: 'horizontal',
                size: 'middle',
                wrap: true,
            },
            desc: '间距',
            acceptsChildren: COMMON_CHILDREN,
            category: 'layout',
            icon: '↔',
            keywords: ['space', '间距', '布局'],
            sort: 30,
            setter: [
                selectSetter('direction', '方向', [
                    { label: '水平', value: 'horizontal' },
                    { label: '垂直', value: 'vertical' },
                ]),
                selectSetter('size', '间距', [
                    { label: '小', value: 'small' },
                    { label: '中', value: 'middle' },
                    { label: '大', value: 'large' },
                ]),
                selectSetter('wrap', '自动换行', boolOptions),
            ],
            stylesSetter: commonStyleSetters,
            events: clickEvents,
            dev: SpaceDev,
            prod: SpaceProd,
        },
        Flex: {
            name: 'Flex',
            defaultProps: {
                direction: 'horizontal',
                justify: 'flex-start',
                align: 'stretch',
                gap: 12,
            },
            desc: '弹性布局',
            acceptsChildren: COMMON_CHILDREN,
            category: 'layout',
            icon: '⇄',
            keywords: ['flex', '弹性', '布局'],
            sort: 40,
            setter: [
                selectSetter('direction', '方向', [
                    { label: '水平', value: 'horizontal' },
                    { label: '垂直', value: 'vertical' },
                ]),
                selectSetter('justify', '主轴对齐', [
                    { label: '起始', value: 'flex-start' },
                    { label: '居中', value: 'center' },
                    { label: '结束', value: 'flex-end' },
                    { label: '两端', value: 'space-between' },
                ]),
                selectSetter('align', '交叉轴对齐', [
                    { label: '拉伸', value: 'stretch' },
                    { label: '起始', value: 'flex-start' },
                    { label: '居中', value: 'center' },
                    { label: '结束', value: 'flex-end' },
                ]),
                numberSetter('gap', '间距'),
            ],
            stylesSetter: commonStyleSetters,
            events: clickEvents,
            dev: FlexDev,
            prod: FlexProd,
        },
        Grid: {
            name: 'Grid',
            defaultProps: {
                columns: 3,
                gap: 12,
            },
            desc: '网格布局',
            acceptsChildren: COMMON_CHILDREN,
            category: 'layout',
            icon: '▦',
            keywords: ['grid', '网格', '栅格', '布局'],
            sort: 50,
            setter: [
                numberSetter('columns', '列数'),
                numberSetter('gap', '间距'),
            ],
            stylesSetter: commonStyleSetters,
            events: clickEvents,
            dev: GridDev,
            prod: GridProd,
        },
        Button: {
            name: 'Button',
            defaultProps: {
                type: 'primary',
                text: '按钮'
            },
            setter: [
                selectSetter('type', '按钮类型', [
                    {label: '主按钮', value: 'primary'},
                    {label: '次按钮', value: 'default'},
                    {label: '虚线按钮', value: 'dashed'},
                    {label: '链接按钮', value: 'link'},
                ]),
                inputSetter('text', '文本'),
                selectSetter('disabled', '禁用', boolOptions),
            ],
            stylesSetter: commonStyleSetters,
            events: [
                defineEvent('click', '点击事件', 'ui', '用户点击按钮时触发', ['args']),
                defineEvent('doubleClick', '双击事件', 'ui', '用户双击按钮时触发', ['args'], ['toast', 'componentAction', 'custom']),
            ],
            desc: '按钮',
            category: 'basic',
            icon: '▭',
            keywords: ['button', 'action', '按钮', '操作'],
            sort: 10,
            dev: ButtonDev,
            prod: ButtonProd
        },
        Link: {
            name: 'Link',
            defaultProps: {
                text: '链接文本',
                href: 'https://example.com',
                target: '_blank',
            },
            desc: '链接',
            category: 'basic',
            icon: '↗',
            keywords: ['link', 'anchor', '链接'],
            sort: 12,
            setter: [
                inputSetter('text', '文本'),
                inputSetter('href', '链接地址'),
                selectSetter('target', '打开方式', openTargetOptions),
            ],
            stylesSetter: commonStyleSetters,
            events: clickEvents,
            dev: LinkDev,
            prod: LinkProd,
        },
        Icon: {
            name: 'Icon',
            defaultProps: {
                icon: 'AppstoreOutlined',
                size: 20,
                color: '#1677ff',
            },
            desc: '图标',
            category: 'basic',
            icon: '◇',
            keywords: ['icon', '图标'],
            sort: 14,
            setter: [
                selectSetter('icon', '图标', [
                    { label: '应用', value: 'AppstoreOutlined' },
                    { label: '用户', value: 'UserOutlined' },
                    { label: '设置', value: 'SettingOutlined' },
                    { label: '搜索', value: 'SearchOutlined' },
                    { label: '首页', value: 'HomeOutlined' },
                    { label: '新增', value: 'PlusOutlined' },
                    { label: '完成', value: 'CheckCircleOutlined' },
                ]),
                numberSetter('size', '尺寸'),
                inputSetter('color', '颜色'),
            ],
            stylesSetter: commonStyleSetters,
            events: clickEvents,
            dev: IconDev,
            prod: IconProd,
        },
        Text: {
            name: 'Text',
            defaultProps: {
                text: '这是一段文本',
                level: 'normal',
            },
            desc: '文本',
            category: 'basic',
            icon: 'T',
            keywords: ['text', 'typography', '文本', '标题'],
            sort: 20,
            setter: [
                inputSetter('text', '文本'),
                selectSetter('level', '样式', [
                    { label: '普通', value: 'normal' },
                    { label: '加粗', value: 'strong' },
                    { label: '斜体', value: 'italic' },
                ]),
            ],
            stylesSetter: [
                numberSetter('fontSize', '字号'),
                inputSetter('color', '颜色'),
                ...commonStyleSetters,
            ],
            events: [
                defineEvent('click', '点击事件', 'ui', '用户点击文本时触发', ['args']),
                doubleClickEvent,
            ],
            dev: TextDev,
            prod: TextProd,
        },
        Image: {
            name: 'Image',
            defaultProps: {
                src: 'https://placehold.co/320x180?text=Image',
                alt: '图片',
                width: 240,
                height: 135,
                preview: false,
            },
            desc: '图片',
            category: 'basic',
            icon: '▧',
            keywords: ['image', 'picture', '图片'],
            sort: 30,
            setter: [
                inputSetter('src', '图片地址'),
                inputSetter('alt', '替代文本'),
                numberSetter('width', '宽度'),
                numberSetter('height', '高度'),
            ],
            stylesSetter: commonStyleSetters,
            events: [
                defineEvent('click', '点击事件', 'ui', '用户点击图片时触发', ['args']),
                doubleClickEvent,
            ],
            dev: ImageDev,
            prod: ImageProd,
        },
        Divider: {
            name: 'Divider',
            defaultProps: {
                text: '分割线',
                dashed: false,
                orientation: 'center',
            },
            desc: '分割线',
            category: 'basic',
            icon: '—',
            keywords: ['divider', 'line', '分割线'],
            sort: 40,
            setter: [
                inputSetter('text', '文案'),
                selectSetter('orientation', '位置', [
                    { label: '居中', value: 'center' },
                    { label: '左侧', value: 'left' },
                    { label: '右侧', value: 'right' },
                ]),
                selectSetter('dashed', '虚线', boolOptions),
            ],
            stylesSetter: commonStyleSetters,
            events: [
                defineEvent('click', '点击事件', 'ui', '用户点击分割线时触发', ['args'], ['toast', 'componentAction', 'custom']),
            ],
            dev: DividerDev,
            prod: DividerProd,
        },
        Tabs: {
            name: 'Tabs',
            defaultProps: {
                itemsText: '概览:概览内容\n详情:详情内容\n设置:设置内容',
                activeKey: '0',
            },
            desc: '标签页',
            category: 'basic',
            icon: '▱',
            keywords: ['tabs', 'tab', '标签页'],
            sort: 50,
            setter: [
                inputSetter('itemsText', '标签配置'),
                inputSetter('activeKey', '默认激活'),
            ],
            stylesSetter: commonStyleSetters,
            events: [
                defineEvent('change', '切换事件', 'value', '用户切换标签时触发', ['value', 'args']),
            ],
            dev: TabsDev,
            prod: TabsProd,
        },
        Steps: {
            name: 'Steps',
            defaultProps: {
                itemsText: '第一步:填写信息\n第二步:确认提交\n第三步:完成',
                current: 0,
            },
            desc: '步骤条',
            category: 'basic',
            icon: '①',
            keywords: ['steps', '步骤条', '流程'],
            sort: 60,
            setter: [
                inputSetter('itemsText', '步骤配置'),
                numberSetter('current', '当前步骤'),
            ],
            stylesSetter: commonStyleSetters,
            events: [
                defineEvent('change', '切换事件', 'value', '用户切换步骤时触发', ['value', 'args']),
            ],
            dev: StepsDev,
            prod: StepsProd,
        },
        Input: {
            name: 'Input',
            defaultProps: {
                placeholder: '请输入',
                defaultValue: '',
                disabled: false,
                allowClear: true,
            },
            desc: '输入框',
            category: 'form',
            icon: 'I',
            keywords: ['input', 'field', '输入框'],
            sort: 10,
            setter: [
                inputSetter('placeholder', '占位提示'),
                inputSetter('defaultValue', '默认值'),
                selectSetter('disabled', '禁用', boolOptions),
            ],
            stylesSetter: commonStyleSetters,
            events: [
                defineEvent('change', '值变化事件', 'value', '输入框内容变化时触发', ['value', 'args']),
                defineEvent('pressEnter', '回车事件', 'value', '输入框按下回车时触发', ['value', 'args'], ['toast', 'url', 'componentAction', 'custom']),
                defineEvent('blur', '失焦事件', 'value', '输入框失去焦点时触发', ['value', 'args']),
            ],
            dev: InputDev,
            prod: InputProd,
        },
        Textarea: {
            name: 'Textarea',
            defaultProps: {
                placeholder: '请输入多行文本',
                defaultValue: '',
                rows: 3,
                disabled: false,
            },
            desc: '多行输入',
            category: 'form',
            icon: '¶',
            keywords: ['textarea', '多行', '输入框'],
            sort: 20,
            setter: [
                inputSetter('placeholder', '占位提示'),
                inputSetter('defaultValue', '默认值'),
                numberSetter('rows', '行数'),
                selectSetter('disabled', '禁用', boolOptions),
            ],
            stylesSetter: commonStyleSetters,
            events: [
                defineEvent('change', '值变化事件', 'value', '内容变化时触发', ['value', 'args']),
                defineEvent('blur', '失焦事件', 'value', '输入框失去焦点时触发', ['value', 'args']),
            ],
            dev: TextareaDev,
            prod: TextareaProd,
        },
        Select: {
            name: 'Select',
            defaultProps: {
                placeholder: '请选择',
                optionsText: '选项一,选项二,选项三',
                disabled: false,
            },
            desc: '下拉框',
            category: 'form',
            icon: '⌄',
            keywords: ['select', 'dropdown', '下拉框'],
            sort: 30,
            setter: [
                inputSetter('placeholder', '占位提示'),
                inputSetter('optionsText', '选项'),
                selectSetter('disabled', '禁用', boolOptions),
            ],
            stylesSetter: commonStyleSetters,
            events: [
                defineEvent('change', '值变化事件', 'value', '下拉框选中值变化时触发', ['value', 'option', 'args']),
            ],
            dev: SelectDev,
            prod: SelectProd,
        },
        Radio: {
            name: 'Radio',
            defaultProps: {
                optionsText: '选项一,选项二,选项三',
                defaultValue: '选项一',
                disabled: false,
            },
            desc: '单选框',
            category: 'form',
            icon: '○',
            keywords: ['radio', '单选'],
            sort: 40,
            setter: [
                inputSetter('optionsText', '选项'),
                inputSetter('defaultValue', '默认值'),
                selectSetter('disabled', '禁用', boolOptions),
            ],
            stylesSetter: commonStyleSetters,
            events: [valueChangeEvent],
            dev: RadioDev,
            prod: RadioProd,
        },
        Checkbox: {
            name: 'Checkbox',
            defaultProps: {
                optionsText: '选项一,选项二,选项三',
                defaultValue: '选项一',
                disabled: false,
            },
            desc: '多选框',
            category: 'form',
            icon: '☑',
            keywords: ['checkbox', '多选'],
            sort: 50,
            setter: [
                inputSetter('optionsText', '选项'),
                inputSetter('defaultValue', '默认值'),
                selectSetter('disabled', '禁用', boolOptions),
            ],
            stylesSetter: commonStyleSetters,
            events: [valueChangeEvent],
            dev: CheckboxDev,
            prod: CheckboxProd,
        },
        DatePicker: {
            name: 'DatePicker',
            defaultProps: {
                placeholder: '请选择日期',
                defaultValue: '',
                disabled: false,
            },
            desc: '日期选择',
            category: 'form',
            icon: '日',
            keywords: ['date', 'datepicker', '日期'],
            sort: 60,
            setter: [
                inputSetter('placeholder', '占位提示'),
                inputSetter('defaultValue', '默认值'),
                selectSetter('disabled', '禁用', boolOptions),
            ],
            stylesSetter: commonStyleSetters,
            events: [
                defineEvent('change', '值变化事件', 'value', '日期变化时触发', ['value', 'dateString', 'args']),
            ],
            dev: DatePickerDev,
            prod: DatePickerProd,
        },
        Switch: {
            name: 'Switch',
            defaultProps: {
                checked: false,
                disabled: false,
                checkedChildren: '开',
                unCheckedChildren: '关',
            },
            desc: '开关',
            category: 'form',
            icon: '◉',
            keywords: ['switch', 'toggle', '开关'],
            sort: 70,
            setter: [
                inputSetter('checkedChildren', '开启文案'),
                inputSetter('unCheckedChildren', '关闭文案'),
                selectSetter('disabled', '禁用', boolOptions),
            ],
            stylesSetter: commonStyleSetters,
            events: [
                defineEvent('change', '值变化事件', 'value', '开关状态变化时触发', ['checked', 'value', 'args']),
            ],
            dev: SwitchDev,
            prod: SwitchProd,
        },
        Upload: {
            name: 'Upload',
            defaultProps: {
                buttonText: '上传文件',
                disabled: false,
            },
            desc: '上传',
            category: 'form',
            icon: '⇧',
            keywords: ['upload', '上传', '文件'],
            sort: 80,
            setter: [
                inputSetter('buttonText', '按钮文案'),
                selectSetter('disabled', '禁用', boolOptions),
            ],
            stylesSetter: commonStyleSetters,
            events: [
                defineEvent('change', '文件变化事件', 'value', '上传文件列表变化时触发', ['value', 'args']),
            ],
            dev: UploadDev,
            prod: UploadProd,
        },
        Rate: {
            name: 'Rate',
            defaultProps: {
                defaultValue: 3,
                count: 5,
                disabled: false,
            },
            desc: '评分',
            category: 'form',
            icon: '★',
            keywords: ['rate', '评分'],
            sort: 90,
            setter: [
                numberSetter('defaultValue', '默认值'),
                numberSetter('count', '数量'),
                selectSetter('disabled', '禁用', boolOptions),
            ],
            stylesSetter: commonStyleSetters,
            events: [valueChangeEvent],
            dev: RateDev,
            prod: RateProd,
        },
        Form: {
            name: 'Form',
            defaultProps: {
                title: '表单',
                showActions: true,
                submitText: '提交',
                resetText: '重置',
            },
            desc: '表单',
            acceptsChildren: ['FormItem'],
            category: 'form',
            icon: '▧',
            keywords: ['form', 'submit', '表单', '提交'],
            sort: 100,
            setter: [
                inputSetter('title', '标题'),
                selectSetter('showActions', '显示按钮', boolOptions),
                inputSetter('submitText', '提交文案'),
                inputSetter('resetText', '重置文案'),
            ],
            stylesSetter: commonStyleSetters,
            events: [
                defineEvent('finish', '提交成功', 'submit', '表单校验通过并提交成功时触发', ['values', 'args']),
                defineEvent('finishFailed', '提交失败', 'submit', '表单校验失败时触发', ['values', 'errorFields', 'outOfDate', 'args'], ['toast', 'condition', 'custom']),
                defineEvent('valuesChange', '值变化事件', 'value', '任意表单字段变化时触发', ['changedValues', 'allValues', 'args']),
            ],
            methods: [
                { name: 'submit', label: '提交' },
                { name: 'reset', label: '重置' },
                { name: 'getValues', label: '读取表单数据' },
                { name: 'setValues', label: '设置表单数据' },
            ],
            dev: FormDev,
            prod: FormProd
        },
        FormItem: {
            name: 'FormItem',
            desc: '表单项',
            category: 'form',
            icon: '▨',
            keywords: ['form item', 'field', '表单项', '字段'],
            sort: 110,
            defaultProps: {
                name: 'field',
                label: '字段',
                type: 'input',
                placeholder: '请输入',
                defaultValue: '',
                optionsText: '选项一,选项二',
            },
            dev: FormItemDev,
            prod: FormItemProd,
            setter: [
                selectSetter('type', '类型', [
                    { label: '文本', value: 'input' },
                    { label: '多行文本', value: 'textarea' },
                    { label: '日期', value: 'date' },
                    { label: '下拉', value: 'select' },
                    { label: '单选', value: 'radio' },
                    { label: '多选', value: 'checkbox' },
                    { label: '开关', value: 'switch' },
                    { label: '评分', value: 'rate' },
                ]),
                inputSetter('label', '标题'),
                inputSetter('name', '字段'),
                inputSetter('placeholder', '占位提示'),
                inputSetter('defaultValue', '默认值'),
                inputSetter('optionsText', '选项'),
                selectSetter('rules', '校验', [
                    { label: '无', value: '' },
                    { label: '必填', value: 'required' },
                    { label: '邮箱', value: 'email' },
                ]),
            ]
        },
        Table: {
            name: 'Table',
            defaultProps: {
                dataText: '[{"id":1,"name":"张三","status":"启用","createdAt":"2026-05-08"},{"id":2,"name":"李四","status":"停用","createdAt":"2026-05-07"}]',
                pagination: false,
                pageSize: 10,
                emptyText: '暂无数据',
                rowKey: 'id',
            },
            desc: '表格',
            acceptsChildren: ['TableColumn'],
            category: 'data',
            icon: '▦',
            keywords: ['table', 'data', '表格', '数据'],
            sort: 10,
            setter: [
                inputSetter('url', '数据接口'),
                inputSetter('dataText', '静态数据'),
                selectSetter('pagination', '开启分页', boolOptions),
                numberSetter('pageSize', '每页条数'),
                inputSetter('emptyText', '空状态文案'),
                inputSetter('rowKey', '行主键字段'),
            ],
            stylesSetter: commonStyleSetters,
            events: [
                defineEvent('change', '表格变化事件', 'value', '分页、筛选或排序变化时触发', ['value', 'args']),
            ],
            dev: TableDev,
            prod: TableProd
        },
        TableColumn: {
            name: 'TableColumn',
            desc: '表格列',
            category: 'data',
            icon: '▥',
            keywords: ['table column', 'column', '表格列', '列'],
            sort: 20,
            defaultProps: {
                dataIndex: 'name',
                title: '列名',
                type: 'text',
                actionText: '查看',
                actionUrl: '',
            },
            setter: [
                selectSetter('type', '类型', [
                    { label: '文本', value: 'text' },
                    { label: '日期', value: 'date' },
                    { label: '操作', value: 'action' },
                ]),
                inputSetter('title', '标题'),
                inputSetter('dataIndex', '字段'),
                inputSetter('width', '宽度'),
                inputSetter('format', '日期格式'),
                inputSetter('actionText', '操作文案'),
                inputSetter('actionUrl', '操作链接'),
            ],
            dev: TableColumnDev,
            prod: TableColumnProd,
        },
        List: {
            name: 'List',
            defaultProps: {
                bordered: true,
                dataText: '[{"id":1,"title":"列表项一","description":"说明内容"},{"id":2,"title":"列表项二","description":"说明内容"}]',
            },
            desc: '列表',
            category: 'data',
            icon: '☰',
            keywords: ['list', '列表'],
            sort: 30,
            setter: [
                inputSetter('dataText', '列表数据'),
                selectSetter('bordered', '显示边框', boolOptions),
            ],
            stylesSetter: commonStyleSetters,
            events: clickEvents,
            dev: ListDev,
            prod: ListProd,
        },
        Descriptions: {
            name: 'Descriptions',
            defaultProps: {
                title: '详情信息',
                pairsText: '姓名:张三\n角色:管理员\n状态:启用',
                column: 2,
                bordered: true,
            },
            desc: '描述列表',
            category: 'data',
            icon: '≡',
            keywords: ['descriptions', '详情', '描述列表'],
            sort: 40,
            setter: [
                inputSetter('title', '标题'),
                inputSetter('pairsText', '字段配置'),
                numberSetter('column', '列数'),
                selectSetter('bordered', '显示边框', boolOptions),
            ],
            stylesSetter: commonStyleSetters,
            events: clickEvents,
            dev: DescriptionsDev,
            prod: DescriptionsProd,
        },
        Statistic: {
            name: 'Statistic',
            defaultProps: {
                title: '指标标题',
                value: 128,
                suffix: '',
                prefix: '',
            },
            desc: '统计数值',
            category: 'data',
            icon: '№',
            keywords: ['statistic', '指标', '统计'],
            sort: 50,
            setter: [
                inputSetter('title', '标题'),
                inputSetter('value', '数值'),
                inputSetter('prefix', '前缀'),
                inputSetter('suffix', '后缀'),
            ],
            stylesSetter: commonStyleSetters,
            events: clickEvents,
            dev: StatisticDev,
            prod: StatisticProd,
        },
        Pagination: {
            name: 'Pagination',
            defaultProps: {
                current: 1,
                total: 50,
                pageSize: 10,
            },
            desc: '分页',
            category: 'data',
            icon: '…',
            keywords: ['pagination', '分页'],
            sort: 60,
            setter: [
                numberSetter('current', '当前页'),
                numberSetter('total', '总数'),
                numberSetter('pageSize', '每页条数'),
            ],
            stylesSetter: commonStyleSetters,
            events: [
                defineEvent('change', '分页变化事件', 'value', '页码或每页条数变化时触发', ['page', 'pageSize', 'args']),
            ],
            dev: PaginationDev,
            prod: PaginationProd,
        },
        Chart: {
            name: 'Chart',
            defaultProps: {
                title: '趋势图',
                dataText: '一月:30\n二月:52\n三月:76\n四月:48',
            },
            desc: '图表',
            category: 'data',
            icon: '▰',
            keywords: ['chart', '图表', '柱状图'],
            sort: 70,
            setter: [
                inputSetter('title', '标题'),
                inputSetter('dataText', '数据'),
            ],
            stylesSetter: commonStyleSetters,
            events: clickEvents,
            dev: ChartDev,
            prod: ChartProd,
        },
        Alert: {
            name: 'Alert',
            defaultProps: {
                type: 'info',
                message: '提示标题',
                description: '这里是一段提示说明',
                showIcon: true,
            },
            desc: '提示',
            category: 'feedback',
            icon: '!',
            keywords: ['alert', 'notice', '提示', '警告'],
            sort: 10,
            setter: [
                selectSetter('type', '类型', [
                    { label: '信息', value: 'info' },
                    { label: '成功', value: 'success' },
                    { label: '警告', value: 'warning' },
                    { label: '错误', value: 'error' },
                ]),
                inputSetter('message', '标题'),
                inputSetter('description', '描述'),
                selectSetter('showIcon', '显示图标', boolOptions),
            ],
            stylesSetter: commonStyleSetters,
            events: [
                defineEvent('click', '点击事件', 'ui', '用户点击提示组件时触发', ['args']),
                defineEvent('close', '关闭事件', 'overlay', '用户关闭提示组件时触发', ['args']),
            ],
            dev: AlertDev,
            prod: AlertProd,
        },
        Modal: {
            name: 'Modal',
            defaultProps: {
                title: '弹窗'
            },
            acceptsChildren: COMMON_CHILDREN,
            setter: [
                inputSetter('title', '标题'),
            ],
            stylesSetter: commonStyleSetters,
            events: [
                defineEvent('ok', '确认事件', 'overlay', '用户点击弹窗确认按钮时触发', ['args']),
                defineEvent('cancel', '取消事件', 'overlay', '用户取消或关闭弹窗时触发', ['args']),
            ],
            methods: [
                { name: 'open', label: '打开弹窗' },
                { name: 'close', label: '关闭弹窗' },
            ],
            desc: '弹窗',
            category: 'feedback',
            icon: '□',
            keywords: ['modal', 'dialog', '弹窗', '反馈'],
            sort: 20,
            dev: ModalDev,
            prod: ModalProd
        },
        Drawer: {
            name: 'Drawer',
            defaultProps: {
                title: '抽屉',
                placement: 'right',
                width: 420,
            },
            acceptsChildren: COMMON_CHILDREN,
            desc: '抽屉',
            category: 'feedback',
            icon: '▐',
            keywords: ['drawer', '抽屉', '侧边'],
            sort: 30,
            setter: [
                inputSetter('title', '标题'),
                selectSetter('placement', '位置', [
                    { label: '右侧', value: 'right' },
                    { label: '左侧', value: 'left' },
                    { label: '顶部', value: 'top' },
                    { label: '底部', value: 'bottom' },
                ]),
                numberSetter('width', '宽度'),
            ],
            stylesSetter: commonStyleSetters,
            events: [
                defineEvent('close', '关闭事件', 'overlay', '用户关闭抽屉时触发', ['args'], ACTIONS.overlay, 'onClose'),
                defineEvent('openChange', '开合变化', 'lifecycle', '抽屉打开或关闭动画结束时触发', ['open', 'args'], ACTIONS.lifecycle, 'afterOpenChange'),
            ],
            methods: [
                { name: 'open', label: '打开抽屉' },
                { name: 'close', label: '关闭抽屉' },
            ],
            dev: DrawerDev,
            prod: DrawerProd,
        },
        Tooltip: {
            name: 'Tooltip',
            defaultProps: {
                title: '提示内容',
                text: '悬浮查看提示',
            },
            desc: '文字提示',
            category: 'feedback',
            icon: '?',
            keywords: ['tooltip', '提示'],
            sort: 40,
            setter: [
                inputSetter('title', '提示内容'),
                inputSetter('text', '触发文本'),
            ],
            stylesSetter: commonStyleSetters,
            events: [
                defineEvent('openChange', '开合变化', 'overlay', '提示显示状态变化时触发', ['open', 'args'], ACTIONS.overlay, 'onOpenChange'),
            ],
            dev: TooltipDev,
            prod: TooltipProd,
        },
        Popover: {
            name: 'Popover',
            defaultProps: {
                title: '气泡标题',
                content: '气泡内容',
                text: '打开气泡卡片',
            },
            desc: '气泡卡片',
            category: 'feedback',
            icon: '◫',
            keywords: ['popover', '气泡', '卡片'],
            sort: 50,
            setter: [
                inputSetter('title', '标题'),
                inputSetter('content', '内容'),
                inputSetter('text', '按钮文本'),
            ],
            stylesSetter: commonStyleSetters,
            events: [
                defineEvent('openChange', '开合变化', 'overlay', '气泡卡片显示状态变化时触发', ['open', 'args'], ACTIONS.overlay, 'onOpenChange'),
            ],
            dev: PopoverDev,
            prod: PopoverProd,
        },
        Notification: {
            name: 'Notification',
            defaultProps: {
                type: 'info',
                title: '通知标题',
                description: '这里是一段通知内容',
                buttonText: '显示通知',
            },
            desc: '通知',
            category: 'feedback',
            icon: '☷',
            keywords: ['notification', '通知'],
            sort: 60,
            setter: [
                selectSetter('type', '类型', [
                    { label: '信息', value: 'info' },
                    { label: '成功', value: 'success' },
                    { label: '警告', value: 'warning' },
                    { label: '错误', value: 'error' },
                ]),
                inputSetter('title', '标题'),
                inputSetter('description', '内容'),
                inputSetter('buttonText', '按钮文本'),
            ],
            stylesSetter: commonStyleSetters,
            events: clickEvents,
            dev: NotificationDev,
            prod: NotificationProd,
        },
        Result: {
            name: 'Result',
            defaultProps: {
                status: 'success',
                title: '操作成功',
                subTitle: '当前流程已经完成',
            },
            desc: '结果页',
            category: 'feedback',
            icon: '✓',
            keywords: ['result', '结果页', '成功'],
            sort: 70,
            setter: [
                selectSetter('status', '状态', [
                    { label: '成功', value: 'success' },
                    { label: '失败', value: 'error' },
                    { label: '信息', value: 'info' },
                    { label: '警告', value: 'warning' },
                    { label: '404', value: '404' },
                    { label: '500', value: '500' },
                ]),
                inputSetter('title', '标题'),
                inputSetter('subTitle', '副标题'),
            ],
            stylesSetter: commonStyleSetters,
            events: clickEvents,
            dev: ResultDev,
            prod: ResultProd,
        },
        Empty: {
            name: 'Empty',
            defaultProps: {
                description: '暂无数据',
            },
            desc: '空状态',
            category: 'feedback',
            icon: '∅',
            keywords: ['empty', '空状态'],
            sort: 80,
            setter: [
                inputSetter('description', '说明'),
            ],
            stylesSetter: commonStyleSetters,
            events: clickEvents,
            dev: EmptyDev,
            prod: EmptyProd,
        },
        Page: {
            name: 'Page',
            defaultProps: {},
            desc: '页面',
            acceptsChildren: baseContainerAccepts(),
            category: 'layout',
            icon: '▤',
            keywords: ['page', '页面'],
            sort: 0,
            stylesSetter: commonStyleSetters,
            dev: PageDev,
            prod: PageProd
        },
    },
    registerComponent: (name, componentConfig) => set((state) => {
        return {
            ...state,
            componentConfig: {
                ...state.componentConfig,
                [name]: componentConfig
            }
        }
    })
}));
