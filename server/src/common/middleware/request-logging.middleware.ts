import type { NextFunction, Request, Response } from 'express';
import {
  createRequestId,
  getSanitizedRequestPath,
  normalizeRequestIdHeader,
  REQUEST_ID_HEADER,
  writeStructuredLog,
} from '../logging/http-log';

export function requestLoggingMiddleware(request: Request, response: Response, next: NextFunction) {
  const requestId = normalizeRequestIdHeader(request.headers[REQUEST_ID_HEADER]) ?? createRequestId();
  const startTime = process.hrtime.bigint();

  response.setHeader(REQUEST_ID_HEADER, requestId);

  let logged = false;
  const writeLog = (event: 'finish' | 'close') => {
    if (logged) return;
    logged = true;

    const durationMs = Number(process.hrtime.bigint() - startTime) / 1_000_000;
    const status = event === 'close' && !response.writableEnded ? 499 : response.statusCode;
    const payload = {
      type: 'http_request',
      requestId,
      method: request.method,
      path: getSanitizedRequestPath(request),
      status,
      durationMs: Math.round(durationMs * 100) / 100,
      ip: request.ip,
      event,
      timestamp: new Date().toISOString(),
    };

    if (status >= 500 || status === 499) {
      writeStructuredLog('error', payload);
      return;
    }

    if (status >= 400) {
      writeStructuredLog('warn', payload);
      return;
    }

    writeStructuredLog('info', payload);
  };

  response.once('finish', () => writeLog('finish'));
  response.once('close', () => writeLog('close'));
  next();
}
