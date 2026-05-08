import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { describe, it } from 'node:test';

const require = createRequire(import.meta.url);
const {
  builtinComponentSchemaRegistry,
  buildHttpActionRequestBody,
  buildHttpActionRequestHeaders,
  CURRENT_SCHEMA_VERSION,
  createLowcodeEventData,
  evaluateSafeExpression,
  migratePageSchema,
  normalizeActionUrl,
  normalizeHttpActionUrl,
  isHttpActionUrlAllowed,
  runLowcodeActions,
  validateComponentTree,
} = require('../../server/dist/packages/lowcode-schema/src/index.js');

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

describe('event action url normalization', () => {
  it('adds https to bare domains', () => {
    assert.equal(normalizeActionUrl('baidu.com'), 'https://baidu.com');
  });

  it('preserves absolute and app-relative urls', () => {
    assert.equal(normalizeActionUrl('https://example.com'), 'https://example.com');
    assert.equal(normalizeActionUrl('/dashboard'), '/dashboard');
    assert.equal(normalizeActionUrl('#section'), '#section');
  });
});

describe('http action url normalization', () => {
  it('uses api base url for app api paths', () => {
    const options = { apiBaseUrl: 'http://localhost:3000/api' };

    assert.equal(normalizeHttpActionUrl('/api/user', options), 'http://localhost:3000/api/user');
    assert.equal(normalizeHttpActionUrl('api/user', options), 'http://localhost:3000/api/user');
    assert.equal(normalizeHttpActionUrl('users', options), 'http://localhost:3000/api/users');
  });

  it('keeps external request urls addressable', () => {
    const options = { apiBaseUrl: 'http://localhost:3000/api' };

    assert.equal(normalizeHttpActionUrl('https://example.com/api', options), 'https://example.com/api');
    assert.equal(normalizeHttpActionUrl('example.com/api', options), 'https://example.com/api');
    assert.equal(normalizeHttpActionUrl('localhost:3000/api/users', options), 'http://localhost:3000/api/users');
  });

  it('checks http action origin allowlist after normalization', () => {
    const options = {
      apiBaseUrl: 'http://localhost:3000/api',
      allowedOrigins: ['http://localhost:3000', 'https://api.example.com'],
    };

    assert.equal(isHttpActionUrlAllowed(normalizeHttpActionUrl('users', options), options), true);
    assert.equal(isHttpActionUrlAllowed('https://api.example.com/users', options), true);
    assert.equal(isHttpActionUrlAllowed('https://evil.example.com/users', options), false);
  });
});

describe('safe expression evaluator', () => {
  const context = {
    context: {
      component: { id: 10, name: 'Input' },
      eventName: 'change',
    },
    event: {
      value: 'admin',
      checked: true,
      values: {
        name: 'Ada',
        age: 18,
      },
    },
    args: ['first', { label: 'second' }],
  };

  it('evaluates event data paths and comparisons', () => {
    assert.equal(evaluateSafeExpression("event.value === 'admin'", context), true);
    assert.equal(evaluateSafeExpression('event.checked && event.values.age >= 18', context), true);
    assert.equal(evaluateSafeExpression("event.values.name !== 'Grace'", context), true);
  });

  it('supports context and args paths', () => {
    assert.equal(evaluateSafeExpression("context.component.name === 'Input'", context), true);
    assert.equal(evaluateSafeExpression("args[1].label === 'second'", context), true);
  });

  it('supports page variables', () => {
    assert.equal(evaluateSafeExpression("variables.form.keyword === 'Ada'", {
      ...context,
      variables: {
        form: {
          keyword: 'Ada',
        },
      },
    }), true);
  });

  it('rejects unsafe expressions instead of executing code', () => {
    assert.throws(
      () => evaluateSafeExpression('globalThis.process.exit()', context),
      /不支持的变量|期望|不支持的字符/,
    );
  });
});

