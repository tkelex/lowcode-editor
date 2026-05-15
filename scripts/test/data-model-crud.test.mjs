import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  builtinComponentSchemaRegistry,
  generateCrudPageSchema,
  migratePageSchema,
  validateComponentTree,
  validateDataSourceModelConfig,
} from './schema-test-utils.mjs';

const model = {
  id: 'model-user',
  name: '用户',
  key: 'user',
  primaryField: 'id',
  listApi: {
    url: '/external/users',
    method: 'GET',
    responseDataPath: 'data.items',
    responseTotalPath: 'data.total',
  },
  detailApi: {
    url: '/external/users/{{ variables.recordId }}',
    method: 'GET',
    responseDataPath: 'data',
  },
  createApi: {
    url: '/external/users',
    method: 'POST',
  },
  updateApi: {
    url: '/external/users/{{ variables.recordId }}',
    method: 'PATCH',
  },
  deleteApi: {
    url: '/external/users/{{ record.id }}',
    method: 'DELETE',
  },
  fields: [
    {
      key: 'id',
      label: 'ID',
      type: 'text',
      sourcePath: 'id',
      requestPath: 'id',
      listVisible: true,
      formVisible: false,
      detailVisible: true,
    },
    {
      key: 'name',
      label: '姓名',
      type: 'text',
      required: true,
      listVisible: true,
      formVisible: true,
      detailVisible: true,
    },
    {
      key: 'status',
      label: '状态',
      type: 'select',
      optionsText: '启用:enabled\n停用:disabled',
      listVisible: true,
      formVisible: true,
      detailVisible: true,
    },
    {
      key: 'createdAt',
      label: '创建时间',
      type: 'date',
      listVisible: true,
      formVisible: false,
      detailVisible: true,
    },
  ],
};

describe('data model CRUD generation', () => {
  it('validates model fields and endpoint contracts', () => {
    const result = validateDataSourceModelConfig(model);
    assert.equal(result.valid, true, result.errors.map((item) => item.message).join('\n'));

    const invalid = validateDataSourceModelConfig({
      ...model,
      key: 'User Model',
      fields: [
        { key: 'name', label: '姓名', type: 'text' },
        { key: 'name', label: '重复', type: 'unknown' },
      ],
    });

    assert.equal(invalid.valid, false);
    assert.match(invalid.errors.map((item) => item.message).join('\n'), /模型标识|不能重复|不受支持/);
  });

  it('generates valid list page schema with runtime data source', () => {
    const result = generateCrudPageSchema(model, {
      pageType: 'list',
      pageName: '用户列表',
      routePath: '/users',
      detailRoutePath: '/users/detail',
    });

    const migrated = migratePageSchema(result.schema);
    const validation = validateComponentTree(migrated.components, builtinComponentSchemaRegistry);
    assert.equal(validation.valid, true, validation.errors.join('\n'));
    assert.equal(result.schema.metadata?.dataSourceModelKey, 'user');

    const page = result.schema.components[0];
    assert.match(String(page.props.dataSources), /userList/);
    assert.match(JSON.stringify(page), /TableColumn/);
    assert.match(JSON.stringify(page), /\/users\/detail\?id=/);
  });

  it('generates valid create, edit and detail page schemas', () => {
    for (const pageType of ['create', 'edit', 'detail']) {
      const result = generateCrudPageSchema(model, {
        pageType,
        pageName: `用户${pageType}`,
        routePath: `/users/${pageType}`,
        listRoutePath: '/users',
      });

      const migrated = migratePageSchema(result.schema);
      const validation = validateComponentTree(migrated.components, builtinComponentSchemaRegistry);
      assert.equal(validation.valid, true, `${pageType}\n${validation.errors.join('\n')}`);
      assert.equal(result.schema.metadata?.crudPageType, pageType);
    }
  });

  it('writes submit HTTP action under props.onEvent', () => {
    const result = generateCrudPageSchema(model, {
      pageType: 'create',
      pageName: '新建用户',
    });

    const form = findComponent(result.schema.components, 'Form');
    assert.ok(form);
    assert.equal(form.props.onEvent.finish.actions[0].actionType, 'http');
    assert.deepEqual(form.props.onEvent.finish.actions[0].args.body.name, '{{ event.values.name }}');
  });
});

function findComponent(components, name) {
  for (const component of components) {
    if (component.name === name) return component;
    const child = findComponent(component.children || [], name);
    if (child) return child;
  }
  return null;
}
