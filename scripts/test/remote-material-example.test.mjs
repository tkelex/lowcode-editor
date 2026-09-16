import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { once } from 'node:events';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { build } from 'esbuild';
import React from 'react';
import * as ReactDOM from 'react-dom';
import { renderToStaticMarkup } from 'react-dom/server';

const require = createRequire(import.meta.url);
const {
  createPageMaterialDependency,
  validateRemoteMaterialManifest,
} = require('@lowcode/schema');
const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(testDirectory, '../..');
const exampleRoot = path.join(repositoryRoot, 'apps/remote-material-example');
const distDirectory = path.join(exampleRoot, 'dist');
let cachedBuildResult;

describe('remote material example package', () => {
  it('builds a deployable IIFE entry and a contract-valid manifest with matching SRI', async () => {
    const result = spawnSync(
      process.platform === 'win32' ? 'npm.cmd' : 'npm',
      ['run', 'build', '--workspace', '@lowcode/remote-material-example'],
      {
        cwd: repositoryRoot,
        encoding: 'utf8',
        shell: process.platform === 'win32',
      },
    );

    assert.equal(result.status, 0, result.error?.message || result.stderr || result.stdout);

    const manifest = JSON.parse(
      await readFile(path.join(distDirectory, 'manifest.json'), 'utf8'),
    );
    const validation = validateRemoteMaterialManifest(manifest);
    assert.equal(validation.valid, true, validation.errors.join('\n'));

    const entryPath = path.resolve(distDirectory, manifest.entry);
    const entry = await readFile(entryPath);
    const integrity = `sha384-${createHash('sha384').update(entry).digest('base64')}`;

    assert.equal(manifest.integrity, integrity);
    assert.match(entry.toString('utf8'), /__LOWCODE_MATERIAL_HOST__/);
  });

  it('registers a hook-based component that renders with the host React and Ant Design instances', async () => {
    const result = buildExample();
    assert.equal(result.status, 0, result.error?.message || result.stderr || result.stdout);

    const manifest = JSON.parse(
      await readFile(path.join(distDirectory, 'manifest.json'), 'utf8'),
    );
    const dependency = createPageMaterialDependency(
      manifest,
      'https://cdn.example.com/remote-material-example/1.0.0/manifest.json',
    );
    const { createRemoteMaterialHost } = await loadHostModule();
    let hostUseStateCalls = 0;
    let actionButtonProps;
    const sharedReact = new Proxy(React, {
      get(target, property, receiver) {
        if (property === 'useState') {
          return (...args) => {
            hostUseStateCalls += 1;
            return target.useState(...args);
          };
        }
        return Reflect.get(target, property, receiver);
      },
    });
    const antd = createAntdFixture((props) => {
      actionButtonProps = props;
    });
    const host = createRemoteMaterialHost({
      trustedDependencies: [dependency],
      shared: {
        React: sharedReact,
        ReactDOM,
        antd,
      },
      sharedVersions: {
        react: '18.3.1',
        reactDom: '18.3.1',
        antd: '5.20.0',
      },
    });

    const entry = await readFile(path.resolve(distDirectory, manifest.entry), 'utf8');
    vm.runInNewContext(entry, {
      window: { __LOWCODE_MATERIAL_HOST__: host },
    });

    const CustomerMetricCard = host.getRegistry().CustomerMetricCard.component;
    const actions = [];
    const html = renderToStaticMarkup(React.createElement(
      CustomerMetricCard,
      {
        title: '活跃客户',
        value: 128,
        unit: '人',
        accentColor: '#2563eb',
        actionText: '刷新数据',
        onAction: (event) => actions.push(event),
      },
      React.createElement('span', null, '更新时间：刚刚'),
    ));

    assert.ok(hostUseStateCalls > 0, '组件应调用宿主 React.useState');
    assert.match(html, /活跃客户/);
    assert.match(html, /128/);
    assert.match(html, /更新时间：刚刚/);
    assert.match(html, /#2563eb/);
    assert.equal(typeof actionButtonProps?.onClick, 'function');

    actionButtonProps.onClick();
    assert.equal(actions.length, 1);
    assert.equal(actions[0].actionCount, 1);
    assert.equal(actions[0].value, 128);
  });

  it('publishes an editor definition with dev/prod components, setters, events, methods and child capability', async () => {
    const result = buildExample();
    assert.equal(result.status, 0, result.error?.message || result.stderr || result.stdout);

    const manifest = JSON.parse(
      await readFile(path.join(distDirectory, 'manifest.json'), 'utf8'),
    );
    const entry = await readFile(path.resolve(distDirectory, manifest.entry), 'utf8');
    let registeredBundle;
    const antd = createAntdFixture(() => {});
    vm.runInNewContext(entry, {
      window: {
        __LOWCODE_MATERIAL_HOST__: {
          protocolVersion: '1',
          shared: { React, ReactDOM, antd },
          register(bundle) {
            registeredBundle = bundle;
          },
        },
      },
    });

    const definition = registeredBundle?.editorMaterials?.CustomerMetricCard;
    assert.ok(definition, '远程包应公开 CustomerMetricCard 编辑态定义');
    assert.equal(definition.name, 'CustomerMetricCard');
    assert.equal(definition.acceptsChildren, true);
    assert.notEqual(definition.dev, registeredBundle.materials.CustomerMetricCard);
    assert.equal(definition.prod, registeredBundle.materials.CustomerMetricCard);
    assert.deepEqual(
      Array.from(definition.setter, (item) => item.name),
      ['title', 'value', 'unit', 'accentColor', 'actionText'],
    );
    assert.deepEqual(
      Array.from(definition.events, (item) => item.name),
      ['action'],
    );
    assert.deepEqual(
      Array.from(definition.methods, (item) => item.name),
      ['reset'],
    );

    const devHtml = renderToStaticMarkup(React.createElement(definition.dev, {
      id: 42,
      title: '编辑态客户指标',
      value: 0,
    }));
    assert.match(devHtml, /data-component-id="42"/);
    assert.match(devHtml, /data-component-name="CustomerMetricCard"/);
    assert.match(devHtml, /编辑态客户指标/);
  });

  it('serves the built manifest and entry with cross-origin headers', async () => {
    const result = buildExample();
    assert.equal(result.status, 0, result.error?.message || result.stderr || result.stdout);

    const server = spawn(
      process.execPath,
      [path.join(exampleRoot, 'scripts/serve.mjs'), '--host', '127.0.0.1', '--port', '0'],
      {
        cwd: repositoryRoot,
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );

    try {
      const baseUrl = await waitForServerUrl(server);
      const manifestResponse = await fetch(`${baseUrl}/manifest.json`);
      assert.equal(manifestResponse.status, 200);
      assert.equal(manifestResponse.headers.get('access-control-allow-origin'), '*');
      const manifest = await manifestResponse.json();

      const entryResponse = await fetch(new URL(manifest.entry, `${baseUrl}/`));
      assert.equal(entryResponse.status, 200);
      assert.equal(entryResponse.headers.get('access-control-allow-origin'), '*');
      assert.match(entryResponse.headers.get('content-type') || '', /javascript/);
      assert.match(await entryResponse.text(), /__LOWCODE_MATERIAL_HOST__/);
    } finally {
      if (server.exitCode === null) {
        server.kill();
        await once(server, 'exit');
      }
    }
  });

  it('exposes root build and serve commands while keeping host libraries peer-only', async () => {
    const rootPackage = JSON.parse(
      await readFile(path.join(repositoryRoot, 'package.json'), 'utf8'),
    );
    const examplePackage = JSON.parse(
      await readFile(path.join(exampleRoot, 'package.json'), 'utf8'),
    );

    assert.equal(
      rootPackage.scripts['build:remote-material-example'],
      'npm run build --workspace @lowcode/remote-material-example',
    );
    assert.equal(
      rootPackage.scripts['serve:remote-material-example'],
      'npm run serve --workspace @lowcode/remote-material-example --',
    );
    assert.equal(examplePackage.dependencies, undefined);
    assert.deepEqual(
      examplePackage.peerDependencies,
      {
        antd: '^5.20.0',
        react: '^18.3.1',
        'react-dom': '^18.3.1',
      },
    );

    const manifest = JSON.parse(
      await readFile(path.join(distDirectory, 'manifest.json'), 'utf8'),
    );
    const entry = await readFile(path.resolve(distDirectory, manifest.entry), 'utf8');
    assert.ok(Buffer.byteLength(entry) < 30_000, 'IIFE 不应打包 React、ReactDOM 或 Ant Design');
    assert.doesNotMatch(entry, /__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED|Minified React error/);
  });
});

function buildExample() {
  cachedBuildResult ??= spawnSync(
    process.platform === 'win32' ? 'npm.cmd' : 'npm',
    ['run', 'build', '--workspace', '@lowcode/remote-material-example'],
    {
      cwd: repositoryRoot,
      encoding: 'utf8',
      shell: process.platform === 'win32',
    },
  );
  return cachedBuildResult;
}

function createAntdFixture(captureButtonProps) {
  return {
    Button(props) {
      captureButtonProps(props);
      return React.createElement('button', { type: 'button' }, props.children);
    },
    Card({ children, style, title }) {
      return React.createElement('section', { style }, [
        React.createElement('h3', { key: 'title' }, title),
        React.createElement('div', { key: 'content' }, children),
      ]);
    },
    Space({ children }) {
      return React.createElement('div', null, children);
    },
    Statistic({ suffix, title, value }) {
      return React.createElement('div', null, `${title}: ${value}${suffix || ''}`);
    },
    Tag({ children }) {
      return React.createElement('span', null, children);
    },
  };
}

async function loadHostModule() {
  const outdir = path.resolve('node_modules/.tmp/remote-material-example-test');
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

function waitForServerUrl(server) {
  return new Promise((resolve, reject) => {
    let stdout = '';
    let stderr = '';
    const timeout = setTimeout(() => {
      reject(new Error(`等待远程物料静态服务超时\n${stdout}\n${stderr}`));
    }, 10_000);

    server.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
      const match = stdout.match(/http:\/\/127\.0\.0\.1:\d+/);
      if (match) {
        clearTimeout(timeout);
        resolve(match[0]);
      }
    });
    server.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    server.once('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    server.once('exit', (code) => {
      if (!stdout.match(/http:\/\/127\.0\.0\.1:\d+/)) {
        clearTimeout(timeout);
        reject(new Error(`远程物料静态服务提前退出（${code}）\n${stdout}\n${stderr}`));
      }
    });
  });
}
