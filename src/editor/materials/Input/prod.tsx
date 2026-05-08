import { Input as AntdInput } from 'antd';
import { CommonComponentProps } from '../../interface';

const Input = ({ id: _id, name: _name, children: _children, placeholder, defaultValue, disabled, allowClear, styles, ...restProps }: CommonComponentProps) => {
    return <div style={styles} className="inline-block min-w-[180px]">
        <AntdInput {...restProps} placeholder={placeholder} defaultValue={defaultValue} disabled={disabled} allowClear={allowClear} />
    </div>
}

export default Input;
