import { HttpStatus, Injectable } from '@nestjs/common';
import {
  Prisma,
  ProjectMemberRole,
  ProjectRemoteMaterial,
  RemoteMaterialStatus,
} from '@prisma/client';
import {
  createPageMaterialDependency,
  createPageMaterialValidationContext,
  type PageMaterialDependency,
} from '@lowcode/schema';
import { BusinessException } from '../../common/errors/business.exception';
import { AppErrorCode } from '../../common/errors/error-codes';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuditLogsService } from '../audit/audit-logs.service';
import {
  ProjectAccessService,
  READABLE_PROJECT_ROLES,
} from '../projects/project-access.service';
import { InstallRemoteMaterialDto } from './dto/install-remote-material.dto';
import { UpdateRemoteMaterialStatusDto } from './dto/update-remote-material-status.dto';

type RemoteMaterialClient = Pick<Prisma.TransactionClient, 'projectRemoteMaterial'>;

@Injectable()
export class RemoteMaterialsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccessService: ProjectAccessService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async list(projectId: number, userId: number) {
    await this.projectAccessService.requireProjectRole(projectId, userId, READABLE_PROJECT_ROLES);
    const records = await this.prisma.projectRemoteMaterial.findMany({
      where: { projectId },
      orderBy: [{ packageName: 'asc' }, { createdAt: 'desc' }],
    });
    return records.map((record) => this.toResponse(record));
  }

  async install(projectId: number, userId: number, dto: InstallRemoteMaterialDto) {
    await this.projectAccessService.requireProjectRole(projectId, userId, [ProjectMemberRole.OWNER]);
    const dependency = this.createDependency(dto);

    return this.prisma.$transaction(async (tx) => {
      const [existing, enabledRecords] = await Promise.all([
        tx.projectRemoteMaterial.findFirst({
          where: {
            projectId,
            packageName: dependency.packageName,
            version: dependency.version,
          },
        }),
        tx.projectRemoteMaterial.findMany({
          where: { projectId, status: RemoteMaterialStatus.ENABLED },
        }),
      ]);

      const otherDependencies = enabledRecords
        .filter((record) => record.packageName !== dependency.packageName)
        .map((record) => this.toDependency(record));
      try {
        createPageMaterialValidationContext([...otherDependencies, dependency]);
      } catch (error) {
        throw new BusinessException(
          AppErrorCode.REMOTE_MATERIAL_CONFLICT,
          error instanceof Error ? error.message : 'Remote material conflicts with the project catalog',
          HttpStatus.CONFLICT,
        );
      }

      if (existing && !sameDependency(this.toDependency(existing), dependency)) {
        throw new BusinessException(
          AppErrorCode.REMOTE_MATERIAL_CONFLICT,
          'Remote material package versions are immutable; publish a new version instead',
          HttpStatus.CONFLICT,
        );
      }

      await tx.projectRemoteMaterial.updateMany({
        where: {
          projectId,
          packageName: dependency.packageName,
          status: RemoteMaterialStatus.ENABLED,
        },
        data: { status: RemoteMaterialStatus.DISABLED },
      });

      const record = existing
        ? await tx.projectRemoteMaterial.update({
          where: { id: existing.id },
          data: { status: RemoteMaterialStatus.ENABLED },
        })
        : await tx.projectRemoteMaterial.create({
          data: this.toCreateInput(projectId, dependency),
        });

      await this.auditLogsService.record({
        actorId: userId,
        projectId,
        action: existing ? 'remoteMaterial.enable' : 'remoteMaterial.install',
        targetType: 'projectRemoteMaterial',
        targetId: record.id,
        summary: `${existing ? 'Enable' : 'Install'} remote material ${dependency.packageName}@${dependency.version}`,
        metadata: {
          packageName: dependency.packageName,
          version: dependency.version,
          manifestUrl: dependency.manifestUrl,
        },
      }, tx);

      return this.toResponse(record);
    }).catch((error) => {
      this.throwPersistenceConflict(error);
      throw error;
    });
  }

  async updateStatus(id: number, userId: number, dto: UpdateRemoteMaterialStatusDto) {
    const current = await this.getForOwner(id, userId);
    const nextStatus = dto.status === 'disabled'
      ? RemoteMaterialStatus.DISABLED
      : RemoteMaterialStatus.ENABLED;

    return this.prisma.$transaction(async (tx) => {
      if (nextStatus === RemoteMaterialStatus.ENABLED) {
        const enabledRecords = await tx.projectRemoteMaterial.findMany({
          where: {
            projectId: current.projectId,
            status: RemoteMaterialStatus.ENABLED,
          },
        });
        const dependencies = enabledRecords
          .filter((record) => record.packageName !== current.packageName)
          .map((record) => this.toDependency(record));
        try {
          createPageMaterialValidationContext([...dependencies, this.toDependency(current)]);
        } catch (error) {
          throw new BusinessException(
            AppErrorCode.REMOTE_MATERIAL_CONFLICT,
            error instanceof Error ? error.message : 'Remote material conflicts with the project catalog',
            HttpStatus.CONFLICT,
          );
        }
        await tx.projectRemoteMaterial.updateMany({
          where: {
            projectId: current.projectId,
            packageName: current.packageName,
            status: RemoteMaterialStatus.ENABLED,
          },
          data: { status: RemoteMaterialStatus.DISABLED },
        });
      }

      const updated = await tx.projectRemoteMaterial.update({
        where: { id },
        data: { status: nextStatus },
      });
      await this.auditLogsService.record({
        actorId: userId,
        projectId: current.projectId,
        action: dto.status === 'enabled' ? 'remoteMaterial.enable' : 'remoteMaterial.disable',
        targetType: 'projectRemoteMaterial',
        targetId: id,
        summary: `${dto.status === 'enabled' ? 'Enable' : 'Disable'} remote material ${current.packageName}@${current.version}`,
        metadata: {
          packageName: current.packageName,
          version: current.version,
          status: dto.status,
        },
      }, tx);
      return this.toResponse(updated);
    }).catch((error) => {
      this.throwPersistenceConflict(error);
      throw error;
    });
  }

  async delete(id: number, userId: number) {
    const current = await this.getForOwner(id, userId);
    await this.prisma.$transaction(async (tx) => {
      await this.auditLogsService.record({
        actorId: userId,
        projectId: current.projectId,
        action: 'remoteMaterial.delete',
        targetType: 'projectRemoteMaterial',
        targetId: id,
        summary: `Delete remote material ${current.packageName}@${current.version}`,
        metadata: {
          packageName: current.packageName,
          version: current.version,
        },
      }, tx);
      await tx.projectRemoteMaterial.delete({ where: { id } });
    });
    return { success: true };
  }

  async listEnabledDependencies(projectId: number, client: RemoteMaterialClient = this.prisma) {
    const records = await client.projectRemoteMaterial.findMany({
      where: { projectId, status: RemoteMaterialStatus.ENABLED },
      orderBy: { packageName: 'asc' },
    });
    return records.map((record) => this.toDependency(record));
  }

  async assertDependenciesEnabled(
    projectId: number,
    dependencyValues: readonly unknown[],
    client: RemoteMaterialClient = this.prisma,
  ) {
    let required: PageMaterialDependency[];
    try {
      required = createPageMaterialValidationContext(dependencyValues).dependencies;
    } catch (error) {
      throw new BusinessException(
        AppErrorCode.PAGE_MATERIAL_DEPENDENCY_INVALID,
        error instanceof Error ? error.message : 'Page material dependencies are invalid',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (required.length === 0) return required;

    const enabled = await this.listEnabledDependencies(projectId, client);
    for (const dependency of required) {
      const current = enabled.find((item) => item.packageName === dependency.packageName);
      if (!current) {
        throw new BusinessException(
          AppErrorCode.PAGE_MATERIAL_DEPENDENCY_INVALID,
          `Remote material is not installed or enabled: ${dependency.packageName}@${dependency.version}`,
          HttpStatus.CONFLICT,
        );
      }
      if (!sameDependency(current, dependency)) {
        throw new BusinessException(
          AppErrorCode.PAGE_MATERIAL_DEPENDENCY_INVALID,
          `Remote material version or manifest does not match: ${dependency.packageName}@${dependency.version}`,
          HttpStatus.CONFLICT,
        );
      }
    }
    return required;
  }

  private async getForOwner(id: number, userId: number) {
    const record = await this.prisma.projectRemoteMaterial.findUnique({ where: { id } });
    if (!record) {
      throw new BusinessException(
        AppErrorCode.REMOTE_MATERIAL_NOT_FOUND,
        'Remote material not found',
        HttpStatus.NOT_FOUND,
      );
    }
    await this.projectAccessService.requireProjectRole(record.projectId, userId, [ProjectMemberRole.OWNER]);
    return record;
  }

  private createDependency(dto: InstallRemoteMaterialDto) {
    try {
      return createPageMaterialDependency(dto.manifest, dto.manifestUrl);
    } catch (error) {
      throw new BusinessException(
        AppErrorCode.REMOTE_MATERIAL_MANIFEST_INVALID,
        error instanceof Error ? error.message : 'Remote material manifest is invalid',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private toCreateInput(
    projectId: number,
    dependency: PageMaterialDependency,
  ): Prisma.ProjectRemoteMaterialUncheckedCreateInput {
    return {
      projectId,
      packageName: dependency.packageName,
      version: dependency.version,
      protocolVersion: dependency.protocolVersion,
      schemaVersion: dependency.schemaVersion,
      manifestUrl: dependency.manifestUrl,
      entry: dependency.entry,
      integrity: dependency.integrity,
      dependencies: dependency.dependencies as unknown as Prisma.InputJsonValue,
      materials: dependency.materials as unknown as Prisma.InputJsonValue,
      status: RemoteMaterialStatus.ENABLED,
    };
  }

  private toDependency(record: ProjectRemoteMaterial): PageMaterialDependency {
    return createPageMaterialDependency({
      protocolVersion: record.protocolVersion,
      name: record.packageName,
      version: record.version,
      entry: record.entry,
      integrity: record.integrity || undefined,
      schemaVersion: record.schemaVersion,
      dependencies: record.dependencies,
      materials: record.materials,
    }, record.manifestUrl);
  }

  private toResponse(record: ProjectRemoteMaterial) {
    const dependency = this.toDependency(record);
    return {
      id: record.id,
      projectId: record.projectId,
      ...dependency,
      status: record.status === RemoteMaterialStatus.DISABLED ? 'disabled' : 'enabled',
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  private throwPersistenceConflict(error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new BusinessException(
        AppErrorCode.REMOTE_MATERIAL_CONFLICT,
        'Another remote material version is already enabled for this package',
        HttpStatus.CONFLICT,
      );
    }
  }
}

function sameDependency(left: PageMaterialDependency, right: PageMaterialDependency) {
  return JSON.stringify(left) === JSON.stringify(right);
}
