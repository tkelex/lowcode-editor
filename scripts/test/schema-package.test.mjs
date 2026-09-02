import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { describe, it } from 'node:test';

const require = createRequire(import.meta.url);

describe('@lowcode/schema package interface', () => {
  it('loads schema behavior through the CommonJS export', () => {
    const schema = require('@lowcode/schema');

    assertSchemaInterface(schema);
  });

  it('loads schema behavior through the ESM export', async () => {
    const schema = await import('@lowcode/schema');

    assertSchemaInterface(schema);
  });
});

function assertSchemaInterface(schema) {
    assert.equal(typeof schema.migratePageSchema, 'function');
    assert.equal(typeof schema.validateComponentTree, 'function');
    assert.equal(typeof schema.runLowcodeActions, 'function');
    assert.equal(typeof schema.generateCrudPageSchema, 'function');
}
