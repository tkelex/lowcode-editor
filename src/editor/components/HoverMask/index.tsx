import {
  useEffect,
  useMemo,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { getComponentById, useComponetsStore } from '../../stores/components';
import {
  getMaskComponentNode,
  getMaskContainer,
  getMaskPosition,
} from '../maskPosition';

interface HoverMaskProps {
  portalWrapperClassName: string;
  containerClassName: string
  componentId: number;
}

function HoverMask({ containerClassName, portalWrapperClassName, componentId }: HoverMaskProps) {

  const [position, setPosition] = useState({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    labelTop: 0,
    labelLeft: 0,
  });

  const components = useComponetsStore((state) => state.components);
  const [portalEl, setPortalEl] = useState<Element | null>(null);

  useEffect(() => {
    updatePosition();
  }, [componentId]);

  useEffect(() => {
    updatePosition();
  }, [components]);

  useEffect(() => {
    setPortalEl(document.querySelector(`.${portalWrapperClassName}`));
  }, [portalWrapperClassName]);

  useEffect(() => {
    const container = document.querySelector(`.${containerClassName}`);
    if (!container) return;

    let frame = 0;
    const updateOnFrame = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(updatePosition);
    };

    container.addEventListener('scroll', updateOnFrame);
    window.addEventListener('resize', updateOnFrame);

    return () => {
      window.cancelAnimationFrame(frame);
      container.removeEventListener('scroll', updateOnFrame);
      window.removeEventListener('resize', updateOnFrame);
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

  function updatePosition() {
    if (!componentId) return;

    const container = getMaskContainer(containerClassName);
    if (!container) return;

    const node = getMaskComponentNode(container, componentId);
    if (!node) return;

    setPosition(getMaskPosition(container, node));
  }

  const curComponent = useMemo(() => {
    return getComponentById(componentId, components);
  }, [componentId, components]);

  if (!portalEl) {
    return null;
  }

  return createPortal((
    <>
      <div
        className="editor-mask editor-mask-hover"
        style={{
          left: position.left,
          top: position.top,
          width: position.width,
          height: position.height,
          zIndex: 12,
        }}
      />
      <div
        className="editor-mask-label"
        style={{
          position: "absolute",
          left: position.left + position.width,
          top: position.labelTop,
          zIndex: 13,
          display: (!position.width || position.width < 10) ? "none" : "inline-flex",
          transform: 'translate(-100%, -100%)',
          pointerEvents: 'none',
        }}
      >
        {curComponent?.desc}
      </div>
    </>
  ), portalEl)
}

export default HoverMask;
