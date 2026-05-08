import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma, ProjectMemberRole } from '@prisma/client';
import { BusinessException } from '../../common/errors/business.exception';
import { AppErrorCode } from '../../common/errors/error-codes';
import { AuditLogsService } from '../audit/audit-logs.service';
import {
  EDITABLE_PROJECT_ROLES,
  ProjectAccessService,
  READABLE_PROJECT_ROLES,
} from '../projects/project-access.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePageDto } from './dto/create-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';
import { PagePublishService } from './page-publish.service';
import { PageSchemaService } from './page-schema.service';
import { PageVersionsService } from './page-versions.service';

type PageWithProject = Prisma.PageGetPayload<{ include: { project: true } }>;

@Injectable()
export class PagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccessService: ProjectAccessService,
    private readonly pageSchemaService: PageSchemaService,
    private readonly pageVersionsService: PageVersionsService,
    private readonly pagePublishService: PagePublishService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async list(projectId: number, userId: number) {
    await this.projectAccessService.requireProjectRole(projectId, userId, READABLE_PROJECT_ROLES);

    return this.prisma.page.findMany({
      where: { projectId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async create(projectId: number, userId: number, dto: CreatePageDto) {
    await this.projectAccessService.requireProjectRole(projectId, userId, EDITABLE_PROJECT_ROLES);
    const schema = this.pageSchemaService.normalizeSchema(dto.schema, undefined);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const page = await tx.page.create({
          data: {
            projectId,
            createdById: userId,
            name: dto.name,
            routePath: dto.routePath,
            schema,
          },
        });

        await this.auditLogsService.record(
          {
            actorId: userId,
            projectId,
            pageId: page.id,
            action: 'page.create',
            targetType: 'page',
            targetId: page.id,
            summary: `Create page ${page.name}`,
            metadata: {
              name: page.name,
              routePath: page.routePath,
            },
          },
          tx,
        );

        return page;
      });
    } catch (error) {
      this.throwRouteConflictIfNeeded(error);
      throw error;
    }
  }

  async get(id: number, userId: number) {
    return this.getPageForAccess(id, userId, READABLE_PROJECT_ROLES);
  }

  async update(id: number, userId: number, dto: UpdatePageDto) {
    const page = await this.getPageForAccess(id, userId, EDITABLE_PROJECT_ROLES);

    try {
      if (!dto.schema) {
        return await this.prisma.$transaction(async (tx) => {
          const updatedPage = await tx.page.update({
            where: { id },
            data: {
              name: dto.name,
              routePath: dto.routePath,
            },
          });

          await this.auditLogsService.record(
            {
              actorId: userId,
              projectId: page.projectId,
              pageId: id,
              action: 'page.update',
              targetType: 'page',
              targetId: id,
              summary: `Update page ${updatedPage.name}`,
              metadata: this.getDefinedJson({
                name: dto.name,
                routePath: dto.routePath,
                schemaChanged: false,
              }),
            },
            tx,
          );

          return updatedPage;
        });
      }

      const schema = this.pageSchemaService.normalizeSchema(dto.schema, id);

      return await this.prisma.$transaction(async (tx) => {
        const updatedPage = await tx.page.update({
          where: { id },
          data: {
            name: dto.name,
            routePath: dto.routePath,
            schema,
          },
        });

        const version = await this.pageVersionsService.create(tx, {
          pageId: id,
          createdById: userId,
          schema,
          source: 'save',
        });

        await this.auditLogsService.record(
          {
            actorId: userId,
            projectId: page.projectId,
            pageId: id,
            action: 'page.update',
            targetType: 'page',
            targetId: id,
            summary: `Save page ${updatedPage.name}`,
            metadata: this.getDefinedJson({
              name: dto.name,
              routePath: dto.routePath,
              schemaChanged: true,
              versionId: version.id,
              versionNo: version.versionNo,
            }),
          },
          tx,
        );

        return updatedPage;
      });
    } catch (error) {
      this.throwRouteConflictIfNeeded(error);
      throw error;
    }
  }

  async publish(id: number, userId: number) {
    const page = await this.getPageForAccess(id, userId, EDITABLE_PROJECT_ROLES);
    const publishedPage = await this.pagePublishService.publish(page, userId);

    await this.auditLogsService.record({
      actorId: userId,
      projectId: page.projectId,
      pageId: id,
      action: 'page.publish',
      targetType: 'page',
      targetId: id,
      summary: `Publish page ${publishedPage.name}`,
      metadata: {
        publicId: publishedPage.publicId,
        publishedVersionId: publishedPage.publishedVersionId,
      },
    });

    return publishedPage;
  }

  async unpublish(id: number, userId: number) {
    const page = await this.getPageForAccess(id, userId, EDITABLE_PROJECT_ROLES);
    const unpublishedPage = await this.pagePublishService.unpublish(id);

    await this.auditLogsService.record({
      actorId: userId,
      projectId: page.projectId,
      pageId: id,
      action: 'page.unpublish',
      targetType: 'page',
      targetId: id,
      summary: `Unpublish page ${unpublishedPage.name}`,
      metadata: {
        publicId: unpublishedPage.publicId,
        publishedVersionId: unpublishedPage.publishedVersionId,
      },
    });

    return unpublishedPage;
  }

  async getPublished(publicId: string) {
    return this.pagePublishService.getPublished(publicId);
  }

  async listVersions(id: number, userId: number) {
    await this.getPageForAccess(id, userId, READABLE_PROJECT_ROLES);
    return this.pageVersionsService.list(id);
  }

  async rollback(id: number, versionId: number, userId: number) {
    const page = await this.getPageForAccess(id, userId, EDITABLE_PROJECT_ROLES);
    const updatedPage = await this.pageVersionsService.rollback(id, versionId, userId);

    await this.auditLogsService.record({
      actorId: userId,
      projectId: page.projectId,
      pageId: id,
      action: 'page.rollback',
      targetType: 'page',
      targetId: id,
      summary: `Rollback page ${updatedPage.name}`,
      metadata: { versionId },
    });

    return updatedPage;
  }

  async deleteVersion(pageId: number, versionId: number, userId: number) {
    const page = await this.getPageForAccess(pageId, userId, EDITABLE_PROJECT_ROLES);
    const result = await this.pageVersionsService.delete(pageId, versionId);

    await this.auditLogsService.record({
      actorId: userId,
      projectId: page.projectId,
      pageId,
      action: 'page.version.delete',
      targetType: 'pageVersion',
      targetId: versionId,
      summary: `Delete page version ${versionId}`,
      metadata: { versionId },
    });

    return result;
  }

  async delete(id: number, userId: number) {
    const page = await this.getPageForAccess(id, userId, EDITABLE_PROJECT_ROLES);

    await this.prisma.$transaction(async (tx) => {
      await this.auditLogsService.record(
        {
          actorId: userId,
          projectId: page.projectId,
          pageId: id,
          action: 'page.delete',
          targetType: 'page',
          targetId: id,
          summary: `Delete page ${page.name}`,
          metadata: {
            name: page.name,
            routePath: page.routePath,
          },
        },
        tx,
      );

      await tx.page.delete({ where: { id } });
    });

    return { success: true };
  }

  private async getPageForAccess(id: number, userId: number, allowedRoles: readonly ProjectMemberRole[]) {
    const page = await this.prisma.page.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!page) {
      throw new BusinessException(AppErrorCode.PAGE_NOT_FOUND, 'Page not found', HttpStatus.NOT_FOUND);
    }

    const role = await this.projectAccessService.getRoleForProject(page.project, userId);
    this.projectAccessService.assertRole(role, allowedRoles, 'Page not found');

    return page;
  }

  private throwRouteConflictIfNeeded(error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new BusinessException(
        AppErrorCode.PAGE_ROUTE_CONFLICT,
        'Page route path already exists in this project',
        HttpStatus.CONFLICT,
      );
    }
  }

  private getDefinedJson(input: Record<string, unknown>) {
    return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined)) as Prisma.InputJsonObject;
  }
}
