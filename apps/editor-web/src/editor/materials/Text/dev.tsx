import { Typography } from 'antd';
import { useEffect, useRef } from 'react';
import { useDrag } from 'react-dnd';
import { CommonComponentProps } from '../../interface';

const Text = ({ id, name, text, level, copyable, ellipsis, styles }: CommonComponentProps) => {
    const textRef = useRef<HTMLSpanElement>(null);
    const [, drag] = useDrag({
        type: name,
        item: {
            type: name,
            dragType: 'move',
            id,
        }
    });

    useEffect(() => {
        drag(textRef);
    }, [drag]);

    return <Typography.Text
        ref={textRef}
        data-component-id={id}
        style={{ display: 'inline-block', ...styles }}
        className="editor-component rounded-[5px] px-[6px] py-[3px] hover:bg-[#eff6ff]"
        strong={level === 'strong'}
        italic={level === 'italic'}
        copyable={copyable}
        ellipsis={ellipsis}
    >
        {text}
    </Typography.Text>
}

export default Text;
