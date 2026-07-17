import { type editor } from 'monaco-editor'
import { LazyMonacoEditor, type LazyMonacoEditorProps, type LazyMonacoOnMount } from '../../../shared/components/LazyMonacoEditor'

export interface EditorFile {
    name: string
    value: string
    language: string
}

interface Props {
    value: string
    onChange?: LazyMonacoEditorProps['onChange']
    options?: editor.IStandaloneEditorConstructionOptions
}

export default function CssEditor(props: Props) {

    const {
        value,
        onChange,
        options
    } = props;

    const handleEditorMount: LazyMonacoOnMount = (editor, monaco) => {
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyJ, () => {
          editor.getAction('editor.action.formatDocument')?.run()
      });
    }

    return <LazyMonacoEditor
        height={'100%'}
        path='component.css'
        language='css'
        onMount={handleEditorMount}
        onChange={onChange}
        value={value}
        options={
            {
                automaticLayout: true,
                fixedOverflowWidgets: true,
                fontSize: 14,
                scrollBeyondLastLine: false,
                minimap: {
                  enabled: false,
                },
                scrollbar: {
                  verticalScrollbarSize: 6,
                  horizontalScrollbarSize: 6,
                },
                ...options
            }
        }
        
    />
}
