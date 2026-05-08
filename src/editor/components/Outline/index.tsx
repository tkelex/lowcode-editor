import { AimOutlined, EditOutlined } from '@ant-design/icons';
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
    } = useComponetsStore((state) => ({
        components: state.components,
        curComponentId: state.curComponentId,
        setCurComponentId: state.setCurComponentId,
        moveComponentTo: state.moveComponentTo,
        renameComponent: state.renameComponent,
    }), shallow);
    const componentConfig = useComponentConfigStore((state) => state.componentConfig);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editingValue, setEditingValue] = useState('');

    function locateComponent(componentId: number) {
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
                            <Typography.Text className="block max-w-full truncate text-[13px] text-[#111827]">
                                {component.desc}
                            </Typography.Text>
                            <Typography.Text type="secondary" className="block max-w-full truncate text-[11px]">
                                {component.name} #{component.id}
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
                            <Tooltip title="重命名">
                                <Button
                                    size="small"
                                    type="text"
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
