import { HttpStatus, Injectable } from '@nestjs/common';
import {
  applyAiComponentPatch,
  createAgentDataSourceBindingPatch,
  createAgentEventActionPatch,
  createAiRepairPromptFromIssues,
  generateAiCrudPageCandidate,
  validateAiGeneratedComponents,
  type AiAgentContextPackage,
  type AiAgentToolCall,
  type AiAgentToolDefinition,
  type AiComponentPatch,
  type AiPageGenerationRequest,
  type LowcodeComponentSchema,
} from '../../../../packages/lowcode-schema/src';
import { BusinessException } from '../../common/errors/business.exception';
import { AppErrorCode } from '../../common/errors/error-codes';
import { AiPageGeneratorService } from './ai-page-generator.service';

interface ToolRunInput {
  context: AiAgentContextPackage;
  components: LowcodeComponentSchema[];
  prompt: string;
  apiDescription?: string;
  responseSample?: unknown;
  dataSourceModel?: unknown;
}

@Injectable()
export class AiAgentToolRegistryService {
  private readonly definitions: AiAgentToolDefinition[] = [
    {
      name: 'readPageContext',
      description: '读取当前页面和选中组件摘要',
      kind: 'read',
      readOnly: true,
      timeoutMs: 1000,
    },
    {
      name: 'readMaterialCapabilities',
      description: '读取 AI 可用物料和父子关系摘要',
      kind: 'read',
      readOnly: true,
      timeoutMs: 1000,
    },
    {
      name: 'readDataSourceModels',
      description: '读取当前项目可用的数据源模型摘要',
      kind: 'read',
      readOnly: true,
      timeoutMs: 1000,
    },
    {
      name: 'generateSchemaDraft',
      description: '基于用户意图生成低代码 schema 草稿',
      kind: 'generate',
      readOnly: false,
      timeoutMs: 30000,
    },
    {
      name: 'generateCrudPage',
      description: '基于已有或临时数据源模型调用 CRUD 生成器产出候选页面',
      kind: 'generate',
      readOnly: false,
      timeoutMs: 3000,
    },
    {
      name: 'proposeSchemaPatch',
      description: '把生成草稿转换为候选 schema patch',
      kind: 'patch',
      readOnly: false,
      timeoutMs: 1000,
    },
    {
      name: 'generateEventActionPatch',
      description: '根据自然语言为目标组件生成低代码事件动作 patch',
      kind: 'patch',
      readOnly: false,
      timeoutMs: 1000,
    },
    {
      name: 'bindDataSource',
      description: '根据自然语言为 Page dataSources 和目标组件 dataSourceId 生成 patch',
      kind: 'patch',
      readOnly: false,
      timeoutMs: 1000,
    },
    {
      name: 'validateCandidate',
      description: '校验候选 patch 或组件树',
      kind: 'validate',
      readOnly: true,
      timeoutMs: 3000,
    },
  ];

  constructor(private readonly pageGenerator: AiPageGeneratorService) {}

  listDefinitions() {
    return this.definitions;
  }

