import { Button, Drawer, List, Popconfirm, Space, Tag, Typography, message } from 'antd';
import dayjs from 'dayjs';
import { useState } from 'react';
import { shallow } from 'zustand/shallow';
import { deletePageVersion, listPageVersions, rollbackPage, updatePage } from '../../../api/pages';
import { PageVersion } from '../../../api/types';
import { Component, useComponetsStore } from '../../stores/components';
import { PerfPanel } from '../PerfPanel';

interface HeaderProps {
  pageId?: number;
  onBack?: () => void;
}

export function Header({ pageId, onBack }: HeaderProps) {
  const [saving, setSaving] = useState(false);
  const [versionDrawerOpen, setVersionDrawerOpen] = useState(false);
  const [versions, setVersions] = useState<PageVersion[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [rollingBack, setRollingBack] = useState(false);
  const [deletingVersionId, setDeletingVersionId] = useState<number | null>(null);

  const { mode, components, setMode, setCurComponentId, setComponents } = useComponetsStore((state) => ({
    mode: state.mode,
    components: state.components,
    setMode: state.setMode,
    setCurComponentId: state.setCurComponentId,
    setComponents: state.setComponents,
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
      message.success('页面已保存，并生成历史版本');
      if (versionDrawerOpen) {
        await loadVersions();
      }
    } catch (error) {
      message.error('保存失败，请稍后重试');
    } finally {
      setSaving(false);
    }
  }

  async function loadVersions() {
    if (!pageId) return;

    setLoadingVersions(true);
    try {
      const data = await listPageVersions(pageId);
      setVersions(data);
    } catch (error) {
      message.error('加载版本历史失败');
    } finally {
      setLoadingVersions(false);
    }
  }

  async function openVersionDrawer() {
    if (!pageId) {
      message.warning('当前页面未绑定后端页面，无法查看版本历史');
      return;
    }

    setVersionDrawerOpen(true);
    await loadVersions();
  }

  async function handleRollback(version: PageVersion) {
    if (!pageId) return;

    setRollingBack(true);
    try {
      const page = await rollbackPage(pageId, version.id);
      setComponents(page.schema.components as Component[]);
      message.success(`已回滚到 v${version.versionNo}，并生成新版本`);
      await loadVersions();
    } catch (error) {
      message.error('回滚失败，请稍后重试');
    } finally {
      setRollingBack(false);
    }
  }

  async function handleDeleteVersion(version: PageVersion) {
    if (!pageId) return;

    setDeletingVersionId(version.id);
    try {
      await deletePageVersion(pageId, version.id);
      message.success(`已删除 v${version.versionNo} 版本记录`);
      await loadVersions();
    } catch (error) {
      message.error('删除版本记录失败，请稍后重试');
    } finally {
      setDeletingVersionId(null);
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
          {mode === 'edit' && <Button onClick={openVersionDrawer}>版本历史</Button>}
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

      <Drawer
        title="版本历史"
        open={versionDrawerOpen}
        width={420}
        onClose={() => setVersionDrawerOpen(false)}
        extra={<Button onClick={loadVersions} loading={loadingVersions}>刷新</Button>}
      >
        <List
          loading={loadingVersions}
          dataSource={versions}
          locale={{ emptyText: '暂无历史版本，请先保存页面' }}
          renderItem={(version) => (
            <List.Item
              actions={[
                <Popconfirm
                  key="rollback"
                  title={`确认回滚到 v${version.versionNo}？`}
                  description="当前页面会恢复为该版本，系统会同时生成一条新的回滚版本。"
                  okText="回滚"
                  cancelText="取消"
                  onConfirm={() => void handleRollback(version)}
                >
                  <Button type="link" loading={rollingBack}>回滚</Button>
                </Popconfirm>,
                <Popconfirm
                  key="delete"
                  title={`确认删除 v${version.versionNo}？`}
                  description="删除后该历史版本不可再回滚，当前页面内容不会受影响。"
                  okText="删除"
                  cancelText="取消"
                  okButtonProps={{ danger: true }}
                  onConfirm={() => void handleDeleteVersion(version)}
                >
                  <Button type="link" danger loading={deletingVersionId === version.id}>删除</Button>
                </Popconfirm>,
              ]}
            >
              <List.Item.Meta
                title={<Space>
                  <Typography.Text strong>v{version.versionNo}</Typography.Text>
                  <Tag color={version.source === 'rollback' ? 'purple' : 'blue'}>
                    {version.source === 'rollback' ? '回滚' : '保存'}
                  </Tag>
                </Space>}
                description={<Space direction="vertical" size={2}>
                  <span>{dayjs(version.createdAt).format('YYYY-MM-DD HH:mm:ss')}</span>
                  {version.message && <Typography.Text type="secondary">{version.message}</Typography.Text>}
                </Space>}
              />
            </List.Item>
          )}
        />
      </Drawer>
    </div>
  )
}
