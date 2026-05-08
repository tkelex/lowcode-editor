import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma, ProjectMemberRole } from '@prisma/client';
import { BusinessException } from '../../common/errors/business.exception';
import { AppErrorCode } from '../../common/errors/error-codes';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogsService } from '../audit/audit-logs.service';
import {
  EDITABLE_PROJECT_ROLES,
  ProjectAccessService,
  READABLE_PROJECT_ROLES,
} from '../projects/project-access.service';
import { CreateTemplateDto } from './dto/create-template.dto';

@Injectable()
export class TemplatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccessService: ProjectAccessService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async list(projectId: number, userId: number) {
    await this.projectAccessService.requireProjectRole(projectId, userId, READABLE_PROJECT_ROLES);

    return this.prisma.pageTemplate.findMany({
      where: {
        OR: [
          { projectId },
          { visibility: 'private', createdById: userId },
        ],
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async create(projectId: number, userId: number, dto: CreateTemplateDto) {
    await this.projectAccessService.requireProjectRole(projectId, userId, EDITABLE_PROJECT_ROLES);

    const template = await this.prisma.$transaction(async (tx) => {
      const createdTemplate = await tx.pageTemplate.create({
        data: {
          projectId: dto.visibility === 'private' ? null : projectId,
          createdById: userId,
          type: dto.type,
          title: dto.title,
          description: dto.description,
          category: dto.category,
          tags: dto.tags ?? [],
          schema: dto.schema as Prisma.InputJsonValue,
          visibility: dto.visibility ?? 'project',
        },
      });

      await this.auditLogsService.record(
        {
          actorId: userId,
          projectId,
          action: 'template.create',
          targetType: 'pageTemplate',
          targetId: createdTemplate.id,
          summary: `Create template ${createdTemplate.title}`,
          metadata: {
            type: createdTemplate.type,
            visibility: createdTemplate.visibility,
          },
        },
        tx,
      );

      return createdTemplate;
    });

    return template;
  }

  async delete(projectId: number, templateId: number, userId: number) {
    const { role } = await this.projectAccessService.requireProjectRole(projectId, userId, READABLE_PROJECT_ROLES);
    const template = await this.prisma.pageTemplate.findFirst({
      where: {
        id: templateId,
        OR: [
          { projectId },
          { visibility: 'private', createdById: userId },
        ],
      },
    });

    if (!template) {
      throw new BusinessException(AppErrorCode.NOT_FOUND, 'Template not found', HttpStatus.NOT_FOUND);
    }

    const canDelete = role === ProjectMemberRole.OWNER || template.createdById === userId;
    if (!canDelete) {
      throw new BusinessException(
        AppErrorCode.PROJECT_FORBIDDEN,
        'No permission to delete template',
        HttpStatus.FORBIDDEN,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await this.auditLogsService.record(
        {
          actorId: userId,
          projectId,
          action: 'template.delete',
          targetType: 'pageTemplate',
          targetId: template.id,
          summary: `Delete template ${template.title}`,
          metadata: {
            type: template.type,
            visibility: template.visibility,
          },
        },
        tx,
      );

      await tx.pageTemplate.delete({ where: { id: template.id } });
    });

    return { success: true };
  }
}
