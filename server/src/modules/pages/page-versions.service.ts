import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { BusinessException } from '../../common/errors/business.exception';
import { AppErrorCode } from '../../common/errors/error-codes';
import { PrismaService } from '../../prisma/prisma.service';
import { PageSchemaService } from './page-schema.service';

@Injectable()
export class PageVersionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pageSchemaService: PageSchemaService,
  ) {}

  list(pageId: number) {
    return this.prisma.pageVersion.findMany({
      where: { pageId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(
    tx: Prisma.TransactionClient,
    input: {
      pageId: number;
      createdById: number;
      schema: Prisma.InputJsonValue;
      source: string;
      message?: string;
    },
  ) {
    return tx.pageVersion.create({
      data: {
        pageId: input.pageId,
        createdById: input.createdById,
        versionNo: await this.getNextVersionNo(tx, input.pageId),
        schema: input.schema,
        source: input.source,
        message: input.message,
      },
    });
  }

  async rollback(pageId: number, versionId: number, ownerId: number) {
    const version = await this.prisma.pageVersion.findFirst({
      where: {
        id: versionId,
        pageId,
      },
    });

    if (!version) {
      throw new BusinessException(
        AppErrorCode.PAGE_VERSION_NOT_FOUND,
        'Page version not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const schema = this.pageSchemaService.normalizeSchema(version.schema as Record<string, unknown>, pageId);

    return this.prisma.$transaction(async (tx) => {
      const updatedPage = await tx.page.update({
        where: { id: pageId },
        data: { schema },
      });

      await this.create(tx, {
        pageId,
        createdById: ownerId,
        schema,
        source: 'rollback',
        message: `Rollback from version ${version.versionNo}`,
      });

      return updatedPage;
    });
  }

  async delete(pageId: number, versionId: number) {
    const result = await this.prisma.pageVersion.deleteMany({
      where: {
        id: versionId,
        pageId,
      },
    });

    if (result.count === 0) {
      throw new BusinessException(
        AppErrorCode.PAGE_VERSION_NOT_FOUND,
        'Page version not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return { success: true };
  }

  private async getNextVersionNo(tx: Prisma.TransactionClient, pageId: number) {
    await tx.$executeRaw`SELECT id FROM "Page" WHERE id = ${pageId} FOR UPDATE`;

    const latestVersion = await tx.pageVersion.findFirst({
      where: { pageId },
      orderBy: { versionNo: 'desc' },
      select: { versionNo: true },
    });

    return (latestVersion?.versionNo ?? 0) + 1;
  }
}