  async call(toolName: string, args: Record<string, unknown>, input: ToolRunInput): Promise<AiAgentToolCall> {
    const definition = this.definitions.find((item) => item.name === toolName);
    if (!definition) {
      throw new BusinessException(
        AppErrorCode.AI_AGENT_TOOL_NOT_ALLOWED,
        `AI agent tool is not allowed: ${toolName}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const startedAt = new Date().toISOString();
    try {
      const result = await this.runTool(toolName, args, input);
      return {
        id: createId('tool'),
        toolName,
        args,
        status: 'success',
        startedAt,
        finishedAt: new Date().toISOString(),
        summary: summarizeResult(toolName, result),
        result,
      };
    } catch (error) {
      return {
        id: createId('tool'),
        toolName,
        args,
        status: 'failed',
        startedAt,
        finishedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : '工具调用失败',
      };
    }
  }

  private async runTool(toolName: string, args: Record<string, unknown>, input: ToolRunInput) {
    if (toolName === 'readPageContext') {
      return {
        targetScope: input.context.targetScope,
        selectedComponentId: input.context.selectedComponentId,
        selectedComponentPath: input.context.selectedComponentPath,
        componentCount: input.context.componentSummaries.length,
        pageFingerprint: input.context.pageFingerprint,
        dataSourceModelCount: input.context.dataSourceModels?.length || 0,
      };
    }

    if (toolName === 'readMaterialCapabilities') {
      return {
        materials: input.context.materials,
        toolPolicy: '工具只返回候选 schema 或 patch，不直接持久化页面。',
      };
    }

    if (toolName === 'readDataSourceModels') {
      return {
        models: (input.context.dataSourceModels || []).map((model) => ({
          id: model.id,
          key: model.key,
          name: model.name,
          primaryField: model.primaryField,
          fieldCount: model.fields.length,
          hasListApi: Boolean(model.listApi),
          hasCreateApi: Boolean(model.createApi),
          hasUpdateApi: Boolean(model.updateApi),
          hasDetailApi: Boolean(model.detailApi),
          hasDeleteApi: Boolean(model.deleteApi),
        })),
      };
    }

    if (toolName === 'generateSchemaDraft') {
      return this.pageGenerator.generate({
        prompt: input.prompt,
        projectId: input.context.projectId,
        pageId: input.context.pageId,
        target: input.context.targetScope === 'page' ? 'fullPage' : 'section',
        writeMode: input.context.targetScope === 'page' ? 'replacePage' : 'insertSelection',
        apiDescription: input.apiDescription,
        responseSample: input.responseSample,
        dataSourceModel: input.dataSourceModel,
        currentComponents: input.components,
      } satisfies AiPageGenerationRequest);
    }

    if (toolName === 'generateCrudPage') {
      const result = generateAiCrudPageCandidate({
        prompt: input.prompt,
        apiDescription: input.apiDescription,
        responseSample: input.responseSample,
        dataSourceModel: input.dataSourceModel,
        dataSourceModels: input.context.dataSourceModels,
        idStart: 1,
      });

      return {
        components: result.crudResult.schema.components,
        summary: `已基于${result.source === 'existingModel' ? '项目数据源模型' : '临时数据源模型'}「${result.model.name}」生成 CRUD ${result.crudResult.pageType} 页面候选。`,
        warnings: result.warnings,
        assumptions: result.assumptions,
        crud: {
          source: result.source,
          modelId: result.model.id,
          modelKey: result.model.key,
          modelName: result.model.name,
          pageType: result.crudResult.pageType,
          routePath: result.crudResult.routePath,
          generatedBy: 'data-model-crud-generation' as const,
        },
      };
    }

    if (toolName === 'proposeSchemaPatch') {
      const generatedComponents = readComponents(args.generatedComponents);
      const patch = createPatchFromGenerated(input.context, generatedComponents);
      return {
        patch,
        candidateKind: 'patch',
      };
    }

    if (toolName === 'generateEventActionPatch') {
      const result = createAgentEventActionPatch({
        components: input.components,
        prompt: input.prompt,
        selectedComponentId: input.context.selectedComponentId,
        pageFingerprint: input.context.pageFingerprint,
        apiDescription: input.apiDescription,
      });

      return {
        ...result,
        candidateKind: 'patch',
      };
    }

    if (toolName === 'bindDataSource') {
      const result = createAgentDataSourceBindingPatch({
        components: input.components,
        prompt: input.prompt,
        selectedComponentId: input.context.selectedComponentId,
        pageFingerprint: input.context.pageFingerprint,
        apiDescription: input.apiDescription,
      });

      return {
        ...result,
        candidateKind: 'patch',
      };
    }

    if (toolName === 'validateCandidate') {
      const components = args.components;
      if (Array.isArray(components)) {
        const validation = validateAiGeneratedComponents(components);
        return {
          ...validation,
          repairPrompt: createAiRepairPromptFromIssues(validation.errors),
        };
      }

      const patch = args.patch as AiComponentPatch | undefined;
      if (!patch?.operations) {
        throw new BusinessException(
          AppErrorCode.AI_AGENT_TOOL_ARGUMENT_INVALID,
          'validateCandidate requires patch.operations or components',
          HttpStatus.BAD_REQUEST,
        );
      }

      const validation = applyAiComponentPatch(input.components, patch, {
        expectedBaselineFingerprint: input.context.pageFingerprint,
        scopeRootId: Object.prototype.hasOwnProperty.call(args, 'scopeRootId')
          ? readScopeRootId(args.scopeRootId)
          : input.context.targetScope === 'page' ? undefined : input.context.selectedComponentId,
      });
      return {
        ...validation,
        repairPrompt: createAiRepairPromptFromIssues(validation.errors),
      };
    }

    throw new BusinessException(
      AppErrorCode.AI_AGENT_TOOL_NOT_ALLOWED,
      `AI agent tool is not allowed: ${toolName}`,
      HttpStatus.BAD_REQUEST,
    );
  }
}

function createPatchFromGenerated(context: AiAgentContextPackage, generatedComponents: LowcodeComponentSchema[]): AiComponentPatch {
  const page = generatedComponents.find((component) => component.name === 'Page');
  const children = page?.children?.length ? page.children : generatedComponents.filter((component) => component.name !== 'Page');
  if (context.targetScope === 'page') {
    return {
      baselineFingerprint: context.pageFingerprint,
      summary: '替换整页为 agent 候选页面。',
      operations: [
        {
          type: 'replacePage',
          components: generatedComponents,
          reason: '用户目标范围为整页。',
        },
      ],
    };
  }

  const parentId = context.selectedComponentId || 1;
  return {
    baselineFingerprint: context.pageFingerprint,
    summary: '插入 agent 生成的页面区块。',
    operations: children.map((component) => ({
      type: 'addChild',
      parentId,
      component,
      reason: '用户目标范围为当前选中组件。',
    })),
  };
}

function readComponents(value: unknown): LowcodeComponentSchema[] {
  if (Array.isArray(value)) {
    return value as LowcodeComponentSchema[];
  }
  if (value && typeof value === 'object' && Array.isArray((value as { components?: unknown }).components)) {
    return (value as { components: LowcodeComponentSchema[] }).components;
  }
  throw new BusinessException(
    AppErrorCode.AI_AGENT_TOOL_ARGUMENT_INVALID,
    'generatedComponents must be an array',
    HttpStatus.BAD_REQUEST,
  );
}

function readScopeRootId(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function summarizeResult(toolName: string, result: unknown) {
  if (toolName === 'generateSchemaDraft' && result && typeof result === 'object') {
    return (result as { summary?: string }).summary || '已生成 schema 草稿';
  }
  if (toolName === 'generateCrudPage' && result && typeof result === 'object') {
    return (result as { summary?: string }).summary || '已生成 CRUD 页面候选';
  }
  if (toolName === 'validateCandidate' && result && typeof result === 'object') {
    return (result as { valid?: boolean }).valid ? '候选修改校验通过' : '候选修改未通过校验';
  }
  return `${toolName} 调用完成`;
}

function createId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
