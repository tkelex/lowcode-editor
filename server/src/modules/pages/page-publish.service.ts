import { randomUUID } from 'crypto';
import { HttpStatus, Injectable } from '@nestjs/common';
import { BusinessException } from '../../common/errors/business.exception';
import { AppErrorCode } from '../../common/errors/error-codes';
import { PrismaService } from '../../prisma/prisma.service';
import { PageSchemaService } from './page-schema.service';
import { PageVersionsService } from './page-versions.service';

@Injectable()
export class PagePublishService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pageSchemaService: PageSchemaService,
    private readonly pageVersionsService: PageVersionsService,
  ) {}

  async publish(page: { id: number; publicId: string | null; schema: unknown }, ownerId: number) {
    const schema = this.pageSchemaService.normalizeSchema(page.schema as Record<string, unknown>, page.id);
    const publishedAt = new Date();
    const publicId = page.publicId ?? randomUUID();

    return this.prisma.$transaction(async (tx) => {
      const version = await this.pageVersionsService.create(tx, {
        pageId: page.id,
        createdById: ownerId,
        schema,
        source: 'publish',
        message: 'Publish page',
      });

      return tx.page.update({
        where: { id: page.id },
        data: {
          publicId,
          isPublished: true,
          publishedAt,
          publishedVersionId: version.id,
        },
      });
    });
  }

  unpublish(pageId: number) {
    return this.prisma.page.update({
      where: { id: pageId },
      data: { isPublished: false },
    });
  }

  async getPublished(publicId: string) {
    const page = await this.prisma.page.findFirst({
      where: {
        publicId,
        isPublished: true,
        project: {
          status: PROJECT_STATUS_ACTIVE,
        },
      },
    });

    if (!page || !page.publishedVersionId) {
      throw new BusinessException(
        AppErrorCode.PUBLISHED_PAGE_NOT_FOUND,
        'Published page not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const version = await this.prisma.pageVersion.findFirst({
      where: {
        id: page.publishedVersionId,
        pageId: page.id,
      },
    });

    if (!version) {
      throw new BusinessException(
        AppErrorCode.PUBLISHED_PAGE_NOT_FOUND,
        'Published page not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return {
      publicId: page.publicId,
      name: page.name,
      routePath: page.routePath,
      schema: version.schema,
      publishedAt: page.publishedAt,
    };
  }
}

const PROJECT_STATUS_ACTIVE = 'ACTIVE';
