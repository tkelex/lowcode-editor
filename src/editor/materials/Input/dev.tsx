import { Input as AntdInput } from 'antd';
import { useDrag } from 'react-dnd';
import { CommonComponentProps } from '../../interface';

const Input = ({ id, name, placeholder, defaultValue, disabled, allowClear, styles }: CommonComponentProps) => {
    const [_, drag] = useDrag({
        type: name,
        item: {
            type: name,
            dragType: 'move',
            id,
        }
    });

    return <div ref={drag} data-component-id={id} style={styles} className="editor-component editor-field-shell">
        <AntdInput placeholder={placeholder} defaultValue={defaultValue} disabled={disabled} allowClear={allowClear} />
    </div>
}

export default Input;
