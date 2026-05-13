import { Input as AntdInput } from 'antd';
import { CommonComponentProps } from '../../interface';
import { splitControlStyles } from '../styleSplit';

const Input = ({ id: _id, name: _name, children: _children, placeholder, defaultValue, disabled, allowClear, maxLength, styles, ...restProps }: CommonComponentProps) => {
    const { shellStyles, controlStyles } = splitControlStyles(styles);

    return <div style={shellStyles} className="inline-block min-w-[180px]">
        <AntdInput
            {...restProps}
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
