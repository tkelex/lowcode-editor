import { Button, Collapse, CollapseProps, Empty, Popconfirm, Space, Tag, Tooltip, Typography, message } from 'antd';
import {
    ArrowDownOutlined,
    ArrowUpOutlined,
    CopyOutlined,
    DeleteOutlined,
    EditOutlined,
    PauseCircleOutlined,
    PlayCircleOutlined,
    PlusOutlined,
} from '@ant-design/icons';
import { useState } from 'react';
import { shallow } from 'zustand/shallow';
import { getLowcodeEventName } from '../../events/eventNames';
import { getComponentEventConfig } from '../../events/normalize';
import type { LowcodeAction } from '../../events/types';
import { useComponentConfigStore } from '../../registry/component-config';
import type { ComponentEvent as ComponentEventConfig } from '../../registry/component-config';
import { getComponentById, useComponetsStore } from '../../stores/components';
import { ActionConfig, ActionModal } from './ActionModal';

const actionLabelMap = {
    toast: '消息',
    url: '跳转',
    componentAction: '组件方法',
    confirm: '确认',
    condition: '条件',
    http: '请求',
    componentControl: '联动',
    setComponentProps: '属性',
    setComponentStyles: '样式',
    setVariable: '变量',
    custom: 'JS',
};

const actionColorMap = {
    toast: 'green',
    url: 'blue',
    componentAction: 'purple',
    confirm: 'cyan',
    condition: 'gold',
    http: 'geekblue',
    componentControl: 'lime',
    setComponentProps: 'magenta',
    setComponentStyles: 'volcano',
    setVariable: 'cyan',
    custom: 'orange',
};

interface ComponentEventProps {
    keyword?: string;
}

