import { Switch as AntdSwitch } from 'antd';
import { useDrag } from 'react-dnd';
import { CommonComponentProps } from '../../interface';

const Switch = ({ id, name, checked, disabled, checkedChildren, unCheckedChildren, styles }: CommonComponentProps) => {
    const [_, drag] = useDrag({
        type: name,
        item: {
            type: name,
            dragType: 'move',
            id,
        }
    });

    return <div ref={drag} data-component-id={id} style={styles} className="editor-component editor-inline-component rounded-[6px] p-[4px]">
        <AntdSwitch defaultChecked={checked} disabled={disabled} checkedChildren={checkedChildren} unCheckedChildren={unCheckedChildren} />
    </div>
}

export default Switch;
