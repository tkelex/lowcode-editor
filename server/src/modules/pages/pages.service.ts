import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectsService } from '../projects/projects.service';
import { CreatePageDto } from './dto/create-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';

const defaultSchema = {
  schemaVersion: '1.0.0',
  components: [
    {
      id: 1,
      name: 'Page',
      props: {},
      desc: '页面',
    },
  ],
  metadata: {},
};

@Injectable()
export class PagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectsService: ProjectsService,
  ) {}

  async list(projectId: number, ownerId: number) {
    await this.projectsService.getOwnedProject(projectId, ownerId);

    return this.prisma.page.findMany({
      where: { projectId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async create(projectId: number, ownerId: number, dto: CreatePageDto) {
    await this.projectsService.getOwnedProject(projectId, ownerId);

    try {
      return await this.prisma.page.create({
        data: {
          projectId,
          createdById: ownerId,
          name: dto.name,
          routePath: dto.routePath,
          schema: this.normalizeSchema(dto.schema, undefined),
        },
      });
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('Page route path already exists in this project');
      }

      throw error;
    }
  }

  async get(id: number, ownerId: number) {
    return this.getOwnedPage(id, ownerId);
  }

  async update(id: number, ownerId: number, dto: UpdatePageDto) {
    await this.getOwnedPage(id, ownerId);

    if (!dto.schema) {
      return this.prisma.page.update({
        where: { id },
        data: {
          name: dto.name,
          routePath: dto.routePath,
        },
      });
    }

    const schema = this.normalizeSchema(dto.schema, id);

    return this.prisma.$transaction(async (tx) => {
      const updatedPage = await tx.page.update({
        where: { id },
        data: {
          name: dto.name,
          routePath: dto.routePath,
          schema,
        },
      });

      await tx.pageVersion.create({
        data: {
          pageId: id,
          createdById: ownerId,
          versionNo: await this.getNextVersionNo(tx, id),
          schema,
          source: 'save',
        },
      });

      return updatedPage;
    });
  }

  async listVersions(id: number, ownerId: number) {
    await this.getOwnedPage(id, ownerId);

    return this.prisma.pageVersion.findMany({
      where: { pageId: id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async rollback(id: number, versionId: number, ownerId: number) {
    await this.getOwnedPage(id, ownerId);

    const version = await this.prisma.pageVersion.findFirst({
      where: {
        id: versionId,
        pageId: id,
      },
    });

    if (!version) {
      throw new NotFoundException('Page version not found');
    }

    const schema = this.normalizeSchema(version.schema as Record<string, unknown>, id);

    return this.prisma.$transaction(async (tx) => {
      const updatedPage = await tx.page.update({
        where: { id },
        data: { schema },
      });

      await tx.pageVersion.create({
        data: {
          pageId: id,
          createdById: ownerId,
          versionNo: await this.getNextVersionNo(tx, id),
          schema,
          source: 'rollback',
          message: `Rollback from version ${version.versionNo}`,
        },
      });

      return updatedPage;
    });
  }

  async delete(id: number, ownerId: number) {
    await this.getOwnedPage(id, ownerId);
    await this.prisma.page.delete({ where: { id } });
    return { success: true };
  }

  private async getOwnedPage(id: number, ownerId: number) {
    const page = await this.prisma.page.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!page || page.project.ownerId !== ownerId) {
      throw new NotFoundException('Page not found');
    }

    return page;
  }

  private async getNextVersionNo(tx: Prisma.TransactionClient, pageId: number) {
    const latestVersion = await tx.pageVersion.findFirst({
      where: { pageId },
      orderBy: { versionNo: 'desc' },
      select: { versionNo: true },
    });

    return (latestVersion?.versionNo ?? 0) + 1;
  }

  private isUniqueConstraintError(error: unknown) {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
  }

  private normalizeSchema(schema: Record<string, unknown> | undefined, pageId: number | undefined): Prisma.InputJsonValue {
    const nextSchema: Record<string, unknown> = schema ?? defaultSchema;

    return {
      ...nextSchema,
      schemaVersion: typeof nextSchema.schemaVersion === 'string' ? nextSchema.schemaVersion : '1.0.0',
      pageId: pageId ?? nextSchema.pageId ?? null,
      metadata: {
        ...(typeof nextSchema.metadata === 'object' && nextSchema.metadata !== null ? nextSchema.metadata : {}),
        updatedAt: new Date().toISOString(),
      },
    } as Prisma.InputJsonValue;
  }
}
