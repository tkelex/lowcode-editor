import { Button as AntdButton } from 'antd';
import { CommonComponentProps } from '../../interface';

const Button = ({id: _id, name: _name, type, text, styles, ...props}: CommonComponentProps) => {
  return (
    <AntdButton type={type} style={styles} {...props}>{text}</AntdButton>
  )
}

export default Button;