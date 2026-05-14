import { Alert, Button, Divider, Empty, Form, Input, Radio, Select, Space, Spin, Typography, message } from 'antd';
import { useMemo, useState } from 'react';
import type {
  AiAgentMessage,
  AiAgentRunResult,
  AiAgentTargetScope,
  AiPageBuilderTarget,
  AiPageBuilderWriteMode,
  AiPageGenerationResult,
  LowcodeComponentSchema,
} from '../../../../packages/lowcode-schema/src';
import {
  applyAiComponentPatch,
  createAiComponentTreeFingerprint,
  validateAiGeneratedComponents,
} from '../../../../packages/lowcode-schema/src';
import {
  createAiAgentRunForPage,
  createAiAgentRunForProject,
  generateAiPageForPage,
  generateAiPageForProject,
} from '../../../shared/api/ai';
import type { ProjectRole } from '../../../shared/api/types';
import { Preview } from '../../runtime/Preview';
import { useComponentConfigStore } from '../../registry/component-config';
import { assertValidComponentTree } from '../../schema/validateComponents';
import type { Component } from '../../stores/components';
import { useComponetsStore } from '../../stores/components';
import {
  cloneComponentWithFreshIds,
  cloneComponents,
  createComponentIdFactory,
  getComponentById,
  setComponentParentIds,
} from '../../stores/component-tree';

interface AiBuilderPanelProps {
  pageId?: number;
  projectId?: number;
  projectRole?: ProjectRole;
}

interface AiBuilderFormValues {
  prompt: string;
  target: AiPageBuilderTarget;
  writeMode: AiPageBuilderWriteMode;
  agentScope: AiAgentTargetScope;
  apiDescription?: string;
  responseSample?: string;
}

const DEFAULT_FORM_VALUES: Partial<AiBuilderFormValues> = {
  target: 'fullPage',
  writeMode: 'replacePage',
  agentScope: 'selection',
};

