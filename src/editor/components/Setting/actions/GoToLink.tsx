import { useEffect, useState } from "react";
import { useComponetsStore } from "../../../stores/components";
import { Input, Segmented, Typography } from "antd";
import { normalizeActionUrl } from "../../../events/normalize";

export interface GoToLinkConfig {
    actionType: 'url',
    args: {
        url: string
        blank?: boolean
    }
}

export interface GoToLinkProps {
    value?: {
        url?: string
        blank?: boolean
    }
    defaultValue?: string
    onChange?: (config: GoToLinkConfig) => void
}

export function GoToLink(props: GoToLinkProps) {
    const { defaultValue, value: val, onChange } = props;

    const curComponentId = useComponetsStore((state) => state.curComponentId);
    const [value, setValue] = useState(defaultValue);
    const [blank, setBlank] = useState(false);

    useEffect(() => {
        setValue(val?.url || defaultValue || '');
        setBlank(Boolean(val?.blank));
    }, [val, defaultValue]);

    function emit(nextUrl = value || '', nextBlank = blank) {
        if (!curComponentId) return;

        onChange?.({
            actionType: 'url',
            args: {
                url: nextUrl.trim(),
                ...(nextBlank ? { blank: true } : {}),
            }
        });
    }

    function urlChange(value: string) {
        setValue(value);
        emit(value, blank);
    }

    const normalizedUrl = normalizeActionUrl(value || '');

    return <div className='mt-[28px]'>
        <div className='mb-[8px] text-[13px] font-medium text-[#1f2937]'>跳转链接</div>
        <Input
            placeholder="例如 https://baidu.com、baidu.com 或 /publish/demo"
            onChange={(e) => { urlChange(e.target.value) }}
            value={value || ''}
        />
        <div className='mb-[8px] mt-[16px] text-[13px] font-medium text-[#1f2937]'>打开方式</div>
        <Segmented
            block
            value={blank ? 'blank' : 'self'}
            options={[
                { label: '当前窗口', value: 'self' },
                { label: '新窗口', value: 'blank' },
            ]}
            onChange={(nextTarget) => {
                const nextBlank = nextTarget === 'blank';
                setBlank(nextBlank);
                emit(value || '', nextBlank);
            }}
        />
        <Typography.Text type="secondary" className="mt-[8px] block text-[12px]">
            未填写协议时会自动补全为 https://，站内路径请以 / 开头。
        </Typography.Text>
        {normalizedUrl && (
            <Typography.Text type="secondary" className="mt-[4px] block text-[12px]">
                实际跳转：{normalizedUrl} / {blank ? '新窗口' : '当前窗口'}
            </Typography.Text>
        )}
    </div>
}
