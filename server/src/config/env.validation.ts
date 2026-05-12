import { AppErrorCode } from '../common/errors/error-codes';

const REQUIRED_ENV_KEYS = ['DATABASE_URL', 'JWT_SECRET'] as const;
const LOCAL_FRONTEND_ORIGINS = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]);
const WEAK_JWT_SECRETS = new Set([
  'secret',
  'change-me',
  'change-me-before-production',
  'replace-with-a-random-secret',
  'replace-with-a-random-production-secret-at-least-32-chars',
  'local-docker-change-me',
  'ci-secret-change-me',
]);

export function validateEnv(config: Record<string, unknown>) {
  const missingKeys = REQUIRED_ENV_KEYS.filter((key) => !readString(config[key]));

  if (missingKeys.length > 0) {
    throw new Error(`${AppErrorCode.CONFIG_INVALID}: Missing env ${missingKeys.join(', ')}`);
  }

  const nodeEnv = readString(config.NODE_ENV);
  const isProduction = nodeEnv === 'production';
  const jwtSecret = readString(config.JWT_SECRET);
  if (isProduction && (jwtSecret.length < 32 || WEAK_JWT_SECRETS.has(jwtSecret))) {
    throw new Error(`${AppErrorCode.CONFIG_INVALID}: JWT_SECRET must be strong in production`);
  }

  const port = config.PORT;
  if (port !== undefined && port !== null && port !== '') {
    const parsedPort = Number(port);
    if (!Number.isInteger(parsedPort) || parsedPort <= 0 || parsedPort > 65535) {
      throw new Error(`${AppErrorCode.CONFIG_INVALID}: PORT must be a valid TCP port`);
    }
  }

  const frontendOrigin = readString(config.FRONTEND_ORIGIN);
  if (frontendOrigin) {
    try {
      new URL(frontendOrigin);
    } catch {
      throw new Error(`${AppErrorCode.CONFIG_INVALID}: FRONTEND_ORIGIN must be a valid URL`);
    }
  } else if (isProduction) {
    throw new Error(`${AppErrorCode.CONFIG_INVALID}: FRONTEND_ORIGIN is required in production`);
  }

  if (isProduction && LOCAL_FRONTEND_ORIGINS.has(frontendOrigin)) {
    throw new Error(`${AppErrorCode.CONFIG_INVALID}: FRONTEND_ORIGIN must not use localhost in production`);
  }

  const uploadMaxSize = config.UPLOAD_MAX_SIZE;
  if (uploadMaxSize !== undefined && uploadMaxSize !== null && uploadMaxSize !== '') {
    const parsedUploadMaxSize = Number(uploadMaxSize);
    if (!Number.isInteger(parsedUploadMaxSize) || parsedUploadMaxSize <= 0) {
      throw new Error(`${AppErrorCode.CONFIG_INVALID}: UPLOAD_MAX_SIZE must be a positive integer`);
    }
  }

  const uploadDir = readString(config.UPLOAD_DIR);
  if (isProduction && !uploadDir) {
    throw new Error(`${AppErrorCode.CONFIG_INVALID}: UPLOAD_DIR is required in production`);
  }

  return config;
}

function readString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}
