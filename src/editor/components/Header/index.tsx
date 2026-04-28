import { Button, Space, message } from 'antd';
import { useState } from 'react';
import { shallow } from 'zustand/shallow';
import { updatePage } from '../../../api/pages';
import { useComponetsStore } from '../../stores/components';
import { PerfPanel } from '../PerfPanel';

interface HeaderProps {
  pageId?: number;
  onBack?: () => void;
}

export function Header({ pageId, onBack }: HeaderProps) {
  const [saving, setSaving] = useState(false);

  const { mode, components, setMode, setCurComponentId } = useComponetsStore((state) => ({
    mode: state.mode,
    components: state.components,
    setMode: state.setMode,
    setCurComponentId: state.setCurComponentId,
  }), shallow);

  async function handleSave() {
    if (!pageId) {
      message.warning('当前页面未绑定后端页面，无法保存');
      return;
    }

    setSaving(true);
    try {
      await updatePage(pageId, {
        schema: {
          schemaVersion: '1.0.0',
          pageId,
          components,
          metadata: {
            updatedAt: new Date().toISOString(),
          },
        },
      });
      message.success('页面已保存');
    } catch (error) {
      message.error('保存失败，请稍后重试');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className='w-[100%] h-[100%]'>
      <div className='h-[50px] flex justify-between items-center px-[20px]'>
        <Space>
          {onBack && <Button onClick={onBack}>返回项目</Button>}
          <div>低代码编辑器</div>
        </Space>
        <Space>
          <PerfPanel />
          {mode === 'edit' && <Button loading={saving} onClick={handleSave}>保存</Button>}
          {mode === 'edit' && (
            <Button
                onClick={() => {
                    setMode('preview');
                    setCurComponentId(null);
                }}
                type='primary'
            >
                预览
            </Button>
          )}
          {mode === 'preview' && (
            <Button
              onClick={() => { setMode('edit') }}
              type='primary'
            >
              退出预览
            </Button>
          )}
        </Space>
      </div>
    </div>
  )
}
