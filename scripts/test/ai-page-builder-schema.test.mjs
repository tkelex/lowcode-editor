import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  normalizeAiGeneratedComponents,
  validateAiGeneratedComponents
} from './schema-test-utils.mjs';

describe('ai page builder schema helpers', () => {
  it('normalizes fragments into a page schema with stable parent ids', () => {
    const result = normalizeAiGeneratedComponents([
      {
        name: 'Card',
        props: { title: '用户管理' },
        children: [
          { name: 'Text', props: { text: '欢迎使用' } }
        ]
      }
    ]);

    assert.equal(result.components[0].name, 'Page');
    assert.equal(result.components[0].children[0].name, 'Card');
    assert.equal(result.components[0].children[0].parentId, result.components[0].id);
    assert.equal(
      result.components[0].children[0].children[0].parentId,
      result.components[0].children[0].id
    );
  });

  it('accepts a valid generated page', () => {
    const validation = validateAiGeneratedComponents([
      {
        id: 1,
        name: 'Page',
        props: {},
        desc: '页面',
        children: [
          {
            id: 2,
            name: 'Table',
            props: { rowKey: 'id' },
            desc: '用户表格',
            parentId: 1,
            children: [
              {
                id: 3,
                name: 'TableColumn',
                props: { title: '姓名', dataIndex: 'name' },
                desc: '姓名列',
                parentId: 2
              }
            ]
          }
        ]
      }
    ]);

    assert.equal(validation.valid, true);
    assert.equal(validation.errors.length, 0);
  });

  it('rejects unknown materials', () => {
    const validation = validateAiGeneratedComponents([
      {
        id: 1,
        name: 'Page',
        props: {},
        desc: '页面',
        children: [
          {
            id: 2,
            name: 'UnknownWidget',
            props: {},
            desc: '未知',
            parentId: 1
          }
        ]
      }
    ]);

    assert.equal(validation.valid, false);
    assert.match(validation.errors.map((error) => error.message).join('\n'), /UnknownWidget/);
  });

  it('rejects invalid parent child relations', () => {
    const validation = validateAiGeneratedComponents([
      {
        id: 1,
        name: 'Page',
        props: {},
        desc: '页面',
        children: [
          {
            id: 2,
            name: 'Button',
            props: {},
            desc: '按钮',
            parentId: 1,
            children: [
              {
                id: 3,
                name: 'TableColumn',
                props: {},
                desc: '列',
                parentId: 2
              }
            ]
          }
        ]
      }
    ]);

    assert.equal(validation.valid, false);
    assert.match(validation.errors.map((error) => error.message).join('\n'), /不接收子组件|不能放在/);
  });

  it('repairs duplicate ids during normalization', () => {
    const validation = validateAiGeneratedComponents([
      {
        id: 1,
        name: 'Page',
        props: {},
        desc: '页面',
        children: [
          { id: 1, name: 'Text', props: {}, desc: '文本', parentId: 1 },
          { id: 1, name: 'Button', props: {}, desc: '按钮', parentId: 1 }
        ]
      }
    ]);

    assert.equal(validation.valid, true);
    assert.deepEqual(
      validation.components[0].children.map((component) => component.id),
      [2, 3]
    );
  });

  it('rejects custom actions by default', () => {
    const validation = validateAiGeneratedComponents([
      {
        id: 1,
        name: 'Page',
        props: {
          onEvent: {
            click: {
              actions: [
                {
                  actionType: 'custom',
                  args: { script: 'alert(1)' }
                }
              ]
            }
          }
        },
        desc: '页面'
      }
    ]);

    assert.equal(validation.valid, false);
    assert.equal(validation.errors[0].code, 'AI_CUSTOM_ACTION_FORBIDDEN');
  });
});
