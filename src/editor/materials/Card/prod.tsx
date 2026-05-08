import { Card as AntdCard } from 'antd';
import { CommonComponentProps } from '../../interface';

const Card = ({ id: _id, name: _name, title, bordered, children, styles, ...restProps }: CommonComponentProps) => {
    return <div {...restProps} style={styles}>
        <AntdCard title={title} bordered={bordered}>
            {children}
        </AntdCard>
    </div>
}

export default Card;
