import type { LowcodePageSchema } from './types';

export const CURRENT_SCHEMA_VERSION = '1.0.0';

export const defaultPageSchema: LowcodePageSchema = {
  schemaVersion: CURRENT_SCHEMA_VERSION,
  components: [
    {
      id: 1,
      name: 'Page',
      props: {},
      desc: '页面',
    },
  ],
  metadata: {},
};
