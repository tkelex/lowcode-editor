import { CommonComponentProps } from "../../interface";
import { useMaterialDrop } from "../../hooks/useMaterialDrop";
import { COMMON_CHILDREN } from "../commonChildren";

function Page({
    id,
    children,
    styles,
    pageTitle,
    subTitle,
    showContent = true,
    showHeader = true,
    showToolbar = true,
    showSidebar = true,
    showControlTips,
    sidebarResizable,
    sidebarFixed,
    pullRefresh,
}: CommonComponentProps) {

    const {canDrop, canDropCurrent, isOverCurrent, drop } = useMaterialDrop([...COMMON_CHILDREN, 'Modal'], id);
    const hasHeader = showHeader && (pageTitle || subTitle || showToolbar || showSidebar);

    return (
        <div
            data-component-id={id}
            ref={drop}
            className={`editor-page editor-page-drop-zone box-border min-h-[calc(100vh-120px)] p-[28px] ${canDrop ? 'can-drop' : ''} ${canDropCurrent ? 'is-drop-target' : ''} ${isOverCurrent && !canDropCurrent ? 'is-drop-disabled' : ''}`}
            style={styles}
        >
            {hasHeader && (
                <div className="editor-page-config-header">
                    <div className="min-w-0">
                        {pageTitle && <div className="editor-page-config-title">{pageTitle}</div>}
                        {subTitle && <div className="editor-page-config-subtitle">{subTitle}</div>}
                    </div>
                    <div className="editor-page-config-badges">
                        {showToolbar && <span>工具栏</span>}
                        {showSidebar && <span>{sidebarFixed ? '固定边栏' : '边栏'}</span>}
                        {showSidebar && sidebarResizable && <span>边栏可调</span>}
                        {showControlTips && <span>控件提示</span>}
                        {pullRefresh && <span>下拉刷新</span>}
                    </div>
                </div>
            )}
            {showContent
                ? (children || <div className="editor-empty min-h-[260px]">从左侧拖拽物料到这里</div>)
                : <div className="editor-empty min-h-[160px]">内容区已隐藏</div>}
        </div>
    )
}

export default Page;
