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
  boolOptions,
  clickEvents,
  commonStyleSetters,
  defineEvent,
  doubleClickEvent,
  inputSetter,
  numberSetter,
  openTargetOptions,
  selectSetter,
} from '../factory';

export const basicComponentConfigs: Record<string, ComponentConfig> = {
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
};
