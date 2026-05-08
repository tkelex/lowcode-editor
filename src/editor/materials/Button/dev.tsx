import { Button as AntdButton } from 'antd';
import { CommonComponentProps } from '../../interface';
import { useDrag } from 'react-dnd';

const Button = ({id, type, text, styles}: CommonComponentProps) => {

  const [_, drag] = useDrag({
      type: 'Button',
      item: {
          type: 'Button',
          dragType: 'move',
          id: id
      }
  });

  return (
    <span ref={drag} data-component-id={id} style={styles} className="editor-component editor-inline-component rounded-[6px] p-[2px]">
      <AntdButton type={type}>{text}</AntdButton>
    </span>
  )
}

export default Button;
