import {
  useEffect,
  useMemo,
  useState,
} from 'react';
import { shallow } from 'zustand/shallow';
import { createPortal } from 'react-dom';
import { getComponentById, useComponetsStore } from '../../stores/components';
import { Dropdown, Popconfirm, Space, Tooltip } from 'antd';
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  BorderOuterOutlined,
  CopyOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useComponentConfigStore } from '../../registry/component-config';
import {
  getMaskComponentNode,
  getMaskContainer,
  getMaskPosition,
} from '../maskPosition';

interface SelectedMaskProps {
  portalWrapperClassName: string
  containerClassName: string
  componentId: number;
}

function SelectedMask({ containerClassName, portalWrapperClassName, componentId }: SelectedMaskProps) {

  const [position, setPosition] = useState({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    labelTop: 0,
    labelLeft: 0,
  });

  const {
    components,
    curComponentId,
    curComponent,
    deleteComponent,
    duplicateComponent,
    moveComponentSibling,
    setCurComponentId,
    wrapComponent,
  } = useComponetsStore((state) => ({
    components: state.components,
    curComponentId: state.curComponentId,
    curComponent: state.curComponent,
    deleteComponent: state.deleteComponent,
    duplicateComponent: state.duplicateComponent,
    moveComponentSibling: state.moveComponentSibling,
    setCurComponentId: state.setCurComponentId,
    wrapComponent: state.wrapComponent,
  }), shallow);
  const componentConfig = useComponentConfigStore((state) => state.componentConfig);
  const [portalEl, setPortalEl] = useState<Element | null>(null);

  useEffect(() => {
    updatePosition();
  }, [componentId]);

  useEffect(() => {
    setTimeout(() => {
      updatePosition();
    }, 200);
  }, [components]);

  useEffect(() => {
    const resizeHandler = () => {
      updatePosition();
    }
    window.addEventListener('resize', resizeHandler)
    return () => {
      window.removeEventListener('resize', resizeHandler)
    }
  }, []);

  useEffect(() => {
    const container = document.querySelector(`.${containerClassName}`);
    if (!container) return;

    let frame = 0;
    const updateOnFrame = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(updatePosition);
    };

    container.addEventListener('scroll', updateOnFrame);

    return () => {
      window.cancelAnimationFrame(frame);
      container.removeEventListener('scroll', updateOnFrame);
    };
  }, [componentId, containerClassName]);

  useEffect(() => {
    const container = getMaskContainer(containerClassName);
    if (!container) return;

    const node = getMaskComponentNode(container, componentId);
    if (!node) return;

    const updateOnFrame = () => {
      window.requestAnimationFrame(updatePosition);
    };
    const observer = new ResizeObserver(updateOnFrame);
    observer.observe(container);
    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [componentId, containerClassName]);

  useEffect(() => {
    setPortalEl(document.querySelector(`.${portalWrapperClassName}`));
  }, [portalWrapperClassName]);

  function updatePosition() {
    if (!componentId) return;

    const container = getMaskContainer(containerClassName);
    if (!container) return;

    const node = getMaskComponentNode(container, componentId);
    if (!node) return;

    setPosition(getMaskPosition(container, node));
  }

  const curSelectedComponent = useMemo(() => {
    return getComponentById(componentId, components);
  }, [componentId, components]);

  function handleDelete() {
    deleteComponent(curComponentId!);
    setCurComponentId(null);
  }

  function handleWrapContainer() {
    if (!curComponentId) return;

    const config = componentConfig.Container;
    if (!config) return;

    wrapComponent(curComponentId, {
      id: Date.now(),
      name: 'Container',
      desc: config.desc,
      props: config.defaultProps,
    });
  }

  const parentComponents = useMemo(() => {
    const parentComponents = [];
    let component = curComponent;

    while (component?.parentId) {
      component = getComponentById(component.parentId, components)!;
      parentComponents.push(component);
    }

    return parentComponents;

  }, [curComponent]);

  if (!portalEl) {
    return null;
  }

  return createPortal((
    <>
      <div
        className="editor-mask editor-mask-selected"
        style={{
          left: position.left,
          top: position.top,
          width: position.width,
          height: position.height,
          zIndex: 12,
        }}
      />
      <div
          style={{
            position: "absolute",
            left: position.labelLeft,
            top: position.labelTop,
            fontSize: "14px",
            zIndex: 13,
            display: (!position.width || position.width < 10) ? "none" : "inline",
            transform: 'translate(-100%, -100%)',
          }}
        >
          <Space className="editor-mask-toolbar" size={3}>
            <Dropdown
              menu={{
                items: parentComponents.map(item => ({
                  key: item.id,
                  label: item.desc,
                })),
                onClick: ({ key }) => {
                  setCurComponentId(+key);
                }
              }}
              disabled={parentComponents.length === 0}
            >
              <div className="editor-mask-label">
                {curSelectedComponent?.desc}
              </div>
            </Dropdown>
            {curComponentId !== 1 && (
              <>
                <Tooltip title="复制">
                  <button className="editor-mask-action" type="button" onClick={() => duplicateComponent(curComponentId!)}>
                    <CopyOutlined />
                  </button>
                </Tooltip>
                <Tooltip title="上移">
                  <button className="editor-mask-action" type="button" onClick={() => moveComponentSibling(curComponentId!, -1)}>
                    <ArrowUpOutlined />
                  </button>
                </Tooltip>
                <Tooltip title="下移">
                  <button className="editor-mask-action" type="button" onClick={() => moveComponentSibling(curComponentId!, 1)}>
                    <ArrowDownOutlined />
                  </button>
                </Tooltip>
                <Tooltip title="包裹容器">
                  <button className="editor-mask-action" type="button" onClick={handleWrapContainer}>
                    <BorderOuterOutlined />
                  </button>
                </Tooltip>
                <Popconfirm
                  title="确认删除？"
                  okText={'确认'}
                  cancelText={'取消'}
                  onConfirm={handleDelete}
                >
                  <button className="editor-mask-action is-danger" type="button">
                    <DeleteOutlined />
                  </button>
                </Popconfirm>
              </>
            )}
          </Space>
        </div>
    </>
  ), portalEl)
}

export default SelectedMask;
