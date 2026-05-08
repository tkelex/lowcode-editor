import { Switch as AntdSwitch } from 'antd';
import { CommonComponentProps } from '../../interface';

const Switch = ({ id: _id, name: _name, checked, disabled, checkedChildren, unCheckedChildren, styles, ...restProps }: CommonComponentProps) => {
    return <div style={styles} className="inline-block">
        <AntdSwitch {...restProps} defaultChecked={checked} disabled={disabled} checkedChildren={checkedChildren} unCheckedChildren={unCheckedChildren} />
    </div>
}

export default Switch;
