import { Alert, Button, Checkbox, Empty, Input, Modal, Tag, Typography } from "antd";
import { SearchOutlined } from '@ant-design/icons';
import { useEffect, useMemo, useState } from "react";
import { GoToLink, GoToLinkConfig } from "./actions/GoToLink";
import { ShowMessage, ShowMessageConfig } from "./actions/ShowMessage";
import { CustomJS, CustomJSConfig } from "./actions/CustomJS";
import { ComponentMethod, ComponentMethodConfig } from "./actions/ComponentMethod";
import { ConfirmActionForm } from "./actions/ConfirmAction";
import { ConditionActionForm } from "./actions/ConditionAction";
import { HttpActionForm } from "./actions/HttpAction";
import { SetComponentData } from "./actions/SetComponentData";
import { ComponentControl } from "./actions/ComponentControl";
import { SetVariable } from "./actions/SetVariable";
import type { ActionType, LowcodeAction } from "../../events/types";
import type { ComponentEvent } from "../../registry/component-config";
import { useComponentConfigStore } from "../../registry/component-config";
import type { Component } from "../../stores/components";
import { useComponetsStore } from "../../stores/components";
import {
    actionCatalog,
    actionCategories,
    actionCatalogMap,
    defaultActionOrder,
    type ActionCatalogItem,
} from './actionCatalog';
import {
    createDefaultAction,
    getActionCommonControls,
    mergeActionConfig,
    validateActionConfig,
    type ActionCommonControls,
} from './actionModel';

type ActionFormConfig = GoToLinkConfig | ShowMessageConfig | CustomJSConfig | ComponentMethodConfig | LowcodeAction;
export type ActionConfig = LowcodeAction;

export interface ActionModalProps {
    visible: boolean
    action?: ActionConfig
    event?: ComponentEvent
    initialActionType?: ActionType
    handleOk: (config?: ActionConfig) => void
    handleCancel: () => void
}

