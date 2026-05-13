import { Button, Empty, Popconfirm, Tag, Tooltip, message } from 'antd';
import {
    ArrowDownOutlined,
    ArrowUpOutlined,
    CopyOutlined,
    DeleteOutlined,
    DownOutlined,
    EditOutlined,
    HolderOutlined,
    InfoCircleOutlined,
    PauseCircleOutlined,
    PlayCircleOutlined,
    PlusOutlined,
    SettingOutlined,
    UpOutlined,
} from '@ant-design/icons';
import { useState } from 'react';
import { shallow } from 'zustand/shallow';
import { getLowcodeEventName, getReactEventProp } from '../../events/eventNames';
import { getComponentEventConfig } from '../../events/normalize';
import type { ActionType, EventCategory, LowcodeAction, LowcodeEvents } from '../../events/types';
import { useComponentConfigStore } from '../../registry/component-config';
import type { ComponentEvent as ComponentEventConfig } from '../../registry/component-config';
import { useComponetsStore } from '../../stores/components';
import { getActionSummary } from './actionModel';
import { actionCatalogMap } from './actionCatalog';
import { ActionConfig, ActionModal } from './ActionModal';

const eventCategoryLabelMap: Record<EventCategory, string> = {
    ui: '交互',
    value: '值变化',
    submit: '提交',
    overlay: '弹层',
    lifecycle: '生命周期',
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
    const [addPanelOpen, setAddPanelOpen] = useState(false);
    const [actionModalOpen, setActionModalOpen] = useState(false);
    const [curEvent, setCurEvent] = useState<ComponentEventConfig>();
    const [curAction, setCurAction] = useState<ActionConfig>();
    const [curActionIndex, setCurActionIndex] = useState<number>();
    const [initialActionType, setInitialActionType] = useState<ActionType>();
    const [collapsedEvents, setCollapsedEvents] = useState<Record<string, boolean>>({});
    const eventToolTooltipProps = {
        placement: 'left' as const,
        mouseEnterDelay: 0.2,
        getPopupContainer: (triggerNode: HTMLElement) => {
            const settingPanel = triggerNode.closest('.setting-panel');
            return settingPanel instanceof HTMLElement ? settingPanel : document.body;
        },
    };

    if (!curComponent) return null;

    const searchText = keyword.trim().toLowerCase();
    const allEvents = componentConfig[curComponent.name]?.events || [];
    const configuredEvents = allEvents.filter((event) => hasEventGroup(event));
    const visibleEvents = configuredEvents.filter((event) => {
        if (!searchText) return true;

        const actions = getEventActions(event);
        return [
            event.name,
            event.label,
            event.description || '',
            eventCategoryLabelMap[event.category],
            ...(event.eventDataSchema || []),
            ...actions.map((action) => getActionLabel(action.actionType)),
            ...actions.map((action) => getActionSummary(action, components)),
        ].join(' ').toLowerCase().includes(searchText);
    });
    const addableEvents = allEvents.filter((event) => !hasEventGroup(event));

    if (allEvents.length === 0) {
        return <div className='px-[10px]'>
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="当前组件暂无可绑定事件" />
        </div>;
    }

    function hasEventGroup(event: ComponentEventConfig) {
        if (!curComponent) return false;

        const eventName = getLowcodeEventName(event.name);
        const onEvent = curComponent.props?.onEvent as LowcodeEvents | undefined;
        if (onEvent && Object.prototype.hasOwnProperty.call(onEvent, eventName)) {
            return true;
        }

        return Boolean(getComponentEventConfig(curComponent, event.name)?.actions?.length);
    }

    function getEventActions(event: ComponentEventConfig): LowcodeAction[] {
        if (!curComponent) return [];
        return getComponentEventConfig(curComponent, event.name)?.actions || [];
    }

    function setEventConfig(event: ComponentEventConfig, actions: LowcodeAction[], remove = false) {
        if (!curComponent) return;

        const eventName = getLowcodeEventName(event.name);
        const onEvent = (curComponent.props?.onEvent || {}) as LowcodeEvents;
        const nextOnEvent: LowcodeEvents = { ...onEvent };

        if (remove) {
            delete nextOnEvent[eventName];
        } else {
            nextOnEvent[eventName] = { actions };
        }

        updateComponentProps(curComponent.id, {
            [eventName]: undefined,
            [event.name]: undefined,
            [getReactEventProp(event)]: undefined,
            onEvent: Object.keys(nextOnEvent).length > 0 ? nextOnEvent : undefined,
        });
    }

    function addEvent(event: ComponentEventConfig) {
        setEventConfig(event, []);
        setCollapsedEvents((state) => ({ ...state, [event.name]: false }));
        setAddPanelOpen(false);
        message.success('事件已添加');
    }

    function deleteEvent(event: ComponentEventConfig) {
        setEventConfig(event, [], true);
        message.success('事件已删除');
    }

    function clearEventActions(event: ComponentEventConfig) {
        setEventConfig(event, []);
        message.success('事件动作已清空');
    }

    function deleteAction(event: ComponentEventConfig, index: number) {
        const actions = getEventActions(event);
        setEventConfig(event, actions.filter((_, actionIndex) => actionIndex !== index));
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
        setEventConfig(event, nextActions);
        message.success('动作顺序已更新');
    }

    function copyAction(event: ComponentEventConfig, index: number) {
        const actions = getEventActions(event);
        const action = actions[index];
        if (!action) return;

        const nextAction = cloneAction(action);
        setEventConfig(event, [
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

        setEventConfig(event, nextActions);
        message.success(actions[index]?.disabled ? '动作已启用' : '动作已禁用');
    }

    function resetActionState() {
        setCurAction(undefined);
        setCurActionIndex(undefined);
        setInitialActionType(undefined);
    }

    function openActionModal(event: ComponentEventConfig, actionType?: ActionType) {
        resetActionState();
        setInitialActionType(actionType);
        setCurEvent(event);
        setActionModalOpen(true);
    }

    function editAction(event: ComponentEventConfig, config: ActionConfig, index: number) {
        setCurEvent(event);
        setCurAction(config);
        setCurActionIndex(index);
        setInitialActionType(undefined);
        setActionModalOpen(true);
    }

    function handleModalOk(config?: ActionConfig) {
        if(!config || !curEvent || !curComponent) {
            return ;
        }

        const actions = getEventActions(curEvent);

        if(curAction && curActionIndex !== undefined) {
            setEventConfig(curEvent, actions.map((item, index) => {
                return index === curActionIndex ? config : item;
            }));
            message.success('动作已更新');
        } else {
            setEventConfig(curEvent, [...actions, config]);
            message.success('动作已添加');
        }

        resetActionState();
        setActionModalOpen(false);
    }

    function toggleEventCollapsed(event: ComponentEventConfig) {
        setCollapsedEvents((state) => ({
            ...state,
            [event.name]: !(state[event.name] ?? false),
        }));
    }

    function isEventCollapsed(event: ComponentEventConfig) {
        return collapsedEvents[event.name] ?? false;
    }

    return <div className='event-panel event-flow-panel'>
        <div className="event-add-area">
            <Button
                block
                className="event-primary-add-button"
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setAddPanelOpen((open) => !open)}
            >
                添加事件
            </Button>
            {addPanelOpen && (
                <div className="event-add-menu">
                    {addableEvents.length === 0 && (
                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="当前组件事件已全部添加" />
                    )}
                    {addableEvents.map((event) => (
                        <button
                            key={event.name}
                            type="button"
                            className="event-add-option"
                            onClick={() => addEvent(event)}
                        >
                            <span className="event-add-option-title">{event.label}</span>
                            <span className="event-add-option-desc">{event.description || `${event.name} 触发时执行`}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>

        {configuredEvents.length === 0 && (
            <div className="event-flow-empty">
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无事件配置" />
                <span>从添加事件开始，为当前组件编排动作。</span>
            </div>
        )}

        {configuredEvents.length > 0 && visibleEvents.length === 0 && (
            <div className="event-flow-empty">
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="没有匹配的事件配置" />
            </div>
        )}

        <div className="event-group-list">
            {visibleEvents.map((event) => {
                const actions = getEventActions(event);
                const collapsed = isEventCollapsed(event);

                return <div key={event.name} className="event-group">
                    <div className="event-group-header">
                        <div className="event-group-main">
                            <span className="event-group-title">{event.label}</span>
                            <Tag className="event-group-category">{eventCategoryLabelMap[event.category]}</Tag>
                            <span className="event-group-count">{actions.length} 个动作</span>
                            {event.description && (
                                <Tooltip title={event.description}>
                                    <InfoCircleOutlined className="event-group-info" />
                                </Tooltip>
                            )}
                        </div>
                        <div className="event-group-tools">
                            <Tooltip title="添加动作" {...eventToolTooltipProps}>
                                <Button aria-label="添加动作" size="small" type="text" icon={<PlusOutlined />} onClick={() => openActionModal(event)} />
                            </Tooltip>
                            <Tooltip title="清空动作" {...eventToolTooltipProps}>
                                <span className="event-tool-button-wrap">
                                    <Popconfirm
                                        title="清空事件动作？"
                                        description="清空后该事件仍会保留，但不会执行任何动作。"
                                        okText="清空"
                                        cancelText="取消"
                                        onConfirm={() => clearEventActions(event)}
                                    >
                                        <Button aria-label="清空动作" size="small" type="text" icon={<DeleteOutlined />} disabled={actions.length === 0} />
                                    </Popconfirm>
                                </span>
                            </Tooltip>
                            <Tooltip title="删除事件" {...eventToolTooltipProps}>
                                <span className="event-tool-button-wrap">
                                    <Popconfirm
                                        title="删除事件？"
                                        description="删除后该事件下的动作也会一并移除。"
                                        okText="删除"
                                        cancelText="取消"
                                        okButtonProps={{ danger: true }}
                                        onConfirm={() => deleteEvent(event)}
                                    >
                                        <Button aria-label="删除事件" size="small" type="text" danger icon={<DeleteOutlined />} />
                                    </Popconfirm>
                                </span>
                            </Tooltip>
                            <Tooltip title={collapsed ? '展开事件' : '收起事件'} {...eventToolTooltipProps}>
                                <Button
                                    aria-label={collapsed ? '展开事件' : '收起事件'}
                                    size="small"
                                    type="text"
                                    icon={collapsed ? <DownOutlined /> : <UpOutlined />}
                                    onClick={() => toggleEventCollapsed(event)}
                                />
                            </Tooltip>
                        </div>
                    </div>
                    {!collapsed && (
                        <div className="event-action-flow">
                            {actions.length === 0 && (
                                <div className="event-action-empty-row">
                                    <span>暂无动作</span>
                                    <Button size="small" type="link" icon={<PlusOutlined />} onClick={() => openActionModal(event)}>
                                        添加动作
                                    </Button>
                                </div>
                            )}
                            {actions.map((action, index) => (
                                <div key={`${event.name}-${index}-${action.actionType}`} className={`event-action-row ${action.disabled ? 'is-disabled' : ''}`}>
                                    <HolderOutlined className="event-action-handle" />
                                    <div className="event-action-row-index">{index + 1}</div>
                                    <Tag className="event-action-tag" color={getActionColor(action.actionType)}>
                                        {getActionLabel(action.actionType)}
                                    </Tag>
                                    <div className="event-action-row-body">
                                        <span className="event-action-row-title">{getActionTitle(action.actionType)}</span>
                                        <span className="event-action-row-summary" title={getActionSummary(action, components)}>
                                            {getActionSummary(action, components)}
                                        </span>
                                    </div>
                                    {action.disabled && <Tag className="event-action-disabled-tag" color="default">已禁用</Tag>}
                                    <div className="event-action-row-tools">
                                        <Tooltip title="上移">
                                            <Button aria-label="上移动作" size="small" type="text" icon={<ArrowUpOutlined />} disabled={index === 0} onClick={() => moveAction(event, index, -1)} />
                                        </Tooltip>
                                        <Tooltip title="下移">
                                            <Button aria-label="下移动作" size="small" type="text" icon={<ArrowDownOutlined />} disabled={index === actions.length - 1} onClick={() => moveAction(event, index, 1)} />
                                        </Tooltip>
                                        <Tooltip title="复制动作">
                                            <Button aria-label="复制动作" size="small" type="text" icon={<CopyOutlined />} onClick={() => copyAction(event, index)} />
                                        </Tooltip>
                                        <Tooltip title={action.disabled ? '启用动作' : '禁用动作'}>
                                            <Button aria-label={action.disabled ? '启用动作' : '禁用动作'} size="small" type="text" icon={action.disabled ? <PlayCircleOutlined /> : <PauseCircleOutlined />} onClick={() => toggleActionDisabled(event, index)} />
                                        </Tooltip>
                                        <Tooltip title="动作设置">
                                            <Button aria-label="动作设置" size="small" type="text" icon={<SettingOutlined />} onClick={() => editAction(event, action, index)} />
                                        </Tooltip>
                                        <Tooltip title="编辑动作">
                                            <Button aria-label="编辑动作" size="small" type="text" icon={<EditOutlined />} onClick={() => editAction(event, action, index)} />
                                        </Tooltip>
                                        <Popconfirm
                                            title="确认删除动作？"
                                            description="删除后该事件触发时不会再执行这个动作。"
                                            okText="删除"
                                            cancelText="取消"
                                            okButtonProps={{ danger: true }}
                                            onConfirm={() => deleteAction(event, index)}
                                        >
                                            <Button aria-label="删除动作" size="small" type="text" danger icon={<DeleteOutlined />} />
                                        </Popconfirm>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            })}
        </div>

        <ActionModal visible={actionModalOpen} event={curEvent} initialActionType={initialActionType} handleOk={handleModalOk} action={curAction} handleCancel={() => {
            resetActionState();
            setActionModalOpen(false);
        }}/>
    </div>
}

function cloneAction(action: LowcodeAction): LowcodeAction {
    return JSON.parse(JSON.stringify({
        ...action,
        id: undefined,
    })) as LowcodeAction;
}

function getActionLabel(actionType: ActionType) {
    return actionCatalogMap[actionType]?.shortLabel || actionType;
}

function getActionTitle(actionType: ActionType) {
    return actionCatalogMap[actionType]?.label || actionType;
}

function getActionColor(actionType: ActionType) {
    return actionCatalogMap[actionType]?.color || 'default';
}
