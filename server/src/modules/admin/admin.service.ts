import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma, UserRole, UserStatus } from '@prisma/client';
import { BusinessException } from '../../common/errors/business.exception';
import { AppErrorCode } from '../../common/errors/error-codes';
import { AuditLogsService } from '../audit/audit-logs.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminProjectStatus } from './dto/update-project-status.dto';
import { AdminUserStatus } from './dto/update-user-status.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async getOverview() {
    const [
      userTotal,
      activeUsers,
      disabledUsers,
      projectTotal,
      activeProjects,
      disabledProjects,
      pageTotal,
      publishedPages,
      assetTotal,
      assetSizeAggregate,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { status: UserStatus.ACTIVE } }),
      this.prisma.user.count({ where: { status: UserStatus.DISABLED } }),
      this.prisma.project.count(),
      this.prisma.project.count({ where: { status: PROJECT_STATUS_ACTIVE } }),
      this.prisma.project.count({ where: { status: PROJECT_STATUS_DISABLED } }),
      this.prisma.page.count(),
      this.prisma.page.count({ where: { isPublished: true } }),
      this.prisma.asset.count(),
      this.prisma.asset.aggregate({ _sum: { size: true } }),
    ]);

    return {
      users: {
        total: userTotal,
        active: activeUsers,
        disabled: disabledUsers,
      },
      projects: {
        total: projectTotal,
        active: activeProjects,
        disabled: disabledProjects,
      },
      pages: {
        total: pageTotal,
        published: publishedPages,
      },
      assets: {
        total: assetTotal,
        totalSize: assetSizeAggregate._sum.size ?? 0,
      },
    };
  }

  async listUsers() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            memberships: true,
          },
        },
      },
      take: 200,
    });

    return users.map((user) => this.toAdminUserResponse(user));
  }

  async updateUserStatus(targetUserId: number, actorId: number, status: AdminUserStatus) {
    if (targetUserId === actorId && status === 'disabled') {
      throw new BusinessException(AppErrorCode.BAD_REQUEST, 'Admin cannot disable current account', HttpStatus.BAD_REQUEST);
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      throw new BusinessException(AppErrorCode.AUTH_USER_NOT_FOUND, 'User not found', HttpStatus.NOT_FOUND);
    }

    const nextStatus = this.toDbUserStatus(status);
    if (targetUser.role === UserRole.ADMIN && nextStatus === UserStatus.DISABLED) {
      const activeAdminCount = await this.prisma.user.count({
        where: {
          role: UserRole.ADMIN,
          status: UserStatus.ACTIVE,
          id: { not: targetUserId },
        },
      });

      if (activeAdminCount === 0) {
        throw new BusinessException(AppErrorCode.BAD_REQUEST, 'At least one active admin is required', HttpStatus.BAD_REQUEST);
      }
    }

    const updatedUser = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: targetUserId },
        data: { status: nextStatus },
        include: {
          _count: {
            select: {
              memberships: true,
            },
          },
        },
      });

      await this.auditLogsService.record(
        {
          actorId,
          action: status === 'disabled' ? 'admin.user.disable' : 'admin.user.enable',
          targetType: 'user',
          targetId: targetUserId,
          summary: `${status === 'disabled' ? 'Disable' : 'Enable'} user ${user.email}`,
          metadata: {
            email: user.email,
            previousStatus: this.toApiUserStatus(targetUser.status),
            nextStatus: status,
          },
        },
        tx,
      );

      return user;
    });

    return this.toAdminUserResponse(updatedUser);
  }

  async listProjects() {
    const projects = await this.prisma.project.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            username: true,
            nickname: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            pages: true,
            assets: true,
          },
        },
      },
      take: 200,
    });

    return projects.map((project) => this.toAdminProjectResponse(project));
  }

  async updateProjectStatus(projectId: number, actorId: number, status: AdminProjectStatus) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new BusinessException(AppErrorCode.PROJECT_NOT_FOUND, 'Project not found', HttpStatus.NOT_FOUND);
    }

    const updatedProject = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.project.update({
        where: { id: projectId },
        data: { status: this.toDbProjectStatus(status) },
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              username: true,
              nickname: true,
              avatarUrl: true,
            },
          },
          _count: {
            select: {
              pages: true,
              assets: true,
            },
          },
        },
      });

      if (status === 'disabled') {
        await tx.page.updateMany({
          where: { projectId },
          data: { isPublished: false },
        });
      }

      await this.auditLogsService.record(
        {
          actorId,
          projectId,
          action: status === 'disabled' ? 'admin.project.disable' : 'admin.project.enable',
          targetType: 'project',
          targetId: projectId,
          summary: `${status === 'disabled' ? 'Disable' : 'Enable'} project ${project.name}`,
          metadata: {
            name: project.name,
            previousStatus: this.toApiProjectStatus(project.status),
            nextStatus: status,
            unpublishedPages: status === 'disabled',
          },
        },
        tx,
      );

      return updated;
    });

    return this.toAdminProjectResponse(updatedProject);
  }

  async listPublishedPages() {
    const pages = await this.prisma.page.findMany({
      where: {
        isPublished: true,
        project: {
          status: PROJECT_STATUS_ACTIVE,
        },
      },
      orderBy: { publishedAt: 'desc' },
      include: {
        project: {
          include: {
            owner: {
              select: {
                id: true,
                email: true,
                username: true,
                nickname: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
      take: 200,
    });

    return pages.map((page) => ({
      id: page.id,
      name: page.name,
      routePath: page.routePath,
      publicId: page.publicId,
      publishedAt: page.publishedAt,
      projectId: page.projectId,
      projectName: page.project.name,
      projectStatus: this.toApiProjectStatus(page.project.status),
      owner: page.project.owner,
    }));
  }

  async unpublishPage(pageId: number, actorId: number) {
    const page = await this.prisma.page.findUnique({
      where: { id: pageId },
      include: { project: true },
    });

    if (!page) {
      throw new BusinessException(AppErrorCode.PAGE_NOT_FOUND, 'Page not found', HttpStatus.NOT_FOUND);
    }

    const unpublishedPage = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.page.update({
        where: { id: pageId },
        data: { isPublished: false },
      });

      await this.auditLogsService.record(
        {
          actorId,
          projectId: page.projectId,
          pageId,
          action: 'admin.page.unpublish',
          targetType: 'page',
          targetId: pageId,
          summary: `Admin unpublish page ${page.name}`,
          metadata: {
            publicId: page.publicId,
            publishedVersionId: page.publishedVersionId,
          },
        },
        tx,
      );

      return updated;
    });

    return unpublishedPage;
  }

  async listAuditLogs() {
    const logs = await this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    const actorIds = [...new Set(logs.map((log) => log.actorId).filter((id): id is number => id !== null))];
    const actors = actorIds.length > 0
      ? await this.prisma.user.findMany({
        where: { id: { in: actorIds } },
        select: {
          id: true,
          email: true,
          username: true,
          nickname: true,
          avatarUrl: true,
        },
      })
      : [];
    const actorMap = new Map(actors.map((actor) => [actor.id, actor]));

    return logs.map((log) => ({
      ...log,
      actor: log.actorId ? actorMap.get(log.actorId) ?? null : null,
    }));
  }

  private toApiUserRole(role: UserRole) {
    return role === UserRole.ADMIN ? 'admin' : 'user';
  }

  private toApiUserStatus(status: UserStatus) {
    return status === UserStatus.DISABLED ? 'disabled' : 'active';
  }

  private toDbUserStatus(status: AdminUserStatus) {
    return status === 'disabled' ? UserStatus.DISABLED : UserStatus.ACTIVE;
  }

  private toDbProjectStatus(status: AdminProjectStatus) {
    return status === 'disabled' ? PROJECT_STATUS_DISABLED : PROJECT_STATUS_ACTIVE;
  }

  private toApiProjectStatus(status: string) {
    const value = String(status);
    return value === PROJECT_STATUS_DISABLED || value === 'disabled' ? 'disabled' : 'active';
  }

  private toAdminUserResponse(
    user: {
      id: number;
      email: string;
      username: string;
      nickname: string | null;
      avatarUrl: string | null;
      role: UserRole;
      status: UserStatus;
      createdAt: Date;
      updatedAt: Date;
      _count: { memberships: number };
    },
  ) {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      role: this.toApiUserRole(user.role),
      status: this.toApiUserStatus(user.status),
      projectCount: user._count.memberships,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private toAdminProjectResponse(
    project: {
      id: number;
      name: string;
      description: string | null;
      status: unknown;
      owner: {
        id: number;
        email: string;
        username: string;
        nickname: string | null;
        avatarUrl: string | null;
      };
      _count: { pages: number; assets: number };
      createdAt: Date;
      updatedAt: Date;
    },
  ) {
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      status: this.toApiProjectStatus(String(project.status)),
      owner: project.owner,
      pageCount: project._count.pages,
      assetCount: project._count.assets,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  }
}

const PROJECT_STATUS_ACTIVE = 'ACTIVE';
const PROJECT_STATUS_DISABLED = 'DISABLED';
