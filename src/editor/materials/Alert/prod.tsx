import { Alert as AntdAlert } from 'antd';
import { CommonComponentProps } from '../../interface';

const Alert = ({ id: _id, name: _name, type, message, description, showIcon, styles, ...restProps }: CommonComponentProps) => {
    return <div style={styles}>
        <AntdAlert {...restProps} type={type} message={message} description={description} showIcon={showIcon} closable={!!restProps.onClose} />
    </div>
}

export default Alert;
