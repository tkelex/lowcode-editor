import { useDrag } from 'react-dnd';
import { useMaterialDrop } from '../../hooks/useMaterialDrop';
import { CommonComponentProps } from '../../interface';
import { useEffect, useRef } from 'react';
import { COMMON_CHILDREN } from '../commonChildren';

const Container = ({ id, name, children, styles }: CommonComponentProps) => {

    const {canDrop, canDropCurrent, isOverCurrent, drop } = useMaterialDrop(COMMON_CHILDREN, id);

    const divRef = useRef<HTMLDivElement>(null);

    const [_, drag] = useDrag({
        type: name,
        item: {
            type: name,
            dragType: 'move',
            id: id
        }
    });

    useEffect(() => {
        drop(divRef);
        drag(divRef);
    }, []);
    
    return (
        <div 
            data-component-id={id}
            ref={divRef}
            style={styles}
            className={`editor-component editor-drop-zone min-h-[124px] p-[16px] ${canDrop ? 'can-drop' : ''} ${canDropCurrent ? 'is-drop-target' : ''} ${isOverCurrent && !canDropCurrent ? 'is-drop-disabled' : ''}`}
        >{children || <div className="editor-empty">拖入组件</div>}</div>
    )
}

export default Container;
