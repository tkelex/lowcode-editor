import { AimOutlined, EditOutlined, EyeInvisibleOutlined, EyeOutlined, LockOutlined, UnlockOutlined } from '@ant-design/icons';
import { Button, Input, Space, Tooltip, Tree, Typography, message } from "antd";
import { useState } from 'react';
import { shallow } from 'zustand/shallow';
import { useComponentConfigStore } from '../../registry/component-config';
import { Component, getComponentById, useComponetsStore } from "../../stores/components";

export function Outline() {
    const {
        components,
        curComponentId,
        setCurComponentId,
        moveComponentTo,
        renameComponent,
        toggleComponentHidden,
        toggleComponentLocked,
    } = useComponetsStore((state) => ({
        components: state.components,
        curComponentId: state.curComponentId,
        setCurComponentId: state.setCurComponentId,
        moveComponentTo: state.moveComponentTo,
        renameComponent: state.renameComponent,
        toggleComponentHidden: state.toggleComponentHidden,
        toggleComponentLocked: state.toggleComponentLocked,
    }), shallow);
    const componentConfig = useComponentConfigStore((state) => state.componentConfig);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editingValue, setEditingValue] = useState('');

    function locateComponent(componentId: number) {
        const component = getComponentById(componentId, components);
        if (component?.props?.hidden) {
            message.info('组件已隐藏，可在大纲中取消隐藏后定位');
            return;
        }
        if (component?.props?.locked) {
            message.info('组件已锁定，可在大纲中解锁后选择');
            return;
        }

        setCurComponentId(componentId);

        window.requestAnimationFrame(() => {
            const node = document.querySelector(`.edit-area [data-component-id="${componentId}"]`);
            node?.scrollIntoView({
                block: 'center',
                inline: 'center',
                behavior: 'smooth',
            });
        });
    }

    function startRename(component: Component) {
        setEditingId(component.id);
        setEditingValue(component.desc);
    }

    function submitRename() {
        if (!editingId) return;

        const nextValue = editingValue.trim();
        if (!nextValue) {
            message.warning('组件名称不能为空');
            return;
        }

        renameComponent(editingId, nextValue);
        setEditingId(null);
        setEditingValue('');
    }

    function canAcceptChild(parent: Component, child: Component) {
        const accept = componentConfig[parent.name]?.acceptsChildren;
        if (accept === true) return true;
        return Array.isArray(accept) && accept.includes(child.name);
    }

    function handleDrop(info: any) {
        const dragId = Number(info.dragNode.key);
        const targetId = Number(info.node.key);
        const dragComponent = getComponentById(dragId, components);
        const targetComponent = getComponentById(targetId, components);

        if (!dragComponent || !targetComponent || dragId === 1) return;
        if (dragComponent.props?.locked || targetComponent.props?.locked) {
            message.warning('锁定组件不能移动，也不能接收其它组件');
            return;
        }

        if (info.dropToGap) {
            const parentId = targetComponent.parentId;
            if (!parentId) return;

            const parentComponent = getComponentById(parentId, components);
            if (!parentComponent?.children || !canAcceptChild(parentComponent, dragComponent)) {
                message.warning('目标位置不允许放置该组件');
                return;
            }

            const targetIndex = parentComponent.children.findIndex(item => item.id === targetId);
            const relativePosition = info.dropPosition - Number(String(info.node.pos).split('-').pop());
            const nextIndex = relativePosition > 0 ? targetIndex + 1 : targetIndex;
            moveComponentTo(dragId, parentId, nextIndex);
            return;
        }

        if (!canAcceptChild(targetComponent, dragComponent)) {
            message.warning('目标组件不允许接收该组件');
            return;
        }

        moveComponentTo(dragId, targetId);
    }

    return <div className="rounded-[8px] border border-[#e5e7eb] bg-white p-[8px]">
        <Tree
            className="editor-outline-tree"
            fieldNames={{ title: 'desc', key: 'id' }}
            treeData={components as any}
            showLine
            blockNode
            draggable={{
                icon: false,
            }}
            defaultExpandAll
            selectedKeys={curComponentId ? [curComponentId] : []}
            onDrop={handleDrop}
            onSelect={([selectedKey]) => {
                if (!selectedKey) return;
                locateComponent(Number(selectedKey));
            }}
            titleRender={(nodeData: any) => {
                const component = nodeData as Component;
                const isEditing = editingId === component.id;
                const hidden = Boolean(component.props?.hidden);
                const locked = Boolean(component.props?.locked);
                const systemNode = component.id === 1;

                return <div className="flex min-w-0 items-center justify-between gap-[6px] py-[2px]">
                    {isEditing ? (
                        <Input
                            size="small"
                            autoFocus
                            value={editingValue}
                            onClick={(event) => event.stopPropagation()}
                            onChange={(event) => setEditingValue(event.target.value)}
                            onBlur={submitRename}
                            onPressEnter={submitRename}
                        />
                    ) : (
                        <div className="min-w-0">
                            <Typography.Text className={`block max-w-full truncate text-[13px] ${hidden ? 'text-[#94a3b8]' : 'text-[#111827]'}`}>
                                {component.desc}
                            </Typography.Text>
                            <Typography.Text type="secondary" className="block max-w-full truncate text-[11px]">
                                {component.name} #{component.id}
                                {hidden ? ' / 已隐藏' : ''}
                                {locked ? ' / 已锁定' : ''}
                            </Typography.Text>
                        </div>
                    )}
                    {!isEditing && (
                        <Space size={2} className="shrink-0 opacity-70 transition hover:opacity-100">
                            <Tooltip title="定位">
                                <Button
                                    size="small"
                                    type="text"
                                    icon={<AimOutlined />}
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        locateComponent(component.id);
                                    }}
                                />
                            </Tooltip>
                            <Tooltip title={hidden ? '显示组件' : '隐藏组件'}>
                                <Button
                                    size="small"
                                    type="text"
                                    disabled={systemNode}
                                    icon={hidden ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        toggleComponentHidden(component.id);
                                    }}
                                />
                            </Tooltip>
                            <Tooltip title={locked ? '解锁组件' : '锁定组件'}>
                                <Button
                                    size="small"
                                    type="text"
                                    disabled={systemNode}
                                    icon={locked ? <LockOutlined /> : <UnlockOutlined />}
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        toggleComponentLocked(component.id);
                                    }}
                                />
                            </Tooltip>
                            <Tooltip title="重命名">
                                <Button
                                    size="small"
                                    type="text"
                                    disabled={locked}
                                    icon={<EditOutlined />}
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        startRename(component);
                                    }}
                                />
                            </Tooltip>
                        </Space>
                    )}
                </div>
            }}
        />
    </div>
}
