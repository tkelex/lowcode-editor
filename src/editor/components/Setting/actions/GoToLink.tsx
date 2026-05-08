import { useEffect, useState } from "react";
import { useComponetsStore } from "../../../stores/components";
import { Input, Typography } from "antd";
import { normalizeActionUrl } from "../../../events/normalize";

export interface GoToLinkConfig {
    actionType: 'url',
    args: {
        url: string
    }
}

export interface GoToLinkProps {
    value?: string
    defaultValue?: string
    onChange?: (config: GoToLinkConfig) => void
}

export function GoToLink(props: GoToLinkProps) {
    const { defaultValue, value: val, onChange } = props;

    const curComponentId = useComponetsStore((state) => state.curComponentId);
    const [value, setValue] = useState(defaultValue);

    useEffect(() => {
        setValue(val || defaultValue || '');
    }, [val, defaultValue]);

    function urlChange(value: string) {
        if (!curComponentId) return;

        setValue(value);

        onChange?.({
            actionType: 'url',
            args: {
                url: value.trim()
            }
        });
    }

    const normalizedUrl = normalizeActionUrl(value || '');

    return <div className='mt-[28px]'>
        <div className='mb-[8px] text-[13px] font-medium text-[#1f2937]'>跳转链接</div>
        <Input
            placeholder="例如 https://baidu.com、baidu.com 或 /publish/demo"
            onChange={(e) => { urlChange(e.target.value) }}
            value={value || ''}
        />
        <Typography.Text type="secondary" className="mt-[8px] block text-[12px]">
            未填写协议时会自动补全为 https://，站内路径请以 / 开头。
        </Typography.Text>
        {normalizedUrl && (
            <Typography.Text type="secondary" className="mt-[4px] block text-[12px]">
                实际跳转：{normalizedUrl}
            </Typography.Text>
        )}
    </div>
}
