import {
  builtinComponentSchemaRegistry,
  migratePageSchema,
  validateComponentTree,
} from '@lowcode/schema';
import type { LowcodePageSchema } from '@lowcode/schema';

export interface PublishedPageSnapshot {
  publicId: string;
  name: string;
  routePath: string;
  schema: unknown;
  publishedAt?: string | null;
}

export interface PreparedPublishedPageSnapshot extends Omit<PublishedPageSnapshot, 'schema'> {
  schema: LowcodePageSchema;
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
  const schema = migratePageSchema(snapshot.schema);
  const validation = validateComponentTree(schema.components, builtinComponentSchemaRegistry);

  if (!validation.valid || !validation.components) {
    throw new PublishedPageSchemaError(validation.errors);
  }

  return {
    ...snapshot,
    schema: {
      ...schema,
      components: validation.components,
    },
  };
}
