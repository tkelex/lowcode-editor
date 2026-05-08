import { Select as AntdSelect } from 'antd';
import { useMemo } from 'react';
import { CommonComponentProps } from '../../interface';

function toOptions(optionsText?: string) {
    return (optionsText || '')
        .split(',')
        .map(item => item.trim())
        .filter(Boolean)
        .map(item => ({ label: item, value: item }));
}

const Select = ({ id: _id, name: _name, placeholder, optionsText, disabled, styles, ...restProps }: CommonComponentProps) => {
    const options = useMemo(() => toOptions(optionsText), [optionsText]);

    return <div style={styles} className="inline-block min-w-[180px]">
        <AntdSelect {...restProps} placeholder={placeholder} options={options} disabled={disabled} className="w-full" />
    </div>
}

export default Select;
