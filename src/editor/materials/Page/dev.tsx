import { CommonComponentProps } from "../../interface";
import { useMaterialDrop } from "../../hooks/useMaterialDrop";
import { COMMON_CHILDREN } from "../commonChildren";

function Page({ id, children, styles }: CommonComponentProps) {

    const {canDrop, canDropCurrent, isOverCurrent, drop } = useMaterialDrop([...COMMON_CHILDREN, 'Modal'], id);

    return (
        <div
            data-component-id={id}
            ref={drop}
            className={`editor-page box-border min-h-[calc(100vh-120px)] p-[28px] ${canDrop ? 'editor-drop-zone can-drop' : ''} ${canDropCurrent ? 'is-drop-target' : ''} ${isOverCurrent && !canDropCurrent ? 'is-drop-disabled' : ''}`}
            style={styles}
        >
            {children || <div className="editor-empty min-h-[260px]">从左侧拖拽物料到这里</div>}
        </div>
    )
}

export default Page;
