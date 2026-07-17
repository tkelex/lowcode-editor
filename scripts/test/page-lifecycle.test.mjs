import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { describe, it } from 'node:test';

const require = createRequire(import.meta.url);
const { PageLifecycleService } = require('../../apps/api-server/dist/modules/pages/page-lifecycle.service.js');

describe('page lifecycle cache invalidation', () => {
  it('revalidates a deleted public page after its transaction commits', async () => {
    const events = [];
    const tx = {
      page: {
        async delete() {
          events.push('page.delete');
        },
      },
    };
    const prisma = {
      async $transaction(callback) {
        events.push('transaction.start');
        const result = await callback(tx);
        events.push('transaction.commit');
        return result;
      },
    };
    const auditLogs = {
      async record() {
        events.push('audit.record');
      },
    };
    const revalidate = {
      async revalidate(publicId) {
        events.push(`revalidate:${publicId}`);
      },
    };
    const service = new PageLifecycleService(prisma, revalidate, auditLogs);

    const result = await service.delete({
      id: 1,
      projectId: 2,
      name: '公开页面',
      routePath: '/published',
      publicId: 'public-1',
    }, 3);

    assert.deepEqual(result, { success: true });
    assert.deepEqual(events, [
      'transaction.start',
      'audit.record',
      'page.delete',
      'transaction.commit',
      'revalidate:public-1',
    ]);
  });

  it('returns public ids while unpublishing project pages in the caller transaction', async () => {
    let updateInput;
    const tx = {
      page: {
        async findMany() {
          return [{ publicId: 'public-1' }, { publicId: null }, { publicId: 'public-2' }];
        },
        async updateMany(input) {
          updateInput = input;
        },
      },
    };
    const service = new PageLifecycleService({}, {}, {});

    const publicIds = await service.unpublishProjectPages(tx, 9);

    assert.deepEqual(publicIds, ['public-1', 'public-2']);
    assert.deepEqual(updateInput, {
      where: { projectId: 9, isPublished: true },
      data: {
        isPublished: false,
        publishedVersionId: null,
      },
    });
  });
});
