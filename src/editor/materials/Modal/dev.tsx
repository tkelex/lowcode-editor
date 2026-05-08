import { useMaterialDrop } from '../../hooks/useMaterialDrop';
import { CommonComponentProps } from '../../interface';
import { COMMON_CHILDREN } from '../commonChildren';

function Modal({ id, children, title, styles }: CommonComponentProps) {

    const {canDrop, canDropCurrent, isOverCurrent, drop } = useMaterialDrop(COMMON_CHILDREN, id);

    return (
        <div 
            ref={drop}
            style={styles}
            data-component-id={id}  
            className={`editor-component editor-panel editor-drop-zone min-h-[140px] ${canDrop ? 'can-drop' : ''} ${canDropCurrent ? 'is-drop-target' : ''} ${isOverCurrent && !canDropCurrent ? 'is-drop-disabled' : ''}`}
        >
            <div className="editor-panel-header">
                <span>{title}</span>
                <span className="rounded-[4px] bg-[#eff6ff] px-[6px] py-[2px] text-[11px] font-medium text-[#2563eb]">Modal</span>
            </div>
            <div className="editor-panel-body">
                {children || <div className="editor-empty">拖入组件</div>}
            </div>
        </div>
    );
}

export default Modal;
