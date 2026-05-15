import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma, ProjectDataSourceModel, ProjectMemberRole } from '@prisma/client';
import {
  ProjectDataSourceModelConfig,
  validateDataSourceModelConfig,
} from '../../../../packages/lowcode-schema/src';
import { BusinessException } from '../../common/errors/business.exception';
import { AppErrorCode } from '../../common/errors/error-codes';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogsService } from '../audit/audit-logs.service';
import {
  EDITABLE_PROJECT_ROLES,
  ProjectAccessService,
  READABLE_PROJECT_ROLES,
} from '../projects/project-access.service';
import { CreateDataSourceModelDto } from './dto/create-data-source-model.dto';
import { UpdateDataSourceModelDto } from './dto/update-data-source-model.dto';

type DataSourceModelWithProject = Prisma.ProjectDataSourceModelGetPayload<{ include: { project: true } }>;

@Injectable()
export class DataSourceModelsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccessService: ProjectAccessService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async list(projectId: number, userId: number) {
    await this.projectAccessService.requireProjectRole(projectId, userId, READABLE_PROJECT_ROLES);

    const models = await this.prisma.projectDataSourceModel.findMany({
      where: { projectId },
      orderBy: { updatedAt: 'desc' },
    });

    return models.map((model) => this.toResponse(model));
  }

  async create(projectId: number, userId: number, dto: CreateDataSourceModelDto) {
    await this.projectAccessService.requireProjectRole(projectId, userId, EDITABLE_PROJECT_ROLES);
    const config = this.validateConfig({ ...dto, projectId } as unknown as ProjectDataSourceModelConfig);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const model = await tx.projectDataSourceModel.create({
          data: this.toCreateInput(projectId, config),
        });

        await this.auditLogsService.record(
          {
            actorId: userId,
            projectId,
            action: 'dataSourceModel.create',
            targetType: 'dataSourceModel',
            targetId: model.id,
            summary: `Create data source model ${model.name}`,
            metadata: {
              name: model.name,
              key: model.key,
            },
          },
          tx,
        );

        return this.toResponse(model);
      });
    } catch (error) {
      this.throwConflictIfNeeded(error);
      throw error;
    }
  }

  async get(id: number, userId: number) {
    const model = await this.getModelForAccess(id, userId, READABLE_PROJECT_ROLES);
    return this.toResponse(model);
  }

  async update(id: number, userId: number, dto: UpdateDataSourceModelDto) {
    const current = await this.getModelForAccess(id, userId, EDITABLE_PROJECT_ROLES);
    const merged = this.validateConfig({
      ...this.toConfig(current),
      ...dto,
      id: String(current.id),
      projectId: current.projectId,
    } as unknown as ProjectDataSourceModelConfig);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const updated = await tx.projectDataSourceModel.update({
          where: { id },
          data: this.toUpdateInput(merged),
        });

        await this.auditLogsService.record(
          {
            actorId: userId,
            projectId: current.projectId,
            action: 'dataSourceModel.update',
            targetType: 'dataSourceModel',
            targetId: id,
            summary: `Update data source model ${updated.name}`,
            metadata: {
              name: updated.name,
              key: updated.key,
            },
          },
          tx,
        );

        return this.toResponse(updated);
      });
    } catch (error) {
      this.throwConflictIfNeeded(error);
      throw error;
    }
  }

  async delete(id: number, userId: number) {
    const model = await this.getModelForAccess(id, userId, EDITABLE_PROJECT_ROLES);

    await this.prisma.$transaction(async (tx) => {
      await this.auditLogsService.record(
        {
          actorId: userId,
          projectId: model.projectId,
          action: 'dataSourceModel.delete',
          targetType: 'dataSourceModel',
          targetId: id,
          summary: `Delete data source model ${model.name}`,
          metadata: {
            name: model.name,
            key: model.key,
          },
        },
        tx,
      );

      await tx.projectDataSourceModel.delete({ where: { id } });
    });

    return { success: true };
  }

  private async getModelForAccess(id: number, userId: number, allowedRoles: readonly ProjectMemberRole[]) {
    const model = await this.prisma.projectDataSourceModel.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!model) {
      throw new BusinessException(
        AppErrorCode.DATA_SOURCE_MODEL_NOT_FOUND,
        'Data source model not found',
        HttpStatus.NOT_FOUND,
      );
    }

    this.projectAccessService.assertProjectActive(model.project);
    const role = await this.projectAccessService.getRoleForProject(model.project, userId);
    this.projectAccessService.assertRole(role, allowedRoles, 'Data source model not found');

    return model;
  }

  private validateConfig(config: ProjectDataSourceModelConfig) {
    const validation = validateDataSourceModelConfig(config);
    if (!validation.valid) {
      throw new BusinessException(
        AppErrorCode.DATA_SOURCE_MODEL_INVALID,
        validation.errors[0]?.message || 'Data source model is invalid',
        HttpStatus.BAD_REQUEST,
        { errors: validation.errors },
      );
    }

    return config;
  }

  private toCreateInput(projectId: number, config: ProjectDataSourceModelConfig): Prisma.ProjectDataSourceModelCreateInput {
    return {
      project: { connect: { id: projectId } },
      name: config.name.trim(),
      key: config.key.trim(),
      description: config.description?.trim() || null,
      primaryField: config.primaryField.trim(),
      listApi: this.optionalJson(config.listApi),
      detailApi: this.optionalJson(config.detailApi),
      createApi: this.optionalJson(config.createApi),
      updateApi: this.optionalJson(config.updateApi),
      deleteApi: this.optionalJson(config.deleteApi),
      fields: config.fields as unknown as Prisma.InputJsonValue,
    };
  }

  private toUpdateInput(config: ProjectDataSourceModelConfig): Prisma.ProjectDataSourceModelUpdateInput {
    return {
      name: config.name.trim(),
      key: config.key.trim(),
      description: config.description?.trim() || null,
      primaryField: config.primaryField.trim(),
      listApi: this.optionalJson(config.listApi),
      detailApi: this.optionalJson(config.detailApi),
      createApi: this.optionalJson(config.createApi),
      updateApi: this.optionalJson(config.updateApi),
      deleteApi: this.optionalJson(config.deleteApi),
      fields: config.fields as unknown as Prisma.InputJsonValue,
    };
  }

  private optionalJson(value: unknown) {
    if (value === undefined) {
      return undefined;
    }

    return value === null ? Prisma.JsonNull : value as Prisma.InputJsonValue;
  }

  private toResponse(model: ProjectDataSourceModel) {
    return this.toConfig(model);
  }

  private toConfig(model: ProjectDataSourceModel | DataSourceModelWithProject): ProjectDataSourceModelConfig {
    return {
      id: String(model.id),
      projectId: model.projectId,
      name: model.name,
      key: model.key,
      description: model.description || undefined,
      primaryField: model.primaryField,
      listApi: this.jsonObject(model.listApi),
      detailApi: this.jsonObject(model.detailApi),
      createApi: this.jsonObject(model.createApi),
      updateApi: this.jsonObject(model.updateApi),
      deleteApi: this.jsonObject(model.deleteApi),
      fields: Array.isArray(model.fields) ? model.fields as unknown as ProjectDataSourceModelConfig['fields'] : [],
      createdAt: model.createdAt.toISOString(),
      updatedAt: model.updatedAt.toISOString(),
    };
  }

  private jsonObject(value: Prisma.JsonValue) {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? value as unknown as ProjectDataSourceModelConfig['listApi']
      : undefined;
  }

  private throwConflictIfNeeded(error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new BusinessException(
        AppErrorCode.DATA_SOURCE_MODEL_CONFLICT,
        'Data source model key already exists in this project',
        HttpStatus.CONFLICT,
      );
    }
  }
}
