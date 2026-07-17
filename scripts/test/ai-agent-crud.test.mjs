import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  generateAiCrudPageCandidate,
  decideAiAgentRoute,
  isCrudGenerationIntent,
  validateAiGeneratedComponents,
} from './schema-test-utils.mjs';

const userModel = {
  id: 'model-user',
  name: '用户',
  key: 'user',
  primaryField: 'id',
  listApi: {
    url: '/api/users',
    method: 'GET',
    responseDataPath: 'data.items',
  },
  createApi: {
    url: '/api/users',
    method: 'POST',
  },
  updateApi: {
    url: '/api/users/{{ variables.recordId }}',
    method: 'PUT',
  },
  detailApi: {
    url: '/api/users/{{ variables.recordId }}',
    method: 'GET',
  },
  fields: [
    { key: 'id', label: 'ID', type: 'text', formVisible: false },
    { key: 'name', label: '名称', type: 'text', required: true },
    { key: 'email', label: '邮箱', type: 'text' },
  ],
};

describe('ai agent CRUD generation helpers', () => {
  it('detects CRUD/data source requests', () => {
    assert.equal(isCrudGenerationIntent({ prompt: '基于 /api/users 生成用户管理页' }), true);
    assert.equal(isCrudGenerationIntent({ prompt: '给当前容器加一段说明文字' }), false);
  });

  it('routes explicit CRUD requests to deterministic generation', () => {
    assert.equal(isCrudGenerationIntent({ prompt: 'Create a user CRUD page with list, create, edit, and detail views' }), true);
    assert.equal(isCrudGenerationIntent({ prompt: 'Build a product admin table from /api/products with pagination' }), true);
    assert.equal(isCrudGenerationIntent({ prompt: 'Use this data source model to generate a management page', dataSourceModel: userModel }), true);

    const decision = decideAiAgentRoute({ prompt: 'Build a product admin table from /api/products with pagination' });
    assert.equal(decision.intent, 'crud-page');
    assert.equal(decision.preferredTool, 'crud-generator');
    assert.equal(decision.deterministic, true);
  });

  it('keeps non-CRUD marketing pages on the generic generation path', () => {
    assert.equal(isCrudGenerationIntent({ prompt: 'Design a polished SaaS landing page hero with pricing and testimonials' }), false);
    assert.equal(isCrudGenerationIntent({ prompt: 'Create a brand homepage first screen for a coffee shop' }), false);
  });

  it('uses an existing data source model for CRUD candidates', () => {
    const result = generateAiCrudPageCandidate({
      prompt: '基于 /api/users 生成一个用户管理页，包含列表、新增、编辑、详情',
      dataSourceModels: [userModel],
    });

    assert.equal(result.source, 'existingModel');
    assert.equal(result.model.key, 'user');
    assert.equal(result.crudResult.pageType, 'list');
    assert.equal(result.crudResult.schema.metadata.dataSourceModelKey, 'user');
    assert.equal(result.crudResult.schema.metadata.generatedBy, 'data-model-crud-generation');

    const validation = validateAiGeneratedComponents(result.crudResult.schema.components);
    assert.equal(validation.valid, true, validation.errors.map((issue) => issue.message).join('\n'));
    assert.equal(result.crudResult.schema.components[0].name, 'Page');
  });

  it('generates a valid CRUD list candidate with runtime data source contracts', () => {
    const result = generateAiCrudPageCandidate({
      prompt: 'Create a user CRUD page from /api/users with list, create, edit, delete and detail support',
      responseSample: {
        data: {
          items: [
            { id: 1, name: 'Alice', email: 'alice@example.com', enabled: true },
          ],
        },
      },
    });

    const page = result.crudResult.schema.components[0];
    const validation = validateAiGeneratedComponents(result.crudResult.schema.components);

    assert.equal(validation.valid, true, validation.errors.map((issue) => issue.message).join('\n'));
    assert.equal(page.name, 'Page');
    assert.match(String(page.props.dataSources), /usersList|userList/);
  });

  it('generates a valid CRUD create candidate with HTTP event contracts', () => {
    const result = generateAiCrudPageCandidate({
      prompt: 'Create a user form page from /api/users',
      responseSample: {
        data: {
          items: [
            { id: 1, name: 'Alice', email: 'alice@example.com', enabled: true },
          ],
        },
      },
    });

    const validation = validateAiGeneratedComponents(result.crudResult.schema.components);

    assert.equal(result.crudResult.pageType, 'create');
    assert.equal(validation.valid, true, validation.errors.map((issue) => issue.message).join('\n'));
    assert.equal(hasHttpEventAction(result.crudResult.schema.components), true);
  });

  it('creates a temporary draft model from response sample', () => {
    const result = generateAiCrudPageCandidate({
      prompt: '基于 /api/users 生成用户管理页',
      responseSample: {
        data: {
          items: [
            { id: 1, name: '张三', email: 'zhangsan@example.com', enabled: true },
          ],
        },
      },
    });

    assert.equal(result.source, 'draftModel');
    assert.equal(result.model.key, 'users');
    assert.equal(result.model.fields.some((field) => field.key === 'email'), true);
    assert.match(result.warnings.join('\n'), /临时数据源模型/);
  });

  it('rejects invalid explicit data source models', () => {
    assert.throws(
      () => generateAiCrudPageCandidate({
        prompt: '生成 CRUD 页面',
        dataSourceModel: {
          name: '非法模型',
          key: 'Invalid Model',
          primaryField: 'id',
          fields: [],
        },
      }),
      /模型标识|字段|不合法/,
    );
  });
});

function hasHttpEventAction(components) {
  for (const component of components) {
    const onEvent = component.props?.onEvent || {};
    const hasAction = Object.values(onEvent).some((eventConfig) => (
      Array.isArray(eventConfig?.actions)
      && eventConfig.actions.some((action) => action.actionType === 'http')
    ));

    if (hasAction || hasHttpEventAction(component.children || [])) {
      return true;
    }
  }

  return false;
}
