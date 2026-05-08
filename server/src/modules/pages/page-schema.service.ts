import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  builtinComponentSchemaRegistry,
  migratePageSchema,
  validateComponentTree,
} from '../../../../packages/lowcode-schema/src';
import { BusinessException } from '../../common/errors/business.exception';
import { AppErrorCode } from '../../common/errors/error-codes';

@Injectable()
export class PageSchemaService {
  normalizeSchema(schema: Record<string, unknown> | undefined, pageId: number | undefined): Prisma.InputJsonValue {
    const now = new Date().toISOString();
    const nextSchema = migratePageSchema(schema, {
      pageId: pageId ?? null,
      now,
    });
    const components = nextSchema.components;
    const validation = validateComponentTree(components, builtinComponentSchemaRegistry);

    if (!validation.valid) {
      throw new BusinessException(
        AppErrorCode.PAGE_SCHEMA_INVALID,
        validation.errors[0] || 'Page schema is invalid',
        HttpStatus.BAD_REQUEST,
        { errors: validation.errors },
      );
    }

    return {
      ...nextSchema,
      components: validation.components,
      metadata: {
        ...(typeof nextSchema.metadata === 'object' && nextSchema.metadata !== null ? nextSchema.metadata : {}),
        updatedAt: now,
      },
    } as Prisma.InputJsonValue;
  }
}
