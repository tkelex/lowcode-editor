import { CommonComponentProps } from '../../interface';

const Container = ({ children, styles }: CommonComponentProps) => {
    return (
        <div
            style={styles}
            className="min-h-[80px] p-[20px] border border-dashed border-slate-300 box-border"
        >{children}</div>
    )
}

export default Container;