import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

export const {
  builtinComponentSchemaRegistry,
  buildHttpActionRequestBody,
  buildHttpActionRequestHeaders,
  CURRENT_SCHEMA_VERSION,
  applyAiComponentPatch,
  createAiComponentTreeFingerprint,
  createAgentDataSourceBindingPatch,
  createAgentEventActionPatch,
  createAiRepairPromptFromIssues,
  decideAiAgentRoute,
  generateAiCrudPageCandidate,
  generateCrudPageSchema,
  isCrudGenerationIntent,
  isCrudRouteDecision,
  createLowcodeEventData,
  evaluateSafeExpression,
  migratePageSchema,
  normalizeAiGeneratedComponents,
  normalizeActionUrl,
  normalizeHttpActionUrl,
  isHttpActionUrlAllowed,
  runLowcodeActions,
  validateAiComponentPatch,
  validateAiGeneratedComponents,
  validateDataSourceModelConfig,
  validateComponentTree,
} = require('@lowcode/schema');

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
