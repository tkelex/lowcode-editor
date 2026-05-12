import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  createLowcodeEventData
} from './schema-test-utils.mjs';

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
