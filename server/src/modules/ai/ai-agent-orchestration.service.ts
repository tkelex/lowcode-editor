import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  applyAiComponentPatch,
  decideAiAgentRoute,
  isCrudRouteDecision,
  type AiAgentCandidate,
  type AiAgentCrudCandidateMetadata,
  type AiAgentRouteDecision,
  type AiAgentRunEvent,
  type AiAgentRunLimits,
  type AiAgentRunRequest,
  type AiAgentRunResult,
  type AiAgentRunStatus,
  type AiAgentToolCall,
  type AiComponentPatch,
  type AiPageGenerationResult,
  type LowcodeComponentSchema,
} from '../../../../packages/lowcode-schema/src';
import { BusinessException } from '../../common/errors/business.exception';
import { AppErrorCode } from '../../common/errors/error-codes';
import { AiAgentContextService } from './ai-agent-context.service';
import { AiAgentToolRegistryService } from './ai-agent-tool-registry.service';

interface CrudToolResult {
  components: LowcodeComponentSchema[];
  summary: string;
  warnings: string[];
  assumptions: string[];
  crud: AiAgentCrudCandidateMetadata;
}

interface SpecializedPatchToolResult {
  patch: AiComponentPatch;
  summary?: string;
  warnings?: string[];
  assumptions?: string[];
}

@Injectable()
export class AiAgentOrchestrationService {
  private readonly runs = new Map<string, AiAgentRunResult>();
  private readonly userRunStartedAt = new Map<number, number[]>();

  constructor(
    private readonly configService: ConfigService,
    private readonly contextService: AiAgentContextService,
    private readonly toolRegistry: AiAgentToolRegistryService,
  ) {}

  async run(input: AiAgentRunRequest, userId: number): Promise<AiAgentRunResult> {
    this.assertRateLimit(userId);
    const startedAt = Date.now();
    const runId = createId('agent');
    const context = this.contextService.build(input);
    const limits = this.getLimits();
    const routeDecision = decideAiAgentRoute(input);
    const events: AiAgentRunEvent[] = [];
    const toolCalls: AiAgentToolCall[] = [];
    const plan = createPlan(routeDecision).slice(0, limits.maxSteps);

    const run: AiAgentRunResult = {
      runId,
      status: 'running',
      context,
      routeDecision,
      plan,
      events,
      toolCalls,
    };
    this.runs.set(runId, run);

    try {
      this.pushEvent(events, 'message', '已识别用户意图', summarizeRouteDecision(routeDecision));
      this.pushEvent(events, 'plan', '执行计划已创建', plan.join(' / '));
      const toolInput = {
        context,
        components: input.currentComponents || [],
        prompt: input.prompt,
        apiDescription: input.apiDescription,
        responseSample: input.responseSample,
        dataSourceModel: input.dataSourceModel,
      };

      toolCalls.push(await this.toolRegistry.call('readPageContext', {}, toolInput));
      this.pushEvent(events, 'tool_call', '已读取页面上下文', lastSummary(toolCalls));
      this.assertStillRunning(runId);

      toolCalls.push(await this.toolRegistry.call('readMaterialCapabilities', {}, toolInput));
      this.pushEvent(events, 'tool_call', '已读取物料能力', lastSummary(toolCalls));
      this.assertStillRunning(runId);

      if (isCrudRouteDecision(routeDecision)) {
        return await this.runCrudGeneration({
          input,
          run,
          startedAt,
          runId,
          toolInput,
          toolCalls,
          events,
        });
      }

      if (isSpecializedPatchRoute(routeDecision)) {
        return await this.runSpecializedPatchGeneration({
          input,
          run,
          startedAt,
          runId,
          toolInput,
          toolCalls,
          events,
        });
      }

      return await this.runPatchGeneration({
        input,
        run,
        startedAt,
        runId,
        toolInput,
        toolCalls,
        events,
      });
    } catch (error) {
      run.status = run.status === 'cancelled' ? 'cancelled' : 'failed';
      run.error = error instanceof Error ? error.message : 'AI agent run failed';
      run.audit = createAudit(runId, input, run.status, startedAt, toolCalls, routeDecision, undefined, run.error);
      this.pushEvent(events, 'error', 'agent 执行失败', run.error);
      return run;
    }
  }

  getRun(runId: string) {
    const run = this.runs.get(runId);
    if (!run) {
      throw new BusinessException(AppErrorCode.AI_AGENT_RUN_NOT_FOUND, 'AI agent run not found', HttpStatus.NOT_FOUND);
    }
    return run;
  }

  cancelRun(runId: string) {
    const run = this.getRun(runId);
    if (run.status === 'running' || run.status === 'queued') {
      run.status = 'cancelled';
      this.pushEvent(run.events, 'error', '用户已取消 agent run');
    }
    return run;
  }

