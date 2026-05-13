import { Alert as AntdAlert } from 'antd';
import { useDrag } from 'react-dnd';
import { CommonComponentProps } from '../../interface';
import { splitControlStyles } from '../styleSplit';

const Alert = ({ id, name, type, message, description, showIcon, closable, styles }: CommonComponentProps) => {
    const { shellStyles, controlStyles } = splitControlStyles(styles);
    const [_, drag] = useDrag({
        type: name,
        item: {
            type: name,
            dragType: 'move',
            id,
        }
    });

    return <div ref={drag} data-component-id={id} style={shellStyles} className="editor-component rounded-[8px]">
        <AntdAlert style={controlStyles} type={type} message={message} description={description} showIcon={showIcon} closable={closable} />
    </div>
}

export default Alert;
