import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { AiPageGenerationRequest } from '@lowcode/schema';
import { BusinessException } from '../../common/errors/business.exception';
import { AppErrorCode } from '../../common/errors/error-codes';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuditLogsService } from '../audit/audit-logs.service';
import { DataSourceModelsService } from '../data-source-models/data-source-models.service';
import {
  EDITABLE_PROJECT_ROLES,
  ProjectAccessService,
} from '../projects/project-access.service';
import { AiAgentRunStore } from './ai-agent-run-store.service';
import { CreateAiAgentRunDto } from './dto/create-ai-agent-run.dto';
import { GenerateAiPageDto } from './dto/generate-ai-page.dto';
import { AiPageGeneratorService } from './ai-page-generator.service';

@Injectable()
export class AiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccessService: ProjectAccessService,
    private readonly auditLogsService: AuditLogsService,
    private readonly dataSourceModelsService: DataSourceModelsService,
    private readonly pageGenerator: AiPageGeneratorService,
    private readonly agentRuns: AiAgentRunStore,
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
    return this.agentRuns.enqueue({
      ...dto,
      projectId,
      currentComponents: dto.currentComponents,
      targetScope: dto.targetScope || 'page',
      dataSourceModels: await this.dataSourceModelsService.list(projectId, userId),
    }, userId);
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

    return this.agentRuns.enqueue({
      ...dto,
      projectId: page.projectId,
      pageId: page.id,
      currentComponents: dto.currentComponents || readCurrentComponents(page.schema),
      selectedComponentId: dto.selectedComponentId || readSelectedComponentId(dto.context),
      targetScope: dto.targetScope || (dto.selectedComponentId ? 'selection' : 'page'),
      dataSourceModels: await this.dataSourceModelsService.list(page.projectId, userId),
    }, userId);
  }

  async getAgentRun(runId: string, userId: number) {
    return this.agentRuns.get(runId, userId);
  }

  async cancelAgentRun(runId: string, userId: number) {
    return this.agentRuns.cancel(runId, userId);
  }

  async listAgentRunsForProject(projectId: number, userId: number) {
    return this.agentRuns.list(projectId, userId);
  }

  async listAgentRunsForPage(pageId: number, userId: number) {
    const page = await this.prisma.page.findUnique({ where: { id: pageId }, select: { projectId: true } });
    if (!page) throw new BusinessException(AppErrorCode.PAGE_NOT_FOUND, 'Page not found', HttpStatus.NOT_FOUND);
    return this.agentRuns.list(page.projectId, userId, pageId);
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
