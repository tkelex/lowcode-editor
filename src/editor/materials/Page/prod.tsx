import { CommonComponentProps } from "../../interface";

function Page({ children, styles }: CommonComponentProps) {
    return (
        <div
            className='min-h-[calc(100vh-60px)] p-[20px] box-border bg-white'
            style={{ ...styles }}
        >
            {children}
        </div>
    )
}

export default Page;