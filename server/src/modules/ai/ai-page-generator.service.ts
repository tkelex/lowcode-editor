import { Injectable } from '@nestjs/common';
import {
  AiPageGenerationRequest,
  AiPageGenerationResult,
  AiGeneratedFieldType,
  AiPageIntent,
  LowcodeComponentSchema,
  normalizeAiGeneratedComponents,
  validateAiGeneratedComponents,
} from '../../../../packages/lowcode-schema/src';
import { AiModelGatewayService } from './ai-model-gateway.service';

interface BuildState {
  id: number;
}

@Injectable()
export class AiPageGeneratorService {
  constructor(private readonly modelGateway: AiModelGatewayService) {}

  async generate(input: AiPageGenerationRequest): Promise<AiPageGenerationResult> {
    const fallback = this.buildDeterministicResult(input, ['当前环境未配置模型服务，已使用本地规则生成可编辑草稿。']);

    if (!this.modelGateway.isConfigured()) {
      return fallback;
    }

    const modelResult = await this.tryGenerateWithModel(input);
    if (modelResult) {
      return modelResult;
    }

    return {
      ...fallback,
      warnings: ['模型输出未通过校验，已降级为本地规则草稿。', ...fallback.warnings],
    };
  }

  private async tryGenerateWithModel(input: AiPageGenerationRequest) {
    const systemPrompt = [
      '你是低代码页面 schema 生成器，只输出 JSON。',
      '输出结构必须是 {"summary": string, "warnings": string[], "assumptions": string[], "components": LowcodeComponentSchema[] }。',
      'components 只能使用当前物料：Page, Container, Card, Space, Flex, Grid, Tabs, Steps, Text, Image, Divider, Alert, Button, Link, Icon, Form, FormItem, Input, Textarea, Select, Radio, Checkbox, DatePicker, Switch, Rate, Upload, Table, TableColumn, List, Descriptions, Statistic, Pagination, Chart, Result, Empty。',
      '不要输出 React/Vue/HTML 源码，不要默认输出 custom action 或可执行 JS。',
      '必须包含 Page 根节点；props 必须是对象；children 必须符合父子关系。',
    ].join('\n');
    const userPrompt = JSON.stringify({
      prompt: input.prompt,
      target: input.target || 'fullPage',
      apiDescription: input.apiDescription,
      responseSample: input.responseSample,
      dataSourceModel: input.dataSourceModel,
    }, null, 2);

    const raw = await this.modelGateway.requestJson({ systemPrompt, userPrompt });
    const firstValidation = validateAiGeneratedComponents(raw);
    if (firstValidation.valid && firstValidation.components) {
      return this.toResult(raw, firstValidation.components, firstValidation.warnings.map((issue) => issue.message));
    }

    const repaired = await this.modelGateway.requestJson({
      systemPrompt,
      userPrompt,
      repairPrompt: [
        '上一次 JSON 没有通过校验，请只返回修复后的 JSON。',
        '校验错误：',
        ...firstValidation.errors.map((issue) => `- ${issue.message}`),
      ].join('\n'),
    });
    const repairedValidation = validateAiGeneratedComponents(repaired);
    if (repairedValidation.valid && repairedValidation.components) {
      return this.toResult(
        repaired,
        repairedValidation.components,
        ['模型第一次输出未通过校验，已执行一次修复。', ...repairedValidation.warnings.map((issue) => issue.message)],
      );
    }

    return null;
  }

  private toResult(raw: unknown, components: LowcodeComponentSchema[], validationWarnings: string[]): AiPageGenerationResult {
    const record = isRecord(raw) ? raw : {};
    return {
      components,
      summary: typeof record.summary === 'string' ? record.summary : 'AI 已生成页面草稿。',
      warnings: [
        ...readStringArray(record.warnings),
        ...validationWarnings,
      ],
      assumptions: readStringArray(record.assumptions),
      intent: isRecord(record.intent) ? record.intent as unknown as AiPageIntent : undefined,
      metadata: { source: 'model', model: this.modelGateway.getModelName() },
    };
  }

