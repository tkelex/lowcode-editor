import type { ComponentConfig } from '../types';
import ButtonDev from '../../materials/Button/dev';
import ButtonProd from '../../materials/Button/prod';
import DividerDev from '../../materials/Divider/dev';
import DividerProd from '../../materials/Divider/prod';
import ImageDev from '../../materials/Image/dev';
import ImageProd from '../../materials/Image/prod';
import TextDev from '../../materials/Text/dev';
import TextProd from '../../materials/Text/prod';
import {
  IconDev,
  IconProd,
  LinkDev,
  LinkProd,
  StepsDev,
  StepsProd,
  TabsDev,
  TabsProd,
} from '../../materials/p3';
import {
  clickEvents,
  commonStyleSetters,
  defineEvent,
  doubleClickEvent,
  imageStyleSetters,
  inputSetter,
  numberSetter,
  openTargetOptions,
  selectSetter,
  switchSetter,
  urlSetter,
} from '../factory';

export const basicComponentConfigs: Record<string, ComponentConfig> = {
Button: {
            name: 'Button',
            defaultProps: {
                type: 'primary',
                text: '按钮',
                disabled: false,
                block: false,
                loading: false,
                danger: false,
            },
            setter: [
                selectSetter('type', '按钮类型', [
                    {label: '主按钮', value: 'primary'},
                    {label: '次按钮', value: 'default'},
                    {label: '虚线按钮', value: 'dashed'},
                    {label: '链接按钮', value: 'link'},
                ]),
                inputSetter('text', '文本'),
                selectSetter('size', '尺寸', [
                    { label: '小', value: 'small' },
                    { label: '中', value: 'middle' },
                    { label: '大', value: 'large' },
                ]),
                switchSetter('disabled', '禁用', { help: '禁用后按钮不可点击，也不会触发点击事件。' }),
                switchSetter('block', '块级按钮', { help: '按钮宽度撑满父容器。' }),
                switchSetter('loading', '加载中', { help: '展示加载状态，常用于提交中或接口请求中。' }),
                switchSetter('danger', '危险按钮', { help: '用于删除、撤销等高风险操作的视觉强调。' }),
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
                urlSetter('href', '链接地址'),
                selectSetter('target', '打开方式', openTargetOptions),
                switchSetter('disabled', '禁用', { help: '禁用后链接不可点击。' }),
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
                selectSetter('copyable', '可复制', [
                    { label: '关闭', value: false },
                    { label: '开启', value: true },
                ]),
                selectSetter('level', '样式', [
                    { label: '普通', value: 'normal' },
                    { label: '加粗', value: 'strong' },
                    { label: '斜体', value: 'italic' },
                ]),
                switchSetter('ellipsis', '超出省略', { help: '文本超出容器时使用省略号展示。' }),
            ],
            stylesSetter: commonStyleSetters,
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
                fallback: '',
            },
            desc: '图片',
            category: 'basic',
            icon: '▧',
            keywords: ['image', 'picture', '图片'],
            sort: 30,
            setter: [
                urlSetter('src', '图片地址'),
                inputSetter('alt', '替代文本'),
                numberSetter('width', '宽度'),
                numberSetter('height', '高度'),
                switchSetter('preview', '允许预览', { help: '开启后点击图片可查看大图预览。' }),
                urlSetter('fallback', '加载失败图', { group: 'advanced' }),
            ],
            stylesSetter: imageStyleSetters,
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
                plain: false,
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
                switchSetter('dashed', '虚线', { help: '将分割线显示为虚线样式。' }),
                switchSetter('plain', '普通文字'),
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
                inputSetter('itemsText', '标签配置', {
                    help: '每行一个标签，格式：标题:内容',
                }),
                inputSetter('activeKey', '默认激活'),
                selectSetter('type', '标签样式', [
                    { label: '线条', value: 'line' },
                    { label: '卡片', value: 'card' },
                    { label: '可编辑卡片', value: 'editable-card' },
                ]),
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
                inputSetter('itemsText', '步骤配置', {
                    help: '每行一步，格式：标题:描述',
                }),
                numberSetter('current', '当前步骤'),
                selectSetter('direction', '方向', [
                    { label: '水平', value: 'horizontal' },
                    { label: '垂直', value: 'vertical' },
                ]),
            ],
            stylesSetter: commonStyleSetters,
            events: [
                defineEvent('change', '切换事件', 'value', '用户切换步骤时触发', ['value', 'args']),
            ],
            dev: StepsDev,
            prod: StepsProd,
        },
};
