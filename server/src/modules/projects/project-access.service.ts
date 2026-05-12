import { HttpStatus, Injectable } from '@nestjs/common';
import { Project, ProjectMemberRole } from '@prisma/client';
import { BusinessException } from '../../common/errors/business.exception';
import { AppErrorCode } from '../../common/errors/error-codes';
import { PrismaService } from '../../prisma/prisma.service';

export type ProjectRole = 'owner' | 'editor' | 'viewer';

export const PROJECT_ROLE_VALUES = ['owner', 'editor', 'viewer'] as const;

export const EDITABLE_PROJECT_ROLES = [ProjectMemberRole.OWNER, ProjectMemberRole.EDITOR] as const;
export const READABLE_PROJECT_ROLES = [
  ProjectMemberRole.OWNER,
  ProjectMemberRole.EDITOR,
  ProjectMemberRole.VIEWER,
] as const;

const ROLE_LABEL: Record<ProjectMemberRole, ProjectRole> = {
  [ProjectMemberRole.OWNER]: 'owner',
  [ProjectMemberRole.EDITOR]: 'editor',
  [ProjectMemberRole.VIEWER]: 'viewer',
};

const ROLE_VALUE: Record<ProjectRole, ProjectMemberRole> = {
  owner: ProjectMemberRole.OWNER,
  editor: ProjectMemberRole.EDITOR,
  viewer: ProjectMemberRole.VIEWER,
};

@Injectable()
export class ProjectAccessService {
  constructor(private readonly prisma: PrismaService) {}

  toApiRole(role: ProjectMemberRole): ProjectRole {
    return ROLE_LABEL[role];
  }

  toDbRole(role: ProjectRole): ProjectMemberRole {
    return ROLE_VALUE[role];
  }

  async requireProjectRole(projectId: number, userId: number, allowedRoles: readonly ProjectMemberRole[]) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      throw new BusinessException(AppErrorCode.PROJECT_NOT_FOUND, 'Project not found', HttpStatus.NOT_FOUND);
    }

    this.assertProjectActive(project);

    const role = await this.getRoleForProject(project, userId);
    if (!role || !allowedRoles.includes(role)) {
      throw new BusinessException(
        AppErrorCode.PROJECT_FORBIDDEN,
        'No permission to access project',
        HttpStatus.FORBIDDEN,
      );
    }

    return { project, role };
  }

  async getRoleForProject(project: Pick<Project, 'id' | 'ownerId'>, userId: number) {
    if (project.ownerId === userId) {
      return ProjectMemberRole.OWNER;
    }

    const member = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: project.id,
          userId,
        },
      },
      select: { role: true },
    });

    return member?.role ?? null;
  }

  assertProjectActive(project: Pick<Project, 'status'>) {
    const status = String(project.status);
    if (status !== PROJECT_STATUS_ACTIVE && status !== 'active') {
      throw new BusinessException(AppErrorCode.PROJECT_FORBIDDEN, 'Project is disabled', HttpStatus.FORBIDDEN);
    }
  }

  assertRole(role: ProjectMemberRole | null, allowedRoles: readonly ProjectMemberRole[], notFoundMessage = 'Project not found') {
    if (!role) {
      throw new BusinessException(AppErrorCode.PAGE_NOT_FOUND, notFoundMessage, HttpStatus.NOT_FOUND);
    }

    if (!allowedRoles.includes(role)) {
      throw new BusinessException(
        AppErrorCode.PROJECT_FORBIDDEN,
        'No permission to perform this operation',
        HttpStatus.FORBIDDEN,
      );
    }
  }
}

const PROJECT_STATUS_ACTIVE = 'ACTIVE';
