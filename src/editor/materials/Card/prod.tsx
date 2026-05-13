import { Card as AntdCard } from 'antd';
import { CommonComponentProps } from '../../interface';

const Card = ({ id: _id, name: _name, title, bordered, hoverable, children, styles, ...restProps }: CommonComponentProps) => {
    return <div {...restProps} style={styles}>
        <AntdCard title={title} bordered={bordered} hoverable={hoverable}>
            {children}
        </AntdCard>
    </div>
}

export default Card;
