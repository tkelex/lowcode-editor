import type { ComponentConfig } from '../types';
import CardDev from '../../materials/Card/dev';
import CardProd from '../../materials/Card/prod';
import ContainerDev from '../../materials/Container/dev';
import ContainerProd from '../../materials/Container/prod';
import PageDev from '../../materials/Page/dev';
import PageProd from '../../materials/Page/prod';
import {
  FlexDev,
  FlexProd,
  GridDev,
  GridProd,
  SpaceDev,
  SpaceProd,
} from '../../materials/p3';
import { COMMON_CHILDREN } from '../../materials/commonChildren';
import {
  baseContainerAccepts,
  clickEvents,
  commonStyleSetters,
  defineEvent,
  doubleClickEvent,
  inputSetter,
  jsonSetter,
  numberSetter,
  selectSetter,
  switchSetter,
  urlSetter,
} from '../factory';

export const layoutComponentConfigs: Record<string, ComponentConfig> = {
Container: {
            name: 'Container',
            defaultProps: {
                title: '',
                visible: true,
                direction: 'vertical',
            },
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
            setter: [
                inputSetter('title', '标题', { placeholder: '用于大纲或辅助标识' }),
                switchSetter('visible', '可见', { help: '关闭后仍保留配置，运行时可按需隐藏。' }),
                selectSetter('direction', '布局方式', [
                    { label: '纵向', value: 'vertical' },
                    { label: '横向', value: 'horizontal' },
                ], { help: '控制容器内子组件按纵向堆叠或横向排列。' }),
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
                inputSetter('title', '标题', { placeholder: '卡片标题' }),
                switchSetter('bordered', '显示边框'),
                switchSetter('hoverable', '悬浮反馈'),
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
                switchSetter('wrap', '自动换行'),
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
Page: {
            name: 'Page',
            defaultProps: {
                variables: '{\n  "form": {},\n  "table": {}\n}',
                dataSources: '{\n  "items": []\n}',
                pageTitle: 'Hello world',
                subTitle: '',
                showContent: true,
                showHeader: true,
                seoTitle: '',
                seoDescription: '',
                favicon: '',
            },
            desc: '页面',
            acceptsChildren: baseContainerAccepts(),
            category: 'layout',
            icon: '▤',
            keywords: ['page', '页面'],
            sort: 0,
            setter: [
                inputSetter('pageTitle', '页面标题', { placeholder: '页面标题' }),
                inputSetter('subTitle', '副标题', { placeholder: '可选副标题' }),
                switchSetter('showContent', '内容区', { help: '控制页面主体内容区域是否显示。关闭后组件配置仍保留。' }),
                switchSetter('showHeader', '标题栏', { help: '控制页面标题和副标题区域是否显示。' }),
                jsonSetter('variables', '页面变量 JSON', {
                    group: 'data',
                    placeholder: '{\n  "form": {},\n  "table": {}\n}',
                    rows: 4,
                }),
                jsonSetter('dataSources', '数据源 JSON', {
                    group: 'data',
                    placeholder: '{\n  "items": []\n}',
                    rows: 4,
                }),
                inputSetter('seoTitle', 'SEO 标题', { group: 'advanced', help: '发布页面时用于浏览器和搜索引擎识别的标题。' }),
                inputSetter('seoDescription', 'SEO 描述', { group: 'advanced', help: '发布页面的搜索摘要描述。' }),
                urlSetter('favicon', 'Favicon 地址', { group: 'advanced', help: '浏览器标签页图标地址。' }),
            ],
            stylesSetter: commonStyleSetters,
            dev: PageDev,
            prod: PageProd
        },
};
