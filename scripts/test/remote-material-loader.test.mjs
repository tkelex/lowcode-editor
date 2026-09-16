import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { describe, it } from 'node:test';
import { build } from 'esbuild';

const require = createRequire(import.meta.url);
const { createPageMaterialDependency } = require('@lowcode/schema');
const VALID_ENTRY_SOURCE = 'window.__REMOTE_MATERIAL_TEST__ = true;';
const VALID_ENTRY_INTEGRITY = `sha384-${createHash('sha384').update(VALID_ENTRY_SOURCE).digest('base64')}`;

describe('remote material loader', () => {
  it('loads a pinned manifest and IIFE before returning the registered runtime material', async () => {
    const {
      createRemoteMaterialHost,
      createRemoteMaterialLoader,
    } = await loadRuntimeModule();
    const manifest = validManifest();
    const dependency = createPageMaterialDependency(
      manifest,
      'https://cdn.example.com/customer/1.2.0/manifest.json',
    );
    const CustomerSummary = () => null;
    const CustomerSummaryDev = () => null;
    const editorDefinition = {
      name: 'CustomerSummary',
      desc: '客户摘要',
      category: 'data',
      defaultProps: {},
      dev: CustomerSummaryDev,
      prod: CustomerSummary,
    };
    const host = createRemoteMaterialHost({
      trustedDependencies: [dependency],
      shared: { React: {}, ReactDOM: {}, antd: {} },
      sharedVersions: {
        react: '18.3.1',
        reactDom: '18.3.1',
        antd: '5.20.0',
      },
    });
    let scriptRemoved = false;
    const document = createScriptDocument((script) => {
      assert.equal(script.src, dependency.entry);
      assert.equal(script.integrity, dependency.integrity);
      assert.equal(script.crossOrigin, 'anonymous');
      script.remove = () => {
        scriptRemoved = true;
      };
      host.register({
        protocolVersion: '1',
        name: dependency.packageName,
        version: dependency.version,
        schemaVersion: dependency.schemaVersion,
        materials: { CustomerSummary },
        editorMaterials: { CustomerSummary: editorDefinition },
      });
      script.onload?.(new Event('load'));
    });
    const loader = createRemoteMaterialLoader({
      host,
      allowedOrigins: ['https://cdn.example.com'],
      document,
      fetchImpl: async (url) => {
        if (url === dependency.manifestUrl) {
          return new Response(JSON.stringify(manifest), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          });
        }
        if (url === dependency.entry) {
          return new Response(VALID_ENTRY_SOURCE, { status: 200 });
        }
        assert.fail(`未预期的请求：${url}`);
      },
    });

    const result = await loader.load(dependency);

    assert.equal(result.key, '@portfolio/customer-materials@1.2.0');
    assert.deepEqual(result.materialNames, ['CustomerSummary']);
    assert.equal(result.registry.CustomerSummary.component, CustomerSummary);
    assert.deepEqual(result.editorMaterials, { CustomerSummary: editorDefinition });
    assert.equal(scriptRemoved, true);
  });

  it('rejects a dependency whose manifest origin is outside the allowlist', async () => {
    const {
      createRemoteMaterialHost,
      createRemoteMaterialLoader,
    } = await loadRuntimeModule();
    const dependency = createPageMaterialDependency(
      validManifest(),
      'https://untrusted.example.com/customer/1.2.0/manifest.json',
    );
    const host = createRemoteMaterialHost({
      trustedDependencies: [dependency],
      shared: { React: {}, ReactDOM: {}, antd: {} },
      sharedVersions: {
        react: '18.3.1',
        reactDom: '18.3.1',
        antd: '5.20.0',
      },
    });
    const loader = createRemoteMaterialLoader({
      host,
      allowedOrigins: ['https://cdn.example.com'],
      document: createScriptDocument(() => {
        assert.fail('不应注入未授权来源的脚本');
      }),
      fetchImpl: async () => {
        assert.fail('不应请求未授权来源的 manifest');
      },
    });

    await assert.rejects(
      () => loader.load(dependency),
      (error) => {
        assert.equal(error.code, 'ORIGIN_NOT_ALLOWED');
        assert.match(error.message, /untrusted\.example\.com/);
        return true;
      },
    );
  });

  it('rejects insecure HTTP outside local development hosts', async () => {
    const {
      createRemoteMaterialHost,
      createRemoteMaterialLoader,
    } = await loadRuntimeModule();
    const dependency = createPageMaterialDependency(
      validManifest(),
      'http://cdn.example.com/customer/1.2.0/manifest.json',
    );
    const host = createRemoteMaterialHost({
      trustedDependencies: [dependency],
      shared: { React: {}, ReactDOM: {}, antd: {} },
      sharedVersions: {
        react: '18.3.1',
        reactDom: '18.3.1',
        antd: '5.20.0',
      },
    });
    const loader = createRemoteMaterialLoader({
      host,
      allowedOrigins: ['http://cdn.example.com'],
      document: createScriptDocument(() => {
        assert.fail('不应注入非本地 HTTP 脚本');
      }),
      fetchImpl: async () => {
        assert.fail('不应请求非本地 HTTP manifest');
      },
    });

    await assert.rejects(
      () => loader.load(dependency),
      (error) => {
        assert.equal(error.code, 'PROTOCOL_NOT_ALLOWED');
        assert.match(error.message, /HTTPS/);
        return true;
      },
    );
  });

  it('maps a missing manifest to a structured fetch failure', async () => {
    const {
      createRemoteMaterialHost,
      createRemoteMaterialLoader,
    } = await loadRuntimeModule();
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
    });
    const loader = createRemoteMaterialLoader({
      host,
      allowedOrigins: ['https://cdn.example.com'],
      document: createScriptDocument(() => {
        assert.fail('manifest 失败后不应注入脚本');
      }),
      fetchImpl: async () => new Response('not found', { status: 404 }),
    });

    await assert.rejects(
      () => loader.load(dependency),
      (error) => {
        assert.equal(error.code, 'MANIFEST_FETCH_FAILED');
        assert.match(error.message, /HTTP 404/);
        return true;
      },
    );
  });

  it('rejects a manifest whose fixed version drifted from the page snapshot', async () => {
    const {
      createRemoteMaterialHost,
      createRemoteMaterialLoader,
    } = await loadRuntimeModule();
    const manifest = validManifest();
    const dependency = createPageMaterialDependency(
      manifest,
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
    });
    const loader = createRemoteMaterialLoader({
      host,
      allowedOrigins: ['https://cdn.example.com'],
      document: createScriptDocument(() => {
        assert.fail('漂移的 manifest 不应继续注入脚本');
      }),
      fetchImpl: async () => new Response(JSON.stringify({
        ...manifest,
        version: '1.2.1',
      }), { status: 200 }),
    });

    await assert.rejects(
      () => loader.load(dependency),
      (error) => {
        assert.equal(error.code, 'MANIFEST_MISMATCH');
        assert.match(error.message, /固定依赖不一致/);
        return true;
      },
    );
  });

  it('maps a failed IIFE request to a structured entry load failure', async () => {
    const {
      createRemoteMaterialHost,
      createRemoteMaterialLoader,
    } = await loadRuntimeModule();
    const manifest = validManifest();
    const dependency = createPageMaterialDependency(
      manifest,
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
    });
    const loader = createRemoteMaterialLoader({
      host,
      allowedOrigins: ['https://cdn.example.com'],
      document: createScriptDocument(() => {
        assert.fail('entry 预检失败后不应注入脚本');
      }),
      fetchImpl: async (url) => {
        if (url === dependency.manifestUrl) {
          return new Response(JSON.stringify(manifest), { status: 200 });
        }
        if (url === dependency.entry) {
          return new Response('not found', { status: 404 });
        }
        assert.fail(`未预期的请求：${url}`);
      },
    });

    await assert.rejects(
      () => loader.load(dependency),
      (error) => {
        assert.equal(error.code, 'ENTRY_LOAD_FAILED');
        assert.match(error.message, /customer-materials\.iife\.js/);
        return true;
      },
    );
  });

  it('maps a browser script rejection after byte verification to an integrity failure', async () => {
    const {
      createRemoteMaterialHost,
      createRemoteMaterialLoader,
    } = await loadRuntimeModule();
    const manifest = validManifest();
    const dependency = createPageMaterialDependency(
      manifest,
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
    });
    const loader = createRemoteMaterialLoader({
      host,
      allowedOrigins: ['https://cdn.example.com'],
      document: createScriptDocument((script) => {
        script.onerror?.(new Event('error'));
      }),
      fetchImpl: createValidFetch(manifest, dependency),
    });

    await assert.rejects(
      () => loader.load(dependency),
      (error) => {
        assert.equal(error.code, 'INTEGRITY_FAILED');
        assert.match(error.message, /integrity/);
        return true;
      },
    );
  });

  it('rejects an IIFE that loads without registering its pinned package', async () => {
    const {
      createRemoteMaterialHost,
      createRemoteMaterialLoader,
    } = await loadRuntimeModule();
    const manifest = validManifest();
    const dependency = createPageMaterialDependency(
      manifest,
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
    });
    const loader = createRemoteMaterialLoader({
      host,
      allowedOrigins: ['https://cdn.example.com'],
      document: createScriptDocument((script) => {
        script.onload?.(new Event('load'));
      }),
      fetchImpl: createValidFetch(manifest, dependency),
    });

    await assert.rejects(
      () => loader.load(dependency),
      (error) => {
        assert.equal(error.code, 'REGISTRATION_MISSING');
        assert.match(error.message, /CustomerSummary/);
        return true;
      },
    );
  });

  it('times out when the IIFE never finishes loading or registering', async () => {
    const {
      createRemoteMaterialHost,
      createRemoteMaterialLoader,
    } = await loadRuntimeModule();
    const manifest = validManifest();
    const dependency = createPageMaterialDependency(
      manifest,
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
    });
    const loader = createRemoteMaterialLoader({
      host,
      allowedOrigins: ['https://cdn.example.com'],
      timeoutMs: 10,
      document: createScriptDocument(() => undefined),
      fetchImpl: createValidFetch(manifest, dependency),
    });

    await assert.rejects(
      () => Promise.race([
        loader.load(dependency),
        new Promise((_, reject) => setTimeout(() => {
          const error = new Error('测试等待 loader 超时');
          error.code = 'TEST_TIMEOUT';
          reject(error);
        }, 100)),
      ]),
      (error) => {
        assert.equal(error.code, 'REGISTRATION_TIMEOUT');
        assert.match(error.message, /10ms/);
        return true;
      },
    );
  });

  it('deduplicates concurrent loads by pinned package version and entry', async () => {
    const {
      createRemoteMaterialHost,
      createRemoteMaterialLoader,
    } = await loadRuntimeModule();
    const manifest = validManifest();
    const dependency = createPageMaterialDependency(
      manifest,
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
    let manifestFetchCount = 0;
    let entryFetchCount = 0;
    let appendCount = 0;
    const loader = createRemoteMaterialLoader({
      host,
      allowedOrigins: ['https://cdn.example.com'],
      document: createScriptDocument((script) => {
        appendCount += 1;
        host.register({
          protocolVersion: '1',
          name: dependency.packageName,
          version: dependency.version,
          schemaVersion: dependency.schemaVersion,
          materials: { CustomerSummary },
        });
        script.onload?.(new Event('load'));
      }),
      fetchImpl: async (url) => {
        if (url === dependency.manifestUrl) {
          manifestFetchCount += 1;
          return new Response(JSON.stringify(manifest), { status: 200 });
        }
        if (url === dependency.entry) {
          entryFetchCount += 1;
          return new Response(VALID_ENTRY_SOURCE, { status: 200 });
        }
        assert.fail(`未预期的请求：${url}`);
      },
    });

    const [first, second] = await Promise.all([
      loader.load(dependency),
      loader.load(dependency),
    ]);

    assert.equal(manifestFetchCount, 1);
    assert.equal(entryFetchCount, 1);
    assert.equal(appendCount, 1);
    assert.equal(first.registry.CustomerSummary.component, CustomerSummary);
    assert.equal(second.registry.CustomerSummary.component, CustomerSummary);
  });

  it('removes failed cache entries so a fixed remote source can be retried', async () => {
    const {
      createRemoteMaterialHost,
      createRemoteMaterialLoader,
    } = await loadRuntimeModule();
    const manifest = validManifest();
    const dependency = createPageMaterialDependency(
      manifest,
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
    let manifestAttempts = 0;
    const loader = createRemoteMaterialLoader({
      host,
      allowedOrigins: ['https://cdn.example.com'],
      document: createScriptDocument((script) => {
        host.register({
          protocolVersion: '1',
          name: dependency.packageName,
          version: dependency.version,
          schemaVersion: dependency.schemaVersion,
          materials: { CustomerSummary },
        });
        script.onload?.(new Event('load'));
      }),
      fetchImpl: async (url) => {
        if (url === dependency.manifestUrl) {
          manifestAttempts += 1;
          if (manifestAttempts === 1) {
            return new Response('temporary failure', { status: 503 });
          }
          return new Response(JSON.stringify(manifest), { status: 200 });
        }
        if (url === dependency.entry) {
          return new Response(VALID_ENTRY_SOURCE, { status: 200 });
        }
        assert.fail(`未预期的请求：${url}`);
      },
    });

    await assert.rejects(() => loader.load(dependency), { code: 'MANIFEST_FETCH_FAILED' });
    const result = await loader.load(dependency);

    assert.equal(manifestAttempts, 2);
    assert.equal(result.registry.CustomerSummary.component, CustomerSummary);
  });

  it('rejects entry bytes that do not match the pinned SRI value', async () => {
    const {
      createRemoteMaterialHost,
      createRemoteMaterialLoader,
    } = await loadRuntimeModule();
    const manifest = validManifest();
    const dependency = createPageMaterialDependency(
      manifest,
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
    });
    const loader = createRemoteMaterialLoader({
      host,
      allowedOrigins: ['https://cdn.example.com'],
      document: createScriptDocument(() => {
        assert.fail('integrity 不匹配时不应执行脚本');
      }),
      fetchImpl: async (url) => {
        if (url === dependency.manifestUrl) {
          return new Response(JSON.stringify(manifest), { status: 200 });
        }
        if (url === dependency.entry) {
          return new Response('tampered entry bytes', { status: 200 });
        }
        assert.fail(`未预期的请求：${url}`);
      },
    });

    await assert.rejects(
      () => loader.load(dependency),
      (error) => {
        assert.equal(error.code, 'INTEGRITY_FAILED');
        assert.match(error.message, /integrity/);
        return true;
      },
    );
  });
});

