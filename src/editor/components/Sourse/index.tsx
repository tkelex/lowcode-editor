import MonacoEditor, { type OnMount } from '@monaco-editor/react'
import { useComponetsStore } from '../../stores/components';

export function Source() {
    const {components} = useComponetsStore();

    const handleEditorMount: OnMount = (editor, monaco) => {//OnMount：编辑器挂载完成的回调函数类型
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyJ, () => {
          editor.getAction('editor.action.formatDocument')?.run()
      });
    }

    return <MonacoEditor
        height={'100%'}
        path='components.json'
        language='json'
        onMount={handleEditorMount}
        value={JSON.stringify(components, null, 2)}
        options={
            {
                fontSize: 14,
                scrollBeyondLastLine: false,
                minimap: {
                  enabled: false,
                },
                scrollbar: {
                  verticalScrollbarSize: 6,
                  horizontalScrollbarSize: 6,
                }
            }
        }
    />
}
