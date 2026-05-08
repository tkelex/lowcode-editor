import {
  Alert,
  Button,
  Modal,
  Space,
  Tooltip,
  Typography,
  message,
} from 'antd';
import {
  CheckOutlined,
  CopyOutlined,
  FormatPainterOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useEffect, useMemo, useState } from 'react';
import { LazyMonacoEditor, type LazyMonacoOnMount } from '../../../shared/components/LazyMonacoEditor';
import { assertValidComponentTree, validateComponentTree } from '../../schema/validateComponents';
import { useComponentConfigStore } from '../../registry/component-config';
import { useComponetsStore } from '../../stores/components';

export function Source() {
  const { components, setComponents } = useComponetsStore((state) => ({
    components: state.components,
    setComponents: state.setComponents,
  }));
  const componentConfig = useComponentConfigStore((state) => state.componentConfig);
  const latestSourceCode = useMemo(() => JSON.stringify(components, null, 2), [components]);
  const [sourceCode, setSourceCode] = useState(() => latestSourceCode);
  const [jsonError, setJsonError] = useState('');

  useEffect(() => {
    setSourceCode(latestSourceCode);
    setJsonError('');
  }, [latestSourceCode]);

  const isDirty = sourceCode !== latestSourceCode;

  function validateSource(nextSourceCode: string) {
    try {
      const validation = validateComponentTree(JSON.parse(nextSourceCode), componentConfig);
      if (!validation.valid || !validation.components) {
        return validation.errors.slice(0, 3).join('；');
      }

      return '';
    } catch (error) {
      return error instanceof Error ? error.message : '源码格式不正确';
    }
  }

  function handleSourceChange(value?: string) {
    const nextSourceCode = value || '';
    setSourceCode(nextSourceCode);
    setJsonError(validateSource(nextSourceCode));
  }

  function applySource() {
    try {
      const nextComponents = assertValidComponentTree(JSON.parse(sourceCode), componentConfig);
      setComponents(nextComponents);
    } catch (error) {
      setJsonError(error instanceof Error ? error.message : '源码格式不正确');
      return;
    }

    message.success('源码已应用，画布已更新');
  }

  function handleApplySource() {
    if (!isDirty) {
      message.info('源码和当前画布一致');
      return;
    }

    Modal.confirm({
      title: '确认应用源码？',
      content: <div className="text-[13px] leading-[22px] text-[#475569]">
        <div>这会用当前 JSON 替换整个画布组件树。</div>
        <div className="mt-[8px] rounded-[6px] bg-[#f8fafc] px-[10px] py-[8px]">
          {createDiffSummary(latestSourceCode, sourceCode)}
        </div>
      </div>,
      okText: '应用',
      cancelText: '取消',
      onOk: applySource,
    });
  }

  function handleFormatSource() {
    try {
      const formatted = JSON.stringify(JSON.parse(sourceCode), null, 2);
      setSourceCode(formatted);
      setJsonError(validateSource(formatted));
      message.success('源码已格式化');
    } catch (error) {
      setJsonError(error instanceof Error ? error.message : '源码格式不正确');
    }
  }

  async function handleCopySource() {
    try {
      await navigator.clipboard.writeText(sourceCode);
      message.success('源码已复制');
    } catch {
      message.error('复制失败，请手动选择源码复制');
    }
  }

  function handleResetSource() {
    setSourceCode(latestSourceCode);
    setJsonError('');
    message.success('源码已重置为当前画布');
  }

  const handleEditorMount: LazyMonacoOnMount = (editor, monaco) => {
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyJ, () => {
        editor.getAction('editor.action.formatDocument')?.run()
    });
  }

  return <div className="flex h-full min-h-0 flex-col gap-[10px]">
    <div className="shrink-0 rounded-[8px] border border-[#e5e7eb] bg-white p-[10px]">
      <Space direction="vertical" size={8} className="w-full">
        <div className="flex flex-wrap items-center justify-between gap-[8px]">
          <div className="min-w-0">
            <Typography.Text strong className="block">组件树源码</Typography.Text>
            <Typography.Text type="secondary" className="block text-[12px]">
              {isDirty ? '有未应用的源码变更' : '源码与当前画布一致'}
            </Typography.Text>
          </div>
          <Space size={4} wrap>
            <Tooltip title="格式化 JSON">
              <Button size="small" icon={<FormatPainterOutlined />} onClick={handleFormatSource} />
            </Tooltip>
            <Tooltip title="复制源码">
              <Button size="small" icon={<CopyOutlined />} onClick={handleCopySource} />
            </Tooltip>
            <Tooltip title="重置为当前画布">
              <Button size="small" icon={<ReloadOutlined />} disabled={!isDirty} onClick={handleResetSource} />
            </Tooltip>
            <Tooltip title={jsonError ? '修复源码错误后再应用' : '应用源码'}>
              <Button
                type="primary"
                size="small"
                icon={<CheckOutlined />}
                disabled={!!jsonError || !isDirty}
                onClick={handleApplySource}
              >
                应用
              </Button>
            </Tooltip>
          </Space>
        </div>
        {jsonError
          ? <Alert type="error" showIcon message={jsonError} />
          : <Alert type="success" showIcon message="源码格式正确，应用前会显示变更摘要" />}
      </Space>
    </div>
    <div className="min-h-[280px] flex-1 overflow-hidden rounded-[8px] border border-[#e5e7eb] bg-white">
      <LazyMonacoEditor
          height={'100%'}
          path='components.json'
          language='json'
          onMount={handleEditorMount}
          onChange={handleSourceChange}
          value={sourceCode}
          options={
              {
                  automaticLayout: true,
                  fixedOverflowWidgets: true,
                  fontSize: 14,
                  scrollBeyondLastLine: false,
                  minimap: {
                    enabled: false,
                  },
                  scrollbar: {
                    verticalScrollbarSize: 6,
                    horizontalScrollbarSize: 6,
                  }
              }
          }
      />
    </div>
  </div>
}

function createDiffSummary(currentSource: string, nextSource: string) {
  const currentLines = currentSource.split('\n');
  const nextLines = nextSource.split('\n');
  const maxLength = Math.max(currentLines.length, nextLines.length);
  let changed = 0;

  for (let index = 0; index < maxLength; index++) {
    if (currentLines[index] !== nextLines[index]) {
      changed += 1;
    }
  }

  const lineDelta = nextLines.length - currentLines.length;
  const deltaText = lineDelta === 0
    ? '行数不变'
    : lineDelta > 0
      ? `增加 ${lineDelta} 行`
      : `减少 ${Math.abs(lineDelta)} 行`;

  return `预计变更 ${changed} 行，${deltaText}。`;
}
