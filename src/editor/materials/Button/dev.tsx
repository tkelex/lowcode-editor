import { Button as AntdButton } from 'antd';
import { CommonComponentProps } from '../../interface';
import { useDrag } from 'react-dnd';
import { splitControlStyles } from '../styleSplit';

const Button = ({id, type, text, styles}: CommonComponentProps) => {
  const { shellStyles, controlStyles } = splitControlStyles(styles);

  const [_, drag] = useDrag({
      type: 'Button',
      item: {
          type: 'Button',
          dragType: 'move',
          id: id
      }
  });

  return (
    <span ref={drag} data-component-id={id} style={shellStyles} className="editor-component editor-inline-component rounded-[6px]">
      <AntdButton type={type} style={controlStyles}>{text}</AntdButton>
    </span>
  )
}

export default Button;
