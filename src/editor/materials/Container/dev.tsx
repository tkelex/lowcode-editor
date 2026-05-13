import { useDrag } from 'react-dnd';
import { useMaterialDrop } from '../../hooks/useMaterialDrop';
import { CommonComponentProps } from '../../interface';
import { CSSProperties, useEffect, useRef } from 'react';
import { COMMON_CHILDREN } from '../commonChildren';

const Container = ({ id, name, children, styles, title, visible = true, direction = 'vertical' }: CommonComponentProps) => {

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

    const layoutStyles = {
        ...styles,
        display: 'flex',
        flexDirection: direction === 'horizontal' ? 'row' : 'column',
        flexWrap: direction === 'horizontal' ? 'wrap' : undefined,
        gap: direction === 'horizontal' ? 12 : undefined,
        opacity: visible ? styles?.opacity : 0.48,
    } as CSSProperties;
    
    return (
        <div 
            data-component-id={id}
            ref={divRef}
            style={layoutStyles}
            className={`editor-component editor-drop-zone min-h-[124px] p-[16px] ${canDrop ? 'can-drop' : ''} ${canDropCurrent ? 'is-drop-target' : ''} ${isOverCurrent && !canDropCurrent ? 'is-drop-disabled' : ''}`}
        >
            {title && <div className="editor-container-title">{title}</div>}
            {visible ? (children || <div className="editor-empty">拖入组件</div>) : <div className="editor-empty">容器已设为不可见</div>}
        </div>
    )
}

export default Container;
