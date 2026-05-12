import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  builtinComponentSchemaRegistry,
  validateComponentTree
} from './schema-test-utils.mjs';

describe('lowcode schema validation', () => {
  it('accepts a valid page tree', () => {
    const validation = validateComponentTree(
      [
        {
          id: 1,
          name: 'Page',
          props: {},
          desc: '页面',
          children: [
            {
              id: 2,
              name: 'Text',
              props: { text: 'hello' },
              desc: '文本',
              parentId: 1,
            },
          ],
        },
      ],
      builtinComponentSchemaRegistry,
    );

    assert.equal(validation.valid, true);
  });

  it('accepts P3 materials and nested layout containers', () => {
    const validation = validateComponentTree(
      [
        {
          id: 1,
          name: 'Page',
          props: {},
          desc: '页面',
          children: [
            {
              id: 2,
              name: 'Grid',
              props: { columns: 2 },
              desc: '网格',
              parentId: 1,
              children: [
                {
                  id: 3,
                  name: 'Statistic',
                  props: { title: '新增用户', value: 128 },
                  desc: '统计数值',
                  parentId: 2,
                },
                {
                  id: 4,
                  name: 'Chart',
                  props: { title: '趋势图' },
                  desc: '图表',
                  parentId: 2,
                },
              ],
            },
            {
              id: 5,
              name: 'Form',
              props: {},
              desc: '表单',
              parentId: 1,
              children: [
                {
                  id: 6,
                  name: 'FormItem',
                  props: { name: 'email', type: 'input' },
                  desc: '邮箱字段',
                  parentId: 5,
                },
              ],
            },
            {
              id: 7,
              name: 'Drawer',
              props: { title: '抽屉' },
              desc: '抽屉',
              parentId: 1,
              children: [
                {
                  id: 8,
                  name: 'Descriptions',
                  props: { title: '详情' },
                  desc: '描述列表',
                  parentId: 7,
                },
              ],
            },
          ],
        },
      ],
      builtinComponentSchemaRegistry,
    );

    assert.equal(validation.valid, true, validation.errors.join('\n'));
  });

  it('rejects duplicate component ids', () => {
    const validation = validateComponentTree(
      [
        {
          id: 1,
          name: 'Page',
          props: {},
          desc: '页面',
          children: [
            {
              id: 1,
              name: 'Text',
              props: {},
              desc: '文本',
              parentId: 1,
            },
          ],
        },
      ],
      builtinComponentSchemaRegistry,
    );

    assert.equal(validation.valid, false);
    assert.match(validation.errors.join('\n'), /不能重复|duplicate/i);
  });
});
