import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createRuntimeHarness } from './action-runtime-utils.mjs';
import {
  createFetchResponse,
  runLowcodeActions,
} from './schema-test-utils.mjs';

describe('lowcode http action runtime', () => {
  it('stores http success response and shows success message', async () => {
    const requests = [];
    const harness = createRuntimeHarness({
      adapters: {
        fetch: async (url, init) => {
          requests.push({ url, init });
          return createFetchResponse({
            ok: true,
            status: 200,
            data: { id: 1 },
          });
        },
      },
    });

    await runLowcodeActions([
      {
        actionType: 'http',
        args: {
          url: 'users',
          method: 'POST',
          body: {
            name: 'Ada',
          },
          successMsg: 'saved',
        },
      },
    ], harness.context, harness.adapters);

    assert.deepEqual(requests, [{
      url: 'http://localhost:3000/api/users',
      init: {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: '{"name":"Ada"}',
      },
    }]);
    assert.deepEqual(harness.context.eventData.httpResponse, {
      ok: true,
      status: 200,
      data: { id: 1 },
    });
    assert.deepEqual(harness.messages, [{ content: 'saved', type: 'success' }]);
  });

  it('supports http auth headers and response mapping', async () => {
    const requests = [];
    const harness = createRuntimeHarness({
      adapters: {
        fetch: async (url, init) => {
          requests.push({ url, init });
          return createFetchResponse({
            ok: true,
            status: 200,
            data: { token: 'ok' },
          });
        },
      },
    });

    await runLowcodeActions([
      {
        actionType: 'http',
        args: {
          url: 'users/me',
          auth: 'currentUser',
          responseKey: 'api.me',
        },
      },
    ], harness.context, harness.adapters);

    assert.equal(requests[0].init.headers.Authorization, 'Bearer current-token');
    assert.deepEqual(harness.context.eventData.api.me, {
      ok: true,
      status: 200,
      data: { token: 'ok' },
    });
  });

  it('interpolates http header and body templates from event data', async () => {
    const requests = [];
    const harness = createRuntimeHarness({
      context: {
        eventData: {
          value: 'Ada',
        },
      },
      adapters: {
        fetch: async (url, init) => {
          requests.push({ url, init });
          return createFetchResponse({
            ok: true,
            status: 200,
            data: { ok: true },
          });
        },
      },
    });

    await runLowcodeActions([
      {
        actionType: 'http',
        args: {
          url: 'users',
          method: 'POST',
          headers: {
            'x-name': '{{event.value}}',
          },
          body: {
            name: '{{event.value}}',
          },
        },
      },
    ], harness.context, harness.adapters);

    assert.equal(requests[0].init.headers['x-name'], 'Ada');
    assert.equal(requests[0].init.body, '{"name":"Ada"}');
  });

  it('stores http error and shows error message', async () => {
    const harness = createRuntimeHarness({
      adapters: {
        fetch: async () => createFetchResponse({
          ok: false,
          status: 500,
          data: { message: 'bad' },
        }),
      },
    });

    await runLowcodeActions([
      {
        actionType: 'http',
        args: {
          url: 'users',
          errorMsg: 'failed',
        },
      },
    ], harness.context, harness.adapters);

    assert.deepEqual(harness.context.eventData.httpResponse, {
      ok: false,
      status: 500,
      data: { message: 'bad' },
    });
    assert.equal(harness.context.eventData.httpError instanceof Error, true);
    assert.deepEqual(harness.messages, [{ content: 'failed', type: 'error' }]);
    assert.equal(harness.errors.length, 1);
  });

  it('blocks http actions outside the configured origin allowlist', async () => {
    const harness = createRuntimeHarness({
      adapters: {
        normalizeHttpUrlOptions: {
          apiBaseUrl: 'http://localhost:3000/api',
          allowedOrigins: ['http://localhost:3000'],
        },
        fetch: async () => {
          throw new Error('fetch should not run');
        },
      },
    });

    await runLowcodeActions([
      {
        actionType: 'http',
        args: {
          url: 'https://evil.example.com/users',
          errorMsg: 'blocked',
        },
      },
    ], harness.context, harness.adapters);

    assert.equal(harness.context.eventData.httpError instanceof Error, true);
    assert.deepEqual(harness.messages, [{ content: 'blocked', type: 'error' }]);
    assert.equal(harness.errors.length, 1);
  });
});
