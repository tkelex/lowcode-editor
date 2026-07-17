import { Input, Select } from "antd"
import type { ToastType } from "../../../events/types";
import { useComponetsStore } from "../../../stores/components";
import { useEffect, useState } from "react";

export interface ShowMessageConfig {
    actionType: 'toast',
    args: {
        msgType: ToastType
        msg: string
    }
}

export interface ShowMessageProps {
    value?: {
        type: ToastType
        text: string
    }
    defaultValue?: {
        type: ToastType
        text: string
    }
    onChange?: (config: ShowMessageConfig) => void
}

export function ShowMessage(props: ShowMessageProps) {
    const { value: val, defaultValue, onChange } = props;

    const curComponentId = useComponetsStore((state) => state.curComponentId);

    const [type, setType] = useState<ToastType>(defaultValue?.type || 'success');
    const [text, setText] = useState<string>(defaultValue?.text || '');

    useEffect(() => {
        if(val) {
            setType(val.type)
            setText(val.text)
        } else {
            setType(defaultValue?.type || 'success');
            setText(defaultValue?.text || '');
        }
    }, [val, defaultValue]);

    function messageTypeChange(value: ToastType) {
        if (!curComponentId) return;

        setType(value);

        onChange?.({
            actionType: 'toast',
            args: {
                msgType: value,
                msg: text
            }
        })
      }
    
    function messageTextChange(value: string) {
        if (!curComponentId) return;

        setText(value);

        onChange?.({
            actionType: 'toast',
            args: {
                msgType: type,
                msg: value
            }
        })
    }

    return <div className='mt-[24px] space-y-[16px]'>
        <div>
            <div className="mb-[8px] text-[13px] font-medium text-[#1f2937]">消息类型</div>
            <Select
                className="w-full"
                options={[
                    { label: '成功', value: 'success' },
                    { label: '失败', value: 'error' },
                    { label: '警告', value: 'warning' },
                    { label: '提示', value: 'info' },
                ]}
                onChange={(value) => { messageTypeChange(value) }}
                value={type}
            />
        </div>
        <div>
            <div className="mb-[8px] text-[13px] font-medium text-[#1f2937]">提示文本</div>
                <Input.TextArea
                    autoSize={{ minRows: 3, maxRows: 5 }}
                    placeholder="请输入事件触发后的提示内容"
                    onChange={(e) => { messageTextChange(e.target.value) }}
                    value={text}
                />
        </div>
    </div>
}
