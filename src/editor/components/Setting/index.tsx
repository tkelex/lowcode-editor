import { Empty, Input, Segmented, Space, Tag, Typography } from 'antd';
import { useState } from 'react';
import { useComponetsStore } from '../../stores/components';
import { ComponentAttr } from './ComponentAttr';
import { ComponentEvent } from './ComponentEvent';
import { ComponentStyle } from './ComponentStyle';

export function Setting() {

    const curComponentId = useComponetsStore((state) => state.curComponentId);
    const curComponent = useComponetsStore((state) => state.curComponent);

    const [key, setKey] = useState<string>('属性');
    const [keyword, setKeyword] = useState('');

    if (!curComponentId) {
      return <div className="flex h-full items-center justify-center bg-[#f8fafc] px-[24px]">
        <div className="w-full max-w-[240px] rounded-[8px] border border-dashed border-[#cbd5e1] bg-white px-[18px] py-[24px] text-center">
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="请选择画布中的组件" />
          <div className="mt-[8px] text-[12px] leading-[20px] text-[#64748b]">
            点击画布中的组件后，可以在这里配置属性、样式和事件。
          </div>
        </div>
      </div>
    }

    return <div className="flex h-full flex-col bg-[#f8fafc]">
        <div className="border-b border-[#e5e7eb] bg-white px-[12px] py-[12px]">
          <Space direction="vertical" size={10} className="w-full">
            <div className="flex min-w-0 items-center justify-between gap-[8px]">
              <div className="min-w-0">
                <Typography.Text strong className="block truncate text-[13px]">
                  {curComponent?.desc}
                </Typography.Text>
                <Typography.Text type="secondary" className="block truncate text-[12px]">
                  {curComponent?.name} #{curComponent?.id}
                </Typography.Text>
              </div>
              <Tag className="m-0 shrink-0" color="blue">{key}</Tag>
            </div>
            <Segmented value={key} onChange={setKey} block options={['属性', '样式', '事件']} />
            <Input.Search
              allowClear
              size="small"
              placeholder={`搜索${key}配置`}
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
          </Space>
        </div>
        <div className='min-h-0 flex-1 overflow-auto bg-white px-[14px] py-[16px]'>
            {
                key === '属性' && <ComponentAttr keyword={keyword} />
            }
            {
                key === '样式' && <ComponentStyle keyword={keyword} />
            }
            {
                key === '事件' && <ComponentEvent keyword={keyword} />
            }
        </div>
    </div>
}