export function ActionModal(props: ActionModalProps) {
    const {
        visible,
        action,
        event,
        initialActionType,
        handleOk,
        handleCancel
    } = props;

    const [key, setKey] = useState<ActionType>('toast');
    const [curConfig, setCurConfig] = useState<ActionConfig>();
    const [commonControls, setCommonControls] = useState<ActionCommonControls>({});
    const [keyword, setKeyword] = useState('');
    const components = useComponetsStore((state) => state.components);
    const { componentConfig } = useComponentConfigStore();

    const allowedActions = useMemo(() => defaultActionOrder.filter((actionType) => {
        return event?.allowedActions?.includes(actionType) ?? true;
    }), [event]);

    const availableActions = useMemo(() => {
        return allowedActions.filter((actionType) => isActionAvailable(actionType, components, componentConfig));
    }, [allowedActions, components, componentConfig]);

    const actionTypes = useMemo(() => {
        if (action?.actionType && !availableActions.includes(action.actionType)) {
            return [action.actionType, ...availableActions];
        }

        return availableActions;
    }, [action?.actionType, availableActions]);
    const actionTypesKey = actionTypes.join('|');

    const actionItems = useMemo(() => {
        const text = keyword.trim().toLowerCase();
        return actionCatalog
            .filter((item) => actionTypes.includes(item.actionType))
            .filter((item) => {
                if (!text) return true;
                return [
                    item.label,
                    item.shortLabel,
                    item.description,
                    ...item.keywords,
                ].join(' ').toLowerCase().includes(text);
            });
    }, [actionTypes, keyword]);

    const commonActions = useMemo(() => actionCatalog.filter((item) => {
        return item.common && actionTypes.includes(item.actionType);
    }), [actionTypes]);

    const selectedAction = actionCatalogMap[key];
    const selectedActionDescription = selectedAction?.description || '请选择一个动作类型。';

    useEffect(() => {
        if (!visible) return;

        if(action?.actionType && actionTypes.includes(action.actionType)) {
            setKey(action.actionType);
            setCurConfig(action);
            setCommonControls(getActionCommonControls(action));
        } else if(initialActionType && actionTypes.includes(initialActionType)) {
            setKey(initialActionType);
            setCurConfig(createDefaultAction(initialActionType));
            setCommonControls({});
        } else {
            const nextType = actionTypes[0] || 'toast';
            setKey(nextType);
            setCurConfig(createDefaultAction(nextType));
            setCommonControls({});
        }

        setKeyword('');
    }, [visible, action, actionTypesKey, initialActionType]);

    function handleActionTypeChange(value: ActionType) {
        setKey(value);
        const nextConfig = action?.actionType === value ? action : createDefaultAction(value);
        setCurConfig(nextConfig);
        setCommonControls(getActionCommonControls(nextConfig));
    }

    function updateCommonControl(control: keyof ActionCommonControls, value: boolean) {
        setCommonControls((current) => ({
            ...current,
            [control]: value,
        }));
    }

    function renderActionForm() {
        if (key === 'url') {
            return <GoToLink key="goToLink" value={curConfig?.actionType === 'url' ? curConfig.args : undefined} onChange={(config) => {
                setCurConfig(config as ActionFormConfig);
            }}/>;
        }

        if (key === 'toast') {
            return <ShowMessage  key="showMessage" value={curConfig?.actionType === 'toast' ? {
                type: curConfig.args.msgType || 'success',
                text: curConfig.args.msg,
            } : undefined} onChange={(config) => {
                setCurConfig(config as ActionFormConfig);
            }}/>;
        }

        if (key === 'componentAction') {
            return <ComponentMethod  key="componentMethod" value={curConfig?.actionType === 'componentAction' ? {
                componentId: curConfig.componentId,
                method: curConfig.args.method,
                params: curConfig.args.params,
            } : undefined} onChange={(config) => {
                setCurConfig(config as ActionFormConfig);
            }}/>;
        }

        if (key === 'custom') {
            return <CustomJS key="customJS" value={curConfig?.actionType === 'custom' ? curConfig.args.script : ''} onChange={(config) => {
                setCurConfig(config as ActionFormConfig);
            }}/>;
        }

        if (key === 'confirm') {
            return <ConfirmActionForm key="confirm" value={curConfig?.actionType === 'confirm' ? curConfig.args : undefined} onChange={(config) => {
                setCurConfig(config as ActionFormConfig);
            }} />;
        }

        if (key === 'condition') {
            return <ConditionActionForm key="condition" value={curConfig?.actionType === 'condition' ? curConfig.args : undefined} onChange={(config) => {
                setCurConfig(config as ActionFormConfig);
            }} />;
        }

        if (key === 'http') {
            return <HttpActionForm key="http" value={curConfig?.actionType === 'http' ? curConfig.args : undefined} onChange={(config) => {
                setCurConfig(config as ActionFormConfig);
            }} />;
        }

        if (key === 'componentControl') {
            return <ComponentControl key="componentControl" value={curConfig?.actionType === 'componentControl' ? curConfig : undefined} onChange={(config) => {
                setCurConfig(config as ActionFormConfig);
            }} />;
        }

        if (key === 'setComponentProps') {
            return <SetComponentData key="setComponentProps" actionType="setComponentProps" value={curConfig?.actionType === 'setComponentProps' ? curConfig : undefined} onChange={(config) => {
                setCurConfig(config as ActionFormConfig);
            }} />;
        }

        if (key === 'setComponentStyles') {
            return <SetComponentData key="setComponentStyles" actionType="setComponentStyles" value={curConfig?.actionType === 'setComponentStyles' ? curConfig : undefined} onChange={(config) => {
                setCurConfig(config as ActionFormConfig);
            }} />;
        }

        if (key === 'setVariable') {
            return <SetVariable key="setVariable" value={curConfig?.actionType === 'setVariable' ? curConfig : undefined} onChange={(config) => {
                setCurConfig(config as ActionFormConfig);
            }} />;
        }

        return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="请选择动作" />;
    }

    const mergedConfig = curConfig ? mergeActionConfig(curConfig, action, commonControls) : undefined;
    const validationErrors = validateActionConfig(mergedConfig);

    return  <Modal
        title={event ? `${event.label} - 动作配置` : '动作配置'}
        width={1120}
        open={visible}
        okText="确认"
        cancelText="取消"
        okButtonProps={{ disabled: validationErrors.length > 0 }}
        onOk={() => handleOk(mergedConfig)}
        onCancel={handleCancel}
        className="event-action-modal"
    >
        <div className="event-action-modal-shell">
            <div className="event-action-modal-top">
                <span className="event-action-modal-label">常用动作：</span>
                <div className="event-action-common-list">
                    {commonActions.map((item) => (
                        <Button
                            key={item.actionType}
                            size="small"
                            type={key === item.actionType ? 'primary' : 'default'}
                            shape="round"
                            onClick={() => handleActionTypeChange(item.actionType)}
                        >
                            {item.label}
                        </Button>
                    ))}
                </div>
            </div>
            <div className="event-action-modal-body">
                <aside className="event-action-modal-sidebar">
                    <div className="event-action-sidebar-title">执行动作</div>
                    <Input
                        allowClear
                        prefix={<SearchOutlined />}
                        value={keyword}
                        placeholder="搜索执行动作"
                        onChange={(event) => setKeyword(event.target.value)}
                    />
                    <div className="event-action-category-list">
                        {actionCategories.map((category) => {
                            const items = actionItems.filter((item) => item.category === category.key);
                            if (items.length === 0) return null;

                            return <div key={category.key} className="event-action-category">
                                <div className="event-action-category-title">{category.label}</div>
                                {items.map((item) => (
                                    <ActionTypeButton
                                        key={item.actionType}
                                        item={item}
                                        active={key === item.actionType}
                                        onClick={() => handleActionTypeChange(item.actionType)}
                                    />
                                ))}
                            </div>;
                        })}
                    </div>
                </aside>
                <section className="event-action-modal-config">
                    {selectedAction ? (
                        <>
                            <div className="event-action-config-header">
                                <div>
                                    <div className="event-action-config-title">{selectedAction.label}</div>
                                    <Typography.Text type="secondary" className="event-action-config-desc">
                                        {selectedActionDescription}
                                    </Typography.Text>
                                </div>
                                <Tag color={selectedAction.color}>{selectedAction.shortLabel}</Tag>
                            </div>
                            <div className="event-action-config-section">
                                <div className="event-action-config-section-title">基础设置</div>
                                {renderActionForm()}
                            </div>
                            <div className="event-action-config-section event-action-common-controls">
                                <div className="event-action-config-section-title">通用控制</div>
                                <Checkbox checked={Boolean(commonControls.disabled)} onChange={(event) => updateCommonControl('disabled', event.target.checked)}>
                                    禁用动作
                                </Checkbox>
                                <Checkbox checked={Boolean(commonControls.preventDefault)} onChange={(event) => updateCommonControl('preventDefault', event.target.checked)}>
                                    阻止默认行为
                                </Checkbox>
                                <Checkbox checked={Boolean(commonControls.stopPropagation)} onChange={(event) => updateCommonControl('stopPropagation', event.target.checked)}>
                                    阻止事件冒泡并停止后续动作
                                </Checkbox>
                            </div>
                            {validationErrors.length > 0 && (
                                <Alert
                                    className="event-action-validation"
                                    type="warning"
                                    showIcon
                                    message={validationErrors.join('；')}
                                />
                            )}
                            {key === 'custom' && (
                                <div className="event-action-config-warning">
                                    自定义 JS 仅编辑器预览可执行，公开发布页会禁用。
                                </div>
                            )}
                        </>
                    ) : (
                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="请选择执行动作" />
                    )}
                </section>
            </div>
        </div>
    </Modal>
}

function ActionTypeButton(props: {
    item: ActionCatalogItem;
    active: boolean;
    onClick: () => void;
}) {
    const { item, active, onClick } = props;

    return <button
        type="button"
        className={`event-action-type-button ${active ? 'is-active' : ''}`}
        onClick={onClick}
    >
        <span className="event-action-type-label">{item.label}</span>
        <span className="event-action-type-desc">{item.description}</span>
    </button>;
}

function isActionAvailable(
    actionType: ActionType,
    components: Component[],
    componentConfig: Record<string, any>,
) {
    if (actionType === 'componentAction') {
        return flattenComponents(components).some((component) => {
            return (componentConfig[component.name]?.methods || []).length > 0;
        });
    }

    if (
        actionType === 'componentControl'
        || actionType === 'setComponentProps'
        || actionType === 'setComponentStyles'
    ) {
        return flattenComponents(components).some((component) => component.name !== 'Page');
    }

    return true;
}

function flattenComponents(components: Component[]) {
    const result: Component[] = [];

    function walk(items: Component[]) {
        items.forEach((component) => {
            result.push(component);
            if (component.children?.length) {
                walk(component.children);
            }
        });
    }

    walk(components);
    return result;
}
