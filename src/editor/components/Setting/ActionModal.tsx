import { Modal, Select, Typography } from "antd";
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

type ActionFormConfig = GoToLinkConfig | ShowMessageConfig | CustomJSConfig | ComponentMethodConfig | LowcodeAction;
export type ActionConfig = LowcodeAction;

export interface ActionModalProps {
    visible: boolean
    action?: ActionConfig
    event?: ComponentEvent
    handleOk: (config?: ActionConfig) => void
    handleCancel: () => void
}

const actionTypeLabelMap: Record<ActionType, string> = {
    url: '访问链接',
    toast: '消息提示',
    custom: '自定义 JS',
    componentAction: '组件方法',
    confirm: '确认弹窗',
    condition: '条件执行',
    http: 'HTTP 请求',
    componentControl: '组件联动',
    setComponentProps: '设置属性',
    setComponentStyles: '设置样式',
    setVariable: '设置变量',
};

const actionTypeDescriptionMap: Record<ActionType, string> = {
    url: '跳转到站内页面或外部链接，未填写协议时会自动补全。',
    toast: '触发事件后展示成功、失败、警告或提示消息。',
    custom: '执行自定义 JavaScript，可读取事件数据并组合复杂逻辑。',
    componentAction: '调用其它组件暴露的方法，例如提交表单或打开弹窗。',
    confirm: '先弹出确认框，用户确认后再继续执行后续动作。',
    condition: '根据表达式判断是否继续执行指定动作。',
    http: '向后端或外部服务发起 HTTP 请求。',
    componentControl: '显示隐藏、启用禁用、设置/清空值，或打开弹窗、提交表单。',
    setComponentProps: '修改目标组件属性，例如文本、禁用状态或数据源。',
    setComponentStyles: '修改目标组件样式，例如颜色、间距或显示状态。',
    setVariable: '把事件数据、固定值或表达式结果写入页面级变量。',
};

const defaultActionOrder: ActionType[] = [
    'toast',
    'url',
    'componentAction',
    'confirm',
    'condition',
    'http',
    'componentControl',
    'setComponentProps',
    'setComponentStyles',
    'setVariable',
    'custom',
];

export function ActionModal(props: ActionModalProps) {
    const {
        visible,
        action,
        event,
        handleOk,
        handleCancel
    } = props;

    const [key, setKey] = useState<ActionType>('toast');
    const [curConfig, setCurConfig] = useState<ActionConfig>();

    const allowedActions = useMemo(() => defaultActionOrder.filter((actionType) => {
        return event?.allowedActions?.includes(actionType) ?? true;
    }), [event]);

    const actionTypes = useMemo(() => {
        if (action?.actionType && !allowedActions.includes(action.actionType)) {
            return [action.actionType, ...allowedActions];
        }

        return allowedActions;
    }, [action?.actionType, allowedActions]);

    const actionOptions = actionTypes.map((actionType) => ({
        label: actionTypeLabelMap[actionType],
        value: actionType,
    }));
    const selectedActionDescription = actionTypeDescriptionMap[key];

    useEffect(() => {
        if (!visible) return;

        if(action?.actionType && actionTypes.includes(action.actionType)) {
            setKey(action.actionType);
            setCurConfig(action);
        } else {
            setKey(actionTypes[0] || 'toast');
            setCurConfig(undefined);
        }
    }, [visible, action, actionTypes]);

    function handleActionTypeChange(value: ActionType) {
        setKey(value);
        setCurConfig(action?.actionType === value ? action : undefined);
    }

    return  <Modal
        title={event ? `${event.label} - 事件动作配置` : '事件动作配置'}
        width={800}
        open={visible}
        okText="确认"
        cancelText="取消"
        okButtonProps={{ disabled: !curConfig }}
        onOk={() => handleOk(curConfig)}
        onCancel={handleCancel}
    >
        <div className="max-h-[70vh] min-h-[420px] overflow-y-auto pr-[4px]">
            <div className="rounded-[8px] border border-[#e5e7eb] bg-[#f8fafc] p-[14px]">
                <div className="mb-[8px] text-[13px] font-medium text-[#1f2937]">动作类型</div>
                <Select<ActionType>
                    className="w-full"
                    value={key}
                    options={actionOptions}
                    placeholder="请选择事件触发后要执行的动作"
                    onChange={handleActionTypeChange}
                />
                <Typography.Text type="secondary" className="mt-[8px] block text-[12px] leading-[18px]">
                    {selectedActionDescription}
                </Typography.Text>
            </div>
            {
                key === 'url' && <GoToLink key="goToLink" value={action?.actionType === 'url' ? action.args.url : ''} onChange={(config) => {
                    setCurConfig(config as ActionFormConfig);
                }}/>
            }
            {
                key === 'toast' && <ShowMessage  key="showMessage" value={action?.actionType === 'toast' ? {
                    type: action.args.msgType || 'success',
                    text: action.args.msg,
                } : undefined} onChange={(config) => {
                setCurConfig(config as ActionFormConfig);
                }}/>
            }
            {
                key === 'componentAction' && <ComponentMethod  key="componentMethod" value={action?.actionType === 'componentAction' ? {
                    componentId: action.componentId,
                    method: action.args.method,
                    params: action.args.params,
                } : undefined} onChange={(config) => {
                    setCurConfig(config as ActionFormConfig);
                }}/>
            }
            {
                key === 'custom' && <CustomJS key="customJS" value={action?.actionType === 'custom' ? action.args.script : ''} onChange={(config) => {
                    setCurConfig(config as ActionFormConfig);
                }}/>
            }
            {
                key === 'confirm' && <ConfirmActionForm key="confirm" value={action?.actionType === 'confirm' ? action.args : undefined} onChange={(config) => {
                    setCurConfig(config as ActionFormConfig);
                }} />
            }
            {
                key === 'condition' && <ConditionActionForm key="condition" value={action?.actionType === 'condition' ? action.args : undefined} onChange={(config) => {
                    setCurConfig(config as ActionFormConfig);
                }} />
            }
            {
                key === 'http' && <HttpActionForm key="http" value={action?.actionType === 'http' ? action.args : undefined} onChange={(config) => {
                    setCurConfig(config as ActionFormConfig);
                }} />
            }
            {
                key === 'componentControl' && <ComponentControl key="componentControl" value={action?.actionType === 'componentControl' ? action : undefined} onChange={(config) => {
                    setCurConfig(config as ActionFormConfig);
                }} />
            }
            {
                key === 'setComponentProps' && <SetComponentData key="setComponentProps" actionType="setComponentProps" value={action?.actionType === 'setComponentProps' ? action : undefined} onChange={(config) => {
                    setCurConfig(config as ActionFormConfig);
                }} />
            }
            {
                key === 'setComponentStyles' && <SetComponentData key="setComponentStyles" actionType="setComponentStyles" value={action?.actionType === 'setComponentStyles' ? action : undefined} onChange={(config) => {
                    setCurConfig(config as ActionFormConfig);
                }} />
            }
            {
                key === 'setVariable' && <SetVariable key="setVariable" value={action?.actionType === 'setVariable' ? action : undefined} onChange={(config) => {
                    setCurConfig(config as ActionFormConfig);
                }} />
            }
        </div>
    </Modal>
}
