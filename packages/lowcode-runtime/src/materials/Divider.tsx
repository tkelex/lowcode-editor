import { Divider as AntdDivider } from 'antd';
import type { CommonComponentProps } from '../types';

const Divider = ({ id: _id, name: _name, text, dashed, orientation, plain, styles, ...restProps }: CommonComponentProps) => {
    return <div {...restProps} style={styles} className="w-full">
        <AntdDivider dashed={dashed} orientation={orientation} plain={plain}>{text}</AntdDivider>
    </div>
}

export default Divider;
