import { Switch as AntdSwitch } from 'antd';
import { useEffect, useRef } from 'react';
import { useDrag } from 'react-dnd';
import { CommonComponentProps } from '../types';
import { splitControlStyles } from '../style';

const Switch = ({ id, name, checked, disabled, checkedChildren, unCheckedChildren, styles }: CommonComponentProps) => {
    const { shellStyles, controlStyles } = splitControlStyles(styles);
    const divRef = useRef<HTMLDivElement>(null);
    const [, drag] = useDrag({
        type: name,
        item: {
            type: name,
            dragType: 'move',
            id,
        }
    });

    useEffect(() => {
        drag(divRef);
    }, [drag]);

    return <div ref={divRef} data-component-id={id} style={shellStyles} className="editor-component editor-inline-component rounded-[6px] p-[4px]">
        <AntdSwitch style={controlStyles} checked={checked} disabled={disabled} checkedChildren={checkedChildren} unCheckedChildren={unCheckedChildren} />
    </div>
}

export default Switch;
