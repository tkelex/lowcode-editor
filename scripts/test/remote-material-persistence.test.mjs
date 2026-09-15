import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { describe, it } from 'node:test';

const require = createRequire(import.meta.url);

describe('project remote material persistence', () => {
  it('lets the owner install a normalized manifest and project members read it', async () => {
    const { RemoteMaterialsService } = require(
      '../../apps/api-server/dist/modules/remote-materials/remote-materials.service.js'
    );
    const database = createRemoteMaterialDatabase();
    const access = createProjectAccess();
    const service = new RemoteMaterialsService(database.prisma, access, { record: async () => {} });

    const installed = await service.install(10, 1, {
      manifestUrl: 'https://cdn.example.com/customer/1.2.0/manifest.json',
      manifest: validManifest(),
    });
    const listed = await service.list(10, 2);

    assert.deepEqual(installed, listed[0]);
    assert.deepEqual(listed, [{
      id: 1,
      projectId: 10,
      packageName: '@portfolio/customer-materials',
      version: '1.2.0',
      protocolVersion: '1',
      schemaVersion: '1.0.0',
      manifestUrl: 'https://cdn.example.com/customer/1.2.0/manifest.json',
      entry: 'https://cdn.example.com/customer/1.2.0/customer-materials.iife.js',
      integrity: 'sha384-YWJjZA==',
      dependencies: {
        react: '^18.3.1',
        reactDom: '^18.3.1',
        antd: '^5.20.0',
      },
      materials: [{
        name: 'CustomerSummary',
        displayName: '客户摘要',
        category: 'data',
        allowedParents: ['Page', 'Container'],
      }],
      status: 'enabled',
      createdAt: '2026-09-15T00:00:00.000Z',
      updatedAt: '2026-09-15T00:00:00.000Z',
    }]);
  });

  it('keeps old package versions immutable while the owner upgrades, disables and deletes them', async () => {
    const { RemoteMaterialsService } = require(
      '../../apps/api-server/dist/modules/remote-materials/remote-materials.service.js'
    );
    const database = createRemoteMaterialDatabase();
    const service = new RemoteMaterialsService(
      database.prisma,
      createProjectAccess(),
      { record: async () => {} },
    );
    const version1 = await service.install(10, 1, {
      manifestUrl: 'https://cdn.example.com/customer/1.2.0/manifest.json',
      manifest: validManifest(),
    });
    const version2 = await service.install(10, 1, {
      manifestUrl: 'https://cdn.example.com/customer/2.0.0/manifest.json',
      manifest: {
        ...validManifest(),
        version: '2.0.0',
      },
    });

    assert.deepEqual(
      (await service.list(10, 2)).map(({ version, status }) => ({ version, status })),
      [
        { version: '1.2.0', status: 'disabled' },
        { version: '2.0.0', status: 'enabled' },
      ],
    );

    await service.updateStatus(version2.id, 1, { status: 'disabled' });
    assert.equal((await service.list(10, 2))[1].status, 'disabled');
    assert.deepEqual(await service.delete(version1.id, 1), { success: true });
    assert.deepEqual(
      (await service.list(10, 2)).map(({ version }) => version),
      ['2.0.0'],
    );
  });

  it('rejects management by non-owners and rejects disabled page dependencies', async () => {
    const { RemoteMaterialsService } = require(
      '../../apps/api-server/dist/modules/remote-materials/remote-materials.service.js'
    );
    const database = createRemoteMaterialDatabase();
    const service = new RemoteMaterialsService(
      database.prisma,
      createProjectAccess(),
      { record: async () => {} },
    );

    await assert.rejects(
      service.install(10, 2, {
        manifestUrl: 'https://cdn.example.com/customer/1.2.0/manifest.json',
        manifest: validManifest(),
      }),
      /forbidden/,
    );

    const installed = await service.install(10, 1, {
      manifestUrl: 'https://cdn.example.com/customer/1.2.0/manifest.json',
      manifest: validManifest(),
    });
    const dependency = Object.fromEntries(
      Object.entries(installed).filter(([key]) => ![
        'id',
        'projectId',
        'status',
        'createdAt',
        'updatedAt',
      ].includes(key)),
    );
    await service.updateStatus(installed.id, 1, { status: 'disabled' });

    await assert.rejects(
      service.assertDependenciesEnabled(10, [dependency]),
      (error) => {
        assert.equal(error.getResponse().code, 'PAGE_MATERIAL_DEPENDENCY_INVALID');
        assert.match(error.message, /not installed or enabled/);
        return true;
      },
    );
  });
});

function createProjectAccess() {
  return {
    async requireProjectRole(projectId, userId, allowedRoles) {
      if (projectId !== 10 || (allowedRoles.length === 1 && userId !== 1)) {
        const error = new Error('forbidden');
        error.status = 403;
        throw error;
      }
      return { project: { id: projectId, ownerId: 1 }, role: userId === 1 ? 'OWNER' : 'VIEWER' };
    },
  };
}

function createRemoteMaterialDatabase() {
  const records = [];
  const now = new Date('2026-09-15T00:00:00.000Z');
  const client = {
    projectRemoteMaterial: {
      async findMany({ where }) {
        return records.filter((record) => (
          record.projectId === where.projectId
          && (where.status === undefined || record.status === where.status)
        ));
      },
      async findFirst({ where }) {
        return records.find((record) => (
          record.projectId === where.projectId
          && record.packageName === where.packageName
          && record.version === where.version
        )) || null;
      },
      async findUnique({ where }) {
        return records.find((record) => record.id === where.id) || null;
      },
      async create({ data }) {
        const record = { id: records.length + 1, ...data, createdAt: now, updatedAt: now };
        records.push(record);
        return record;
      },
      async updateMany({ where, data }) {
        let count = 0;
        records.forEach((record) => {
          if (
            record.projectId === where.projectId
            && record.packageName === where.packageName
            && (where.status === undefined || record.status === where.status)
          ) {
            Object.assign(record, data, { updatedAt: now });
            count += 1;
          }
        });
        return { count };
      },
      async update({ where, data }) {
        const record = records.find((item) => item.id === where.id);
        if (!record) throw new Error('not found');
        Object.assign(record, data, { updatedAt: now });
        return record;
      },
      async delete({ where }) {
        const index = records.findIndex((record) => record.id === where.id);
        if (index < 0) throw new Error('not found');
        return records.splice(index, 1)[0];
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
  };
}

function validManifest() {
  return {
    protocolVersion: '1',
    name: '@portfolio/customer-materials',
    version: '1.2.0',
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
      allowedParents: ['Page', 'Container'],
    }],
  };
}
