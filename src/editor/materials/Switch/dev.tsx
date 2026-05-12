import { Switch as AntdSwitch } from 'antd';
import { useDrag } from 'react-dnd';
import { CommonComponentProps } from '../../interface';
import { splitControlStyles } from '../styleSplit';

const Switch = ({ id, name, checked, disabled, checkedChildren, unCheckedChildren, styles }: CommonComponentProps) => {
    const { shellStyles, controlStyles } = splitControlStyles(styles);
    const [_, drag] = useDrag({
        type: name,
        item: {
            type: name,
            dragType: 'move',
            id,
        }
    });

    return <div ref={drag} data-component-id={id} style={shellStyles} className="editor-component editor-inline-component rounded-[6px] p-[4px]">
        <AntdSwitch style={controlStyles} defaultChecked={checked} disabled={disabled} checkedChildren={checkedChildren} unCheckedChildren={unCheckedChildren} />
    </div>
}

export default Switch;
