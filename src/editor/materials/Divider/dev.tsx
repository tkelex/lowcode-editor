import { Divider as AntdDivider } from 'antd';
import { useDrag } from 'react-dnd';
import { CommonComponentProps } from '../../interface';

const Divider = ({ id, name, text, dashed, orientation, plain, styles }: CommonComponentProps) => {
    const [_, drag] = useDrag({
        type: name,
        item: {
            type: name,
            dragType: 'move',
            id,
        }
    });

    return <div ref={drag} data-component-id={id} style={styles} className="editor-component w-full rounded-[6px] px-[8px] hover:bg-[#f8fafc]">
        <AntdDivider dashed={dashed} orientation={orientation} plain={plain}>{text}</AntdDivider>
    </div>
}

export default Divider;
