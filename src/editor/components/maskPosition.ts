export interface MaskPosition {
  left: number;
  top: number;
  width: number;
  height: number;
  labelTop: number;
  labelLeft: number;
}

export function getMaskContainer(containerClassName: string) {
  return document.querySelector(`.${containerClassName}`);
}

export function getMaskComponentNode(container: Element, componentId: number) {
  const nodes = Array.from(
    container.querySelectorAll<HTMLElement>(`[data-component-id="${componentId}"]`),
  );

  return nodes.find(isComponentRootNode) || nodes[0] || null;
}

export function getMaskPosition(container: Element, node: Element): MaskPosition {
  const { top, left, width, height } = node.getBoundingClientRect();
  const { top: containerTop, left: containerLeft } = container.getBoundingClientRect();
  const relativeTop = top - containerTop + container.scrollTop;
  const relativeLeft = left - containerLeft + container.scrollLeft;
  let labelTop = relativeTop;

  if (labelTop <= 0) {
    labelTop -= -20;
  }

  return {
    top: relativeTop,
    left: relativeLeft,
    width,
    height,
    labelTop,
    labelLeft: relativeLeft + width,
  };
}

function isComponentRootNode(node: HTMLElement) {
  return node.classList.contains('editor-component') || node.classList.contains('editor-page');
}
