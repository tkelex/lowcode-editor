import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

const moduleUrl = new URL('../../server/dist/server/src/modules/auth/auth-normalization.js', import.meta.url);
const {
  normalizeEmail,
  normalizeLoginAccount,
  normalizeStringValue,
  normalizeUsername,
} = await import(moduleUrl.href);

describe('auth account normalization', () => {
  it('normalizes emails before registration and email login', () => {
    assert.equal(normalizeEmail('  User.Name@Example.COM  '), 'user.name@example.com');
    assert.equal(normalizeLoginAccount('  User.Name@Example.COM  '), 'user.name@example.com');
  });

  it('trims usernames without changing their case', () => {
    assert.equal(normalizeUsername('  DemoUser  '), 'DemoUser');
    assert.equal(normalizeLoginAccount('  DemoUser  '), 'DemoUser');
  });

  it('leaves non-string transform values untouched for validator errors', () => {
    assert.equal(normalizeStringValue(123, normalizeEmail), 123);
  });
});