  private async runCrudGeneration(input: {
    input: AiAgentRunRequest;
    run: AiAgentRunResult;
    startedAt: number;
    runId: string;
    toolInput: ToolInput;
    toolCalls: AiAgentToolCall[];
    events: AiAgentRunEvent[];
  }) {
    input.toolCalls.push(await this.toolRegistry.call('readDataSourceModels', {}, input.toolInput));
    this.pushEvent(input.events, 'tool_call', '已读取数据源模型', lastSummary(input.toolCalls));
    this.assertStillRunning(input.runId);

    const generationCall = await this.toolRegistry.call('generateCrudPage', {}, input.toolInput);
    input.toolCalls.push(generationCall);
    this.pushEvent(input.events, 'tool_call', '已调用 CRUD 生成器', lastSummary(input.toolCalls));
    this.assertStillRunning(input.runId);

    if (generationCall.status !== 'success') {
      throw new BusinessException(
        AppErrorCode.AI_GENERATION_INVALID,
        generationCall.error || 'CRUD page generation failed',
        HttpStatus.BAD_REQUEST,
      );
    }

    const generation = generationCall.result as CrudToolResult;
    const validationCall = await this.toolRegistry.call('validateCandidate', { components: generation.components }, input.toolInput);
    input.toolCalls.push(validationCall);
    this.pushEvent(input.events, 'validation', 'CRUD 候选页面校验完成', lastSummary(input.toolCalls));

    const validation = validationCall.result as ReturnType<typeof applyAiComponentPatch>;
    if (!validation.valid || !validation.components) {
      return this.failValidation(input, validation.errors[0]?.message || '候选页面未通过校验');
    }

    const warnings = [...generation.warnings];
    if (input.toolInput.context.targetScope !== 'page') {
      warnings.push('CRUD 页面候选会作为整页内容应用，已将影响范围提升为整页。');
    }

    const candidate: AiAgentCandidate = {
      id: createId('candidate'),
      kind: 'components',
      summary: generation.summary,
      impactScope: 'page',
      baselineFingerprint: input.toolInput.context.pageFingerprint,
      warnings,
      assumptions: generation.assumptions,
      validationErrors: validation.errors,
      validationWarnings: validation.warnings,
      components: validation.components,
      metadata: {
        crud: generation.crud,
      },
    };

    input.run.status = 'awaiting_confirmation';
    input.run.candidate = candidate;
    input.run.audit = createAudit(input.runId, input.input, input.run.status, input.startedAt, input.toolCalls, input.run.routeDecision, candidate);
    this.pushEvent(input.events, 'candidate', 'CRUD 候选页面已准备好', candidate.summary);
    return input.run;
  }

  private async runPatchGeneration(input: {
    input: AiAgentRunRequest;
    run: AiAgentRunResult;
    startedAt: number;
    runId: string;
    toolInput: ToolInput;
    toolCalls: AiAgentToolCall[];
    events: AiAgentRunEvent[];
  }) {
    const generationCall = await this.toolRegistry.call('generateSchemaDraft', {}, input.toolInput);
    input.toolCalls.push(generationCall);
    this.pushEvent(input.events, 'tool_call', '已生成 schema 草稿', lastSummary(input.toolCalls));
    this.assertStillRunning(input.runId);

    if (generationCall.status !== 'success') {
      throw new BusinessException(
        AppErrorCode.AI_MODEL_REQUEST_FAILED,
        generationCall.error || 'AI schema draft generation failed',
        HttpStatus.BAD_GATEWAY,
      );
    }

    const generation = generationCall.result as AiPageGenerationResult;
    const patchCall = await this.toolRegistry.call(
      'proposeSchemaPatch',
      { generatedComponents: generation.components },
      input.toolInput,
    );
    input.toolCalls.push(patchCall);
    this.pushEvent(input.events, 'tool_call', '已生成候选 patch', lastSummary(input.toolCalls));

    if (patchCall.status !== 'success') {
      throw new BusinessException(
        AppErrorCode.AI_GENERATION_INVALID,
        patchCall.error || 'AI patch proposal failed',
        HttpStatus.BAD_REQUEST,
      );
    }

    const patch = (patchCall.result as { patch: AiComponentPatch }).patch;
    const validationCall = await this.toolRegistry.call('validateCandidate', { patch }, input.toolInput);
    input.toolCalls.push(validationCall);
    this.pushEvent(input.events, 'validation', '候选修改校验完成', lastSummary(input.toolCalls));

    const validation = validationCall.result as ReturnType<typeof applyAiComponentPatch>;
    if (!validation.valid || !validation.components) {
      return this.failValidation(input, validation.errors[0]?.message || '候选修改未通过校验');
    }

    const candidate: AiAgentCandidate = {
      id: createId('candidate'),
      kind: 'patch',
      summary: generation.summary,
      impactScope: input.toolInput.context.targetScope,
      baselineFingerprint: input.toolInput.context.pageFingerprint,
      warnings: generation.warnings,
      assumptions: generation.assumptions,
      validationErrors: validation.errors,
      validationWarnings: validation.warnings,
      patch,
      previewComponents: validation.components,
    };
    input.run.status = 'awaiting_confirmation';
    input.run.candidate = candidate;
    input.run.generation = generation;
    input.run.audit = createAudit(input.runId, input.input, input.run.status, input.startedAt, input.toolCalls, input.run.routeDecision, candidate);
    this.pushEvent(input.events, 'candidate', '候选修改已准备好', candidate.summary);
    return input.run;
  }

