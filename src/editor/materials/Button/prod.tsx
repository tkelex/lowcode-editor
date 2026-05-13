import { Button as AntdButton } from 'antd';
import { CommonComponentProps } from '../../interface';
import { splitControlStyles } from '../styleSplit';

const Button = ({id: _id, name: _name, type, text, size, disabled, block, loading, danger, styles, ...props}: CommonComponentProps) => {
  const { shellStyles, controlStyles } = splitControlStyles(styles);

  return (
    <span style={shellStyles}>
      <AntdButton
        type={type}
        size={size}
        disabled={disabled}
        block={block}
        loading={loading}
        danger={danger}
        style={controlStyles}
        {...props}
      >
        {text}
      </AntdButton>
    </span>
  )
}

export default Button;
