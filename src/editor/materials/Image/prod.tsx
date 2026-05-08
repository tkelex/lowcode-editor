import { Image as AntdImage } from 'antd';
import { CommonComponentProps } from '../../interface';

const Image = ({ id: _id, name: _name, src, alt, width, height, preview, styles, ...restProps }: CommonComponentProps) => {
    return <AntdImage
        {...restProps}
        src={src}
        alt={alt}
        width={width}
        height={height}
        preview={preview}
        style={{ objectFit: 'cover', ...styles }}
    />
}

export default Image;
