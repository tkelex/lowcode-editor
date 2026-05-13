import { Alert as AntdAlert } from 'antd';
import { CommonComponentProps } from '../../interface';
import { splitControlStyles } from '../styleSplit';

const Alert = ({ id: _id, name: _name, type, message, description, showIcon, closable, styles, ...restProps }: CommonComponentProps) => {
    const { shellStyles, controlStyles } = splitControlStyles(styles);

    return <div style={shellStyles}>
        <AntdAlert {...restProps} style={controlStyles} type={type} message={message} description={description} showIcon={showIcon} closable={closable || !!restProps.onClose} />
    </div>
}

export default Alert;
