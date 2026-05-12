import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildHttpActionRequestBody,
  buildHttpActionRequestHeaders
} from './schema-test-utils.mjs';

describe('http action request creation', () => {
  it('serializes object body and adds json content-type', () => {
    const body = { name: 'Ada' };

    assert.equal(buildHttpActionRequestBody(body), '{"name":"Ada"}');
    assert.deepEqual(buildHttpActionRequestHeaders({ Authorization: 'Bearer token' }, body), {
      'content-type': 'application/json',
      Authorization: 'Bearer token',
    });
  });

  it('keeps string body as-is without forcing json header', () => {
    assert.equal(buildHttpActionRequestBody('raw body'), 'raw body');
    assert.deepEqual(buildHttpActionRequestHeaders({ 'x-source': 'lowcode' }, 'raw body'), {
      'x-source': 'lowcode',
    });
  });

  it('omits empty request body', () => {
    assert.equal(buildHttpActionRequestBody(undefined), undefined);
    assert.equal(buildHttpActionRequestBody(null), undefined);
    assert.equal(buildHttpActionRequestBody(''), undefined);
  });
});