describe('lowcode event data creation', () => {
  it('extracts input change value from native event', () => {
    const nativeEvent = {
      target: {
        value: 'hello',
        checked: false,
      },
    };
    const eventData = createLowcodeEventData([nativeEvent], 'change');

    assert.equal(eventData.value, 'hello');
    assert.equal(eventData.checked, false);
    assert.equal(eventData.nativeEvent, nativeEvent);
  });

  it('extracts switch checked value', () => {
    const nativeEvent = { type: 'click' };
    const eventData = createLowcodeEventData([true, nativeEvent], 'change');

    assert.equal(eventData.value, true);
    assert.equal(eventData.checked, true);
    assert.equal(eventData.nativeEvent, nativeEvent);
  });

  it('extracts select value and option', () => {
    const option = { label: 'Admin', value: 'admin' };
    const eventData = createLowcodeEventData(['admin', option], 'change');

    assert.equal(eventData.value, 'admin');
    assert.equal(eventData.option, option);
  });

  it('extracts form submit and values change payloads', () => {
    assert.deepEqual(createLowcodeEventData([{ name: 'Ada' }], 'finish').values, { name: 'Ada' });

    const valuesChangeData = createLowcodeEventData([{ name: 'Ada' }, { name: 'Ada', age: 18 }], 'valuesChange');
    assert.deepEqual(valuesChangeData.changedValues, { name: 'Ada' });
    assert.deepEqual(valuesChangeData.allValues, { name: 'Ada', age: 18 });
  });

  it('extracts date and pagination payloads', () => {
    const dateData = createLowcodeEventData(['date-object', '2026-05-08'], 'change');
    assert.equal(dateData.value, 'date-object');
    assert.equal(dateData.dateString, '2026-05-08');

    const paginationData = createLowcodeEventData([2, 20], 'change');
    assert.equal(paginationData.page, 2);
    assert.equal(paginationData.pageSize, 20);
  });
});

describe('http action request creation', () => {
  it('serializes object body and adds json content-type', () => {
    const body = { name: 'Ada' };

    assert.equal(buildHttpActionRequestBody(body), '{"name":"Ada"}');
    assert.deepEqual(buildHttpActionRequestHeaders({ Authorization: 'Bearer token' }, body), {
      'content-type': 'application/json',
      Authorization: 'Bearer token',
    });
  });

  it('keeps string body as-is without forcing json header', () => {
    assert.equal(buildHttpActionRequestBody('raw body'), 'raw body');
    assert.deepEqual(buildHttpActionRequestHeaders({ 'x-source': 'lowcode' }, 'raw body'), {
      'x-source': 'lowcode',
    });
  });

  it('omits empty request body', () => {
    assert.equal(buildHttpActionRequestBody(undefined), undefined);
    assert.equal(buildHttpActionRequestBody(null), undefined);
    assert.equal(buildHttpActionRequestBody(''), undefined);
  });
});

