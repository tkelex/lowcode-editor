import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { describe, it } from 'node:test';

const require = createRequire(import.meta.url);
const { agentJson, AiAgentRunStore } = require('../../apps/api-server/dist/modules/ai/ai-agent-run-store.service.js');

describe('agent persistence boundaries', () => {
  it('rejects recognizable secrets without rewriting the schema', () => {
    for (const value of [{ headers: { Authorization: 'Bearer private' } }, { password: 'private' }, { api_key: 'private' }]) {
      assert.throws(() => agentJson(value), /凭证/);
    }
    const safe = { props: { placeholder: '请输入密码' }, responseSample: { count: 2 } };
    assert.deepEqual(agentJson(safe), safe);
  });
  it('enforces a UTF-8 byte limit', () => {
    assert.throws(() => agentJson({ prompt: '中'.repeat(180_000) }), /512 KB/);
  });
  it('rejects stale worker results before any mutation', async () => {
    const tx = {
      $queryRaw: async (sql) => String(sql).includes('clock_timestamp')
        ? [{ now: new Date() }]
        : [{ status: 'running', leaseToken: 'new-worker', leaseExpiresAt: new Date(Date.now() + 10000) }],
    };
    const store = new AiAgentRunStore({ $transaction: (callback) => callback(tx) }, {});
    const accepted = await store.finish({ id: 'run', leaseToken: 'old-worker' }, {
      runId: 'run', status: 'failed', events: [], toolCalls: [],
    });
    assert.equal(accepted, false);
  });
  it('rejects an expired lease even if its token still matches', async () => {
    const tx = {
      $queryRaw: async (sql) => String(sql).includes('clock_timestamp')
        ? [{ now: new Date() }]
        : [{ status: 'running', leaseToken: 'same', leaseExpiresAt: new Date(0) }],
    };
    const store = new AiAgentRunStore({ $transaction: (callback) => callback(tx) }, {});
    assert.equal(await store.finish({ id: 'run', leaseToken: 'same' }, {
      runId: 'run', status: 'failed', events: [], toolCalls: [],
    }), false);
  });
});
