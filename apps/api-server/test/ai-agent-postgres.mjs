import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';

const require = createRequire(import.meta.url);
const { PrismaClient } = require('@prisma/client');
const { AiAgentRunStore } = require('../dist/modules/ai/ai-agent-run-store.service.js');
const { AiAgentContextService } = require('../dist/modules/ai/ai-agent-context.service.js');
// Never fall back to the developer's DATABASE_URL / .env.
const url = process.env.AGENT_TEST_DATABASE_URL;
if (!url || !/_(test|ci)$/.test(new URL(url).pathname.slice(1))) {
  throw new Error('Set AGENT_TEST_DATABASE_URL to an isolated migrated database ending in _test or _ci');
}
const prisma = new PrismaClient({ datasources: { db: { url } } });
const store = new AiAgentRunStore(prisma, new AiAgentContextService());
let actorId;
try {
  assert.equal(await prisma.aiAgentRun.count({ where: { status: { in: ['queued', 'running'] } } }), 0,
    'Stop workers and use an isolated database without active Agent tasks');
  const actor = await prisma.user.create({ data: {
    username: `agent-test-${randomUUID()}`, email: `${randomUUID()}@example.invalid`, passwordHash: 'not-a-login',
  } });
  actorId = actor.id;
  const project = await prisma.project.create({ data: { ownerId: actor.id, name: 'Agent integration fixture' } });
  const components = [{ id: 1, name: 'Page', desc: '页面', props: {}, children: [] }];
  const page = await prisma.page.create({ data: {
    projectId: project.id, createdById: actor.id, name: 'fixture', routePath: '/fixture', schema: { components },
  } });
  const input = { prompt: '生成用户管理页面', projectId: project.id, pageId: page.id, currentComponents: components };
  const admitted = await Promise.allSettled([store.enqueue(input, actor.id), store.enqueue(input, actor.id)]);
  assert.equal(admitted.filter((r) => r.status === 'fulfilled').length, 1, 'one active page task');
  const created = admitted.find((r) => r.status === 'fulfilled').value;
  assert.equal(created.status, 'queued');
  const secondStore = new AiAgentRunStore(prisma, new AiAgentContextService());
  const claims = await Promise.all([store.claim(), secondStore.claim()]);
  assert.equal(claims.filter(Boolean).length, 1, 'one owner across workers');
  const oldLease = claims.find(Boolean);
  await prisma.aiAgentRun.update({ where: { id: created.runId }, data: { leaseExpiresAt: new Date(0) } });
  const recovered = await secondStore.claim();
  assert.equal(recovered.recoveryCount, 1);
  assert.notEqual(recovered.leaseToken, oldLease.leaseToken);
  const failed = { ...(await store.get(created.runId, actor.id)), status: 'failed', events: [] };
  assert.equal(await store.finish(oldLease, failed), false, 'old generation cannot commit');
  assert.equal(await store.heartbeat(oldLease), 0, 'old generation cannot renew');
  await prisma.aiAgentRun.update({ where: { id: created.runId }, data: { leaseExpiresAt: new Date(0) } });
  assert.equal(await store.claim(), null, 'only one recovery requeue');
  const snapshot = await secondStore.get(created.runId, actor.id);
  assert.equal(snapshot.status, 'failed');
  assert.deepEqual(snapshot.events.map((e) => e.sequence), Array.from({ length: snapshot.lastSequence }, (_, i) => i + 1));
  const next = await store.enqueue(input, actor.id);
  await store.cancel(next.runId, actor.id);
  await store.cancel(next.runId, actor.id);
  assert.equal((await store.get(next.runId, actor.id)).status, 'cancelled');
  const successful = await store.enqueue(input, actor.id);
  const successfulLease = await store.claim();
  const pending = await store.get(successful.runId, actor.id);
  assert.equal(await secondStore.finish(successfulLease, { ...pending, status: 'awaiting_confirmation', events: [],
    candidate: { id: randomUUID(), kind: 'components', summary: '测试候选', impactScope: 'page',
      components, baselineFingerprint: pending.context.pageFingerprint,
      warnings: [], assumptions: [], validationErrors: [], validationWarnings: [],
    },
  }), true);
  const ready = await store.get(successful.runId, actor.id);
  assert.equal(ready.status, 'awaiting_confirmation');
  assert.equal(ready.candidate.kind, 'components');
  assert.ok(Date.parse(ready.candidateExpiresAt) > Date.now() + 23 * 60 * 60 * 1000);
  await assert.rejects(() => store.cancel(successful.runId, actor.id), /当前状态不能取消/);
  assert.equal(await prisma.pageVersion.count({ where: { pageId: page.id } }), 0, 'Agent never saves a page');
  console.log('Agent PostgreSQL integration checks passed');
} finally {
  // Only the fixture actor and its cascading fixture records are removed.
  if (actorId) {
    await prisma.auditLog.deleteMany({ where: { actorId } });
    await prisma.user.delete({ where: { id: actorId } });
  }
  await prisma.$disconnect();
}
