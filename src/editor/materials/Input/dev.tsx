import { Input as AntdInput } from 'antd';
import { useDrag } from 'react-dnd';
import { CommonComponentProps } from '../../interface';
import { splitControlStyles } from '../styleSplit';

const Input = ({ id, name, placeholder, defaultValue, disabled, allowClear, maxLength, styles }: CommonComponentProps) => {
    const { shellStyles, controlStyles } = splitControlStyles(styles);
    const [_, drag] = useDrag({
        type: name,
        item: {
            type: name,
            dragType: 'move',
            id,
        }
    });

    return <div ref={drag} data-component-id={id} style={shellStyles} className="editor-component editor-field-shell">
        <AntdInput
            style={controlStyles}
            styles={{ input: controlStyles }}
            placeholder={placeholder}
            defaultValue={defaultValue}
            disabled={disabled}
            allowClear={allowClear}
            maxLength={maxLength}
        />
    </div>
}

export default Input;
