import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

export const {
  builtinComponentSchemaRegistry,
  buildHttpActionRequestBody,
  buildHttpActionRequestHeaders,
  CURRENT_SCHEMA_VERSION,
  createLowcodeEventData,
  evaluateSafeExpression,
  migratePageSchema,
  normalizeActionUrl,
  normalizeHttpActionUrl,
  isHttpActionUrlAllowed,
  runLowcodeActions,
  validateComponentTree,
} = require('../../server/dist/packages/lowcode-schema/src/index.js');

export function createFetchResponse({ ok, status, data, contentType = 'application/json' }) {
  return {
    ok,
    status,
    headers: {
      get(name) {
        return name.toLowerCase() === 'content-type' ? contentType : null;
      },
    },
    async json() {
      return data;
    },
    async text() {
      return typeof data === 'string' ? data : JSON.stringify(data);
    },
  };
}
