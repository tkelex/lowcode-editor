import { CommonComponentProps } from '../../interface';

const Container = ({ id: _id, name: _name, children, styles, title, visible = true, direction = 'vertical', ...restProps }: CommonComponentProps) => {
    if (!visible) {
        return null;
    }

    return (
        <div
            {...restProps}
            style={{
                ...styles,
                display: 'flex',
                flexDirection: direction === 'horizontal' ? 'row' : 'column',
                flexWrap: direction === 'horizontal' ? 'wrap' : undefined,
                gap: direction === 'horizontal' ? 12 : undefined,
            }}
            className="min-h-[80px] p-[20px] border border-dashed border-slate-300 box-border"
        >
            {title && <div className="mb-[8px] w-full text-[13px] font-semibold text-[#0f172a]">{title}</div>}
            {children}
        </div>
    )
}

export default Container;
