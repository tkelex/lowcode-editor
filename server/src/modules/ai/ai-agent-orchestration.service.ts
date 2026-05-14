import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  applyAiComponentPatch,
  type AiAgentCandidate,
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
    const events: AiAgentRunEvent[] = [];
    const toolCalls: AiAgentToolCall[] = [];
    const plan = [
      '读取当前页面上下文',
      '读取可用物料和工具边界',
      '生成低代码 schema 草稿',
      '转换为候选 patch',
      '校验候选修改并等待用户确认',
    ].slice(0, limits.maxSteps);

    const run: AiAgentRunResult = {
      runId,
      status: 'running',
      context,
      plan,
      events,
      toolCalls,
    };
    this.runs.set(runId, run);

    try {
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

      const generationCall = await this.toolRegistry.call('generateSchemaDraft', {}, toolInput);
      toolCalls.push(generationCall);
      this.pushEvent(events, 'tool_call', '已生成 schema 草稿', lastSummary(toolCalls));
      this.assertStillRunning(runId);

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
        toolInput,
      );
      toolCalls.push(patchCall);
      this.pushEvent(events, 'tool_call', '已生成候选 patch', lastSummary(toolCalls));

      if (patchCall.status !== 'success') {
        throw new BusinessException(
          AppErrorCode.AI_GENERATION_INVALID,
          patchCall.error || 'AI patch proposal failed',
          HttpStatus.BAD_REQUEST,
        );
      }

      const patch = (patchCall.result as { patch: AiComponentPatch }).patch;
      const validationCall = await this.toolRegistry.call('validateCandidate', { patch }, toolInput);
      toolCalls.push(validationCall);
      this.pushEvent(events, 'validation', '候选修改校验完成', lastSummary(toolCalls));

      const validation = validationCall.result as ReturnType<typeof applyAiComponentPatch>;
      if (!validation.valid || !validation.components) {
        this.pushEvent(events, 'repair', '候选修改未通过校验', validation.errors[0]?.message || '校验失败');
        run.status = 'failed';
        run.error = validation.errors[0]?.message || '候选修改未通过校验';
        run.audit = createAudit(runId, input, run.status, startedAt, toolCalls, undefined, run.error);
        return run;
      }

      const candidate: AiAgentCandidate = {
        id: createId('candidate'),
        kind: 'patch',
        summary: generation.summary,
        impactScope: context.targetScope,
        baselineFingerprint: context.pageFingerprint,
        warnings: generation.warnings,
        assumptions: generation.assumptions,
        validationErrors: validation.errors,
        validationWarnings: validation.warnings,
        patch,
        previewComponents: validation.components,
      };
      run.status = 'awaiting_confirmation';
      run.candidate = candidate;
      run.generation = generation;
      run.audit = createAudit(runId, input, run.status, startedAt, toolCalls, candidate);
      this.pushEvent(events, 'candidate', '候选修改已准备好', candidate.summary);
      return run;
    } catch (error) {
      run.status = run.status === 'cancelled' ? 'cancelled' : 'failed';
      run.error = error instanceof Error ? error.message : 'AI agent run failed';
      run.audit = createAudit(runId, input, run.status, startedAt, toolCalls, undefined, run.error);
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

function createAudit(
  runId: string,
  input: AiAgentRunRequest,
  status: AiAgentRunStatus,
  startedAt: number,
  toolCalls: AiAgentToolCall[],
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
  };
}

function lastSummary(toolCalls: AiAgentToolCall[]) {
  const last = toolCalls[toolCalls.length - 1];
  return last?.summary || last?.error;
}

function createId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
