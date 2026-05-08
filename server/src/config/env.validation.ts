import { AppErrorCode } from '../common/errors/error-codes';

const REQUIRED_ENV_KEYS = ['DATABASE_URL', 'JWT_SECRET'] as const;

export function validateEnv(config: Record<string, unknown>) {
  const missingKeys = REQUIRED_ENV_KEYS.filter((key) => !readString(config[key]));

  if (missingKeys.length > 0) {
    throw new Error(`${AppErrorCode.CONFIG_INVALID}: Missing env ${missingKeys.join(', ')}`);
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
  }

  return config;
}

function readString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}
