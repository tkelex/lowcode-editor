import { Divider as AntdDivider } from 'antd';
import { CommonComponentProps } from '../../interface';

const Divider = ({ id: _id, name: _name, text, dashed, orientation, styles, ...restProps }: CommonComponentProps) => {
    return <div {...restProps} style={styles} className="w-full">
        <AntdDivider dashed={dashed} orientation={orientation}>{text}</AntdDivider>
    </div>
}

export default Divider;
