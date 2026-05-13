import { Button, Collapse, CollapseProps, Empty, Popconfirm, Tag, Tooltip, message } from 'antd';
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
        return {
            key: event.name,
            label: <div className='grid w-full min-w-0 grid-cols-[minmax(0,1fr)_24px] items-center gap-[8px]'>
                <div className="event-summary">
                    <div className="event-title-row">
                        <span className="event-title">{event.label}</span>
                        {actions.length > 0 && <span className="event-action-count">{actions.length}</span>}
                    </div>
                    {event.description && (
                        <span className="event-description" title={event.description}>
                            {event.description}
                        </span>
                    )}
                </div>
                <Button
                    aria-label="添加动作"
                    title="添加动作"
                    size="small"
                    type="text"
                    className="event-add-button"
                    icon={<PlusOutlined />}
                    onPointerDown={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onDoubleClick={(e) => e.stopPropagation()}
                    onClick={(e) => {
                        e.stopPropagation();

                        resetActionState();
                        setCurEvent(event);
                        setActionModalOpen(true);
                    }}
                />
            </div>,
            children: <div>
                <div className="event-data-card">
                    <span className="event-data-label">事件数据</span>
                    <span className="event-data-value">{formatEventDataSchema(event)}</span>
                </div>
                {actions.length === 0 && (
                    <div className="event-empty-card">
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
                    return <div key={`${event.name}-${index}-${item.actionType}`} className={`event-action-card ${item.disabled ? 'is-disabled' : ''}`}>
                        <div className="flex items-start justify-between gap-[8px]">
                            <div className="event-action-index">
                                {index + 1}
                            </div>
                            <div className="min-w-0 flex-1 pt-[1px]">
                                <div className="mb-[4px] flex min-w-0 items-center gap-[6px]">
                                    <Tag className="event-action-tag" color={actionColorMap[item.actionType]}>{actionLabelMap[item.actionType]}</Tag>
                                    {item.disabled && <Tag className="m-0" color="default">已禁用</Tag>}
                                </div>
                                <span className="event-action-summary" title={renderActionSummary(item)}>
                                    {renderActionSummary(item)}
                                </span>
                            </div>
                            <div className="event-action-tools">
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
                            </div>
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

    return <div className='event-panel'>
        <Collapse
            className='setting-collapse mb-[10px] [&_.ant-collapse-header-text]:min-w-0 [&_.ant-collapse-header-text]:w-full'
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
