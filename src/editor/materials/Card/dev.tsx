import { Card as AntdCard } from 'antd';
import { useEffect, useRef } from 'react';
import { useDrag } from 'react-dnd';
import { useMaterialDrop } from '../../hooks/useMaterialDrop';
import { CommonComponentProps } from '../../interface';
import { COMMON_CHILDREN } from '../commonChildren';

const Card = ({ id, name, title, bordered, hoverable, children, styles }: CommonComponentProps) => {
    const { canDrop, canDropCurrent, isOverCurrent, drop } = useMaterialDrop(COMMON_CHILDREN, id);
    const divRef = useRef<HTMLDivElement>(null);

    const [_, drag] = useDrag({
        type: name,
        item: {
            type: name,
            dragType: 'move',
            id,
        }
    });

    useEffect(() => {
        drop(divRef);
        drag(divRef);
    }, []);

    return <div ref={divRef} data-component-id={id} style={styles} className="editor-component">
        <AntdCard
            title={title}
            bordered={bordered}
            hoverable={hoverable}
            className={`editor-panel editor-drop-zone ${canDrop ? 'can-drop' : ''} ${canDropCurrent ? 'is-drop-target' : ''} ${isOverCurrent && !canDropCurrent ? 'is-drop-disabled' : ''}`}
            styles={{
                header: {
                    minHeight: 40,
                    padding: '0 14px',
                    borderBottom: '1px solid #eef2f7',
                    color: '#0f172a',
                    fontSize: 13,
                    fontWeight: 600,
                },
                body: {
                    minHeight: 96,
                    padding: 14,
                },
            }}
        >
            {children || <div className="editor-empty">拖入组件</div>}
        </AntdCard>
    </div>
}

export default Card;
