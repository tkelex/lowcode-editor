import { randomUUID } from 'crypto';
import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  builtinComponentSchemaRegistry,
  migratePageSchema,
  validateComponentTree,
} from '@lowcode/schema';
import { BusinessException } from '../../common/errors/business.exception';
import { AppErrorCode } from '../../common/errors/error-codes';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuditLogsService } from '../audit/audit-logs.service';
import { CreatePageDto } from './dto/create-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';
import { PublishedPageRevalidateService } from './published-page-revalidate.service';

type UnpublishOrigin = 'member' | 'admin';

interface AccessiblePage {
  id: number;
  projectId: number;
  name: string;
  routePath: string;
  publicId?: string | null;
}

@Injectable()
export class PageLifecycleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly publishedPageRevalidateService: PublishedPageRevalidateService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  create(projectId: number, actorId: number, dto: CreatePageDto) {
    const schema = this.normalizeSchema(dto.schema, undefined);

    return this.prisma.$transaction(async (tx) => {
      const page = await tx.page.create({
        data: {
          projectId,
          createdById: actorId,
          name: dto.name,
          routePath: dto.routePath,
          schema,
        },
      });

      await this.auditLogsService.record(
        {
          actorId,
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
  }

  update(page: AccessiblePage, actorId: number, dto: UpdatePageDto) {
    if (!dto.schema) {
      return this.prisma.$transaction(async (tx) => {
        const updatedPage = await tx.page.update({
          where: { id: page.id },
          data: {
            name: dto.name,
            routePath: dto.routePath,
          },
        });

        await this.auditLogsService.record(
          {
            actorId,
            projectId: page.projectId,
            pageId: page.id,
            action: 'page.update',
            targetType: 'page',
            targetId: page.id,
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

    const schema = this.normalizeSchema(dto.schema, page.id);

    return this.prisma.$transaction(async (tx) => {
      await this.lockPage(tx, page.id);
      const updatedPage = await tx.page.update({
        where: { id: page.id },
        data: {
          name: dto.name,
          routePath: dto.routePath,
          schema,
        },
      });
      const version = await this.createVersion(tx, {
        pageId: page.id,
        createdById: actorId,
        schema,
        source: 'save',
      });

      await this.auditLogsService.record(
        {
          actorId,
          projectId: page.projectId,
          pageId: page.id,
          action: 'page.update',
          targetType: 'page',
          targetId: page.id,
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
  }

  async publish(pageId: number, actorId: number) {
    const publishedPage = await this.prisma.$transaction(async (tx) => {
      await this.lockPage(tx, pageId);
      const page = await tx.page.findUnique({ where: { id: pageId } });
      if (!page) {
        throw this.pageNotFound();
      }

      const schema = this.normalizeSchema(page.schema as Record<string, unknown>, page.id);
      const version = await this.createVersion(tx, {
        pageId,
        createdById: actorId,
        schema,
        source: 'publish',
        message: 'Publish page',
      });
      const updatedPage = await tx.page.update({
        where: { id: pageId },
        data: {
          publicId: page.publicId ?? randomUUID(),
          isPublished: true,
          publishedAt: new Date(),
          publishedVersionId: version.id,
        },
      });

      await this.auditLogsService.record(
        {
          actorId,
          projectId: page.projectId,
          pageId,
          action: 'page.publish',
          targetType: 'page',
          targetId: pageId,
          summary: `Publish page ${updatedPage.name}`,
          metadata: {
            publicId: updatedPage.publicId,
            publishedVersionId: version.id,
          },
        },
        tx,
      );

      return updatedPage;
    });

    await this.publishedPageRevalidateService.revalidate(publishedPage.publicId);
    return publishedPage;
  }

  async unpublish(pageId: number, actorId: number, origin: UnpublishOrigin) {
    const unpublishedPage = await this.prisma.$transaction(async (tx) => {
      await this.lockPage(tx, pageId);
      const page = await tx.page.findUnique({ where: { id: pageId } });
      if (!page) {
        throw this.pageNotFound();
      }

      const updatedPage = await tx.page.update({
        where: { id: pageId },
        data: {
          isPublished: false,
          publishedVersionId: null,
        },
      });

      await this.auditLogsService.record(
        {
          actorId,
          projectId: page.projectId,
          pageId,
          action: origin === 'admin' ? 'admin.page.unpublish' : 'page.unpublish',
          targetType: 'page',
          targetId: pageId,
          summary: `${origin === 'admin' ? 'Admin unpublish' : 'Unpublish'} page ${page.name}`,
          metadata: {
            publicId: page.publicId,
            publishedVersionId: page.publishedVersionId,
          },
        },
        tx,
      );

      return updatedPage;
    });

    await this.publishedPageRevalidateService.revalidate(unpublishedPage.publicId);
    return unpublishedPage;
  }

  async unpublishProjectPages(tx: Prisma.TransactionClient, projectId: number) {
    const pages = await tx.page.findMany({
      where: { projectId, isPublished: true },
      select: { publicId: true },
    });

    await tx.page.updateMany({
      where: { projectId, isPublished: true },
      data: {
        isPublished: false,
        publishedVersionId: null,
      },
    });

    return pages
      .map((page) => page.publicId)
      .filter((publicId): publicId is string => Boolean(publicId));
  }

  async revalidatePublishedPages(publicIds: readonly string[]) {
    await Promise.all(
      publicIds.map((publicId) => this.publishedPageRevalidateService.revalidate(publicId)),
    );
  }

  listVersions(pageId: number) {
    return this.prisma.pageVersion.findMany({
      where: { pageId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async rollback(pageId: number, versionId: number, actorId: number) {
    return this.prisma.$transaction(async (tx) => {
      await this.lockPage(tx, pageId);
      const [page, version] = await Promise.all([
        tx.page.findUnique({ where: { id: pageId } }),
        tx.pageVersion.findFirst({ where: { id: versionId, pageId } }),
      ]);
      if (!page) {
        throw this.pageNotFound();
      }
      if (!version) {
        throw this.versionNotFound();
      }

      const schema = this.normalizeSchema(version.schema as Record<string, unknown>, pageId);
      const updatedPage = await tx.page.update({
        where: { id: pageId },
        data: { schema },
      });
      const rollbackVersion = await this.createVersion(tx, {
        pageId,
        createdById: actorId,
        schema,
        source: 'rollback',
        message: `Rollback from version ${version.versionNo}`,
      });

      await this.auditLogsService.record(
        {
          actorId,
          projectId: page.projectId,
          pageId,
          action: 'page.rollback',
          targetType: 'page',
          targetId: pageId,
          summary: `Rollback page ${updatedPage.name}`,
          metadata: {
            versionId,
            rollbackVersionId: rollbackVersion.id,
          },
        },
        tx,
      );

      return updatedPage;
    });
  }

  deleteVersion(pageId: number, versionId: number, actorId: number) {
    return this.prisma.$transaction(async (tx) => {
      await this.lockPage(tx, pageId);
      const page = await tx.page.findUnique({ where: { id: pageId } });
      if (!page) {
        throw this.pageNotFound();
      }
      if (page.publishedVersionId === versionId) {
        throw new BusinessException(
          AppErrorCode.PAGE_VERSION_IN_USE,
          'Published page version cannot be deleted before unpublishing',
          HttpStatus.CONFLICT,
        );
      }

      const result = await tx.pageVersion.deleteMany({
        where: { id: versionId, pageId },
      });
      if (result.count === 0) {
        throw this.versionNotFound();
      }

      await this.auditLogsService.record(
        {
          actorId,
          projectId: page.projectId,
          pageId,
          action: 'page.version.delete',
          targetType: 'pageVersion',
          targetId: versionId,
          summary: `Delete page version ${versionId}`,
          metadata: { versionId },
        },
        tx,
      );

      return { success: true };
    });
  }

  async delete(page: AccessiblePage, actorId: number) {
    const result = await this.prisma.$transaction(async (tx) => {
      await this.auditLogsService.record(
        {
          actorId,
          projectId: page.projectId,
          pageId: page.id,
          action: 'page.delete',
          targetType: 'page',
          targetId: page.id,
          summary: `Delete page ${page.name}`,
          metadata: {
            name: page.name,
            routePath: page.routePath,
          },
        },
        tx,
      );
      await tx.page.delete({ where: { id: page.id } });
      return { success: true };
    });

    await this.revalidatePublishedPages(page.publicId ? [page.publicId] : []);
    return result;
  }

  async getPublished(publicId: string) {
    const page = await this.prisma.page.findFirst({
      where: {
        publicId,
        isPublished: true,
        project: { status: PROJECT_STATUS_ACTIVE },
      },
    });
    if (!page || !page.publishedVersionId) {
      throw this.publishedPageNotFound();
    }

    const version = await this.prisma.pageVersion.findFirst({
      where: { id: page.publishedVersionId, pageId: page.id },
    });
    if (!version) {
      throw this.publishedPageNotFound();
    }

    return {
      publicId: page.publicId,
      name: page.name,
      routePath: page.routePath,
      schema: version.schema,
      publishedAt: page.publishedAt,
    };
  }

  private normalizeSchema(
    schema: Record<string, unknown> | undefined,
    pageId: number | undefined,
  ): Prisma.InputJsonValue {
    const now = new Date().toISOString();
    const nextSchema = migratePageSchema(schema, { pageId: pageId ?? null, now });
    const validation = validateComponentTree(nextSchema.components, builtinComponentSchemaRegistry);

    if (!validation.valid || !validation.components) {
      throw new BusinessException(
        AppErrorCode.PAGE_SCHEMA_INVALID,
        validation.errors[0] || 'Page schema is invalid',
        HttpStatus.BAD_REQUEST,
        { errors: validation.errors },
      );
    }

    return {
      ...nextSchema,
      components: validation.components,
      metadata: {
        ...(typeof nextSchema.metadata === 'object' && nextSchema.metadata !== null ? nextSchema.metadata : {}),
        updatedAt: now,
      },
    } as unknown as Prisma.InputJsonValue;
  }

  private createVersion(
    tx: Prisma.TransactionClient,
    input: {
      pageId: number;
      createdById: number;
      schema: Prisma.InputJsonValue;
      source: string;
      message?: string;
    },
  ) {
    return this.getNextVersionNo(tx, input.pageId).then((versionNo) => tx.pageVersion.create({
      data: {
        ...input,
        versionNo,
      },
    }));
  }

  private async getNextVersionNo(tx: Prisma.TransactionClient, pageId: number) {
    const latestVersion = await tx.pageVersion.findFirst({
      where: { pageId },
      orderBy: { versionNo: 'desc' },
      select: { versionNo: true },
    });
    return (latestVersion?.versionNo ?? 0) + 1;
  }

  private lockPage(tx: Prisma.TransactionClient, pageId: number) {
    return tx.$executeRaw`SELECT id FROM "Page" WHERE id = ${pageId} FOR UPDATE`;
  }

  private getDefinedJson(input: Record<string, unknown>) {
    return Object.fromEntries(
      Object.entries(input).filter(([, value]) => value !== undefined),
    ) as Prisma.InputJsonObject;
  }

  private pageNotFound() {
    return new BusinessException(AppErrorCode.PAGE_NOT_FOUND, 'Page not found', HttpStatus.NOT_FOUND);
  }

  private versionNotFound() {
    return new BusinessException(
      AppErrorCode.PAGE_VERSION_NOT_FOUND,
      'Page version not found',
      HttpStatus.NOT_FOUND,
    );
  }

  private publishedPageNotFound() {
    return new BusinessException(
      AppErrorCode.PUBLISHED_PAGE_NOT_FOUND,
      'Published page not found',
      HttpStatus.NOT_FOUND,
    );
  }
}

const PROJECT_STATUS_ACTIVE = 'ACTIVE';
