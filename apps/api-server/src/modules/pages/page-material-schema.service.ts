import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  createPageMaterialValidationContext,
  migratePageSchema,
  validateComponentTree,
  type PageMaterialDependency,
} from '@lowcode/schema';
import { BusinessException } from '../../common/errors/business.exception';
import { AppErrorCode } from '../../common/errors/error-codes';
import { RemoteMaterialsService } from '../remote-materials/remote-materials.service';

type PageMaterialClient = Pick<Prisma.TransactionClient, 'projectRemoteMaterial'>;

export interface PreparedPageSchema {
  schema: Prisma.InputJsonValue;
  materialDependencies: PageMaterialDependency[];
}

@Injectable()
export class PageMaterialSchemaService {
  constructor(private readonly remoteMaterialsService: RemoteMaterialsService) {}

  async prepareDraft(
    projectId: number,
    pageId: number | undefined,
    schema: Record<string, unknown> | undefined,
    client: PageMaterialClient,
  ) {
    const dependencies = await this.remoteMaterialsService.listEnabledDependencies(projectId, client);
    return this.normalize(schema, pageId, dependencies);
  }

  async prepareFixed(
    projectId: number,
    pageId: number,
    schema: Record<string, unknown>,
    dependencyValue: Prisma.JsonValue,
    client: PageMaterialClient,
  ) {
    if (!Array.isArray(dependencyValue)) {
      throw new BusinessException(
        AppErrorCode.PAGE_MATERIAL_DEPENDENCY_INVALID,
        'Page material dependencies must be an array',
        HttpStatus.BAD_REQUEST,
      );
    }
    const dependencies = await this.remoteMaterialsService.assertDependenciesEnabled(
      projectId,
      dependencyValue,
      client,
    );
    return this.normalize(schema, pageId, dependencies);
  }

  private normalize(
    schema: Record<string, unknown> | undefined,
    pageId: number | undefined,
    dependencyValues: readonly unknown[],
  ): PreparedPageSchema {
    let materialContext;
    try {
      materialContext = createPageMaterialValidationContext(dependencyValues);
    } catch (error) {
      throw new BusinessException(
        AppErrorCode.PAGE_MATERIAL_DEPENDENCY_INVALID,
        error instanceof Error ? error.message : 'Page material dependencies are invalid',
        HttpStatus.BAD_REQUEST,
      );
    }

    const now = new Date().toISOString();
    const nextSchema = migratePageSchema(schema, { pageId: pageId ?? null, now });
    const validation = validateComponentTree(nextSchema.components, materialContext.componentConfig);
    if (!validation.valid || !validation.components) {
      throw new BusinessException(
        AppErrorCode.PAGE_SCHEMA_INVALID,
        validation.errors[0] || 'Page schema is invalid',
        HttpStatus.BAD_REQUEST,
        { errors: validation.errors },
      );
    }

    return {
      schema: {
        ...nextSchema,
        components: validation.components,
        metadata: {
          ...(typeof nextSchema.metadata === 'object' && nextSchema.metadata !== null ? nextSchema.metadata : {}),
          updatedAt: now,
        },
      } as unknown as Prisma.InputJsonValue,
      materialDependencies: materialContext.selectDependencies(validation.components),
    };
  }
}
