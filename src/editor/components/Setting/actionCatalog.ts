import type { ActionType } from "../../events/types";

export type ActionCategoryKey = 'page' | 'feedback' | 'service' | 'component' | 'data' | 'logic' | 'advanced';

export interface ActionCategory {
    key: ActionCategoryKey;
    label: string;
}

export interface ActionCatalogItem {
    actionType: ActionType;
    label: string;
    shortLabel: string;
    category: ActionCategoryKey;
    description: string;
    keywords: string[];
    common?: boolean;
    color: string;
}

export const actionCategories: ActionCategory[] = [
    { key: 'page', label: '页面' },
    { key: 'feedback', label: '弹窗消息' },
    { key: 'service', label: '服务' },
    { key: 'component', label: '组件联动' },
    { key: 'data', label: '数据' },
    { key: 'logic', label: '逻辑' },
    { key: 'advanced', label: '高级' },
];

export const actionCatalog: ActionCatalogItem[] = [
    {
        actionType: 'url',
        label: '跳转链接',
        shortLabel: '跳转',
        category: 'page',
        description: '跳转到站内页面或外部链接，可选择当前窗口或新窗口打开。',
        keywords: ['url', 'link', 'jump', '页面', '跳转', '链接'],
        common: true,
        color: 'blue',
    },
    {
        actionType: 'toast',
        label: '消息提醒',
        shortLabel: '消息',
        category: 'feedback',
        description: '展示成功、失败、警告或普通提示消息。',
        keywords: ['toast', 'message', '提示', '消息'],
        common: true,
        color: 'green',
    },
    {
        actionType: 'confirm',
        label: '确认弹窗',
        shortLabel: '确认',
        category: 'feedback',
        description: '先弹出确认框，再按确认或取消分支执行动作。',
        keywords: ['confirm', 'dialog', '确认', '弹窗'],
        color: 'cyan',
    },
    {
        actionType: 'http',
        label: 'HTTP 请求',
        shortLabel: '请求',
        category: 'service',
        description: '向后端或外部服务发送请求，并可把响应或错误写入事件数据。',
        keywords: ['http', 'api', 'request', '接口', '请求', '服务'],
        common: true,
        color: 'geekblue',
    },
    {
        actionType: 'componentControl',
        label: '组件联动',
        shortLabel: '联动',
        category: 'component',
        description: '显示、隐藏、启用、禁用、设置值，或打开弹窗、提交表单。',
        keywords: ['component', 'control', '组件', '联动', '显示', '隐藏', '设置值'],
        common: true,
        color: 'lime',
    },
    {
        actionType: 'componentAction',
        label: '调用组件方法',
        shortLabel: '方法',
        category: 'component',
        description: '调用目标组件暴露的方法，例如打开弹窗、关闭抽屉或提交表单。',
        keywords: ['component', 'method', '组件', '方法', '调用'],
        color: 'purple',
    },
    {
        actionType: 'setComponentProps',
        label: '设置组件属性',
        shortLabel: '属性',
        category: 'component',
        description: '以 JSON 修改目标组件 props，例如文案、禁用状态或数据源。',
        keywords: ['props', 'component', '属性', '组件'],
        color: 'magenta',
    },
    {
        actionType: 'setComponentStyles',
        label: '设置组件样式',
        shortLabel: '样式',
        category: 'component',
        description: '以 JSON 修改目标组件 styles，例如颜色、间距或显示状态。',
        keywords: ['styles', 'component', '样式', '组件'],
        color: 'volcano',
    },
    {
        actionType: 'setVariable',
        label: '设置变量',
        shortLabel: '变量',
        category: 'data',
        description: '把事件数据、固定值或表达式结果写入页面级变量。',
        keywords: ['variable', 'data', '变量', '数据'],
        color: 'cyan',
    },
    {
        actionType: 'condition',
        label: '条件执行',
        shortLabel: '条件',
        category: 'logic',
        description: '根据表达式结果执行 true 或 false 分支动作。',
        keywords: ['condition', 'if', 'logic', '条件', '逻辑'],
        color: 'gold',
    },
    {
        actionType: 'custom',
        label: '自定义 JS',
        shortLabel: 'JS',
        category: 'advanced',
        description: '在编辑器预览中执行自定义 JavaScript，公开发布页禁用。',
        keywords: ['custom', 'javascript', 'js', '自定义', '脚本'],
        color: 'orange',
    },
];

export const actionCatalogMap = actionCatalog.reduce<Record<ActionType, ActionCatalogItem>>((map, item) => {
    map[item.actionType] = item;
    return map;
}, {} as Record<ActionType, ActionCatalogItem>);

export const defaultActionOrder = actionCatalog.map((item) => item.actionType);

export function getActionCatalogItem(actionType: ActionType) {
    return actionCatalogMap[actionType];
}
