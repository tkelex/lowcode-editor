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
import { Button, Empty, Popconfirm, Space, Tag, Tooltip, Typography, message } from 'antd';
import { useState } from 'react';
import type { ActionType, LowcodeAction } from '../../../events/types';
import { useComponetsStore } from '../../../stores/components';
import { ActionConfig, ActionModal } from '../ActionModal';
import { getActionSummary } from '../actionModel';

interface NestedActionListProps {
    title: string;
    description?: string;
    actions?: LowcodeAction[];
    emptyText?: string;
    onChange?: (actions: LowcodeAction[]) => void;
}

const actionLabelMap: Record<ActionType, string> = {
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

const actionColorMap: Record<ActionType, string> = {
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

export function NestedActionList(props: NestedActionListProps) {
    const {
        title,
        description,
        actions = [],
        emptyText = '暂无动作',
        onChange,
    } = props;
    const components = useComponetsStore((state) => state.components);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingAction, setEditingAction] = useState<ActionConfig>();
    const [editingIndex, setEditingIndex] = useState<number>();

    function openCreateModal() {
        setEditingAction(undefined);
        setEditingIndex(undefined);
        setModalOpen(true);
    }

    function openEditModal(action: LowcodeAction, index: number) {
        setEditingAction(action);
        setEditingIndex(index);
        setModalOpen(true);
    }

    function updateActions(nextActions: LowcodeAction[]) {
        onChange?.(nextActions);
    }

    function handleModalOk(config?: ActionConfig) {
        if (!config) return;

        if (editingIndex !== undefined) {
            updateActions(actions.map((action, index) => index === editingIndex ? config : action));
            message.success('嵌套动作已更新');
        } else {
            updateActions([...actions, config]);
            message.success('嵌套动作已添加');
        }

        setModalOpen(false);
        setEditingAction(undefined);
        setEditingIndex(undefined);
    }

    function moveAction(index: number, direction: -1 | 1) {
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= actions.length) return;

        const nextActions = [...actions];
        const [action] = nextActions.splice(index, 1);
        nextActions.splice(targetIndex, 0, action);
        updateActions(nextActions);
        message.success('嵌套动作顺序已更新');
    }

    function copyAction(index: number) {
        const action = actions[index];
        if (!action) return;

        updateActions([
            ...actions.slice(0, index + 1),
            cloneAction(action),
            ...actions.slice(index + 1),
        ]);
        message.success('嵌套动作已复制');
    }

    function toggleActionDisabled(index: number) {
        updateActions(actions.map((action, actionIndex) => {
            if (actionIndex !== index) return action;
            return {
                ...action,
                disabled: !action.disabled,
            };
        }));
        message.success(actions[index]?.disabled ? '嵌套动作已启用' : '嵌套动作已禁用');
    }

    function deleteAction(index: number) {
        updateActions(actions.filter((_, actionIndex) => actionIndex !== index));
        message.success('嵌套动作已删除');
    }

    return <div className="rounded-[8px] border border-[#e5e7eb] bg-white p-[12px]">
        <div className="mb-[10px] flex items-start justify-between gap-[12px]">
            <div className="min-w-0">
                <Typography.Text strong className="block text-[13px] text-[#1f2937]">{title}</Typography.Text>
                {description && (
                    <Typography.Text type="secondary" className="mt-[2px] block text-[12px] leading-[18px]">
                        {description}
                    </Typography.Text>
                )}
            </div>
            <Button size="small" type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
                添加
            </Button>
        </div>

        {actions.length === 0 && (
            <div className="rounded-[8px] border border-dashed border-[#cbd5e1] bg-[#f8fafc] px-[10px] py-[12px] text-center">
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyText} />
            </div>
        )}

        {actions.map((action, index) => (
            <div
                key={`${index}-${action.actionType}`}
                className={`group mb-[8px] rounded-[8px] border p-[10px] transition ${
                    action.disabled ? 'border-[#e5e7eb] bg-[#f8fafc] opacity-70' : 'border-[#e5e7eb] bg-white'
                }`}
            >
                <div className="flex items-start justify-between gap-[10px]">
                    <div className="flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-full bg-[#eff6ff] text-[12px] font-semibold text-[#2563eb]">
                        {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="mb-[5px] flex items-center gap-[6px]">
                            <Tag className="m-0" color={actionColorMap[action.actionType]}>{actionLabelMap[action.actionType]}</Tag>
                            {action.disabled && <Tag className="m-0" color="default">已禁用</Tag>}
                            <Typography.Text type="secondary" className="text-[12px]">
                                {action.disabled ? '执行到这里时跳过' : '按顺序执行'}
                            </Typography.Text>
                        </div>
                        <Typography.Text className="block max-w-full truncate text-[13px] text-[#374151]">
                            {getActionSummary(action, components)}
                        </Typography.Text>
                    </div>
                    <Space size={2}>
                        <Tooltip title="上移">
                            <Button size="small" type="text" icon={<ArrowUpOutlined />} disabled={index === 0} onClick={() => moveAction(index, -1)} />
                        </Tooltip>
                        <Tooltip title="下移">
                            <Button size="small" type="text" icon={<ArrowDownOutlined />} disabled={index === actions.length - 1} onClick={() => moveAction(index, 1)} />
                        </Tooltip>
                        <Tooltip title="复制">
                            <Button size="small" type="text" icon={<CopyOutlined />} onClick={() => copyAction(index)} />
                        </Tooltip>
                        <Tooltip title={action.disabled ? '启用' : '禁用'}>
                            <Button size="small" type="text" icon={action.disabled ? <PlayCircleOutlined /> : <PauseCircleOutlined />} onClick={() => toggleActionDisabled(index)} />
                        </Tooltip>
                        <Tooltip title="编辑">
                            <Button size="small" type="text" icon={<EditOutlined />} onClick={() => openEditModal(action, index)} />
                        </Tooltip>
                        <Popconfirm
                            title="确认删除动作？"
                            okText="删除"
                            cancelText="取消"
                            okButtonProps={{ danger: true }}
                            onConfirm={() => deleteAction(index)}
                        >
                            <Button size="small" type="text" danger icon={<DeleteOutlined />} />
                        </Popconfirm>
                    </Space>
                </div>
            </div>
        ))}

        <ActionModal
            visible={modalOpen}
            action={editingAction}
            handleOk={handleModalOk}
            handleCancel={() => {
                setModalOpen(false);
                setEditingAction(undefined);
                setEditingIndex(undefined);
            }}
        />
    </div>;
}

function cloneAction(action: LowcodeAction): LowcodeAction {
    return JSON.parse(JSON.stringify({
        ...action,
        id: undefined,
    })) as LowcodeAction;
}
