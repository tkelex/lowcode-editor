import { Image as AntdImage } from 'antd';
import { useEffect, useRef } from 'react';
import { useDrag } from 'react-dnd';
import { CommonComponentProps } from '../types';

const Image = ({ id, name, src, alt, width, height, preview, fallback, styles }: CommonComponentProps) => {
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

    return <div ref={divRef} data-component-id={id} style={styles} className="editor-component editor-inline-component overflow-hidden rounded-[8px] border border-[#e2e8f0] bg-white p-[3px] shadow-sm">
        <AntdImage
            src={src}
            alt={alt}
            width={width}
            height={height}
            preview={preview}
            fallback={fallback}
            style={{ borderRadius: 6, objectFit: styles?.objectFit || 'cover' }}
        />
    </div>
}

export default Image;
