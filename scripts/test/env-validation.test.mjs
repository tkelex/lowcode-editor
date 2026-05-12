import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

const moduleUrl = new URL('../../server/dist/server/src/config/env.validation.js', import.meta.url);
const { validateEnv } = await import(moduleUrl.href);

const baseConfig = {
  DATABASE_URL: 'postgresql://user:password@localhost:5432/lowcode_editor?schema=public',
  JWT_SECRET: 'a'.repeat(48),
  FRONTEND_ORIGIN: 'https://lowcode.example.com',
  UPLOAD_DIR: '/app/server/uploads',
  NODE_ENV: 'production',
};

describe('server env validation', () => {
  it('accepts production config with strong secret and real origin', () => {
    assert.equal(validateEnv(baseConfig), baseConfig);
  });

  it('rejects weak production JWT secret', () => {
    assert.throws(() => validateEnv({
      ...baseConfig,
      JWT_SECRET: 'replace-with-a-random-secret',
    }), /JWT_SECRET must be strong/);
  });

  it('rejects localhost frontend origin in production', () => {
    assert.throws(() => validateEnv({
      ...baseConfig,
      FRONTEND_ORIGIN: 'http://localhost:5173',
    }), /FRONTEND_ORIGIN must not use localhost/);
  });

  it('requires upload dir in production', () => {
    assert.throws(() => validateEnv({
      ...baseConfig,
      UPLOAD_DIR: '',
    }), /UPLOAD_DIR is required/);
  });
});
