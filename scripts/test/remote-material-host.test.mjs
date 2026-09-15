import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { describe, it } from 'node:test';
import { build } from 'esbuild';

const require = createRequire(import.meta.url);
const { createPageMaterialDependency } = require('@lowcode/schema');

describe('remote material host protocol', () => {
  it('registers a trusted bundle once and treats repeated registration as idempotent', async () => {
    const { createRemoteMaterialHost } = await loadHostModule();
    const dependency = createPageMaterialDependency(
      validManifest(),
      'https://cdn.example.com/customer/1.2.0/manifest.json',
    );
    const CustomerSummary = () => null;
    const host = createRemoteMaterialHost({
      trustedDependencies: [dependency],
      shared: { React: {}, ReactDOM: {}, antd: {} },
      sharedVersions: {
        react: '18.3.1',
        reactDom: '18.3.1',
        antd: '5.20.0',
      },
    });
    const bundle = {
      protocolVersion: '1',
      name: dependency.packageName,
      version: dependency.version,
      schemaVersion: dependency.schemaVersion,
      materials: { CustomerSummary },
    };

    assert.deepEqual(host.register(bundle), {
      status: 'registered',
      key: '@portfolio/customer-materials@1.2.0',
      materialNames: ['CustomerSummary'],
    });
    assert.deepEqual(host.register(bundle), {
      status: 'already_registered',
      key: '@portfolio/customer-materials@1.2.0',
      materialNames: ['CustomerSummary'],
    });
    assert.equal(host.getRegistry().CustomerSummary.component, CustomerSummary);
  });

  it('rejects a bundle when the host shared dependency versions do not satisfy its manifest', async () => {
    const { createRemoteMaterialHost } = await loadHostModule();
    const dependency = createPageMaterialDependency(
      validManifest(),
      'https://cdn.example.com/customer/1.2.0/manifest.json',
    );
    const host = createRemoteMaterialHost({
      trustedDependencies: [dependency],
      shared: { React: {}, ReactDOM: {}, antd: {} },
      sharedVersions: {
        react: '17.0.2',
        reactDom: '17.0.2',
        antd: '5.20.0',
      },
    });

    assert.throws(
      () => host.register({
        protocolVersion: '1',
        name: dependency.packageName,
        version: dependency.version,
        schemaVersion: dependency.schemaVersion,
        materials: { CustomerSummary: () => null },
      }),
      (error) => {
        assert.equal(error.code, 'SHARED_DEPENDENCY_INCOMPATIBLE');
        assert.match(error.message, /react/);
        return true;
      },
    );
  });

  it('rejects a remote component that conflicts with the host runtime registry', async () => {
    const { createRemoteMaterialHost } = await loadHostModule();
    const dependency = createPageMaterialDependency(
      validManifest(),
      'https://cdn.example.com/customer/1.2.0/manifest.json',
    );
    const host = createRemoteMaterialHost({
      trustedDependencies: [dependency],
      shared: { React: {}, ReactDOM: {}, antd: {} },
      sharedVersions: {
        react: '18.3.1',
        reactDom: '18.3.1',
        antd: '5.20.0',
      },
      initialRegistry: {
        CustomerSummary: { component: () => null },
      },
    });

    assert.throws(
      () => host.register({
        protocolVersion: '1',
        name: dependency.packageName,
        version: dependency.version,
        schemaVersion: dependency.schemaVersion,
        materials: { CustomerSummary: () => null },
      }),
      (error) => {
        assert.equal(error.code, 'COMPONENT_CONFLICT');
        assert.match(error.message, /CustomerSummary/);
        return true;
      },
    );
  });
});

async function loadHostModule() {
  const outdir = path.resolve('node_modules/.tmp/remote-material-host-test');
  await mkdir(outdir, { recursive: true });
  const outfile = path.join(outdir, `host-${Date.now()}-${Math.random().toString(16).slice(2)}.cjs`);
  const result = await build({
    entryPoints: ['packages/lowcode-runtime/src/remote-material-host.ts'],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    write: false,
    external: ['react', 'react-dom', 'antd'],
  });
  await writeFile(outfile, result.outputFiles[0].text, 'utf8');
  return require(outfile);
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
