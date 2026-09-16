import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { describe, it } from 'node:test';
import { build } from 'esbuild';

const require = createRequire(import.meta.url);

describe('remote material editor adapter', () => {
  it('normalizes remote dev, setters, events and methods into editor component configs', async () => {
    const {
      createRemoteEditorComponentConfigs,
      createRemoteParentAccepts,
    } = await loadAdapterModule();
    const Dev = () => null;
    const Prod = () => null;

    const configs = createRemoteEditorComponentConfigs([{
      key: '@portfolio/customer-materials@1.2.0',
      materialNames: ['CustomerSummary'],
      registry: {},
      editorMaterials: {
        CustomerSummary: {
          name: 'CustomerSummary',
          desc: '客户摘要',
          category: 'data',
          icon: '№',
          keywords: ['客户'],
          sort: 80,
          defaultProps: { title: '客户摘要' },
          acceptsChildren: true,
          setter: [
            { name: 'title', label: '标题', type: 'input' },
            { name: 'value', label: '数值', type: 'number' },
          ],
          events: [{ name: 'action', label: '操作事件', propName: 'onAction' }],
          methods: [{ name: 'reset', label: '重置' }],
          dev: Dev,
          prod: Prod,
        },
      },
    }]);

    assert.equal(configs.CustomerSummary.dev, Dev);
    assert.equal(configs.CustomerSummary.prod, Prod);
    assert.deepEqual(configs.CustomerSummary.defaultProps, { title: '客户摘要' });
    assert.equal(configs.CustomerSummary.setter[1].type, 'inputNumber');
    assert.deepEqual(configs.CustomerSummary.events, [{
      name: 'action',
      label: '操作事件',
      propName: 'onAction',
      category: 'ui',
      description: '操作事件触发时执行',
      eventDataSchema: ['args'],
      allowedActions: [
        'toast',
        'url',
        'componentAction',
        'componentControl',
        'confirm',
        'condition',
        'http',
        'setComponentProps',
        'setComponentStyles',
        'setVariable',
        'custom',
      ],
    }]);
    assert.deepEqual(configs.CustomerSummary.methods, [{ name: 'reset', label: '重置' }]);
    assert.deepEqual(createRemoteParentAccepts([{
      materials: [{
        name: 'CustomerSummary',
        allowedParents: ['Page', 'Container'],
      }],
    }]), {
      Page: ['CustomerSummary'],
      Container: ['CustomerSummary'],
    });
  });

  it('replaces project remote configs without removing built-in materials', async () => {
    const { useComponentConfigStore } = await loadEditorModule(
      'apps/editor-web/src/features/editor/registry/component-registry-store.tsx',
      'registry',
    );
    const Dev = () => null;
    const Prod = () => null;
    const createConfig = (name) => ({
      name,
      desc: name,
      defaultProps: {},
      dev: Dev,
      prod: Prod,
    });

    useComponentConfigStore.getState().replaceRemoteComponents({
      RemoteOne: {
        ...createConfig('RemoteOne'),
        acceptsChildren: ['Text'],
      },
      RemoteChild: createConfig('RemoteChild'),
    }, {
      Page: ['RemoteOne'],
      RemoteOne: ['RemoteChild'],
    });
    assert.ok(useComponentConfigStore.getState().componentConfig.Button);
    assert.ok(useComponentConfigStore.getState().componentConfig.RemoteOne);
    assert.ok(useComponentConfigStore.getState().componentConfig.Page.acceptsChildren.includes('RemoteOne'));
    assert.deepEqual(
      useComponentConfigStore.getState().componentConfig.RemoteOne.acceptsChildren,
      ['Text', 'RemoteChild'],
    );

    useComponentConfigStore.getState().replaceRemoteComponents({
      RemoteTwo: createConfig('RemoteTwo'),
    });
    assert.ok(useComponentConfigStore.getState().componentConfig.Button);
    assert.equal(useComponentConfigStore.getState().componentConfig.RemoteOne, undefined);
    assert.ok(useComponentConfigStore.getState().componentConfig.RemoteTwo);

    useComponentConfigStore.getState().replaceRemoteComponents({});
  });
});

async function loadAdapterModule() {
  return loadEditorModule(
    'apps/editor-web/src/features/editor/remote-materials/editor-adapter.ts',
    'adapter',
  );
}

async function loadEditorModule(entryPoint, prefix) {
  const outdir = path.resolve('node_modules/.tmp/remote-material-editor-adapter-test');
  await mkdir(outdir, { recursive: true });
  const outfile = path.join(outdir, `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}.cjs`);
  const result = await build({
    entryPoints: [entryPoint],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    write: false,
    external: ['react', 'react-dom', 'react/jsx-runtime', 'antd'],
  });
  await writeFile(outfile, result.outputFiles[0].text, 'utf8');
  return require(outfile);
}
