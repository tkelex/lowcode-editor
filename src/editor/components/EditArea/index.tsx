import React, { MouseEventHandler, useEffect, useMemo, useRef, useState } from "react";
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
import { Component, getComponentById, useComponetsStore } from "../../stores/components"
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
    const [contextMenu, setContextMenu] = useState<{ componentId: number; x: number; y: number; key: number } | null>(null);
    const [areaWidth, setAreaWidth] = useState(0);
    const [canvasContentHeight, setCanvasContentHeight] = useState(0);
    const isDragging = useDragLayer((monitor) => monitor.isDragging());
    const areaRef = useRef<HTMLDivElement | null>(null);
    const shellRef = useRef<HTMLDivElement | null>(null);
    const contextMenuKeyRef = useRef(0);

    const viewportWidth = useMemo(() => {
        return viewportOptions.find(item => item.value === viewportMode)?.width || 1080;
    }, [viewportMode]);

    useEffect(() => {
        const node = areaRef.current;
        if (!node) return;

        setAreaWidth(node.clientWidth);

        const resizeObserver = new ResizeObserver((entries) => {
            const entry = entries[0];
            if (entry) {
                setAreaWidth(entry.contentRect.width);
            }
        });
        resizeObserver.observe(node);

        return () => resizeObserver.disconnect();
    }, []);

    const canvasScale = useMemo(() => {
        if (!areaWidth) return 1;
        const horizontalPadding = 48;
        const availableWidth = Math.max(320, areaWidth - horizontalPadding);
        return Math.min(1, availableWidth / viewportWidth);
    }, [areaWidth, viewportWidth]);

    useEffect(() => {
        const node = shellRef.current;
        if (!node) return;

        const updateCanvasContentHeight = () => {
            setCanvasContentHeight(node.scrollHeight);
        };

        updateCanvasContentHeight();

        const resizeObserver = new ResizeObserver(updateCanvasContentHeight);
        resizeObserver.observe(node);

        return () => resizeObserver.disconnect();
    }, []);

    const minCanvasHeight = useMemo(() => Math.max(560, window.innerHeight - 132), []);

    const scaledCanvasHeight = useMemo(() => {
        return Math.max(minCanvasHeight, canvasContentHeight) * canvasScale;
    }, [canvasContentHeight, canvasScale, minCanvasHeight]);

    function renderComponents(components: Component[]): React.ReactNode {
        return components.map((component: Component) => {
            const config = componentConfig?.[component.name]

            if (isHiddenComponent(component)) {
                return null;
            }

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

        if (componentId && !isLockedComponentId(componentId)) {
            setHoverComponentId(componentId);
        }
    }

    const handleClick: MouseEventHandler = (e) => {
        setContextMenu(null);

        const componentId = getEventComponentId(e);

        if (componentId && componentId !== 1 && !isLockedComponentId(componentId)) {
            setCurComponentId(componentId);
            return;
        }

        if (!componentId || componentId === 1) {
            setCurComponentId(null);
        }
    }

    function handleContextMenu(e: React.MouseEvent) {
        const componentId = getEventComponentId(e);

        e.preventDefault();
        if (!componentId || componentId === 1 || isLockedComponentId(componentId)) {
            setContextMenu(null);
            return;
        }

        setCurComponentId(componentId);
        contextMenuKeyRef.current += 1;
        setContextMenu({
            componentId,
            x: e.clientX,
            y: e.clientY,
            key: contextMenuKeyRef.current,
        });
    }

    function isLockedComponentId(componentId: number) {
        return Boolean(getComponentById(componentId, components)?.props?.locked);
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
    const contextMenuDisabled = !contextMenuComponentId || contextMenuComponentId === 1 || isLockedComponentId(contextMenuComponentId);

    return <div
        ref={areaRef}
        className={`relative h-full overflow-y-auto overflow-x-hidden px-[24px] py-[18px] edit-area ${isDragging ? 'is-dragging' : ''}`}
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
                width: Math.min(viewportWidth, Math.max(320, areaWidth - 48 || viewportWidth)),
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
        <div className="editor-page-stage" style={{ width: viewportWidth * canvasScale, height: scaledCanvasHeight }}>
            <div
                ref={shellRef}
                className="editor-page-shell"
                style={{
                    width: viewportWidth,
                    minHeight: minCanvasHeight,
                    transform: `scale(${canvasScale})`,
                }}
            >
                {renderComponents(components)}
            </div>
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
            key={contextMenu?.key || 'closed'}
            open={Boolean(contextMenu)}
            trigger={[]}
            placement="bottomLeft"
            destroyPopupOnHide
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

function isHiddenComponent(component: Component) {
    return component.id !== 1 && Boolean(component.props?.hidden);
}
