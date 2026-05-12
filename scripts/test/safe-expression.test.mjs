import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  evaluateSafeExpression
} from './schema-test-utils.mjs';

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
