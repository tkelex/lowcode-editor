import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  normalizeActionUrl,
  normalizeHttpActionUrl,
  isHttpActionUrlAllowed
} from './schema-test-utils.mjs';

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
