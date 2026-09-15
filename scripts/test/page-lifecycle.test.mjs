import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { describe, it } from 'node:test';

const require = createRequire(import.meta.url);
const { PageLifecycleService } = require('../../apps/api-server/dist/modules/pages/page-lifecycle.service.js');

describe('page lifecycle', () => {
  it('rejects a stale page save without creating another version', async () => {
    let page = {
      id: 1,
      projectId: 2,
      createdById: 3,
      name: '并发页面',
      routePath: '/concurrent',
      schema: pageSchema('初始内容'),
      revision: 1,
    };
    const versions = [];
    const tx = {
      async $executeRaw() {},
      page: {
        async update({ data }) {
          page = applyPageData(page, data);
          return page;
        },
        async updateMany({ where, data }) {
          if (where.id !== page.id || where.revision !== page.revision) {
            return { count: 0 };
          }
          page = applyPageData(page, data);
          return { count: 1 };
        },
        async findUnique() {
          return page;
        },
      },
      pageVersion: {
        async findFirst() {
          const latest = versions.at(-1);
          return latest ? { versionNo: latest.versionNo } : null;
        },
        async create({ data }) {
          const version = { id: versions.length + 1, ...data };
          versions.push(version);
          return version;
        },
      },
    };
    const prisma = {
      async $transaction(callback) {
        return callback(tx);
      },
    };
    const service = new PageLifecycleService(prisma, {}, { record: async () => {} });
    const accessiblePage = {
      id: page.id,
      projectId: page.projectId,
      name: page.name,
      routePath: page.routePath,
    };

    const firstSave = await service.update(accessiblePage, 3, {
      schema: pageSchema('第一个编辑者'),
      expectedRevision: 1,
    });

    assert.equal(firstSave.revision, 2);
    assert.equal(versions.length, 1);

    await assert.rejects(
      service.update(accessiblePage, 4, {
        schema: pageSchema('第二个编辑者'),
        expectedRevision: 1,
      }),
      (error) => {
        assert.equal(error.getStatus(), 409);
        assert.equal(error.getResponse().code, 'PAGE_DRAFT_CONFLICT');
        return true;
      },
    );
    assert.equal(versions.length, 1);
    assert.equal(page.schema.components[0].children[0].props.text, '第一个编辑者');
  });

  it('guards metadata-only updates with the page revision without creating a version', async () => {
    let page = {
      id: 1,
      projectId: 2,
      createdById: 3,
      name: '原页面名',
      routePath: '/metadata',
      schema: pageSchema('原内容'),
      revision: 4,
    };
    let versionCount = 0;
    const tx = {
      page: {
        async update({ data }) {
          page = applyPageData(page, data);
          return page;
        },
        async updateMany({ where, data }) {
          if (where.id !== page.id || where.revision !== page.revision) {
            return { count: 0 };
          }
          page = applyPageData(page, data);
          return { count: 1 };
        },
        async findUnique() {
          return page;
        },
      },
      pageVersion: {
        async create() {
          versionCount += 1;
        },
      },
    };
    const prisma = {
      async $transaction(callback) {
        return callback(tx);
      },
    };
    const service = new PageLifecycleService(prisma, {}, { record: async () => {} });
    const accessiblePage = {
      id: page.id,
      projectId: page.projectId,
      name: page.name,
      routePath: page.routePath,
    };

    const firstUpdate = await service.update(accessiblePage, 3, {
      name: '新页面名',
      expectedRevision: 4,
    });

    assert.equal(firstUpdate.name, '新页面名');
    assert.equal(firstUpdate.revision, 5);
    assert.equal(versionCount, 0);

    await assert.rejects(
      service.update(accessiblePage, 4, {
        routePath: '/stale-route',
        expectedRevision: 4,
      }),
      (error) => {
        assert.equal(error.getStatus(), 409);
        assert.equal(error.getResponse().code, 'PAGE_DRAFT_CONFLICT');
        return true;
      },
    );
    assert.equal(page.routePath, '/metadata');
    assert.equal(versionCount, 0);
  });

  it('increments the page revision after rolling back the draft schema', async () => {
    let page = {
      id: 1,
      projectId: 2,
      createdById: 3,
      name: '回滚页面',
      routePath: '/rollback',
      schema: pageSchema('当前内容'),
      revision: 7,
    };
    const targetVersion = {
      id: 5,
      pageId: page.id,
      versionNo: 2,
      schema: pageSchema('历史内容'),
    };
    const createdVersions = [];
    const tx = {
      async $executeRaw() {},
      page: {
        async findUnique() {
          return page;
        },
        async update({ data }) {
          page = applyPageData(page, data);
          return page;
        },
      },
      pageVersion: {
        async findFirst({ where, select }) {
          if (where.id === targetVersion.id) {
            return targetVersion;
          }
          if (select?.versionNo) {
            return { versionNo: targetVersion.versionNo + createdVersions.length };
          }
          return null;
        },
        async create({ data }) {
          const version = { id: 6 + createdVersions.length, ...data };
          createdVersions.push(version);
          return version;
        },
      },
    };
    const prisma = {
      async $transaction(callback) {
        return callback(tx);
      },
    };
    const service = new PageLifecycleService(prisma, {}, { record: async () => {} });

    const rolledBackPage = await service.rollback(page.id, targetVersion.id, 3);

    assert.equal(rolledBackPage.revision, 8);
    assert.equal(rolledBackPage.schema.components[0].children[0].props.text, '历史内容');
    assert.equal(createdVersions.length, 1);
    assert.equal(createdVersions[0].source, 'rollback');
  });

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

function pageSchema(text) {
  return {
    schemaVersion: '1.0.0',
    components: [{
      id: 1,
      name: 'Page',
      desc: '页面',
      props: {},
      children: [{
        id: 2,
        parentId: 1,
        name: 'Text',
        desc: '文本',
        props: { text },
      }],
    }],
  };
}

function applyPageData(page, data) {
  const revision = data.revision?.increment
    ? page.revision + data.revision.increment
    : page.revision;
  const definedData = Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined),
  );
  return {
    ...page,
    ...definedData,
    revision,
  };
}
