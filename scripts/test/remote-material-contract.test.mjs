import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { describe, it } from 'node:test';

const require = createRequire(import.meta.url);
const {
  createPageMaterialDependency,
  createPageMaterialValidationContext,
  validateComponentTree,
  validateRemoteMaterialManifest,
} = require('@lowcode/schema');

describe('remote material contract', () => {
  it('accepts and normalizes a trusted versioned manifest', () => {
    const result = validateRemoteMaterialManifest({
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
    });

    assert.deepEqual(result, {
      valid: true,
      errors: [],
      manifest: {
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
      },
    });
  });

  it('pins an absolute entry and integrity in a page material dependency', () => {
    const manifest = validManifest();

    assert.deepEqual(
      createPageMaterialDependency(
        manifest,
        'https://cdn.example.com/customer/1.2.0/manifest.json',
      ),
      {
        protocolVersion: '1',
        packageName: '@portfolio/customer-materials',
        version: '1.2.0',
        manifestUrl: 'https://cdn.example.com/customer/1.2.0/manifest.json',
        entry: 'https://cdn.example.com/customer/1.2.0/customer-materials.iife.js',
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
      },
    );
  });

  it('extends schema validation and selects only dependencies used by the page', () => {
    const dependency = createPageMaterialDependency(
      validManifest(),
      'https://cdn.example.com/customer/1.2.0/manifest.json',
    );
    const context = createPageMaterialValidationContext([dependency]);
    const components = [{
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
    }];

    assert.equal(
      validateComponentTree(components, context.componentConfig).valid,
      true,
    );
    assert.deepEqual(context.selectDependencies(components), [dependency]);
  });

  it('rejects floating versions, incompatible schema and duplicate component declarations', () => {
    const result = validateRemoteMaterialManifest({
      ...validManifest(),
      version: 'latest',
      schemaVersion: '2.0.0',
      materials: [
        validManifest().materials[0],
        validManifest().materials[0],
      ],
    });

    assert.equal(result.valid, false);
    assert.match(result.errors.join('\n'), /固定版本/);
    assert.match(result.errors.join('\n'), /不兼容/);
    assert.match(result.errors.join('\n'), /不能重复/);
  });

  it('rejects a remote component name that conflicts with a built-in material', () => {
    const dependency = createPageMaterialDependency({
      ...validManifest(),
      materials: [{
        ...validManifest().materials[0],
        name: 'Button',
      }],
    }, 'https://cdn.example.com/customer/1.2.0/manifest.json');

    assert.throws(
      () => createPageMaterialValidationContext([dependency]),
      (error) => {
        assert.equal(error.code, 'COMPONENT_CONFLICT');
        assert.match(error.message, /Button/);
        return true;
      },
    );
  });

  it('extends parent acceptance without mutating the immutable dependency snapshot', () => {
    const dependency = createPageMaterialDependency({
      ...validManifest(),
      materials: [
        {
          name: 'RemoteContainer',
          displayName: '远程容器',
          category: 'layout',
          allowedParents: ['Page'],
          acceptsChildren: ['Text'],
        },
        {
          name: 'RemoteChild',
          displayName: '远程子项',
          category: 'data',
          allowedParents: ['RemoteContainer'],
        },
      ],
    }, 'https://cdn.example.com/customer/1.2.0/manifest.json');
    const context = createPageMaterialValidationContext([dependency]);

    assert.deepEqual(dependency.materials[0].acceptsChildren, ['Text']);
    assert.deepEqual(context.componentConfig.RemoteContainer.acceptsChildren, ['Text', 'RemoteChild']);
  });
});

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
