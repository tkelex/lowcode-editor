import { useMaterialDrop } from '../../hooks/useMaterialDrop';
import { CommonComponentProps } from '../../interface';
import { COMMON_CHILDREN } from '../commonChildren';

function Modal({ id, children, title, width, centered, maskClosable, styles }: CommonComponentProps) {

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
                <span className="rounded-[4px] bg-[#eff6ff] px-[6px] py-[2px] text-[11px] font-medium text-[#2563eb]">
                    Modal {width ? `${width}px` : ''}
                </span>
            </div>
            {(centered || maskClosable) && (
                <div className="border-b border-[#eef2f7] bg-[#f8fafc] px-[12px] py-[6px] text-[11px] text-[#64748b]">
                    {centered ? '居中显示' : ''}
                    {centered && maskClosable ? ' / ' : ''}
                    {maskClosable ? '点击遮罩关闭' : ''}
                </div>
            )}
            <div className="editor-panel-body">
                {children || <div className="editor-empty">拖入组件</div>}
            </div>
        </div>
    );
}

export default Modal;