describe('lowcode action runtime', () => {
  function createRuntimeHarness(overrides = {}) {
    const messages = [];
    const navigations = [];
    const confirmations = [];
    const componentCalls = [];
    const propsUpdates = [];
    const stylesUpdates = [];
    const errors = [];
    const context = {
      component: {
        id: 1,
        name: 'Button',
        props: {},
        desc: '按钮',
      },
      eventName: 'click',
      eventData: {},
      args: ['native-event'],
      components: [],
      componentRefs: {
        2: {
          open: (...args) => componentCalls.push(args),
        },
      },
      allowCustomJS: false,
      getAuthToken: () => 'current-token',
      updateComponentProps: (componentId, props) => propsUpdates.push({ componentId, props }),
      updateComponentStyles: (componentId, styles) => stylesUpdates.push({ componentId, styles }),
      ...overrides.context,
    };
    const adapters = {
      showMessage: (content, type) => messages.push({ content, type }),
      navigate: (url, options) => navigations.push({ url, options }),
      showConfirm: (options) => confirmations.push(options),
      onError: (error) => errors.push(error),
      normalizeHttpUrlOptions: {
        apiBaseUrl: 'http://localhost:3000/api',
      },
      ...overrides.adapters,
    };

    return {
      adapters,
      componentCalls,
      confirmations,
      context,
      errors,
      messages,
      navigations,
      propsUpdates,
      stylesUpdates,
    };
  }

  it('runs toast, url, component method and component update actions', async () => {
    const harness = createRuntimeHarness();

    await runLowcodeActions([
      {
        actionType: 'toast',
        args: {
          msgType: 'success',
          msg: 'ok',
        },
      },
      {
        actionType: 'url',
        args: {
          url: 'baidu.com',
          blank: true,
        },
      },
      {
        actionType: 'componentAction',
        componentId: 2,
        args: {
          method: 'open',
          params: ['modal'],
        },
      },
      {
        actionType: 'setComponentProps',
        componentId: 3,
        args: {
          props: {
            text: 'next',
          },
        },
      },
      {
        actionType: 'setComponentStyles',
        componentId: 3,
        args: {
          styles: {
            color: 'red',
          },
        },
      },
    ], harness.context, harness.adapters);

    assert.deepEqual(harness.messages, [{ content: 'ok', type: 'success' }]);
    assert.deepEqual(harness.navigations, [{ url: 'https://baidu.com', options: { blank: true } }]);
    assert.deepEqual(harness.componentCalls, [['modal']]);
    assert.deepEqual(harness.propsUpdates, [{ componentId: 3, props: { text: 'next' } }]);
    assert.deepEqual(harness.stylesUpdates, [{ componentId: 3, styles: { color: 'red' } }]);
  });

  it('runs confirm ok and cancel branches', async () => {
    const okHarness = createRuntimeHarness();
    const okPromise = runLowcodeActions([
      {
        actionType: 'confirm',
        args: {
          title: '确认？',
          actions: [
            {
              actionType: 'toast',
              args: {
                msgType: 'success',
                msg: 'confirmed',
              },
            },
          ],
        },
      },
    ], okHarness.context, okHarness.adapters);
    await okHarness.confirmations[0].onOk();
    await okPromise;
    assert.deepEqual(okHarness.messages, [{ content: 'confirmed', type: 'success' }]);

    const cancelHarness = createRuntimeHarness();
    const cancelPromise = runLowcodeActions([
      {
        actionType: 'confirm',
        args: {
          title: '确认？',
          cancelActions: [
            {
              actionType: 'toast',
              args: {
                msgType: 'warning',
                msg: 'cancelled',
              },
            },
          ],
        },
      },
    ], cancelHarness.context, cancelHarness.adapters);
    await cancelHarness.confirmations[0].onCancel();
    await cancelPromise;
    assert.deepEqual(cancelHarness.messages, [{ content: 'cancelled', type: 'warning' }]);
  });

  it('runs condition branches with safe expression when custom js is disabled', async () => {
    const harness = createRuntimeHarness({
      context: {
        eventData: {
          value: 'admin',
        },
      },
    });

    await runLowcodeActions([
      {
        actionType: 'condition',
        args: {
          expression: "event.value === 'admin'",
          trueActions: [
            {
              actionType: 'toast',
              args: {
                msgType: 'success',
                msg: 'matched',
              },
            },
          ],
          falseActions: [
            {
              actionType: 'toast',
              args: {
                msgType: 'error',
                msg: 'missed',
              },
            },
          ],
        },
      },
    ], harness.context, harness.adapters);

    assert.deepEqual(harness.messages, [{ content: 'matched', type: 'success' }]);
  });

  it('stores http success response and shows success message', async () => {
    const requests = [];
    const harness = createRuntimeHarness({
      adapters: {
        fetch: async (url, init) => {
          requests.push({ url, init });
          return createFetchResponse({
            ok: true,
            status: 200,
            data: { id: 1 },
          });
        },
      },
    });

    await runLowcodeActions([
      {
        actionType: 'http',
        args: {
          url: 'users',
          method: 'POST',
          body: {
            name: 'Ada',
          },
          successMsg: 'saved',
        },
      },
    ], harness.context, harness.adapters);

    assert.deepEqual(requests, [{
      url: 'http://localhost:3000/api/users',
      init: {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: '{"name":"Ada"}',
      },
    }]);
    assert.deepEqual(harness.context.eventData.httpResponse, {
      ok: true,
      status: 200,
      data: { id: 1 },
    });
    assert.deepEqual(harness.messages, [{ content: 'saved', type: 'success' }]);
  });

  it('supports http auth headers and response mapping', async () => {
    const requests = [];
    const harness = createRuntimeHarness({
      adapters: {
        fetch: async (url, init) => {
          requests.push({ url, init });
          return createFetchResponse({
            ok: true,
            status: 200,
            data: { token: 'ok' },
          });
        },
      },
    });

    await runLowcodeActions([
      {
        actionType: 'http',
        args: {
          url: 'users/me',
          auth: 'currentUser',
          responseKey: 'api.me',
        },
      },
    ], harness.context, harness.adapters);

    assert.equal(requests[0].init.headers.Authorization, 'Bearer current-token');
    assert.deepEqual(harness.context.eventData.api.me, {
      ok: true,
      status: 200,
      data: { token: 'ok' },
    });
  });

  it('interpolates http header and body templates from event data', async () => {
    const requests = [];
    const harness = createRuntimeHarness({
      context: {
        eventData: {
          value: 'Ada',
        },
      },
      adapters: {
        fetch: async (url, init) => {
          requests.push({ url, init });
          return createFetchResponse({
            ok: true,
            status: 200,
            data: { ok: true },
          });
        },
      },
    });

    await runLowcodeActions([
      {
        actionType: 'http',
        args: {
          url: 'users',
          method: 'POST',
          headers: {
            'x-name': '{{event.value}}',
          },
          body: {
            name: '{{event.value}}',
          },
        },
      },
    ], harness.context, harness.adapters);

    assert.equal(requests[0].init.headers['x-name'], 'Ada');
    assert.equal(requests[0].init.body, '{"name":"Ada"}');
  });

  it('runs component control actions', async () => {
    const harness = createRuntimeHarness({
      context: {
        componentRefs: {
          4: {
            open: () => harness.componentCalls.push(['open']),
          },
          5: {
            submit: () => harness.componentCalls.push(['submit']),
          },
        },
      },
    });

    await runLowcodeActions([
      {
        actionType: 'componentControl',
        componentId: 2,
        args: {
          operation: 'hide',
        },
      },
      {
        actionType: 'componentControl',
        componentId: 3,
        args: {
          operation: 'disable',
        },
      },
      {
        actionType: 'componentControl',
        componentId: 3,
        args: {
          operation: 'setValue',
          valueProp: 'value',
          value: 'Ada',
        },
      },
      {
        actionType: 'componentControl',
        componentId: 4,
        args: {
          operation: 'open',
        },
      },
      {
        actionType: 'componentControl',
        componentId: 5,
        args: {
          operation: 'submit',
        },
      },
    ], harness.context, harness.adapters);

    assert.deepEqual(harness.stylesUpdates, [{ componentId: 2, styles: { display: 'none' } }]);
    assert.deepEqual(harness.propsUpdates, [
      { componentId: 3, props: { disabled: true } },
      { componentId: 3, props: { value: 'Ada' } },
    ]);
    assert.deepEqual(harness.componentCalls, [['open'], ['submit']]);
  });

  it('sets page variables from event expressions', async () => {
    const harness = createRuntimeHarness({
      context: {
        eventData: {
          value: 'Ada',
        },
        variables: {},
        setVariable: (path, value) => {
          harness.context.variables[path] = value;
        },
      },
    });

    await runLowcodeActions([
      {
        actionType: 'setVariable',
        args: {
          path: 'keyword',
          expression: 'event.value',
        },
      },
    ], harness.context, harness.adapters);

    assert.equal(harness.context.variables.keyword, 'Ada');
  });

  it('stores http error and shows error message', async () => {
    const harness = createRuntimeHarness({
      adapters: {
        fetch: async () => createFetchResponse({
          ok: false,
          status: 500,
          data: { message: 'bad' },
        }),
      },
    });

    await runLowcodeActions([
      {
        actionType: 'http',
        args: {
          url: 'users',
          errorMsg: 'failed',
        },
      },
    ], harness.context, harness.adapters);

    assert.deepEqual(harness.context.eventData.httpResponse, {
      ok: false,
      status: 500,
      data: { message: 'bad' },
    });
    assert.equal(harness.context.eventData.httpError instanceof Error, true);
    assert.deepEqual(harness.messages, [{ content: 'failed', type: 'error' }]);
    assert.equal(harness.errors.length, 1);
  });

  it('blocks http actions outside the configured origin allowlist', async () => {
    const harness = createRuntimeHarness({
      adapters: {
        normalizeHttpUrlOptions: {
          apiBaseUrl: 'http://localhost:3000/api',
          allowedOrigins: ['http://localhost:3000'],
        },
        fetch: async () => {
          throw new Error('fetch should not run');
        },
      },
    });

    await runLowcodeActions([
      {
        actionType: 'http',
        args: {
          url: 'https://evil.example.com/users',
          errorMsg: 'blocked',
        },
      },
    ], harness.context, harness.adapters);

    assert.equal(harness.context.eventData.httpError instanceof Error, true);
    assert.deepEqual(harness.messages, [{ content: 'blocked', type: 'error' }]);
    assert.equal(harness.errors.length, 1);
  });

  it('does not run custom scripts when custom js is disabled', async () => {
    const harness = createRuntimeHarness();

    await runLowcodeActions([
      {
        actionType: 'custom',
        args: {
          script: "throw new Error('published page custom js must not run')",
        },
      },
    ], harness.context, harness.adapters);

    assert.deepEqual(harness.messages, []);
    assert.deepEqual(harness.errors, []);
  });

  it('skips disabled actions without stopping later actions', async () => {
    const harness = createRuntimeHarness();

    await runLowcodeActions([
      {
        actionType: 'toast',
        disabled: true,
        args: {
          msgType: 'warning',
          msg: 'disabled',
        },
      },
      {
        actionType: 'toast',
        args: {
          msgType: 'success',
          msg: 'enabled',
        },
      },
    ], harness.context, harness.adapters);

    assert.deepEqual(harness.messages, [{ content: 'enabled', type: 'success' }]);
  });

  it('skips disabled nested actions in confirm and condition branches', async () => {
    const confirmHarness = createRuntimeHarness();
    const confirmPromise = runLowcodeActions([
      {
        actionType: 'confirm',
        args: {
          title: '确认？',
          actions: [
            {
              actionType: 'toast',
              disabled: true,
              args: {
                msgType: 'warning',
                msg: 'disabled confirm',
              },
            },
            {
              actionType: 'toast',
              args: {
                msgType: 'success',
                msg: 'enabled confirm',
              },
            },
          ],
        },
      },
    ], confirmHarness.context, confirmHarness.adapters);
    await confirmHarness.confirmations[0].onOk();
    await confirmPromise;
    assert.deepEqual(confirmHarness.messages, [{ content: 'enabled confirm', type: 'success' }]);

    const conditionHarness = createRuntimeHarness({
      context: {
        eventData: {
          value: 'admin',
        },
      },
    });
    await runLowcodeActions([
      {
        actionType: 'condition',
        args: {
          expression: "event.value === 'admin'",
          trueActions: [
            {
              actionType: 'toast',
              disabled: true,
              args: {
                msgType: 'warning',
                msg: 'disabled condition',
              },
            },
            {
              actionType: 'toast',
              args: {
                msgType: 'success',
                msg: 'enabled condition',
              },
            },
          ],
        },
      },
    ], conditionHarness.context, conditionHarness.adapters);
    assert.deepEqual(conditionHarness.messages, [{ content: 'enabled condition', type: 'success' }]);
  });

  it('keeps component snapshots immutable unless runtime update hooks apply changes', async () => {
    const components = [
      {
        id: 3,
        name: 'Text',
        props: {
          text: 'before',
        },
        styles: {
          color: 'blue',
        },
        desc: '文本',
      },
    ];
    const harness = createRuntimeHarness({
      context: {
        components,
      },
    });

    await runLowcodeActions([
      {
        actionType: 'setComponentProps',
        componentId: 3,
        args: {
          props: {
            text: 'after',
          },
        },
      },
      {
        actionType: 'setComponentStyles',
        componentId: 3,
        args: {
          styles: {
            color: 'red',
          },
        },
      },
    ], harness.context, harness.adapters);

    assert.deepEqual(components[0].props, { text: 'before' });
    assert.deepEqual(components[0].styles, { color: 'blue' });
    assert.deepEqual(harness.propsUpdates, [{ componentId: 3, props: { text: 'after' } }]);
    assert.deepEqual(harness.stylesUpdates, [{ componentId: 3, styles: { color: 'red' } }]);
  });
});

function createFetchResponse({ ok, status, data, contentType = 'application/json' }) {
  return {
    ok,
    status,
    headers: {
      get(name) {
        return name.toLowerCase() === 'content-type' ? contentType : null;
      },
    },
    async json() {
      return data;
    },
    async text() {
      return typeof data === 'string' ? data : JSON.stringify(data);
    },
  };
}
