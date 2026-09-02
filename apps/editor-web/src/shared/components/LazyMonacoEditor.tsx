import { Spin } from 'antd';
import { lazy, Suspense } from 'react';
import type { EditorProps, OnMount } from '@monaco-editor/react';

const MonacoEditor = lazy(() => import('@monaco-editor/react'));

export type LazyMonacoEditorProps = EditorProps;
export type LazyMonacoOnMount = OnMount;

export function LazyMonacoEditor(props: LazyMonacoEditorProps) {
  return <Suspense fallback={<div className="flex h-full min-h-[160px] items-center justify-center bg-white">
    <Spin size="small" />
  </div>}>
    <MonacoEditor {...props} />
  </Suspense>;
}