  private async runSpecializedPatchGeneration(input: {
    input: AiAgentRunRequest;
    run: AiAgentRunResult;
    startedAt: number;
    runId: string;
    toolInput: ToolInput;
    toolCalls: AiAgentToolCall[];
    events: AiAgentRunEvent[];
  }) {
    const toolName = input.run.routeDecision?.intent === 'bind-data-source'
      ? 'bindDataSource'
      : 'generateEventActionPatch';
    const patchCall = await this.toolRegistry.call(toolName, {}, input.toolInput);
    input.toolCalls.push(patchCall);
    this.pushEvent(input.events, 'tool_call', toolName === 'bindDataSource' ? '已调用数据源绑定工具' : '已调用事件动作工具', lastSummary(input.toolCalls));
    this.assertStillRunning(input.runId);

    if (patchCall.status !== 'success') {
      throw new BusinessException(
        AppErrorCode.AI_GENERATION_INVALID,
        patchCall.error || 'AI specialized patch generation failed',
        HttpStatus.BAD_REQUEST,
      );
    }

    const toolResult = patchCall.result as SpecializedPatchToolResult;
    const patch = toolResult.patch;
    const validationCall = await this.toolRegistry.call('validateCandidate', {
      patch,
      scopeRootId: undefined,
    }, input.toolInput);
    input.toolCalls.push(validationCall);
    this.pushEvent(input.events, 'validation', '专用工具候选 patch 校验完成', lastSummary(input.toolCalls));

    const validation = validationCall.result as ReturnType<typeof applyAiComponentPatch>;
    if (!validation.valid || !validation.components) {
      return this.failValidation(input, validation.errors[0]?.message || '专用工具候选 patch 未通过校验');
    }

    const candidate: AiAgentCandidate = {
      id: createId('candidate'),
      kind: 'patch',
      summary: toolResult.summary || patch.summary || '已生成专用工具候选修改',
      impactScope: input.toolInput.context.targetScope,
      baselineFingerprint: input.toolInput.context.pageFingerprint,
      warnings: toolResult.warnings || [],
      assumptions: toolResult.assumptions || [],
      validationErrors: validation.errors,
      validationWarnings: validation.warnings,
      patch,
      previewComponents: validation.components,
    };
    input.run.status = 'awaiting_confirmation';
    input.run.candidate = candidate;
    input.run.audit = createAudit(input.runId, input.input, input.run.status, input.startedAt, input.toolCalls, input.run.routeDecision, candidate);
    this.pushEvent(input.events, 'candidate', '专用工具候选修改已准备好', candidate.summary);
    return input.run;
  }

  private failValidation(
    input: {
      input: AiAgentRunRequest;
      run: AiAgentRunResult;
      startedAt: number;
      runId: string;
      toolCalls: AiAgentToolCall[];
      events: AiAgentRunEvent[];
    },
    message: string,
  ) {
    this.pushEvent(input.events, 'repair', '候选结果未通过校验', message);
    input.run.status = 'failed';
    input.run.error = message;
    input.run.audit = createAudit(input.runId, input.input, input.run.status, input.startedAt, input.toolCalls, input.run.routeDecision, undefined, input.run.error);
    return input.run;
  }

  private getLimits(): AiAgentRunLimits {
    return {
      maxSteps: Number(this.configService.get<string>('AI_AGENT_MAX_STEPS') || 8),
      maxRepairs: Number(this.configService.get<string>('AI_AGENT_MAX_REPAIRS') || 1),
      timeoutMs: Number(this.configService.get<string>('AI_AGENT_TIMEOUT_MS') || 45000),
      maxContextComponents: Number(this.configService.get<string>('AI_AGENT_MAX_CONTEXT_COMPONENTS') || 80),
    };
  }

