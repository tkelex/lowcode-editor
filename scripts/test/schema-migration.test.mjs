import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CURRENT_SCHEMA_VERSION,
  migratePageSchema
} from './schema-test-utils.mjs';

describe('lowcode schema migration', () => {
  it('creates a default page schema for empty input', () => {
    const schema = migratePageSchema(undefined, { pageId: 10, now: '2026-05-07T00:00:00.000Z' });

    assert.equal(schema.schemaVersion, CURRENT_SCHEMA_VERSION);
    assert.equal(schema.pageId, 10);
    assert.equal(schema.metadata?.migratedAt, '2026-05-07T00:00:00.000Z');
    assert.deepEqual(schema.components, [
      {
        id: 1,
        name: 'Page',
        props: {},
        desc: '页面',
      },
    ]);
  });

  it('migrates legacy event props and actions into onEvent', () => {
    const schema = migratePageSchema({
      components: [
        {
          id: 1,
          name: 'Page',
          props: {
            onClick: {
              actions: [
                { type: 'goToLink', url: 'baidu.com' },
                { type: 'showMessage', config: { type: 'success', text: 'ok' } },
              ],
            },
          },
          desc: '页面',
        },
      ],
    });

    assert.deepEqual(schema.components[0].props, {
      onEvent: {
        click: {
          actions: [
            {
              actionType: 'url',
              args: { url: 'baidu.com' },
            },
            {
              actionType: 'toast',
              args: {
                msgType: 'success',
                msg: 'ok',
              },
            },
          ],
        },
      },
    });
  });

  it('preserves url action open targets during migration', () => {
    const schema = migratePageSchema({
      components: [
        {
          id: 1,
          name: 'Page',
          props: {
            onClick: {
              actions: [
                { type: 'goToLink', url: 'example.com/current', target: '_self' },
                { type: 'goToLink', url: 'example.com/new', config: { target: '_blank' } },
                {
                  actionType: 'url',
                  target: '_blank',
                  args: {
                    url: '/publish/demo',
                  },
                },
              ],
            },
          },
          desc: '页面',
        },
      ],
    });

    assert.deepEqual(schema.components[0].props.onEvent.click.actions, [
      {
        actionType: 'url',
        args: { url: 'example.com/current' },
      },
      {
        actionType: 'url',
        args: { url: 'example.com/new', blank: true },
      },
      {
        actionType: 'url',
        args: { url: '/publish/demo', blank: true },
      },
    ]);
  });

  it('allocates stable ids for malformed components', () => {
    const schema = migratePageSchema({
      components: [
        {
          id: 1,
          name: 'Page',
          props: {},
          desc: '页面',
          children: [
            { name: 'Text', props: {}, desc: '文本' },
            { id: 'bad-id', name: 'Button', props: {}, desc: '按钮' },
          ],
        },
      ],
    });

    assert.equal(schema.components[0].children?.[0].id, 2);
    assert.equal(schema.components[0].children?.[1].id, 3);
  });
});
