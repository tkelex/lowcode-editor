import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma, ProjectMemberRole } from '@prisma/client';
import { BusinessException } from '../../common/errors/business.exception';
import { AppErrorCode } from '../../common/errors/error-codes';
import { AuditLogsService } from '../audit/audit-logs.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AddProjectMemberDto } from './dto/add-project-member.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectMemberDto } from './dto/update-project-member.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectAccessService, READABLE_PROJECT_ROLES } from './project-access.service';

type ProjectMemberWithUser = Prisma.ProjectMemberGetPayload<{
  include: {
    user: {
      select: {
        id: true;
        email: true;
        username: true;
        nickname: true;
        avatarUrl: true;
      };
    };
  };
}>;

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccessService: ProjectAccessService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async list(userId: number) {
    const projects = await this.prisma.project.findMany({
      where: {
        status: PROJECT_STATUS_ACTIVE,
        OR: [
          { ownerId: userId },
          {
            members: {
              some: { userId },
            },
          },
        ],
      },
      include: {
        members: {
          where: { userId },
          select: { role: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return projects.map(({ members, ...project }) => this.toProjectResponse(
      project,
      this.projectAccessService.toApiRole(
        project.ownerId === userId ? ProjectMemberRole.OWNER : members[0]?.role ?? ProjectMemberRole.VIEWER,
      ),
    ));
  }

  create(ownerId: number, dto: CreateProjectDto) {
    return this.prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          ownerId,
          name: dto.name,
          description: dto.description,
          members: {
            create: {
              userId: ownerId,
              role: ProjectMemberRole.OWNER,
            },
          },
        },
      });

      await this.auditLogsService.record(
        {
          actorId: ownerId,
          projectId: project.id,
          action: 'project.create',
          targetType: 'project',
          targetId: project.id,
          summary: `Create project ${project.name}`,
          metadata: { name: project.name },
        },
        tx,
      );

      return this.toProjectResponse(project, this.projectAccessService.toApiRole(ProjectMemberRole.OWNER));
    });
  }

  async get(id: number, userId: number) {
    const { project, role } = await this.projectAccessService.requireProjectRole(id, userId, READABLE_PROJECT_ROLES);
    return this.toProjectResponse(project, this.projectAccessService.toApiRole(role));
  }

  async update(id: number, userId: number, dto: UpdateProjectDto) {
    await this.projectAccessService.requireProjectRole(id, userId, [ProjectMemberRole.OWNER]);

    return this.prisma.$transaction(async (tx) => {
      const project = await tx.project.update({
        where: { id },
        data: dto,
      });

      await this.auditLogsService.record(
        {
          actorId: userId,
          projectId: id,
          action: 'project.update',
          targetType: 'project',
          targetId: id,
          summary: `Update project ${project.name}`,
          metadata: this.getDefinedJson(dto),
        },
        tx,
      );

      return this.toProjectResponse(project, this.projectAccessService.toApiRole(ProjectMemberRole.OWNER));
    });
  }

  async delete(id: number, userId: number) {
    const { project } = await this.projectAccessService.requireProjectRole(id, userId, [ProjectMemberRole.OWNER]);

    await this.prisma.$transaction(async (tx) => {
      await this.auditLogsService.record(
        {
          actorId: userId,
          projectId: id,
          action: 'project.delete',
          targetType: 'project',
          targetId: id,
          summary: `Delete project ${project.name}`,
          metadata: { name: project.name },
        },
        tx,
      );

      await tx.project.delete({ where: { id } });
    });

    return { success: true };
  }

  async listMembers(projectId: number, userId: number) {
    await this.projectAccessService.requireProjectRole(projectId, userId, READABLE_PROJECT_ROLES);

    const members = await this.prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            nickname: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
    });

    return members.map((member) => this.toMemberResponse(member));
  }

  async addMember(projectId: number, actorId: number, dto: AddProjectMemberDto) {
    const { project } = await this.projectAccessService.requireProjectRole(projectId, actorId, [
      ProjectMemberRole.OWNER,
    ]);
    const user = await this.resolveMemberUser(dto);
    const role = this.projectAccessService.toDbRole(dto.role);

    if (user.id === project.ownerId) {
      throw new BusinessException(
        AppErrorCode.PROJECT_MEMBER_CONFLICT,
        'Project owner is already a member',
        HttpStatus.CONFLICT,
      );
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const member = await tx.projectMember.create({
          data: {
            projectId,
            userId: user.id,
            role,
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                username: true,
                nickname: true,
                avatarUrl: true,
              },
            },
          },
        });

        await this.auditLogsService.record(
          {
            actorId,
            projectId,
            action: 'project.member.add',
            targetType: 'projectMember',
            targetId: member.id,
            summary: `Add ${user.email} as ${dto.role}`,
            metadata: {
              memberUserId: user.id,
              role: dto.role,
            },
          },
          tx,
        );

        return this.toMemberResponse(member);
      });
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new BusinessException(
          AppErrorCode.PROJECT_MEMBER_CONFLICT,
          'User is already a project member',
          HttpStatus.CONFLICT,
        );
      }

      throw error;
    }
  }

  async updateMember(projectId: number, memberId: number, actorId: number, dto: UpdateProjectMemberDto) {
    const { project } = await this.projectAccessService.requireProjectRole(projectId, actorId, [
      ProjectMemberRole.OWNER,
    ]);
    const member = await this.getProjectMember(projectId, memberId);

    this.assertMutableMember(project.ownerId, member);
    const nextRole = this.projectAccessService.toDbRole(dto.role);

    const updatedMember = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.projectMember.update({
        where: { id: memberId },
        data: { role: nextRole },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
              nickname: true,
              avatarUrl: true,
            },
          },
        },
      });

      await this.auditLogsService.record(
        {
          actorId,
          projectId,
          action: 'project.member.update',
          targetType: 'projectMember',
          targetId: memberId,
          summary: `Update member ${updated.user.email} role`,
          metadata: {
            memberUserId: updated.userId,
            previousRole: this.projectAccessService.toApiRole(member.role),
            nextRole: dto.role,
          },
        },
        tx,
      );

      return updated;
    });

    return this.toMemberResponse(updatedMember);
  }

  async removeMember(projectId: number, memberId: number, actorId: number) {
    const { project } = await this.projectAccessService.requireProjectRole(projectId, actorId, [
      ProjectMemberRole.OWNER,
    ]);
    const member = await this.getProjectMember(projectId, memberId);

    this.assertMutableMember(project.ownerId, member);

    await this.prisma.$transaction(async (tx) => {
      await this.auditLogsService.record(
        {
          actorId,
          projectId,
          action: 'project.member.remove',
          targetType: 'projectMember',
          targetId: memberId,
          summary: `Remove member ${member.user.email}`,
          metadata: {
            memberUserId: member.userId,
            role: this.projectAccessService.toApiRole(member.role),
          },
        },
        tx,
      );

      await tx.projectMember.delete({ where: { id: memberId } });
    });

    return { success: true };
  }

  async listAuditLogs(projectId: number, userId: number) {
    await this.projectAccessService.requireProjectRole(projectId, userId, [ProjectMemberRole.OWNER]);
    return this.auditLogsService.listByProject(projectId);
  }

  private async resolveMemberUser(dto: AddProjectMemberDto) {
    if (!dto.userId && !dto.email) {
      throw new BusinessException(
        AppErrorCode.BAD_REQUEST,
        'userId or email is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const user = dto.userId
      ? await this.prisma.user.findUnique({ where: { id: dto.userId } })
      : await this.prisma.user.findUnique({ where: { email: dto.email } });

    if (!user) {
      throw new BusinessException(AppErrorCode.AUTH_USER_NOT_FOUND, 'User not found', HttpStatus.NOT_FOUND);
    }

    return user;
  }

  private async getProjectMember(projectId: number, memberId: number) {
    const member = await this.prisma.projectMember.findFirst({
      where: { id: memberId, projectId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            nickname: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!member) {
      throw new BusinessException(
        AppErrorCode.PROJECT_MEMBER_NOT_FOUND,
        'Project member not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return member;
  }

  private assertMutableMember(projectOwnerId: number, member: ProjectMemberWithUser) {
    if (member.userId === projectOwnerId || member.role === ProjectMemberRole.OWNER) {
      throw new BusinessException(
        AppErrorCode.PROJECT_OWNER_IMMUTABLE,
        'Project owner membership cannot be changed here',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private toMemberResponse(member: ProjectMemberWithUser) {
    return {
      id: member.id,
      projectId: member.projectId,
      userId: member.userId,
      role: this.projectAccessService.toApiRole(member.role),
      user: member.user,
      createdAt: member.createdAt,
      updatedAt: member.updatedAt,
    };
  }

  private isUniqueConstraintError(error: unknown) {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
  }

  private getDefinedJson(input: object) {
    return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined)) as Prisma.InputJsonObject;
  }

  private toProjectResponse<T extends { status: unknown }>(project: T, currentUserRole: string) {
    return {
      ...project,
      status: this.toApiProjectStatus(project.status),
      currentUserRole,
    };
  }

  private toApiProjectStatus(status: unknown) {
    const value = String(status);
    return value === PROJECT_STATUS_DISABLED || value === 'disabled' ? 'disabled' : 'active';
  }
}

const PROJECT_STATUS_ACTIVE = 'ACTIVE';
const PROJECT_STATUS_DISABLED = 'DISABLED';
