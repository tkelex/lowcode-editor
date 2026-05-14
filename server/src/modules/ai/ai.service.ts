import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { AiAgentRunResult, AiPageGenerationRequest } from '../../../../packages/lowcode-schema/src';
import { BusinessException } from '../../common/errors/business.exception';
import { AppErrorCode } from '../../common/errors/error-codes';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogsService } from '../audit/audit-logs.service';
import {
  EDITABLE_PROJECT_ROLES,
  READABLE_PROJECT_ROLES,
  ProjectAccessService,
} from '../projects/project-access.service';
import { AiAgentOrchestrationService } from './ai-agent-orchestration.service';
import { CreateAiAgentRunDto } from './dto/create-ai-agent-run.dto';
import { GenerateAiPageDto } from './dto/generate-ai-page.dto';
import { AiPageGeneratorService } from './ai-page-generator.service';

@Injectable()
export class AiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccessService: ProjectAccessService,
    private readonly auditLogsService: AuditLogsService,
    private readonly pageGenerator: AiPageGeneratorService,
    private readonly agentOrchestration: AiAgentOrchestrationService,
  ) {}

  async generateForProject(projectId: number, userId: number, dto: GenerateAiPageDto) {
    await this.projectAccessService.requireProjectRole(projectId, userId, EDITABLE_PROJECT_ROLES);
    return this.generateAndAudit({
      userId,
      projectId,
      targetType: 'project',
      targetId: projectId,
      dto,
    });
  }

  async generateForPage(pageId: number, userId: number, dto: GenerateAiPageDto) {
    const page = await this.prisma.page.findUnique({
      where: { id: pageId },
      include: { project: true },
    });

    if (!page) {
      throw new BusinessException(AppErrorCode.PAGE_NOT_FOUND, 'Page not found', HttpStatus.NOT_FOUND);
    }

    this.projectAccessService.assertProjectActive(page.project);
    const role = await this.projectAccessService.getRoleForProject(page.project, userId);
    this.projectAccessService.assertRole(role, EDITABLE_PROJECT_ROLES, 'Page not found');

    return this.generateAndAudit({
      userId,
      projectId: page.projectId,
      pageId: page.id,
      targetType: 'page',
      targetId: page.id,
      dto,
      currentComponents: readCurrentComponents(page.schema),
    });
  }

  async createAgentRunForProject(projectId: number, userId: number, dto: CreateAiAgentRunDto) {
    await this.projectAccessService.requireProjectRole(projectId, userId, EDITABLE_PROJECT_ROLES);
    const result = await this.agentOrchestration.run({
      ...dto,
      projectId,
      currentComponents: dto.currentComponents,
      targetScope: dto.targetScope || 'page',
    }, userId);
    await this.recordAgentAudit(result, userId, projectId);
    return result;
  }

  async createAgentRunForPage(pageId: number, userId: number, dto: CreateAiAgentRunDto) {
    const page = await this.prisma.page.findUnique({
      where: { id: pageId },
      include: { project: true },
    });

    if (!page) {
      throw new BusinessException(AppErrorCode.PAGE_NOT_FOUND, 'Page not found', HttpStatus.NOT_FOUND);
    }

    this.projectAccessService.assertProjectActive(page.project);
    const role = await this.projectAccessService.getRoleForProject(page.project, userId);
    this.projectAccessService.assertRole(role, EDITABLE_PROJECT_ROLES, 'Page not found');

    const result = await this.agentOrchestration.run({
      ...dto,
      projectId: page.projectId,
      pageId: page.id,
      currentComponents: dto.currentComponents || readCurrentComponents(page.schema),
      selectedComponentId: dto.selectedComponentId || readSelectedComponentId(dto.context),
      targetScope: dto.targetScope || (dto.selectedComponentId ? 'selection' : 'page'),
    }, userId);
    await this.recordAgentAudit(result, userId, page.projectId, page.id);
    return result;
  }

  async getAgentRun(runId: string, userId: number) {
    const run = this.agentOrchestration.getRun(runId);
    await this.assertCanReadAgentRun(run, userId);
    return run;
  }

  async cancelAgentRun(runId: string, userId: number) {
    const run = this.agentOrchestration.getRun(runId);
    await this.assertCanReadAgentRun(run, userId);
    return this.agentOrchestration.cancelRun(runId);
  }

  private async generateAndAudit(input: {
    userId: number;
    projectId: number;
    pageId?: number;
    targetType: string;
    targetId: number;
    dto: GenerateAiPageDto;
    currentComponents?: AiPageGenerationRequest['currentComponents'];
  }) {
    const startedAt = Date.now();
    try {
      const result = await this.pageGenerator.generate({
        ...input.dto,
        projectId: input.projectId,
        pageId: input.pageId,
        currentComponents: input.currentComponents,
      });

      await this.auditLogsService.record({
        actorId: input.userId,
        projectId: input.projectId,
        pageId: input.pageId,
        action: 'ai.page.generate',
        targetType: input.targetType,
        targetId: input.targetId,
        summary: `Generate AI page draft: ${truncate(input.dto.prompt, 80)}`,
        metadata: toPrismaJson({
          prompt: truncate(input.dto.prompt, 500),
          target: input.dto.target,
          writeMode: input.dto.writeMode,
          durationMs: Date.now() - startedAt,
          status: 'success',
          warningCount: result.warnings.length,
          assumptionCount: result.assumptions.length,
          source: result.metadata?.source,
        }),
      });

      return result;
    } catch (error) {
      await this.auditLogsService.record({
        actorId: input.userId,
        projectId: input.projectId,
        pageId: input.pageId,
        action: 'ai.page.generate.failed',
        targetType: input.targetType,
        targetId: input.targetId,
        summary: `AI page generation failed: ${truncate(input.dto.prompt, 80)}`,
        metadata: toPrismaJson({
          prompt: truncate(input.dto.prompt, 500),
          target: input.dto.target,
          writeMode: input.dto.writeMode,
          durationMs: Date.now() - startedAt,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        }),
      });
      throw error;
    }
  }

  private async assertCanReadAgentRun(run: AiAgentRunResult, userId: number) {
    const projectId = run.context.projectId;
    if (!projectId) {
      throw new BusinessException(AppErrorCode.AI_AGENT_RUN_NOT_FOUND, 'AI agent run not found', HttpStatus.NOT_FOUND);
    }

    await this.projectAccessService.requireProjectRole(projectId, userId, READABLE_PROJECT_ROLES);
  }

  private async recordAgentAudit(result: AiAgentRunResult, userId: number, projectId: number, pageId?: number) {
    const action = result.status === 'failed' ? 'ai.agent.run.failed' : 'ai.agent.run';
    await this.auditLogsService.record({
      actorId: userId,
      projectId,
      pageId,
      action,
      targetType: pageId ? 'page' : 'project',
      targetId: pageId || projectId,
      summary: `${result.status === 'failed' ? 'AI agent run failed' : 'Run AI agent'}: ${truncate(result.context.userPrompt, 80)}`,
      metadata: toPrismaJson({
        prompt: truncate(result.context.userPrompt, 500),
        runId: result.runId,
        status: result.status,
        targetScope: result.context.targetScope,
        selectedComponentId: result.context.selectedComponentId,
        toolCallCount: result.toolCalls.length,
        warningCount: result.candidate?.warnings.length || 0,
        candidateKind: result.candidate?.kind,
        error: result.error,
      }),
    });
  }
}

function readCurrentComponents(schema: Prisma.JsonValue) {
  if (isRecord(schema) && Array.isArray(schema.components)) {
    return schema.components as unknown as AiPageGenerationRequest['currentComponents'];
  }
  return undefined;
}

function truncate(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
}

function readSelectedComponentId(context: Record<string, unknown> | undefined) {
  const value = context?.selectedComponentId;
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function toPrismaJson(value: Record<string, unknown>) {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonObject;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
