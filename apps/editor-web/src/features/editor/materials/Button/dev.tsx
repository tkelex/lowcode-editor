import { Button as AntdButton } from 'antd';
import { useEffect, useRef } from 'react';
import { CommonComponentProps } from '../types';
import { useDrag } from 'react-dnd';
import { splitControlStyles } from '../style';

const Button = ({id, type, text, size, disabled, block, loading, danger, styles}: CommonComponentProps) => {
  const { shellStyles, controlStyles } = splitControlStyles(styles);
  const spanRef = useRef<HTMLSpanElement>(null);

  const [, drag] = useDrag({
      type: 'Button',
      item: {
          type: 'Button',
          dragType: 'move',
          id: id
      }
  });

  useEffect(() => {
    drag(spanRef);
  }, [drag]);

  return (
    <span ref={spanRef} data-component-id={id} style={shellStyles} className="editor-component editor-inline-component rounded-[6px]">
      <AntdButton
        type={type}
        size={size}
        disabled={disabled}
        block={block}
        loading={loading}
        danger={danger}
        style={controlStyles}
      >
        {text}
      </AntdButton>
    </span>
  )
}

export default Button;
