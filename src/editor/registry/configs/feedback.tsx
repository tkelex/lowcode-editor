import type { ComponentConfig } from '../types';
import AlertDev from '../../materials/Alert/dev';
import AlertProd from '../../materials/Alert/prod';
import ModalDev from '../../materials/Modal/dev';
import ModalProd from '../../materials/Modal/prod';
import {
  DrawerDev,
  DrawerProd,
  EmptyDev,
  EmptyProd,
  NotificationDev,
  NotificationProd,
  PopoverDev,
  PopoverProd,
  ResultDev,
  ResultProd,
  TooltipDev,
  TooltipProd,
} from '../../materials/p3';
import { COMMON_CHILDREN } from '../../materials/commonChildren';
import {
  ACTIONS,
  boolOptions,
  clickEvents,
  commonStyleSetters,
  defineEvent,
  inputSetter,
  numberSetter,
  selectSetter,
} from '../factory';

export const feedbackComponentConfigs: Record<string, ComponentConfig> = {
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
};
