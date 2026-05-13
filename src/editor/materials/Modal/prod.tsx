import { Modal as AntdModal } from 'antd';
import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { CommonComponentProps } from '../../interface';

type ModalProps = Omit<CommonComponentProps, 'ref'>;

export interface ModalRef {
    open: () => void
    close: () => void
}

const Modal: React.ForwardRefRenderFunction<ModalRef, ModalProps> = ({
  children,
  title,
  width,
  centered,
  maskClosable,
  onOk,
  onCancel,
  styles,
}, ref) => {

  const [open, setOpen] = useState(false);

  useImperativeHandle(ref, () => {
    return {
      open: () => {
        setOpen(true);
      },
      close: () => {
        setOpen(false);
      }
    }
  }, []);

  return (
    <AntdModal
      title={title}
      width={width}
      centered={centered}
      maskClosable={maskClosable}
      style={styles}
      open={open}
      onCancel={() => {
        onCancel && onCancel();
        setOpen(false);
      }}
      onOk={() => {
        onOk && onOk();
      }}
      destroyOnHidden
    >
      {children}
    </AntdModal>
  );
}

export default forwardRef(Modal);
