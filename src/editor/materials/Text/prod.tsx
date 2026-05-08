import { Typography } from 'antd';
import { CommonComponentProps } from '../../interface';

const Text = ({ id: _id, name: _name, text, level, styles, ...restProps }: CommonComponentProps) => {
    return <Typography.Text
        {...restProps}
        style={{ display: 'inline-block', ...styles }}
        strong={level === 'strong'}
        italic={level === 'italic'}
    >
        {text}
    </Typography.Text>
}

export default Text;
