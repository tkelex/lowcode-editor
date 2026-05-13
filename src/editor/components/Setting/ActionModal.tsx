import { Button, Empty, Input, Modal, Tag, Typography } from "antd";
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
import {
    actionCatalog,
    actionCategories,
    actionCatalogMap,
    defaultActionOrder,
    type ActionCatalogItem,
} from './actionCatalog';

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
    const [keyword, setKeyword] = useState('');

    const allowedActions = useMemo(() => defaultActionOrder.filter((actionType) => {
        return event?.allowedActions?.includes(actionType) ?? true;
    }), [event]);

    const actionTypes = useMemo(() => {
        if (action?.actionType && !allowedActions.includes(action.actionType)) {
            return [action.actionType, ...allowedActions];
        }

        return allowedActions;
    }, [action?.actionType, allowedActions]);

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
        } else if(initialActionType && actionTypes.includes(initialActionType)) {
            setKey(initialActionType);
            setCurConfig(undefined);
        } else {
            setKey(actionTypes[0] || 'toast');
            setCurConfig(undefined);
        }

        setKeyword('');
    }, [visible, action, actionTypes, initialActionType]);

    function handleActionTypeChange(value: ActionType) {
        setKey(value);
        setCurConfig(action?.actionType === value ? action : undefined);
    }

    function renderActionForm() {
        if (key === 'url') {
            return <GoToLink key="goToLink" value={action?.actionType === 'url' ? action.args.url : ''} onChange={(config) => {
                setCurConfig(config as ActionFormConfig);
            }}/>;
        }

        if (key === 'toast') {
            return <ShowMessage  key="showMessage" value={action?.actionType === 'toast' ? {
                type: action.args.msgType || 'success',
                text: action.args.msg,
            } : undefined} onChange={(config) => {
                setCurConfig(config as ActionFormConfig);
            }}/>;
        }

        if (key === 'componentAction') {
            return <ComponentMethod  key="componentMethod" value={action?.actionType === 'componentAction' ? {
                componentId: action.componentId,
                method: action.args.method,
                params: action.args.params,
            } : undefined} onChange={(config) => {
                setCurConfig(config as ActionFormConfig);
            }}/>;
        }

        if (key === 'custom') {
            return <CustomJS key="customJS" value={action?.actionType === 'custom' ? action.args.script : ''} onChange={(config) => {
                setCurConfig(config as ActionFormConfig);
            }}/>;
        }

        if (key === 'confirm') {
            return <ConfirmActionForm key="confirm" value={action?.actionType === 'confirm' ? action.args : undefined} onChange={(config) => {
                setCurConfig(config as ActionFormConfig);
            }} />;
        }

        if (key === 'condition') {
            return <ConditionActionForm key="condition" value={action?.actionType === 'condition' ? action.args : undefined} onChange={(config) => {
                setCurConfig(config as ActionFormConfig);
            }} />;
        }

        if (key === 'http') {
            return <HttpActionForm key="http" value={action?.actionType === 'http' ? action.args : undefined} onChange={(config) => {
                setCurConfig(config as ActionFormConfig);
            }} />;
        }

        if (key === 'componentControl') {
            return <ComponentControl key="componentControl" value={action?.actionType === 'componentControl' ? action : undefined} onChange={(config) => {
                setCurConfig(config as ActionFormConfig);
            }} />;
        }

        if (key === 'setComponentProps') {
            return <SetComponentData key="setComponentProps" actionType="setComponentProps" value={action?.actionType === 'setComponentProps' ? action : undefined} onChange={(config) => {
                setCurConfig(config as ActionFormConfig);
            }} />;
        }

        if (key === 'setComponentStyles') {
            return <SetComponentData key="setComponentStyles" actionType="setComponentStyles" value={action?.actionType === 'setComponentStyles' ? action : undefined} onChange={(config) => {
                setCurConfig(config as ActionFormConfig);
            }} />;
        }

        if (key === 'setVariable') {
            return <SetVariable key="setVariable" value={action?.actionType === 'setVariable' ? action : undefined} onChange={(config) => {
                setCurConfig(config as ActionFormConfig);
            }} />;
        }

        return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="请选择动作" />;
    }

    return  <Modal
        title={event ? `${event.label} - 动作配置` : '动作配置'}
        width={1120}
        open={visible}
        okText="确认"
        cancelText="取消"
        okButtonProps={{ disabled: !curConfig }}
        onOk={() => handleOk(curConfig)}
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
