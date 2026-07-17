import { Empty, Input } from 'antd';
import { type KeyboardEvent, useState } from 'react';
import { useComponetsStore } from '../../stores/components';
import { ComponentAttr } from './ComponentAttr';
import { ComponentEvent } from './ComponentEvent';
import { ComponentStyle } from './ComponentStyle';
import '../../settingPanel.css';

const settingTabs = [
    { key: 'attr', label: '属性' },
    { key: 'style', label: '外观' },
    { key: 'event', label: '事件' },
] as const;

type SettingTabKey = typeof settingTabs[number]['key'];

export function Setting() {

    const curComponentId = useComponetsStore((state) => state.curComponentId);
    const curComponent = useComponetsStore((state) => state.curComponent);

    const [key, setKey] = useState<SettingTabKey>('attr');
    const [keyword, setKeyword] = useState('');
    const activeTab = settingTabs.find((item) => item.key === key) || settingTabs[0];

    function switchTab(nextKey: SettingTabKey) {
      setKey(nextKey);
      setKeyword('');
    }

    function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        switchTab(settingTabs[(index + 1) % settingTabs.length].key);
      }

      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        switchTab(settingTabs[(index - 1 + settingTabs.length) % settingTabs.length].key);
      }

      if (event.key === 'Home') {
        event.preventDefault();
        switchTab(settingTabs[0].key);
      }

      if (event.key === 'End') {
        event.preventDefault();
        switchTab(settingTabs[settingTabs.length - 1].key);
      }
    }

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
            <div className="setting-component-header">
              <div className="min-w-0">
                <div className="setting-component-title" title={curComponent?.desc || curComponent?.name}>
                  {curComponent?.desc || curComponent?.name || '未命名组件'}
                </div>
                <div className="setting-component-subtitle" title={`${curComponent?.name || ''} #${curComponentId}`}>
                  <span>{curComponent?.name || 'Unknown'}</span>
                  <span className="setting-component-id">#{curComponentId}</span>
                </div>
              </div>
            </div>
            <div className="setting-panel-tabbar" role="tablist" aria-label="组件配置">
              {settingTabs.map((item, index) => (
                <button
                  key={item.key}
                  type="button"
                  role="tab"
                  aria-selected={key === item.key}
                  tabIndex={key === item.key ? 0 : -1}
                  className={`setting-panel-tab ${key === item.key ? 'is-active' : ''}`}
                  onClick={() => switchTab(item.key)}
                  onKeyDown={(event) => handleTabKeyDown(event, index)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="setting-panel-search">
              <Input.Search
                allowClear
                size="small"
                placeholder={`搜索${activeTab.label}配置`}
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
              />
            </div>
        </div>
        <div className='setting-panel-body'>
          <div className="setting-panel-content">
            {
                key === 'attr' && <ComponentAttr keyword={keyword} />
            }
            {
                key === 'style' && <ComponentStyle keyword={keyword} />
            }
            {
                key === 'event' && <ComponentEvent keyword={keyword} />
            }
          </div>
        </div>
    </div>
}