  private assertRateLimit(userId: number) {
    const now = Date.now();
    const windowMs = 60_000;
    const maxRuns = Number(this.configService.get<string>('AI_AGENT_RATE_LIMIT_PER_MINUTE') || 12);
    const recentRuns = (this.userRunStartedAt.get(userId) || []).filter((time) => now - time < windowMs);
    if (recentRuns.length >= maxRuns) {
      throw new BusinessException(
        AppErrorCode.AI_AGENT_RATE_LIMITED,
        'AI agent run rate limit exceeded',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    recentRuns.push(now);
    this.userRunStartedAt.set(userId, recentRuns);
  }

  private assertStillRunning(runId: string) {
    const run = this.runs.get(runId);
    if (run?.status === 'cancelled') {
      throw new BusinessException(AppErrorCode.AI_AGENT_CANCELLED, 'AI agent run cancelled', HttpStatus.BAD_REQUEST);
    }
  }

  private pushEvent(
    events: AiAgentRunEvent[],
    type: AiAgentRunEvent['type'],
    title: string,
    detail?: string,
  ) {
    events.push({
      id: createId('event'),
      type,
      title,
      detail,
      createdAt: new Date().toISOString(),
    });
  }
}

type ToolInput = {
  context: ReturnType<AiAgentContextService['build']>;
  components: LowcodeComponentSchema[];
  prompt: string;
  apiDescription?: string;
  responseSample?: unknown;
  dataSourceModel?: unknown;
};

function createPlan(routeDecision: AiAgentRouteDecision) {
  if (isCrudRouteDecision(routeDecision)) {
    return [
      '读取当前页面上下文',
      '读取可用物料和数据源模型',
      '识别 CRUD 请求并整理生成选项',
      '调用 CRUD 生成器产出候选页面',
      '校验候选页面并等待用户确认',
    ];
  }

  if (isSpecializedPatchRoute(routeDecision)) {
    return [
      '读取当前页面上下文',
      '读取可用物料和工具边界',
      `调用${routeDecision.intent === 'bind-data-source' ? '数据源绑定' : '事件动作'}专用工具`,
      '校验候选 patch',
      '等待用户确认应用',
    ];
  }

  return [
    '读取当前页面上下文',
    '读取可用物料和工具边界',
    `按 ${toIntentLabel(routeDecision.intent)} 生成低代码 schema 草稿`,
    '转换为候选 patch',
    '校验候选修改并等待用户确认',
  ];
}

function isSpecializedPatchRoute(routeDecision: AiAgentRouteDecision) {
  return routeDecision.intent === 'add-event-action' || routeDecision.intent === 'bind-data-source';
}

function createAudit(
  runId: string,
  input: AiAgentRunRequest,
  status: AiAgentRunStatus,
  startedAt: number,
  toolCalls: AiAgentToolCall[],
  routeDecision?: AiAgentRouteDecision,
  candidate?: AiAgentCandidate,
  failureReason?: string,
) {
  return {
    runId,
    projectId: input.projectId,
    pageId: input.pageId,
    status,
    targetScope: input.targetScope || (input.selectedComponentId ? 'selection' : 'page'),
    durationMs: Date.now() - startedAt,
    toolCallCount: toolCalls.length,
    warningCount: candidate?.warnings.length || 0,
    failureReason,
    candidateKind: candidate?.kind,
    routeIntent: routeDecision?.intent,
    routeFallback: routeDecision?.fallback,
  };
}

function summarizeRouteDecision(routeDecision: AiAgentRouteDecision) {
  const confidence = Math.round(routeDecision.confidence * 100);
  const reasons = routeDecision.reasons.length > 0 ? `；原因：${routeDecision.reasons.join('、')}` : '';
  const fallback = routeDecision.fallback ? `；降级：${routeDecision.fallback}` : '';
  return `意图：${toIntentLabel(routeDecision.intent)}；置信度：${confidence}%；工具：${toToolLabel(routeDecision.preferredTool)}；影响范围：${routeDecision.targetScope}${reasons}${fallback}`;
}

function toIntentLabel(intent: AiAgentRouteDecision['intent']) {
  const labels: Record<AiAgentRouteDecision['intent'], string> = {
    'crud-page': 'CRUD 页面',
    'free-page': '普通页面生成',
    'edit-selected': '选中组件修改',
    'style-polish': '样式优化',
    'bind-data-source': '数据源绑定',
    'add-event-action': '事件动作配置',
    'fix-page-issue': '页面问题修复',
  };
  return labels[intent];
}

function toToolLabel(tool: AiAgentRouteDecision['preferredTool']) {
  const labels: Record<AiAgentRouteDecision['preferredTool'], string> = {
    'crud-generator': '确定性 CRUD 生成器',
    'schema-draft': 'schema 草稿生成',
    'schema-patch': 'schema patch',
    'data-source-patch': '数据源 patch',
    'event-action-patch': '事件动作 patch',
    'diagnostic-patch': '诊断修复 patch',
  };
  return labels[tool];
}

function lastSummary(toolCalls: AiAgentToolCall[]) {
  const last = toolCalls[toolCalls.length - 1];
  return last?.summary || last?.error;
}

function createId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