async function loadRuntimeModule() {
  const outdir = path.resolve('node_modules/.tmp/remote-material-loader-test');
  await mkdir(outdir, { recursive: true });
  const outfile = path.join(outdir, `loader-${Date.now()}-${Math.random().toString(16).slice(2)}.cjs`);
  const result = await build({
    entryPoints: ['packages/lowcode-runtime/src/client.ts'],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    write: false,
    external: ['react', 'react-dom', 'react/jsx-runtime', 'antd'],
  });
  await writeFile(outfile, result.outputFiles[0].text, 'utf8');
  return require(outfile);
}

function createScriptDocument(onAppend) {
  return {
    createElement(tagName) {
      assert.equal(tagName, 'script');
      return {
        async: false,
        crossOrigin: '',
        integrity: '',
        onerror: null,
        onload: null,
        src: '',
      };
    },
    head: {
      appendChild(script) {
        onAppend(script);
        return script;
      },
    },
  };
}

function createValidFetch(manifest, dependency) {
  return async (url) => {
    if (url === dependency.manifestUrl) {
      return new Response(JSON.stringify(manifest), { status: 200 });
    }
    if (url === dependency.entry) {
      return new Response(VALID_ENTRY_SOURCE, { status: 200 });
    }
    assert.fail(`未预期的请求：${url}`);
  };
}

function validManifest() {
  return {
    protocolVersion: '1',
    name: '@portfolio/customer-materials',
    version: '1.2.0',
    entry: './customer-materials.iife.js',
    integrity: VALID_ENTRY_INTEGRITY,
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
