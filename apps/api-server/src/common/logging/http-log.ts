import { randomUUID } from 'node:crypto';
import type { Request } from 'express';

export const REQUEST_ID_HEADER = 'x-request-id';

type HeaderValue = string | number | string[] | undefined;
type LogLevel = 'info' | 'warn' | 'error';

export function createRequestId() {
  return randomUUID();
}

export function normalizeRequestIdHeader(value: HeaderValue) {
  const rawValue = Array.isArray(value) ? value[0] : value;
  if (rawValue === undefined || rawValue === null) {
    return null;
  }

  const normalized = String(rawValue).trim();
  if (!normalized || normalized.length > 128) {
    return null;
  }

  const sanitized = normalized.replace(/[^a-zA-Z0-9_.:-]/g, '').slice(0, 128);
  return sanitized || null;
}

export function getSanitizedRequestPath(request: Request) {
  const rawUrl = request.originalUrl || request.url || request.path || '/';

  try {
    return new URL(rawUrl, 'http://lowcode.local').pathname;
  } catch {
    return rawUrl.split('?')[0] || '/';
  }
}

export function redactSensitiveText(value: string) {
  return value
    .replace(/postgres(?:ql)?:\/\/[^\s'")]+/gi, '[REDACTED_DATABASE_URL]')
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer [REDACTED_TOKEN]')
    .replace(/\b(DATABASE_URL|JWT_SECRET|PASSWORD|TOKEN|SECRET)\s*=\s*([^\s,;]+)/gi, '$1=[REDACTED]')
    .replace(/\b(password|token|secret)\b\s*[:=]\s*["']?[^"'\s,;]+["']?/gi, '$1=[REDACTED]');
}

export function writeStructuredLog(level: LogLevel, payload: Record<string, unknown>) {
  const line = JSON.stringify(payload);

  if (level === 'error') {
    console.error(line);
    return;
  }

  if (level === 'warn') {
    console.warn(line);
    return;
  }

  console.info(line);
}
