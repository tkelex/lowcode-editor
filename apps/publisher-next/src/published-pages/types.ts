import type { LowcodePageSchema } from '../../../../packages/lowcode-schema/src';

export interface PublishedPage {
  publicId: string;
  name: string;
  routePath: string;
  schema: LowcodePageSchema;
  publishedAt?: string | null;
}

export interface PreparedPublishedPage extends PublishedPage {
  schema: LowcodePageSchema;
}