export function AiBuilderPanel({ pageId, projectId, projectRole = 'owner' }: AiBuilderPanelProps) {
  const [form] = Form.useForm<AiBuilderFormValues>();
  const [generating, setGenerating] = useState(false);
  const [agentRunning, setAgentRunning] = useState(false);
  const [result, setResult] = useState<AiPageGenerationResult | null>(null);
  const [agentRun, setAgentRun] = useState<AiAgentRunResult | null>(null);
  const [agentMessages, setAgentMessages] = useState<AiAgentMessage[]>([]);
  const [error, setError] = useState('');
  const [agentError, setAgentError] = useState('');
  const components = useComponetsStore((state) => state.components);
  const curComponentId = useComponetsStore((state) => state.curComponentId);
  const setComponents = useComponetsStore((state) => state.setComponents);
  const setCurComponentId = useComponetsStore((state) => state.setCurComponentId);
  const componentConfig = useComponentConfigStore((state) => state.componentConfig);
  const canWritePage = projectRole === 'owner' || projectRole === 'editor';
  const selectedComponent = useMemo(() => getComponentById(curComponentId || 1, components), [components, curComponentId]);

  async function handleGenerate(values: AiBuilderFormValues) {
    if (!canWritePage) {
      message.warning('当前角色只有查看权限，不能使用 AI 写入页面');
      return;
    }

    if (!pageId && !projectId) {
      message.warning('当前页面缺少项目或页面上下文，无法调用 AI 生成接口');
      return;
    }

    setGenerating(true);
    setError('');
    try {
      const payload = {
        prompt: values.prompt,
        target: values.target,
        writeMode: values.writeMode,
        apiDescription: values.apiDescription,
        responseSample: parseResponseSample(values.responseSample),
        currentComponents: components as LowcodeComponentSchema[],
        context: {
          selectedComponentId: selectedComponent?.id,
          selectedComponentName: selectedComponent?.name,
        },
      };
      const nextResult = pageId
        ? await generateAiPageForPage(pageId, payload)
        : await generateAiPageForProject(projectId as number, payload);
      const validation = validateAiGeneratedComponents(nextResult.components);

      if (!validation.valid || !validation.components) {
        setResult(null);
        setError(validation.errors[0]?.message || 'AI 结果未通过校验');
        return;
      }

      setResult({
        ...nextResult,
        components: validation.components,
        warnings: [
          ...nextResult.warnings,
          ...validation.warnings.map((issue) => issue.message),
        ],
      });
      setAgentRun(null);
      message.success('AI 页面草稿已生成，请确认后应用');
    } catch (requestError) {
      setResult(null);
      setError(requestError instanceof Error ? requestError.message : 'AI 生成失败');
    } finally {
      setGenerating(false);
    }
  }

  async function handleAgentRun() {
    const values = await form.validateFields();
    if (!canWritePage) {
      message.warning('当前角色只有查看权限，不能使用 AI Agent 修改页面');
      return;
    }

    if (!pageId && !projectId) {
      message.warning('当前页面缺少项目或页面上下文，无法调用 AI Agent');
      return;
    }

    setAgentRunning(true);
    setAgentError('');
    const userMessage: AiAgentMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: values.prompt,
      createdAt: new Date().toISOString(),
    };
    const nextHistory = [...agentMessages, userMessage];
    setAgentMessages(nextHistory);
    try {
      const targetScope = values.agentScope === 'selection' && !selectedComponent ? 'page' : values.agentScope;
      const payload = {
        prompt: values.prompt,
        targetScope,
        selectedComponentId: targetScope === 'page' ? undefined : selectedComponent?.id,
        apiDescription: values.apiDescription,
        responseSample: parseResponseSample(values.responseSample),
        currentComponents: components as LowcodeComponentSchema[],
        history: nextHistory,
        context: {
          selectedComponentId: selectedComponent?.id,
          selectedComponentName: selectedComponent?.name,
          baselineFingerprint: createAiComponentTreeFingerprint(components as LowcodeComponentSchema[]),
        },
      };
      const nextRun = pageId
        ? await createAiAgentRunForPage(pageId, payload)
        : await createAiAgentRunForProject(projectId as number, payload);

      setResult(null);
      setAgentRun(nextRun);
      if (nextRun.status === 'awaiting_confirmation') {
        setAgentMessages([
          ...nextHistory,
          {
            id: `assistant_${Date.now()}`,
            role: 'assistant',
            content: nextRun.candidate?.summary || '已生成候选修改。',
            createdAt: new Date().toISOString(),
          },
        ]);
        message.success('AI Agent 已生成候选修改，请确认后应用');
      } else {
        setAgentError(nextRun.error || 'AI Agent 未生成可应用候选修改');
      }
    } catch (requestError) {
      setAgentRun(null);
      setAgentError(requestError instanceof Error ? requestError.message : 'AI Agent 执行失败');
    } finally {
      setAgentRunning(false);
    }
  }

  function applyReplacePage() {
    if (!result) return;

    try {
      assertValidComponentTree(result.components, componentConfig);
      setComponents(result.components as Component[]);
      setCurComponentId(null);
      message.success('AI 页面草稿已应用到当前页面');
    } catch (applyError) {
      message.error(applyError instanceof Error ? applyError.message : 'AI 页面草稿无法应用');
    }
  }

  function applyInsertSelection() {
    if (!result) return;

    const targetId = curComponentId || 1;
    const nextComponents = cloneComponents(components);
    const target = getComponentById(targetId, nextComponents);
    if (!target) {
      message.warning('未找到当前选中组件，无法插入');
      return;
    }

    const acceptsChildren = componentConfig[target.name]?.acceptsChildren;
    if (!acceptsChildren) {
      message.warning(`当前组件“${target.desc || target.name}”不支持插入子内容`);
      return;
    }

    const insertNodes = extractInsertNodes(result.components);
    if (insertNodes.length === 0) {
      message.warning('AI 结果没有可插入的组件');
      return;
    }

    const nextId = createComponentIdFactory(nextComponents);
    const clonedNodes = insertNodes.map((node) => {
      const cloned = cloneComponentWithFreshIds(node as Component, nextId, target.id, node.desc);
      setComponentParentIds(cloned, target.id);
      return cloned;
    });

    target.children = [...(target.children || []), ...clonedNodes];

    try {
      assertValidComponentTree(nextComponents, componentConfig);
      setComponents(nextComponents);
      setCurComponentId(clonedNodes[0]?.id ?? target.id);
      message.success('AI 区块已插入当前组件');
    } catch (applyError) {
      message.error(applyError instanceof Error ? applyError.message : 'AI 区块无法插入当前组件');
    }
  }

  function applyResult() {
    const writeMode = form.getFieldValue('writeMode') || 'replacePage';
    if (writeMode === 'insertSelection') {
      applyInsertSelection();
      return;
    }

    applyReplacePage();
  }

  function applyAgentCandidate() {
    const candidate = agentRun?.candidate;
    if (!candidate) return;

    try {
      const nextComponents = candidate.kind === 'patch'
        ? applyAiComponentPatch(components as LowcodeComponentSchema[], candidate.patch, {
          expectedBaselineFingerprint: candidate.baselineFingerprint,
          scopeRootId: candidate.impactScope === 'page' ? undefined : agentRun.context.selectedComponentId,
        }).components
        : candidate.components;

      if (!nextComponents) {
        throw new Error('候选修改未通过校验，无法应用');
      }

      assertValidComponentTree(nextComponents, componentConfig);
      setComponents(nextComponents as Component[]);
      setCurComponentId(null);
      setAgentRun(null);
      message.success('AI Agent 候选修改已应用到当前页面');
    } catch (applyError) {
      message.error(applyError instanceof Error ? applyError.message : 'AI Agent 候选修改无法应用');
    }
  }

  const agentPreviewComponents = agentRun?.candidate?.kind === 'patch'
    ? agentRun.candidate.previewComponents
    : agentRun?.candidate?.components;

  return <div className="flex h-full flex-col overflow-hidden px-[12px] pb-[16px]">
    <div className="min-h-0 flex-1 overflow-auto pr-[2px]">
      <Typography.Title level={5} className="!mb-[4px]">AI 搭建</Typography.Title>
      <Typography.Text type="secondary" className="text-[12px]">
        生成结果会先预览，确认后才写入当前页面。
      </Typography.Text>

      {!canWritePage && <Alert className="mt-[12px]" type="warning" showIcon message="当前角色只有查看权限，不能生成并写入页面" />}

      <Form
        form={form}
        layout="vertical"
        className="mt-[14px]"
        initialValues={DEFAULT_FORM_VALUES}
        onFinish={handleGenerate}
      >
        <Form.Item
          name="prompt"
          label="页面描述"
          rules={[{ required: true, message: '请输入你想生成的页面' }]}
        >
          <Input.TextArea
            rows={4}
            maxLength={4000}
            showCount
            placeholder="例如：生成一个用户管理页面，包含统计卡片、用户列表、新增/编辑表单"
          />
        </Form.Item>

        <Form.Item name="target" label="生成目标">
          <Select
            options={[
              { label: '整页页面', value: 'fullPage' },
              { label: '当前区块', value: 'section' },
              { label: 'CRUD 页面', value: 'crud' },
            ]}
          />
        </Form.Item>

        <Form.Item name="writeMode" label="应用方式">
          <Radio.Group>
            <Radio.Button value="replacePage">替换整页</Radio.Button>
            <Radio.Button value="insertSelection">插入选中</Radio.Button>
          </Radio.Group>
        </Form.Item>

        <Form.Item name="agentScope" label="Agent 修改范围">
          <Radio.Group>
            <Radio.Button value="selection">当前选中</Radio.Button>
            <Radio.Button value="page">整页</Radio.Button>
          </Radio.Group>
        </Form.Item>

        <Form.Item name="apiDescription" label="接口说明">
          <Input.TextArea rows={3} placeholder="可选：GET /api/users 返回用户列表，POST /api/users 新增用户" />
        </Form.Item>

        <Form.Item name="responseSample" label="响应示例">
          <Input.TextArea rows={4} placeholder='可选：{"data":{"items":[{"id":1,"name":"张三","status":"启用"}]}}' />
        </Form.Item>

        <Space>
          <Button type="primary" htmlType="submit" loading={generating} disabled={!canWritePage}>
            生成草稿
          </Button>
          <Button onClick={handleAgentRun} loading={agentRunning} disabled={!canWritePage}>
            Agent 修改
          </Button>
          <Button
            onClick={() => {
              setResult(null);
              setAgentRun(null);
              setAgentMessages([]);
              setError('');
              setAgentError('');
              form.resetFields();
            }}
          >
            清空
          </Button>
        </Space>
      </Form>

      {generating && <div className="mt-[16px] rounded-[6px] border border-[#dbeafe] bg-[#eff6ff] p-[12px]">
        <Spin size="small" />
        <Typography.Text className="ml-[8px] text-[13px]">正在生成页面草稿...</Typography.Text>
      </div>}

      {agentRunning && <div className="mt-[16px] rounded-[6px] border border-[#dbeafe] bg-[#eff6ff] p-[12px]">
        <Spin size="small" />
        <Typography.Text className="ml-[8px] text-[13px]">AI Agent 正在读取上下文并生成候选修改...</Typography.Text>
      </div>}

      {error && <Alert className="mt-[16px]" type="error" showIcon message={error} />}
      {agentError && <Alert className="mt-[16px]" type="error" showIcon message={agentError} />}

      {!result && !agentRun && !error && !agentError && !generating && !agentRunning && (
        <Empty className="mt-[24px]" image={Empty.PRESENTED_IMAGE_SIMPLE} description="还没有生成结果" />
      )}

      {result && <div className="mt-[16px]">
        <Divider className="!my-[12px]" />
        <Typography.Text strong>生成摘要</Typography.Text>
        <div className="mt-[6px] text-[13px] leading-[22px] text-[#475569]">{result.summary}</div>

        {result.assumptions.length > 0 && <Alert
          className="mt-[10px]"
          type="info"
          showIcon
          message="生成假设"
          description={result.assumptions.join('；')}
        />}

        {result.warnings.length > 0 && <Alert
          className="mt-[10px]"
          type="warning"
          showIcon
          message="需要确认"
          description={result.warnings.join('；')}
        />}

        <div className="mt-[12px] h-[260px] overflow-hidden rounded-[6px] border border-[#d8e0ec] bg-white">
          <Preview components={result.components as Component[]} allowCustomJS={false} />
        </div>

        <Space className="mt-[12px]">
          <Button type="primary" onClick={applyResult} disabled={!canWritePage}>
            应用到页面
          </Button>
          <Button onClick={() => setResult(null)}>放弃结果</Button>
        </Space>
      </div>}

      {agentRun && <div className="mt-[16px]">
        <Divider className="!my-[12px]" />
        {agentMessages.length > 0 && <div className="mb-[12px] space-y-[8px]">
          <Typography.Text strong>Agent 对话</Typography.Text>
          {agentMessages.map((item) => (
            <div key={item.id || `${item.role}-${item.createdAt}`} className="rounded-[6px] border border-[#e2e8f0] bg-white px-[10px] py-[8px]">
              <div className="text-[12px] font-medium text-[#64748b]">{item.role === 'user' ? '用户' : 'Agent'}</div>
              <div className="mt-[3px] text-[13px] leading-[20px] text-[#1e293b]">{item.content}</div>
            </div>
          ))}
        </div>}
        <Typography.Text strong>Agent 执行轨迹</Typography.Text>
        <div className="mt-[8px] space-y-[8px]">
          {agentRun.events.map((event) => (
            <div key={event.id} className="rounded-[6px] border border-[#e2e8f0] bg-[#f8fafc] px-[10px] py-[8px]">
              <div className="text-[13px] font-medium text-[#1e293b]">{event.title}</div>
              {event.detail && <div className="mt-[3px] text-[12px] leading-[18px] text-[#64748b]">{event.detail}</div>}
            </div>
          ))}
        </div>

        {agentRun.candidate && <div className="mt-[12px]">
          <Typography.Text strong>候选修改</Typography.Text>
          <div className="mt-[6px] text-[13px] leading-[22px] text-[#475569]">{agentRun.candidate.summary}</div>
          <div className="mt-[8px] text-[12px] text-[#64748b]">
            影响范围：{agentRun.candidate.impactScope === 'page' ? '整页' : '当前选中'} · 类型：{agentRun.candidate.kind === 'patch' ? 'Patch' : '组件树'}
          </div>

          {agentRun.candidate.assumptions.length > 0 && <Alert
            className="mt-[10px]"
            type="info"
            showIcon
            message="Agent 假设"
            description={agentRun.candidate.assumptions.join('；')}
          />}

          {agentRun.candidate.warnings.length > 0 && <Alert
            className="mt-[10px]"
            type="warning"
            showIcon
            message="需要确认"
            description={agentRun.candidate.warnings.join('；')}
          />}

          {agentRun.candidate.validationWarnings.length > 0 && <Alert
            className="mt-[10px]"
            type="warning"
            showIcon
            message="校验提示"
            description={agentRun.candidate.validationWarnings.map((issue) => issue.message).join('；')}
          />}

          {agentPreviewComponents && <div className="mt-[12px] h-[260px] overflow-hidden rounded-[6px] border border-[#d8e0ec] bg-white">
            <Preview components={agentPreviewComponents as Component[]} allowCustomJS={false} />
          </div>}

          <Space className="mt-[12px]">
            <Button type="primary" onClick={applyAgentCandidate} disabled={!canWritePage}>
              应用 Agent 修改
            </Button>
            <Button onClick={() => setAgentRun(null)}>放弃结果</Button>
          </Space>
        </div>}
      </div>}
    </div>
  </div>;
}

function parseResponseSample(value: string | undefined) {
  if (!value?.trim()) return undefined;

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function extractInsertNodes(components: LowcodeComponentSchema[]) {
  const page = components.find((component) => component.name === 'Page');
  return page?.children?.length ? page.children : components.filter((component) => component.name !== 'Page');
}
