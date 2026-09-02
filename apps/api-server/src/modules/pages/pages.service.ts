import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma, ProjectMemberRole } from '@prisma/client';
import { BusinessException } from '../../common/errors/business.exception';
import { AppErrorCode } from '../../common/errors/error-codes';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import {
  EDITABLE_PROJECT_ROLES,
  ProjectAccessService,
  READABLE_PROJECT_ROLES,
} from '../projects/project-access.service';
import { CreatePageDto } from './dto/create-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';
import { PageLifecycleService } from './page-lifecycle.service';

@Injectable()
export class PagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccessService: ProjectAccessService,
    private readonly pageLifecycleService: PageLifecycleService,
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

    try {
      return await this.pageLifecycleService.create(projectId, userId, dto);
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
      return await this.pageLifecycleService.update(page, userId, dto);
    } catch (error) {
      this.throwRouteConflictIfNeeded(error);
      throw error;
    }
  }

  async publish(id: number, userId: number) {
    await this.getPageForAccess(id, userId, EDITABLE_PROJECT_ROLES);
    return this.pageLifecycleService.publish(id, userId);
  }

  async unpublish(id: number, userId: number) {
    await this.getPageForAccess(id, userId, EDITABLE_PROJECT_ROLES);
    return this.pageLifecycleService.unpublish(id, userId, 'member');
  }

  getPublished(publicId: string) {
    return this.pageLifecycleService.getPublished(publicId);
  }

  async listVersions(id: number, userId: number) {
    await this.getPageForAccess(id, userId, READABLE_PROJECT_ROLES);
    return this.pageLifecycleService.listVersions(id);
  }

  async rollback(id: number, versionId: number, userId: number) {
    await this.getPageForAccess(id, userId, EDITABLE_PROJECT_ROLES);
    return this.pageLifecycleService.rollback(id, versionId, userId);
  }

  async deleteVersion(pageId: number, versionId: number, userId: number) {
    await this.getPageForAccess(pageId, userId, EDITABLE_PROJECT_ROLES);
    return this.pageLifecycleService.deleteVersion(pageId, versionId, userId);
  }

  async delete(id: number, userId: number) {
    const page = await this.getPageForAccess(id, userId, EDITABLE_PROJECT_ROLES);
    return this.pageLifecycleService.delete(page, userId);
  }

  private async getPageForAccess(
    id: number,
    userId: number,
    allowedRoles: readonly ProjectMemberRole[],
  ) {
    const page = await this.prisma.page.findUnique({
      where: { id },
      include: { project: true },
    });
    if (!page) {
      throw new BusinessException(AppErrorCode.PAGE_NOT_FOUND, 'Page not found', HttpStatus.NOT_FOUND);
    }

    this.projectAccessService.assertProjectActive(page.project);
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
}
