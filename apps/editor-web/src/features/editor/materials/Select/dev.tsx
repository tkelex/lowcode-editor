import { Select as AntdSelect } from 'antd';
import { useEffect, useMemo, useRef } from 'react';
import { useDrag } from 'react-dnd';
import { CommonComponentProps } from '../types';
import { splitControlStyles } from '../style';

function toOptions(optionsText?: string) {
    return (optionsText || '')
        .split(',')
        .map(item => item.trim())
        .filter(Boolean)
        .map(item => ({ label: item, value: item }));
}

const Select = ({ id, name, placeholder, optionsText, defaultValue, disabled, allowClear, mode, styles }: CommonComponentProps) => {
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
    const options = useMemo(() => toOptions(optionsText), [optionsText]);

    useEffect(() => {
        drag(divRef);
    }, [drag]);

    return <div ref={divRef} data-component-id={id} style={shellStyles} className="editor-component editor-field-shell">
        <AntdSelect
            style={controlStyles}
            placeholder={placeholder}
            options={options}
            defaultValue={defaultValue}
            disabled={disabled}
            allowClear={allowClear}
            mode={mode || undefined}
            className="w-full"
        />
    </div>
}

export default Select;
