import {
  useEffect,
  useMemo,
  useState,
} from 'react';
import { shallow } from 'zustand/shallow';
import { createPortal } from 'react-dom';
import { getComponentById, useComponetsStore } from '../../stores/components';
import { Dropdown, Input, Modal, Popconfirm, Space, Tooltip, message } from 'antd';
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  BorderOuterOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  MoreOutlined,
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
    renameComponent,
    setCurComponentId,
    wrapComponent,
  } = useComponetsStore((state) => ({
    components: state.components,
    curComponentId: state.curComponentId,
    curComponent: state.curComponent,
    deleteComponent: state.deleteComponent,
    duplicateComponent: state.duplicateComponent,
    moveComponentSibling: state.moveComponentSibling,
    renameComponent: state.renameComponent,
    setCurComponentId: state.setCurComponentId,
    wrapComponent: state.wrapComponent,
  }), shallow);
  const componentConfig = useComponentConfigStore((state) => state.componentConfig);
  const [portalEl, setPortalEl] = useState<Element | null>(null);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState('');

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

  const parentComponents = useMemo(() => {
    const parentComponents = [];
    let component = curComponent;

    while (component?.parentId) {
      component = getComponentById(component.parentId, components)!;
      parentComponents.push(component);
    }

    return parentComponents;
  }, [components, curComponent]);

  if (!portalEl) {
    return null;
  }

  const isLocked = Boolean(curComponent?.props?.locked);
  const moreMenuItems = [
    {
      key: 'wrap',
      label: '包裹容器',
      icon: <BorderOuterOutlined />,
      disabled: isLocked,
    },
    ...parentComponents.map(item => ({
      key: `parent-${item.id}`,
      label: `选择父级：${item.desc}`,
    })),
  ];

  function handleDelete() {
    if (curComponent?.props?.locked) return;

    deleteComponent(curComponentId!);
    setCurComponentId(null);
  }

  function handleWrapContainer() {
    if (!curComponentId) return;
    if (curComponent?.props?.locked) return;

    const config = componentConfig.Container;
    if (!config) return;

    wrapComponent(curComponentId, {
      id: Date.now(),
      name: 'Container',
      desc: config.desc,
      props: config.defaultProps,
    });
  }

  function openRenameModal() {
    if (!curComponent || isLocked) return;

    setRenameValue(curComponent.desc || '');
    setRenameOpen(true);
  }

  function submitRename() {
    if (!curComponentId) return;

    const nextValue = renameValue.trim();
    if (!nextValue) {
      message.warning('组件名称不能为空');
      return;
    }

    renameComponent(curComponentId, nextValue);
    setRenameOpen(false);
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
            transform: 'translateY(-100%)',
          }}
          onClick={(event) => event.stopPropagation()}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <Space className="editor-mask-toolbar" size={3}>
            {curComponentId !== 1 && (
              <>
                <Tooltip title="重命名">
                  <button className="editor-mask-action" type="button" aria-label="重命名" disabled={isLocked} onClick={openRenameModal}>
                    <EditOutlined />
                  </button>
                </Tooltip>
                <Tooltip title="复制">
                  <button className="editor-mask-action" type="button" aria-label="复制" disabled={isLocked} onClick={() => duplicateComponent(curComponentId!)}>
                    <CopyOutlined />
                  </button>
                </Tooltip>
                <Tooltip title="上移">
                  <button className="editor-mask-action" type="button" aria-label="上移" disabled={isLocked} onClick={() => moveComponentSibling(curComponentId!, -1)}>
                    <ArrowUpOutlined />
                  </button>
                </Tooltip>
                <Tooltip title="下移">
                  <button className="editor-mask-action" type="button" aria-label="下移" disabled={isLocked} onClick={() => moveComponentSibling(curComponentId!, 1)}>
                    <ArrowDownOutlined />
                  </button>
                </Tooltip>
                <Popconfirm
                  title="确认删除？"
                  okText={'确认'}
                  cancelText={'取消'}
                  onConfirm={handleDelete}
                >
                  <button className="editor-mask-action is-danger" type="button" aria-label="删除" disabled={isLocked}>
                    <DeleteOutlined />
                  </button>
                </Popconfirm>
                <Dropdown
                  trigger={['click']}
                  menu={{
                    items: moreMenuItems,
                    onClick: ({ key }) => {
                      if (key === 'wrap') {
                        handleWrapContainer();
                        return;
                      }

                      if (String(key).startsWith('parent-')) {
                        setCurComponentId(Number(String(key).replace('parent-', '')));
                      }
                    },
                  }}
                >
                  <button className="editor-mask-action editor-mask-action-more" type="button" aria-label="更多操作">
                    <MoreOutlined />
                  </button>
                </Dropdown>
              </>
            )}
          </Space>
        </div>
        <Modal
          title="重命名组件"
          open={renameOpen}
          onOk={(event) => {
            event.stopPropagation();
            submitRename();
          }}
          onCancel={(event) => {
            event.stopPropagation();
            setRenameOpen(false);
          }}
          okText="确认"
          cancelText="取消"
          destroyOnClose
          modalRender={(modal) => (
            <div onClick={(event) => event.stopPropagation()} onMouseDown={(event) => event.stopPropagation()}>
              {modal}
            </div>
          )}
        >
          <Input
            autoFocus
            value={renameValue}
            maxLength={40}
            placeholder="请输入组件名称"
            onChange={(event) => setRenameValue(event.target.value)}
            onPressEnter={submitRename}
          />
        </Modal>
    </>
  ), portalEl)
}

export default SelectedMask;