  private buildDeterministicResult(input: AiPageGenerationRequest, warnings: string[] = []): AiPageGenerationResult {
    const fields = inferFields(input);
    const isCrud = input.target === 'crud' || /crud|增删改查|管理|列表|表格|接口/i.test(input.prompt);
    const intent: AiPageIntent = {
      title: inferTitle(input.prompt),
      pageType: isCrud ? 'crud' : 'dashboard',
      description: input.prompt,
      primaryEntity: isCrud ? inferEntity(input.prompt) : undefined,
      fields,
      sections: [
        { kind: 'stats', title: '关键指标' },
        { kind: isCrud ? 'table' : 'list', title: isCrud ? '数据列表' : '内容概览', fields },
        { kind: 'form', title: isCrud ? '编辑表单' : '信息收集', fields },
      ],
    };
    const components = this.buildComponents(intent, isCrud);
    const validation = validateAiGeneratedComponents(components);
    const normalized = validation.components ?? normalizeAiGeneratedComponents(components).components;

    return {
      components: normalized,
      summary: isCrud
        ? `已生成“${intent.title}”CRUD 页面草稿，包含指标、表格和表单区域。`
        : `已生成“${intent.title}”页面草稿，包含指标、内容和表单区域。`,
      warnings: [
        ...warnings,
        ...(isCrud ? ['CRUD 生成器对接点已预留；当前结果为可编辑静态草稿，数据写入能力需继续配置。'] : []),
        ...validation.warnings.map((issue) => issue.message),
      ],
      assumptions: [
        '字段类型根据接口示例或字段名称自动推断。',
        '生成结果不会自动保存，确认写入后仍需手动保存页面。',
      ],
      intent,
      metadata: { source: 'fallback' },
    };
  }

  private buildComponents(intent: AiPageIntent, isCrud: boolean): LowcodeComponentSchema[] {
    const state: BuildState = { id: 1 };
    const page = component(state, 'Page', '页面', { title: intent.title });
    const shell = child(state, page, 'Container', 'AI 生成页面容器', {
      gap: 16,
      padding: 24,
    });
    const titleCard = child(state, shell, 'Card', '页面说明', { title: intent.title });
    child(state, titleCard, 'Text', '页面摘要', {
      text: intent.description || 'AI 生成的可编辑页面草稿',
    });

    const stats = child(state, shell, 'Grid', '关键指标', { columns: 3, gap: 12 });
    ['总数', '本月新增', '待处理'].forEach((title, index) => {
      child(state, stats, 'Statistic', title, { title, value: index === 0 ? 128 : index === 1 ? 24 : 6 });
    });

    const dataCard = child(state, shell, 'Card', isCrud ? '数据列表' : '内容概览', { title: isCrud ? '数据列表' : '内容概览' });
    const table = child(state, dataCard, 'Table', '数据表格', {
      rowKey: intent.fields?.[0]?.key || 'id',
      pagination: true,
      pageSize: 10,
      dataText: JSON.stringify(sampleRows(intent.fields || []), null, 2),
    });
    (intent.fields || []).slice(0, 6).forEach((field) => {
      child(state, table, 'TableColumn', `${field.label}列`, {
        title: field.label,
        dataIndex: field.key,
        type: field.type === 'date' ? 'date' : 'text',
      });
    });

    const formCard = child(state, shell, 'Card', isCrud ? '新增/编辑' : '表单', { title: isCrud ? '新增/编辑' : '表单' });
    const form = child(state, formCard, 'Form', '编辑表单', {
      title: isCrud ? '编辑信息' : '提交信息',
      layout: 'horizontal',
      showActions: true,
    });
    (intent.fields || []).slice(0, 8).forEach((field) => {
      child(state, form, 'FormItem', `${field.label}表单项`, {
        name: field.key,
        label: field.label,
        type: toFormItemType(field.type),
        required: field.required,
        rules: field.required ? 'required' : '',
        optionsText: field.optionsText || '选项一,选项二',
        placeholder: `请输入${field.label}`,
      });
    });

    return [page];
  }
}

function component(state: BuildState, name: string, desc: string, props: Record<string, unknown> = {}) {
  const node: LowcodeComponentSchema = {
    id: state.id,
    name,
    props,
    desc,
  };
  state.id += 1;
  return node;
}

