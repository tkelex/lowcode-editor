import { useDrop } from "react-dnd";
import { useComponentConfigStore } from "../registry/component-config";
import { getComponentById, useComponetsStore } from "../stores/components";

export interface ItemType {
  type: string;
  dragType?: 'move' | 'add',
  id: number
}

export function useMaterialDrop(accept: string[], id: number) {
    const { addComponent, moveComponent, components } = useComponetsStore();
    const { componentConfig } = useComponentConfigStore();

    const targetConfig = componentConfig[getComponentById(id, components)?.name || ''];
    const registryAccept = targetConfig?.acceptsChildren;
    const allowedChildren = registryAccept === true ? accept : registryAccept || accept;
    const acceptsAllChildren = registryAccept === true;
    const canAccept = (type: string) => acceptsAllChildren || allowedChildren.includes(type);
    const isDescendantOfDraggingComponent = (draggingComponentId?: number) => {
      if (!draggingComponentId) return false;

      let current = getComponentById(id, components);
      while (current?.parentId) {
        if (current.parentId === draggingComponentId) {
          return true;
        }
        current = getComponentById(current.parentId, components);
      }

      return false;
    };
    const canDropItem = (item: ItemType) => {
      if (!canAccept(item.type)) return false;
      if (item.dragType === 'move' && (item.id === id || isDescendantOfDraggingComponent(item.id))) {
        return false;
      }

      return true;
    };

    const [{ canDrop, isOverCurrent, canDropCurrent }, drop] = useDrop(() => ({
        accept: allowedChildren,
        drop: (item: ItemType, monitor) => {
            const didDrop = monitor.didDrop()
            if (didDrop) {
              return;
            }

            if (!canDropItem(item)) {
              return;
            }

            if(item.dragType === 'move') {
              moveComponent(item.id, id)
            } else {
              const config = componentConfig[item.type];
              const componentId = new Date().getTime();

              addComponent({
                id: componentId,
                name: item.type,
                desc: config.desc,
                props: createMaterialDefaultProps(item.type, config.defaultProps, componentId)
              }, id)
            }
        },
        canDrop: (item) => canDropItem(item),
        collect: (monitor) => ({
          canDrop: monitor.canDrop(),
          isOverCurrent: monitor.isOver({ shallow: true }),
          canDropCurrent: monitor.canDrop() && monitor.isOver({ shallow: true }),
        }),
    }), [allowedChildren, acceptsAllChildren, components, componentConfig, id]);

    return { canDrop, isOverCurrent, canDropCurrent, drop }
}

/**
 * @deprecated Use `useMaterialDrop` instead. Kept for existing material imports.
 */
export const useMaterailDrop = useMaterialDrop;

function createMaterialDefaultProps(type: string, defaultProps: Record<string, any>, componentId: number) {
  const props = { ...defaultProps };

  if (type === 'FormItem') {
    props.name = `field_${componentId}`;
  }

  if (type === 'TableColumn') {
    props.dataIndex = `col_${componentId}`;
  }

  return props;
}
