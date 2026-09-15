import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { describe, it } from 'node:test';

const require = createRequire(import.meta.url);
const { createPageMaterialDependency } = require('@lowcode/schema');
const { PageLifecycleService } = require(
  '../../apps/api-server/dist/modules/pages/page-lifecycle.service.js'
);
const { PagesService } = require(
  '../../apps/api-server/dist/modules/pages/pages.service.js'
);
const { PageMaterialSchemaService } = require(
  '../../apps/api-server/dist/modules/pages/page-material-schema.service.js'
);

describe('page remote material lifecycle', () => {
  it('pins the dependency on save and publish so a later project upgrade cannot rewrite the public snapshot', async () => {
    const version1 = createDependency('1.2.0');
    const version2 = createDependency('2.0.0');
    const database = createPageDatabase();
    let enabledDependencies = [version1];
    const remoteMaterials = {
      async listEnabledDependencies() {
        return enabledDependencies;
      },
      async assertDependenciesEnabled(_projectId, dependencies) {
        assert.deepEqual(dependencies, enabledDependencies);
        return dependencies;
      },
    };
    const service = new PageLifecycleService(
      database.prisma,
      { revalidate: async () => {} },
      { record: async () => {} },
      new PageMaterialSchemaService(remoteMaterials),
    );
    const pages = new PagesService(database.prisma, {}, service);

    await service.update(database.accessiblePage(), 7, {
      expectedRevision: 1,
      schema: remotePageSchema(),
    });
    const published = await service.publish(1, 7);

    assert.deepEqual(database.page().materialDependencies, [version1]);
    assert.deepEqual(database.versions().map((version) => version.materialDependencies), [
      [version1],
      [version1],
    ]);

    enabledDependencies = [version2];
    const publicSnapshot = await pages.getPublished(published.publicId);
    assert.deepEqual(publicSnapshot.materialDependencies, [version1]);
    assert.equal(publicSnapshot.materialDependencies[0].version, '1.2.0');
  });
});

function createPageDatabase() {
  let page = {
    id: 1,
    projectId: 10,
    createdById: 7,
    name: '远程物料页面',
    routePath: '/remote',
    schema: builtinPageSchema(),
    materialDependencies: [],
    revision: 1,
    publicId: 'public-remote',
    isPublished: false,
    publishedVersionId: null,
    publishedAt: null,
  };
  const versions = [];
  const client = {
    async $executeRaw() {},
    page: {
      async updateMany({ where, data }) {
        if (where.id !== page.id || where.revision !== page.revision) return { count: 0 };
        page = applyPageData(page, data);
        return { count: 1 };
      },
      async findUnique() {
        return page;
      },
      async findFirst() {
        return page.isPublished ? page : null;
      },
      async update({ data }) {
        page = applyPageData(page, data);
        return page;
      },
    },
    pageVersion: {
      async findFirst({ where, select }) {
        if (where.id !== undefined) {
          return versions.find((version) => version.id === where.id && version.pageId === where.pageId) || null;
        }
        if (select?.versionNo) {
          const latest = versions.at(-1);
          return latest ? { versionNo: latest.versionNo } : null;
        }
        return null;
      },
      async create({ data }) {
        const version = { id: versions.length + 1, ...data };
        versions.push(version);
        return version;
      },
    },
  };

  return {
    prisma: {
      ...client,
      async $transaction(callback) {
        return callback(client);
      },
    },
    accessiblePage() {
      return {
        id: page.id,
        projectId: page.projectId,
        name: page.name,
        routePath: page.routePath,
        publicId: page.publicId,
      };
    },
    page: () => page,
    versions: () => versions,
  };
}

function createDependency(version) {
  return createPageMaterialDependency({
    protocolVersion: '1',
    name: '@portfolio/customer-materials',
    version,
    entry: './customer-materials.iife.js',
    integrity: 'sha384-YWJjZA==',
    schemaVersion: '1.0.0',
    dependencies: {
      react: '^18.3.1',
      reactDom: '^18.3.1',
      antd: '^5.20.0',
    },
    materials: [{
      name: 'CustomerSummary',
      displayName: '客户摘要',
      category: 'data',
      allowedParents: ['Page'],
    }],
  }, `https://cdn.example.com/customer/${version}/manifest.json`);
}

function builtinPageSchema() {
  return {
    schemaVersion: '1.0.0',
    components: [{ id: 1, name: 'Page', desc: '页面', props: {} }],
  };
}

function remotePageSchema() {
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
        name: 'CustomerSummary',
        desc: '客户摘要',
        props: {},
      }],
    }],
  };
}

function applyPageData(current, data) {
  const revision = data.revision?.increment
    ? current.revision + data.revision.increment
    : current.revision;
  return {
    ...current,
    ...Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined)),
    revision,
  };
}