function child(
  state: BuildState,
  parent: LowcodeComponentSchema,
  name: string,
  desc: string,
  props: Record<string, unknown> = {},
) {
  const node = component(state, name, desc, props);
  node.parentId = parent.id;
  parent.children = [...(parent.children || []), node];
  return node;
}

function inferFields(input: AiPageGenerationRequest) {
  const sample = extractSampleObject(input.responseSample);
  const keys = Object.keys(sample);
  const sourceKeys = keys.length > 0 ? keys : inferKeysFromText(`${input.prompt}\n${input.apiDescription || ''}`);
  const finalKeys = sourceKeys.length > 0 ? sourceKeys : ['id', 'name', 'status', 'createdAt'];

  return finalKeys.slice(0, 12).map((key) => ({
    key,
    label: toLabel(key),
    type: inferFieldType(key, sample[key]),
    required: key === 'name' || key === 'title',
    listVisible: true,
    formVisible: key !== 'id',
    detailVisible: true,
  }));
}

function extractSampleObject(value: unknown): Record<string, unknown> {
  const parsed = typeof value === 'string' ? safeJsonParse(value) : value;
  const queue = [parsed];
  while (queue.length > 0) {
    const current = queue.shift();
    if (Array.isArray(current)) {
      if (isRecord(current[0])) return current[0];
      queue.push(...current);
      continue;
    }

    if (isRecord(current)) {
      const arrayValue = Object.values(current).find(Array.isArray);
      if (Array.isArray(arrayValue) && isRecord(arrayValue[0])) {
        return arrayValue[0];
      }

      if (Object.keys(current).length > 0 && Object.values(current).every((item) => !isRecord(item) && !Array.isArray(item))) {
        return current;
      }

      queue.push(...Object.values(current));
    }
  }

  return {};
}

function inferKeysFromText(text: string) {
  const matches = text.match(/[a-zA-Z_][a-zA-Z0-9_]{1,30}/g) || [];
  return Array.from(new Set(matches.filter((key) => !['http', 'https', 'api', 'json', 'crud'].includes(key.toLowerCase()))));
}

function inferFieldType(key: string, value: unknown): AiGeneratedFieldType {
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return 'number';
  if (/date|time|At$/i.test(key)) return 'date';
  if (/status|type|category|role/i.test(key)) return 'select';
  if (/desc|remark|content|description/i.test(key)) return 'textarea';
  return 'text';
}

function toFormItemType(type: string) {
  if (type === 'textarea') return 'textarea';
  if (type === 'date') return 'date';
  if (type === 'select') return 'select';
  if (type === 'boolean') return 'switch';
  return 'input';
}

function sampleRows(fields: Array<{ key: string; type: string }>) {
  const row = Object.fromEntries(fields.slice(0, 8).map((field, index) => {
    if (field.type === 'number') return [field.key, index + 1];
    if (field.type === 'boolean') return [field.key, index % 2 === 0];
    if (field.type === 'date') return [field.key, '2026-05-14'];
    if (field.type === 'select') return [field.key, '启用'];
    return [field.key, `${toLabel(field.key)}示例`];
  }));
  return [{ id: 1, ...row }, { id: 2, ...row }];
}

function inferTitle(prompt: string) {
  const cleaned = prompt.replace(/\s+/g, ' ').trim();
  if (!cleaned) return 'AI 生成页面';
  return cleaned.length > 24 ? `${cleaned.slice(0, 24)}...` : cleaned;
}

function inferEntity(prompt: string) {
  if (/用户|user/i.test(prompt)) return '用户';
  if (/订单|order/i.test(prompt)) return '订单';
  if (/商品|product/i.test(prompt)) return '商品';
  return '数据';
}

function toLabel(key: string) {
  const known: Record<string, string> = {
    id: 'ID',
    name: '名称',
    title: '标题',
    status: '状态',
    createdAt: '创建时间',
    updatedAt: '更新时间',
    description: '说明',
    email: '邮箱',
    phone: '手机号',
    role: '角色',
  };
  return known[key] || key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim();
}

function safeJsonParse(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

function readStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
