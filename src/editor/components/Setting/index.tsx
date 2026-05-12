import { Empty, Input, Tabs } from 'antd';
import { useState } from 'react';
import { useComponetsStore } from '../../stores/components';
import { ComponentAttr } from './ComponentAttr';
import { ComponentEvent } from './ComponentEvent';
import { ComponentStyle } from './ComponentStyle';
import '../../settingPanel.css';

export function Setting() {

    const curComponentId = useComponetsStore((state) => state.curComponentId);

    const [key, setKey] = useState<string>('属性');
    const [keyword, setKeyword] = useState('');

    if (!curComponentId) {
      return <div className="setting-panel flex h-full items-center justify-center px-[24px]">
        <div className="w-full max-w-[240px] rounded-[4px] border border-dashed border-[#cbd5e1] bg-white px-[18px] py-[24px] text-center">
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="请选择画布中的组件" />
          <div className="mt-[8px] text-[12px] leading-[20px] text-[#64748b]">
            点击画布中的组件后，可以在这里配置属性、样式和事件。
          </div>
        </div>
      </div>
    }

    return <div className="setting-panel flex h-full flex-col">
        <div className="setting-panel-header">
            <Tabs
              className="setting-panel-tabs"
              activeKey={key}
              size="small"
              centered
              items={['属性', '样式', '事件'].map((item) => ({ key: item, label: item }))}
              onChange={setKey}
            />
            <div className="setting-panel-search">
              <Input.Search
                allowClear
                size="small"
                placeholder={`搜索${key}配置`}
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
              />
            </div>
        </div>
        <div className='setting-panel-body'>
          <div className="setting-panel-content">
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
    </div>
}
