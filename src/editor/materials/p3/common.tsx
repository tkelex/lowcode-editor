import React, { useEffect, useRef } from 'react';
import { useDrag } from 'react-dnd';
import { useMaterialDrop } from '../../hooks/useMaterialDrop';
import { CommonComponentProps } from '../../interface';
import { COMMON_CHILDREN } from '../commonChildren';

interface DropShellProps extends CommonComponentProps {
  accept?: string[];
  className?: string;
  emptyText?: string;
  children?: React.ReactNode;
}

function useEditorDrag(name: string, id: number, ref: React.RefObject<HTMLElement>) {
  const [, drag] = useDrag({
    type: name,
    item: {
      type: name,
      dragType: 'move',
      id,
    },
  });

  useEffect(() => {
    drag(ref);
  }, [drag, ref]);
}

export function DraggableBlock({ id, name, styles, className = '', children }: CommonComponentProps & { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEditorDrag(name, id, ref);

  return <div ref={ref} data-component-id={id} style={styles} className={`editor-component ${className}`}>
    {children}
  </div>;
}

export function DraggableInline({ id, name, styles, className = '', children }: CommonComponentProps & { className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEditorDrag(name, id, ref);

  return <span ref={ref} data-component-id={id} style={styles} className={`editor-component editor-inline-component ${className}`}>
    {children}
  </span>;
}

export function DropShell({ id, name, styles, className = '', accept = COMMON_CHILDREN, emptyText = '拖入组件', children }: DropShellProps) {
  const { canDrop, canDropCurrent, isOverCurrent, drop } = useMaterialDrop(accept, id);
  const ref = useRef<HTMLDivElement>(null);
  useEditorDrag(name, id, ref);

  useEffect(() => {
    drop(ref);
  }, [drop]);

  return <div
    ref={ref}
    data-component-id={id}
    style={styles}
    className={`editor-component editor-drop-zone min-h-[88px] ${className} ${canDrop ? 'can-drop' : ''} ${canDropCurrent ? 'is-drop-target' : ''} ${isOverCurrent && !canDropCurrent ? 'is-drop-disabled' : ''}`}
  >
    {children || <div className="editor-empty">{emptyText}</div>}
  </div>;
}

