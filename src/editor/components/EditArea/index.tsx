import React, { MouseEventHandler, useMemo, useState } from "react";
import {
    ArrowDownOutlined,
    ArrowUpOutlined,
    BorderOuterOutlined,
    CopyOutlined,
    DeleteOutlined,
} from '@ant-design/icons';
import { Dropdown, Segmented, Space, Typography } from "antd";
import { useDragLayer } from "react-dnd";
import { shallow } from 'zustand/shallow';
import { useComponentConfigStore } from "../../registry/component-config";
import { Component, useComponetsStore } from "../../stores/components"
import HoverMask from "../HoverMask";
import SelectedMask from "../SelectedMask";
import "../../editorCanvas.css";

type ViewportMode = 'desktop' | 'tablet' | 'mobile';

const viewportOptions: Array<{ label: string; value: ViewportMode; width: number }> = [
    { label: '桌面', value: 'desktop', width: 1080 },
    { label: '平板', value: 'tablet', width: 768 },
    { label: '手机', value: 'mobile', width: 390 },
];

export function EditArea() {
    const {
        components,
        curComponentId,
        setCurComponentId,
        deleteComponent,
        duplicateComponent,
        moveComponentSibling,
        wrapComponent,
    } = useComponetsStore((state) => ({
        components: state.components,
        curComponentId: state.curComponentId,
        setCurComponentId: state.setCurComponentId,
        deleteComponent: state.deleteComponent,
        duplicateComponent: state.duplicateComponent,
        moveComponentSibling: state.moveComponentSibling,
        wrapComponent: state.wrapComponent,
    }), shallow);
    const { componentConfig } = useComponentConfigStore();
    const [hoverComponentId, setHoverComponentId] = useState<number>();
    const [viewportMode, setViewportMode] = useState<ViewportMode>('desktop');
    const [contextMenu, setContextMenu] = useState<{ componentId: number; x: number; y: number } | null>(null);
    const isDragging = useDragLayer((monitor) => monitor.isDragging());

    const viewportWidth = useMemo(() => {
        return viewportOptions.find(item => item.value === viewportMode)?.width || 1080;
    }, [viewportMode]);

    function renderComponents(components: Component[]): React.ReactNode {
        return components.map((component: Component) => {
            const config = componentConfig?.[component.name]

            if (!config?.dev) {
                return null;
            }

            return React.createElement(
                config.dev,
                {
                    key: component.id,
                    id: component.id,
                    name: component.name,
                    styles: component.styles,
                    ...config.defaultProps,
                    ...component.props,
                },
                renderComponents(component.children || [])
            )
        })
    }

    function getEventComponentId(e: React.MouseEvent) {
        const path = e.nativeEvent.composedPath();

        for (let i = 0; i < path.length; i += 1) {
            const ele = path[i] as HTMLElement;
            const componentId = ele.dataset?.componentId;

            if (componentId) {
                return +componentId;
            }
        }

        return null;
    }

    const handleMouseOver: MouseEventHandler = (e)  => {
        const componentId = getEventComponentId(e);

        if (componentId) {
            setHoverComponentId(componentId);
        }
    }

    const handleClick: MouseEventHandler = (e) => {
        const componentId = getEventComponentId(e);

        if (componentId) {
            setCurComponentId(componentId);
        }
    }

    function handleContextMenu(e: React.MouseEvent) {
        const componentId = getEventComponentId(e);
        if (!componentId) return;

        e.preventDefault();
        setCurComponentId(componentId);
        setContextMenu({
            componentId,
            x: e.clientX,
            y: e.clientY,
        });
    }

    function handleWrapContainer(componentId: number) {
        const config = componentConfig.Container;
        if (!config) return;

        wrapComponent(componentId, {
            id: Date.now(),
            name: 'Container',
            desc: config.desc,
            props: config.defaultProps,
        });
    }

    const contextMenuComponentId = contextMenu?.componentId;
    const contextMenuDisabled = !contextMenuComponentId || contextMenuComponentId === 1;

    return <div
        className={`relative h-full overflow-auto px-[32px] py-[24px] edit-area ${isDragging ? 'is-dragging' : ''}`}
        onMouseOver={handleMouseOver}
        onMouseLeave={() => {
            setHoverComponentId(undefined);
        }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
    >
        <div
            className="editor-canvas-ruler"
            style={{
                width: viewportWidth,
                minWidth: viewportWidth,
            }}
        >
            <div className="flex min-w-0 items-center gap-[10px]">
                <span className="editor-canvas-ruler-badge">编辑画布</span>
                <Typography.Text className="text-[12px] text-[#64748b]">
                    页面宽度 {viewportWidth}px
                </Typography.Text>
            </div>
            <Space size={8} wrap>
                <Segmented
                    size="small"
                    value={viewportMode}
                    onChange={(value) => setViewportMode(value as ViewportMode)}
                    options={viewportOptions.map(item => ({
                        label: item.label,
                        value: item.value,
                    }))}
                />
            </Space>
        </div>
        <div
            className="editor-page-shell mx-auto"
            style={{
                width: viewportWidth,
                minWidth: viewportWidth,
            }}
        >
            {renderComponents(components)}
        </div>
        {hoverComponentId && hoverComponentId !== curComponentId && (
            <HoverMask
                portalWrapperClassName='portal-wrapper'
                containerClassName='edit-area'
                componentId={hoverComponentId}
            />
        )}
        {curComponentId && (
            <SelectedMask
                portalWrapperClassName='portal-wrapper'
                containerClassName='edit-area'
                componentId={curComponentId}
            />
        )}
        <div className="portal-wrapper"></div>
        <Dropdown
            open={Boolean(contextMenu)}
            trigger={[]}
            placement="bottomLeft"
            onOpenChange={(open) => {
                if (!open) {
                    setContextMenu(null);
                }
            }}
            menu={{
                items: [
                    {
                        key: 'copy',
                        label: '复制',
                        icon: <CopyOutlined />,
                        disabled: contextMenuDisabled,
                    },
                    {
                        key: 'moveUp',
                        label: '上移',
                        icon: <ArrowUpOutlined />,
                        disabled: contextMenuDisabled,
                    },
                    {
                        key: 'moveDown',
                        label: '下移',
                        icon: <ArrowDownOutlined />,
                        disabled: contextMenuDisabled,
                    },
                    {
                        key: 'wrap',
                        label: '包裹容器',
                        icon: <BorderOuterOutlined />,
                        disabled: contextMenuDisabled,
                    },
                    {
                        type: 'divider',
                    },
                    {
                        key: 'delete',
                        label: '删除',
                        icon: <DeleteOutlined />,
                        danger: true,
                        disabled: contextMenuDisabled,
                    },
                ],
                onClick: ({ key }) => {
                    if (!contextMenuComponentId || contextMenuComponentId === 1) return;

                    if (key === 'copy') {
                        duplicateComponent(contextMenuComponentId);
                    }
                    if (key === 'moveUp') {
                        moveComponentSibling(contextMenuComponentId, -1);
                    }
                    if (key === 'moveDown') {
                        moveComponentSibling(contextMenuComponentId, 1);
                    }
                    if (key === 'wrap') {
                        handleWrapContainer(contextMenuComponentId);
                    }
                    if (key === 'delete') {
                        deleteComponent(contextMenuComponentId);
                        setCurComponentId(null);
                    }

                    setContextMenu(null);
                },
            }}
        >
            <div
                style={{
                    position: 'fixed',
                    left: contextMenu?.x || 0,
                    top: contextMenu?.y || 0,
                    width: 1,
                    height: 1,
                    pointerEvents: 'none',
                }}
            />
        </Dropdown>
    </div>
}
