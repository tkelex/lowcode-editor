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
  boolOptions,
  clickEvents,
  commonStyleSetters,
  defineEvent,
  doubleClickEvent,
  inputSetter,
  numberSetter,
  selectSetter,
  textareaSetter,
} from '../factory';

export const layoutComponentConfigs: Record<string, ComponentConfig> = {
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
Page: {
            name: 'Page',
            defaultProps: {
                variables: '{\n  "form": {},\n  "table": {}\n}',
                dataSources: '{\n  "items": []\n}',
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
                inputSetter('seoTitle', 'SEO 标题'),
                textareaSetter('seoDescription', 'SEO 描述'),
                inputSetter('favicon', 'Favicon 地址'),
                textareaSetter('variables', '页面变量 JSON'),
                textareaSetter('dataSources', '数据源 JSON'),
            ],
            stylesSetter: commonStyleSetters,
            dev: PageDev,
            prod: PageProd
        },
};
