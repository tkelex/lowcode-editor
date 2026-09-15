import {
  createPageMaterialValidationContext,
  migratePageSchema,
  validateComponentTree,
} from '@lowcode/schema';
import type { LowcodePageSchema, PageMaterialDependency } from '@lowcode/schema';

export interface PublishedPageSnapshot {
  publicId: string;
  name: string;
  routePath: string;
  schema: unknown;
  materialDependencies?: unknown[];
  publishedAt?: string | null;
}

export interface PreparedPublishedPageSnapshot extends Omit<PublishedPageSnapshot, 'schema' | 'materialDependencies'> {
  schema: LowcodePageSchema;
  materialDependencies: PageMaterialDependency[];
}

export class PublishedPageSchemaError extends Error {
  readonly errors: string[];

  constructor(errors: string[]) {
    super(errors[0] || '发布快照无法正常解析');
    this.name = 'PublishedPageSchemaError';
    this.errors = errors;
  }
}

export function preparePublishedPageSnapshot(
  snapshot: PublishedPageSnapshot,
): PreparedPublishedPageSnapshot {
  let materialContext;
  try {
    const dependencyValues = snapshot.materialDependencies === undefined
      ? []
      : snapshot.materialDependencies;
    if (!Array.isArray(dependencyValues)) {
      throw new Error('发布快照物料依赖必须是数组');
    }
    materialContext = createPageMaterialValidationContext(dependencyValues);
  } catch (error) {
    throw new PublishedPageSchemaError([
      error instanceof Error ? error.message : '发布快照物料依赖不合法',
    ]);
  }
  const schema = migratePageSchema(snapshot.schema);
  const validation = validateComponentTree(schema.components, materialContext.componentConfig);

  if (!validation.valid || !validation.components) {
    throw new PublishedPageSchemaError(validation.errors);
  }

  return {
    ...snapshot,
    materialDependencies: materialContext.dependencies,
    schema: {
      ...schema,
      components: validation.components,
    },
  };
}
