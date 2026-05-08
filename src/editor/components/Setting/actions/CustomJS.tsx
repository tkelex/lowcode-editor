import { useEffect, useState } from "react";
import { useComponetsStore } from "../../../stores/components";
import { Typography } from "antd";
import { LazyMonacoEditor, type LazyMonacoOnMount } from "../../../../shared/components/LazyMonacoEditor";

export interface CustomJSConfig {
    actionType: 'custom',
    args: {
        script: string
    }
}

export interface CustomJSProps {
    value?: string
    defaultValue?: string
    onChange?: (config: CustomJSConfig) => void
}

export function CustomJS(props: CustomJSProps) {
    const { value: val, defaultValue, onChange } = props;

    const curComponentId = useComponetsStore((state) => state.curComponentId);
    const [value, setValue] = useState(defaultValue);

    useEffect(() => {
        setValue(val || defaultValue || '');
    }, [val, defaultValue]);

    function codeChange(value?: string) {
        if (!curComponentId) return;

        setValue(value);

        onChange?.({
            actionType: 'custom',
            args: {
                script: value!
            }
        })
    }

    const handleEditorMount: LazyMonacoOnMount = (editor, monaco) => {
        editor.focus();

        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyJ, () => {
            editor.getAction('editor.action.formatDocument')?.run()
        });
    }

    return <div className='mt-[24px]'>
        <div className="mb-[8px] text-[13px] font-medium text-[#1f2937]">自定义 JS</div>
        <Typography.Text type="secondary" className="mb-[8px] block text-[12px]">
            可用变量：context、event、args、doAction。常用数据：event.value、event.checked、event.values、event.httpResponse。
        </Typography.Text>
        <div className="overflow-hidden rounded-[6px] border border-[#e5e7eb]">
                <LazyMonacoEditor
                    width={'100%'}
                    height={'360px'}
                    path='action.js'
                    language='javascript'
                    onMount={handleEditorMount}
                    onChange={codeChange}
                    value={value}
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
                            },
                        }
                    }
                />
        </div>
    </div>
}
