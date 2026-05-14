import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createRuntimeHarness } from './action-runtime-utils.mjs';
import { runLowcodeActions } from './schema-test-utils.mjs';

describe('lowcode action runtime', () => {
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

  it('passes url open target to navigation adapter', async () => {
    const harness = createRuntimeHarness();

    await runLowcodeActions([
      {
        actionType: 'url',
        args: {
          url: '/publish/current',
        },
      },
      {
        actionType: 'url',
        args: {
          url: 'example.com/new',
          blank: true,
        },
      },
    ], harness.context, harness.adapters);

    assert.deepEqual(harness.navigations, [
      { url: '/publish/current', options: {} },
      { url: 'https://example.com/new', options: { blank: true } },
    ]);
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

  it('resolves component control setValue sources at runtime', async () => {
    const harness = createRuntimeHarness({
      context: {
        eventData: {
          value: 'Ada',
          values: {
            role: 'Admin',
          },
        },
        variables: {
          fallback: 'Guest',
        },
      },
    });

    await runLowcodeActions([
      {
        actionType: 'componentControl',
        componentId: 3,
        args: {
          operation: 'setValue',
          valueProp: 'value',
          value: 'fixed',
        },
      },
      {
        actionType: 'componentControl',
        componentId: 3,
        args: {
          operation: 'setValue',
          valueProp: 'defaultValue',
          value: 'event.value',
        },
      },
      {
        actionType: 'componentControl',
        componentId: 3,
        args: {
          operation: 'setValue',
          valueProp: 'placeholder',
          value: '{{event.values.role}}',
        },
      },
      {
        actionType: 'componentControl',
        componentId: 3,
        args: {
          operation: 'setValue',
          valueProp: 'title',
          value: '{{event.missing || variables.fallback}}',
        },
      },
    ], harness.context, harness.adapters);

    assert.deepEqual(harness.propsUpdates, [
      { componentId: 3, props: { value: 'fixed' } },
      { componentId: 3, props: { defaultValue: 'Ada' } },
      { componentId: 3, props: { placeholder: 'Admin' } },
      { componentId: 3, props: { title: 'Guest' } },
    ]);
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