export function ComponentEvent({ keyword = '' }: ComponentEventProps) {
    const { components, curComponent, updateComponentProps } = useComponetsStore((state) => ({
        components: state.components,
        curComponent: state.curComponent,
        updateComponentProps: state.updateComponentProps,
    }), shallow);
    const { componentConfig } = useComponentConfigStore();
    const [actionModalOpen, setActionModalOpen] = useState(false);
    const [curEvent, setCurEvent] = useState<ComponentEventConfig>();
    const [curAction, setCurAction] = useState<ActionConfig>();
    const [curActionIndex, setCurActionIndex] = useState<number>();

    if (!curComponent) return null;

    const searchText = keyword.trim().toLowerCase();
    const allEvents = componentConfig[curComponent.name]?.events || [];
    const events = allEvents.filter(event => {
        if (!searchText) return true;

        return [
            event.name,
            event.label,
            event.description || '',
            ...(event.eventDataSchema || []),
            ...event.allowedActions.map(actionType => actionLabelMap[actionType]),
        ].join(' ').toLowerCase().includes(searchText);
    });

    if (allEvents.length === 0) {
        return <div className='px-[10px]'>
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="当前组件暂无可绑定事件" />
        </div>;
    }

    if (events.length === 0) {
        return <div className='px-[10px]'>
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="没有匹配的事件配置" />
        </div>;
    }

    function resetActionState() {
        setCurAction(undefined);
        setCurActionIndex(undefined);
    }

    function getEventActions(event: ComponentEventConfig): LowcodeAction[] {
        if (!curComponent) return [];
        return getComponentEventConfig(curComponent, event.name)?.actions || [];
    }

    function updateEventActions(event: ComponentEventConfig, actions: LowcodeAction[]) {
        if (!curComponent) return;

        const eventName = getLowcodeEventName(event.name);
        const onEvent = curComponent.props.onEvent || {};
        const reactEventName = `on${eventName.charAt(0).toUpperCase()}${eventName.slice(1)}`;

        updateComponentProps(curComponent.id, {
            [eventName]: undefined,
            [event.name]: undefined,
            [reactEventName]: undefined,
            onEvent: {
                ...onEvent,
                [eventName]: {
                    actions,
                },
            },
        });
    }

    function deleteAction(event: ComponentEventConfig, index: number) {
        const actions = getEventActions(event);
        updateEventActions(event, actions.filter((_, actionIndex) => actionIndex !== index));
        message.success('动作已删除');
    }

    function moveAction(event: ComponentEventConfig, index: number, direction: -1 | 1) {
        const actions = getEventActions(event);
        const targetIndex = index + direction;

        if (targetIndex < 0 || targetIndex >= actions.length) {
            return;
        }

        const nextActions = [...actions];
        const [action] = nextActions.splice(index, 1);
        nextActions.splice(targetIndex, 0, action);
        updateEventActions(event, nextActions);
        message.success('动作顺序已更新');
    }

    function copyAction(event: ComponentEventConfig, index: number) {
        const actions = getEventActions(event);
        const action = actions[index];
        if (!action) return;

        const nextAction = cloneAction(action);
        updateEventActions(event, [
            ...actions.slice(0, index + 1),
            nextAction,
            ...actions.slice(index + 1),
        ]);
        message.success('动作已复制');
    }

    function toggleActionDisabled(event: ComponentEventConfig, index: number) {
        const actions = getEventActions(event);
        const nextActions = actions.map((action, actionIndex) => {
            if (actionIndex !== index) {
                return action;
            }

            return {
                ...action,
                disabled: !action.disabled,
            };
        });

        updateEventActions(event, nextActions);
        message.success(actions[index]?.disabled ? '动作已启用' : '动作已禁用');
    }

    function editAction(event: ComponentEventConfig, config: ActionConfig, index: number) {
        setCurEvent(event);
        setCurAction(config);
        setCurActionIndex(index);
        setActionModalOpen(true);
    }

    function renderActionSummary(action: LowcodeAction) {
        if (action.actionType === 'url') {
            return action.args.url || '未配置链接';
        }

        if (action.actionType === 'toast') {
            return `${action.args.msgType}：${action.args.msg || '未配置消息内容'}`;
        }

        if (action.actionType === 'custom') {
            return action.args.script || '未配置脚本';
        }

        if (action.actionType === 'confirm') {
            return action.args.title || '未配置确认标题';
        }

        if (action.actionType === 'condition') {
            return action.args.expression || '未配置条件表达式';
        }

        if (action.actionType === 'http') {
            return `${action.args.method || 'GET'} ${action.args.url || '未配置请求地址'}`;
        }

        if (action.actionType === 'setComponentProps' || action.actionType === 'setComponentStyles') {
            const target = getComponentById(action.componentId, components);
            return `${target?.desc || '未选择组件'} / ${action.actionType === 'setComponentProps' ? '属性' : '样式'}`;
        }

        if (action.actionType === 'setVariable') {
            return `${action.args.path || '未配置变量'} = ${action.args.expression || JSON.stringify(action.args.value ?? '')}`;
        }

        if (action.actionType === 'componentControl') {
            const target = getComponentById(action.componentId, components);
            return `${target?.desc || '未选择组件'} / ${formatComponentControlOperation(action.args.operation)}`;
        }

        const target = getComponentById(action.componentId, components);
        return `${target?.desc || '未选择组件'} / ${action.args.method || '未选择方法'}`;
    }

    const items: CollapseProps['items'] = events.map(event => {
        const actions = getEventActions(event);
        const allowedActions = event.allowedActions || [];

        return {
            key: event.name,
            label: <div className='grid w-full min-w-0 grid-cols-[minmax(0,1fr)_28px] items-center gap-[8px]'>
                <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-[6px]">
                        <span className="shrink-0 whitespace-nowrap text-[14px] font-semibold leading-[22px] text-[#111827]">
                            {event.label}
                        </span>
                        <Tag className="m-0 shrink-0 leading-[20px]" color={actions.length ? 'blue' : 'default'}>
                            {actions.length}
                        </Tag>
                    </div>
                    {event.description && (
                        <Typography.Text
                            type="secondary"
                            ellipsis={{ tooltip: event.description }}
                            className="block max-w-full whitespace-nowrap text-[12px] leading-[18px]"
                        >
                            {event.description}
                        </Typography.Text>
                    )}
                </div>
                <Tooltip title="添加动作">
                    <Button
                        aria-label="添加动作"
                        size="small"
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={(e) => {
                            e.stopPropagation();

                            resetActionState();
                            setCurEvent(event);
                            setActionModalOpen(true);
                        }}
                    />
                </Tooltip>
            </div>,
            children: <div className="pt-[2px]">
                <div className="mb-[10px] rounded-[6px] border border-[#edf2f7] bg-[#f8fafc] p-[8px]">
                    <Space direction="vertical" size={4}>
                        <Typography.Text type="secondary" className="text-[12px]">
                            事件数据：{formatEventDataSchema(event)}
                        </Typography.Text>
                        <Typography.Text type="secondary" className="text-[12px]">
                            自定义 JS 可用变量：context、event、args、doAction
                        </Typography.Text>
                        <Space wrap size={[4, 4]}>
                            {allowedActions.map(actionType => (
                                <Tag className="m-0" key={actionType} color={actionColorMap[actionType]}>{actionLabelMap[actionType]}</Tag>
                            ))}
                        </Space>
                    </Space>
                </div>
                {actions.length === 0 && (
                    <div className="rounded-[8px] border border-dashed border-[#cbd5e1] bg-[#f8fafc] px-[12px] py-[18px] text-center">
                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无动作" />
                        <Button
                            size="small"
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => {
                                resetActionState();
                                setCurEvent(event);
                                setActionModalOpen(true);
                            }}
                        >
                            添加动作
                        </Button>
                    </div>
                )}
                {actions.map((item, index) => {
                    return <div key={`${event.name}-${index}-${item.actionType}`} className={`group mb-[8px] rounded-[8px] border p-[10px] shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-[#bfdbfe] hover:shadow-[0_8px_18px_rgba(15,23,42,0.08)] ${
                        item.disabled ? 'border-[#e5e7eb] bg-[#f8fafc] opacity-70' : 'border-[#e5e7eb] bg-white'
                    }`}>
                        <div className="flex items-start justify-between gap-[10px]">
                            <div className="flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-full bg-[#eff6ff] text-[12px] font-semibold text-[#2563eb]">
                                {index + 1}
                            </div>
                            <div className="min-w-0 flex-1 pt-[1px]">
                                <div className="mb-[5px] flex items-center gap-[6px]">
                                    <Tag className="m-0" color={actionColorMap[item.actionType]}>{actionLabelMap[item.actionType]}</Tag>
                                    {item.disabled && <Tag className="m-0" color="default">已禁用</Tag>}
                                    <Typography.Text type="secondary" className="text-[12px]">
                                        {item.disabled ? '事件触发时跳过' : '事件触发后执行'}
                                    </Typography.Text>
                                </div>
                                <Typography.Text className="block max-w-full truncate text-[13px] text-[#374151]">
                                    {renderActionSummary(item)}
                                </Typography.Text>
                            </div>
                            <Space className="opacity-80 transition group-hover:opacity-100" size={2}>
                                <Tooltip title="上移">
                                    <Button
                                        size="small"
                                        type="text"
                                        icon={<ArrowUpOutlined />}
                                        disabled={index === 0}
                                        onClick={() => moveAction(event, index, -1)}
                                    />
                                </Tooltip>
                                <Tooltip title="下移">
                                    <Button
                                        size="small"
                                        type="text"
                                        icon={<ArrowDownOutlined />}
                                        disabled={index === actions.length - 1}
                                        onClick={() => moveAction(event, index, 1)}
                                    />
                                </Tooltip>
                                <Tooltip title="复制动作">
                                    <Button
                                        size="small"
                                        type="text"
                                        icon={<CopyOutlined />}
                                        onClick={() => copyAction(event, index)}
                                    />
                                </Tooltip>
                                <Tooltip title={item.disabled ? '启用动作' : '禁用动作'}>
                                    <Button
                                        size="small"
                                        type="text"
                                        icon={item.disabled ? <PlayCircleOutlined /> : <PauseCircleOutlined />}
                                        onClick={() => toggleActionDisabled(event, index)}
                                    />
                                </Tooltip>
                                <Tooltip title="编辑动作">
                                    <Button
                                        size="small"
                                        type="text"
                                        icon={<EditOutlined />}
                                        onClick={() => editAction(event, item, index)}
                                    />
                                </Tooltip>
                                <Popconfirm
                                    title="确认删除动作？"
                                    description="删除后该事件触发时不会再执行这个动作。"
                                    okText="删除"
                                    cancelText="取消"
                                    okButtonProps={{ danger: true }}
                                    onConfirm={() => deleteAction(event, index)}
                                >
                                    <Button
                                        size="small"
                                        type="text"
                                        danger
                                        icon={<DeleteOutlined />}
                                    />
                                </Popconfirm>
                            </Space>
                        </div>
                    </div>
                })}
            </div>
        }
    });

    const activeEventNames = events
        .filter((event) => getEventActions(event).length > 0)
        .map((event) => event.name);
    const firstEventName = events[0]?.name;
    const defaultActiveKey = activeEventNames.length > 0 ? activeEventNames : firstEventName ? [firstEventName] : [];

    function handleModalOk(config?: ActionConfig) {
        if(!config || !curEvent || !curComponent) {
            return ;
        }

        const actions = getEventActions(curEvent);

        if(curAction && curActionIndex !== undefined) {
            updateEventActions(curEvent, actions.map((item, index) => {
                return index === curActionIndex ? config : item;
            }));
            message.success('动作已更新');
        } else {
            updateEventActions(curEvent, [...actions, config]);
            message.success('动作已添加');
        }

        resetActionState();
        setActionModalOpen(false);
    }

    return <div className='px-[4px]'>
        <Collapse
            className='mb-[10px] bg-transparent [&_.ant-collapse-header-text]:min-w-0 [&_.ant-collapse-header-text]:w-full'
            size="small"
            accordion={events.length > 2}
            items={items}
            defaultActiveKey={events.length > 2 ? defaultActiveKey[0] : defaultActiveKey}
        />
        <ActionModal visible={actionModalOpen} event={curEvent} handleOk={handleModalOk} action={curAction} handleCancel={() => {
            resetActionState();
            setActionModalOpen(false);
        }}/>
    </div>
}

function formatEventDataSchema(event: ComponentEventConfig) {
    if (!event.eventDataSchema?.length) {
        return '无额外数据，可使用 args 读取原始事件参数';
    }

    return event.eventDataSchema.map(item => `event.${item}`).join('、');
}

function cloneAction(action: LowcodeAction): LowcodeAction {
    return JSON.parse(JSON.stringify({
        ...action,
        id: undefined,
    })) as LowcodeAction;
}

function formatComponentControlOperation(operation: string) {
    const labels: Record<string, string> = {
        show: '显示',
        hide: '隐藏',
        enable: '启用',
        disable: '禁用',
        setValue: '设置值',
        clearValue: '清空值',
        open: '打开',
        close: '关闭',
        submit: '提交',
        reset: '重置',
    };

    return labels[operation] || operation || '未选择操作';
}
