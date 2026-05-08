import { CommonComponentProps } from '../../interface';

const Container = ({ id: _id, name: _name, children, styles, ...restProps }: CommonComponentProps) => {
    return (
        <div
            {...restProps}
            style={styles}
            className="min-h-[80px] p-[20px] border border-dashed border-slate-300 box-border"
        >{children}</div>
    )
}

export default Container;