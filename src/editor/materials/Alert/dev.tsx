import { Alert as AntdAlert } from 'antd';
import { useDrag } from 'react-dnd';
import { CommonComponentProps } from '../../interface';

const Alert = ({ id, name, type, message, description, showIcon, styles }: CommonComponentProps) => {
    const [_, drag] = useDrag({
        type: name,
        item: {
            type: name,
            dragType: 'move',
            id,
        }
    });

    return <div ref={drag} data-component-id={id} style={styles} className="editor-component rounded-[8px]">
        <AntdAlert type={type} message={message} description={description} showIcon={showIcon} />
    </div>
}

export default Alert;
