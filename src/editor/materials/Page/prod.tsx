import { CommonComponentProps } from "../../interface";

function Page({ children, styles, pageTitle, subTitle, showContent = true, showHeader = true }: CommonComponentProps) {
    return (
        <div
            className='min-h-[calc(100vh-60px)] p-[20px] box-border bg-white'
            style={{ ...styles }}
        >
            {showHeader && (pageTitle || subTitle) && (
                <header className="mb-[20px] border-b border-[#eef2f7] pb-[14px]">
                    {pageTitle && <h1 className="m-0 text-[20px] font-semibold leading-[30px] text-[#0f172a]">{pageTitle}</h1>}
                    {subTitle && <p className="m-0 mt-[4px] text-[13px] leading-[22px] text-[#64748b]">{subTitle}</p>}
                </header>
            )}
            {showContent ? children : null}
        </div>
    )
}

export default Page;
