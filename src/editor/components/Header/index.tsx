import { Button, Drawer, List, Popconfirm, Space, Tag, Tooltip, Typography, message } from 'antd';
import { BugOutlined, RedoOutlined, UndoOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useState } from 'react';
import { shallow } from 'zustand/shallow';
import { CURRENT_SCHEMA_VERSION, migratePageSchema } from '../../../../packages/lowcode-schema/src';
import type { LowcodeComponentSchema, LowcodePageSchema } from '../../../../packages/lowcode-schema/src';
import { deletePageVersion, listPageVersions, publishPage, rollbackPage, updatePage } from '../../../shared/api/pages';
import { PageVersion, ProjectRole } from '../../../shared/api/types';
import { assertValidComponentTree } from '../../schema/validateComponents';
import { useComponentConfigStore } from '../../registry/component-config';
import { Component, useComponetsStore } from '../../stores/components';
import { useRuntimeLogsStore } from '../../stores/runtime-logs';

interface HeaderProps {
  pageId?: number;
  projectRole?: ProjectRole;
  onBack?: () => void;
}

export function Header({ pageId, projectRole = 'owner', onBack }: HeaderProps) {
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [versionDrawerOpen, setVersionDrawerOpen] = useState(false);
  const [versions, setVersions] = useState<PageVersion[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [runtimeLogDrawerOpen, setRuntimeLogDrawerOpen] = useState(false);
  const [rollingBack, setRollingBack] = useState(false);
  const [deletingVersionId, setDeletingVersionId] = useState<number | null>(null);

  const {
    mode,
    components,
    canRedo,
    canUndo,
    redo,
    setMode,
    setCurComponentId,
    setComponents,
    undo,
  } = useComponetsStore((state) => ({
    mode: state.mode,
    components: state.components,
    canRedo: state.futureComponents.length > 0,
    canUndo: state.pastComponents.length > 0,
    redo: state.redo,
    setMode: state.setMode,
    setCurComponentId: state.setCurComponentId,
    setComponents: state.setComponents,
    undo: state.undo,
  }), shallow);
  const componentConfig = useComponentConfigStore((state) => state.componentConfig);
  const { runtimeLogs, clearRuntimeLogs } = useRuntimeLogsStore((state) => ({
    runtimeLogs: state.logs,
    clearRuntimeLogs: state.clearLogs,
  }), shallow);
  const runtimeErrorCount = runtimeLogs.filter((log) => log.level === 'error').length;
  const canWritePage = projectRole === 'owner' || projectRole === 'editor';

  function buildPageSchema(): LowcodePageSchema {
    return {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      pageId,
      components: components.map(serializeComponent),
      metadata: {
        updatedAt: new Date().toISOString(),
      },
    };
  }

  async function saveCurrentPage() {
    if (!pageId) {
      throw new Error('Page id is required');
    }

    assertValidComponentTree(components, componentConfig);

    return updatePage(pageId, {
      schema: buildPageSchema(),
    });
  }

  async function handleSave() {
    if (!pageId) {
      message.warning('当前页面未绑定后端页面，无法保存');
      return;
    }
    if (!canWritePage) {
      message.warning('当前角色只有查看权限，不能保存页面');
      return;
    }

    setSaving(true);
    try {
      await saveCurrentPage();
      message.success('页面已保存，并生成历史版本');
      if (versionDrawerOpen) {
        await loadVersions();
      }
    } catch (error) {
      message.error(error instanceof Error ? error.message : '保存失败，请稍后重试');
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    if (!pageId) {
      message.warning('当前页面未绑定后端页面，无法发布');
      return;
    }
    if (!canWritePage) {
      message.warning('当前角色只有查看权限，不能发布页面');
      return;
    }

    setPublishing(true);
    try {
      await saveCurrentPage();
      const page = await publishPage(pageId);
      if (!page.publicId) {
        message.error('发布失败，未生成公开访问地址');
        return;
      }

      if (versionDrawerOpen) {
        await loadVersions();
      }

      const publishUrl = `${window.location.origin}/publish/${page.publicId}`;
      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(publishUrl);
          message.success(`页面已保存并发布，公开链接已复制：${publishUrl}`);
          return;
        } catch (error) {
        }
      }

      message.success(`页面已保存并发布：${publishUrl}`);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '发布失败，请稍后重试');
    } finally {
      setPublishing(false);
    }
  }

  async function loadVersions() {
    if (!pageId) return;
    if (!canWritePage) {
      message.warning('当前角色只有查看权限，不能回滚页面');
      return;
    }

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
    if (!canWritePage) {
      message.warning('当前角色只有查看权限，不能删除版本');
      return;
    }

    setRollingBack(true);
    try {
      const page = await rollbackPage(pageId, version.id);
      const schema = migratePageSchema(page.schema, { pageId: page.id });
      setComponents(schema.components as Component[], { recordHistory: false });
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
    <div className='flex h-full w-full items-center'>
      <div className='flex h-[60px] w-full items-center justify-between px-[20px]'>
        <Space>
          {onBack && <Button onClick={onBack}>返回项目</Button>}
          <div>
            <Typography.Text strong className="text-[16px]">低代码编辑器</Typography.Text>
            <Typography.Text type="secondary" className="ml-[8px] text-[12px]">可视化搭建页面</Typography.Text>
          </div>
        </Space>
        <Space>
          {mode === 'edit' && (
            <Tooltip title="撤销">
              <Button
                aria-label="撤销"
                icon={<UndoOutlined />}
                disabled={!canUndo}
                onClick={undo}
              />
            </Tooltip>
          )}
          {mode === 'edit' && (
            <Tooltip title="重做">
              <Button
                aria-label="重做"
                icon={<RedoOutlined />}
                disabled={!canRedo}
                onClick={redo}
              />
            </Tooltip>
          )}
          {mode === 'edit' && <Button loading={saving} disabled={!canWritePage} onClick={handleSave}>保存</Button>}
          {mode === 'edit' && <Button loading={publishing} disabled={!canWritePage} onClick={handlePublish}>发布</Button>}
          {mode === 'edit' && <Button onClick={openVersionDrawer}>版本历史</Button>}
          <Tooltip title="查看预览和事件动作运行日志">
            <Button
              icon={<BugOutlined />}
              danger={runtimeErrorCount > 0}
              onClick={() => setRuntimeLogDrawerOpen(true)}
            >
              运行日志{runtimeErrorCount > 0 ? ` ${runtimeErrorCount}` : ''}
            </Button>
          </Tooltip>
          {mode === 'edit' && (
            <Button
                onClick={() => {
                    setMode('preview');
                    setCurComponentId(null);
                    message.info('已进入预览模式');
                }}
                type='primary'
            >
                预览
            </Button>
          )}
          {mode === 'preview' && (
            <Button
              onClick={() => {
                setMode('edit');
                message.info('已退出预览模式');
              }}
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
                  <Button type="link" disabled={!canWritePage} loading={rollingBack}>回滚</Button>
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
                  <Button type="link" danger disabled={!canWritePage} loading={deletingVersionId === version.id}>删除</Button>
                </Popconfirm>,
              ]}
            >
              <List.Item.Meta
                title={<Space>
                  <Typography.Text strong>v{version.versionNo}</Typography.Text>
                  <Tag color={version.source === 'rollback' ? 'purple' : version.source === 'publish' ? 'green' : 'blue'}>
                    {version.source === 'rollback' ? '回滚' : version.source === 'publish' ? '发布' : '保存'}
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

      <Drawer
        title="运行日志"
        open={runtimeLogDrawerOpen}
        width={520}
        onClose={() => setRuntimeLogDrawerOpen(false)}
        extra={<Button onClick={clearRuntimeLogs} disabled={runtimeLogs.length === 0}>清空</Button>}
      >
        <List
          dataSource={runtimeLogs}
          locale={{ emptyText: '暂无运行日志' }}
          renderItem={(log) => (
            <List.Item>
              <List.Item.Meta
                title={<Space wrap>
                  <Tag color={log.level === 'error' ? 'red' : log.level === 'warning' ? 'gold' : 'blue'}>
                    {log.level === 'error' ? '错误' : log.level === 'warning' ? '警告' : '信息'}
                  </Tag>
                  <Typography.Text strong>{log.title}</Typography.Text>
                  <Typography.Text type="secondary">{dayjs(log.createdAt).format('HH:mm:ss')}</Typography.Text>
                </Space>}
                description={<Space direction="vertical" size={6} className="w-full">
                  <Typography.Text type="secondary">
                    {[
                      log.componentDesc || log.componentName ? `组件：${log.componentDesc || log.componentName}(${log.componentId})` : '',
                      log.eventName ? `事件：${log.eventName}` : '',
                      log.actionType ? `动作：${log.actionType}` : '',
                    ].filter(Boolean).join(' / ') || '运行时'}
                  </Typography.Text>
                  <Typography.Text type="danger">{log.message}</Typography.Text>
                  {log.stack && (
                    <Typography.Paragraph
                      className="max-h-[160px] overflow-auto rounded-[6px] bg-[#f8fafc] p-[8px] text-[12px]"
                      copyable
                    >
                      {log.stack}
                    </Typography.Paragraph>
                  )}
                </Space>}
              />
            </List.Item>
          )}
        />
      </Drawer>
    </div>
  )
}

function serializeComponent(component: Component): LowcodeComponentSchema {
  const nextComponent: LowcodeComponentSchema = {
    id: component.id,
    name: component.name,
    props: isPlainObject(component.props) ? { ...component.props } : {},
    desc: component.desc,
  };

  if (component.styles) {
    nextComponent.styles = Object.entries(component.styles).reduce<Record<string, unknown>>((styles, [key, value]) => {
      if (value !== undefined) {
        styles[key] = value;
      }

      return styles;
    }, {});
  }

  if (component.parentId !== undefined) {
    nextComponent.parentId = component.parentId;
  }

  if (component.children) {
    nextComponent.children = component.children.map(serializeComponent);
  }

  return nextComponent;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
