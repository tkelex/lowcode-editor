import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { AppErrorCode } from '../errors/error-codes';
import {
  createRequestId,
  getSanitizedRequestPath,
  normalizeRequestIdHeader,
  redactSensitiveText,
  REQUEST_ID_HEADER,
  writeStructuredLog,
} from '../logging/http-log';

type ErrorMessage = string | string[];

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse = exception instanceof HttpException ? exception.getResponse() : null;
    const code = this.getCode(exceptionResponse, status);
    const message = this.getMessage(exceptionResponse);
    const timestamp = new Date().toISOString();
    const requestId = normalizeRequestIdHeader(response.getHeader(REQUEST_ID_HEADER))
      ?? normalizeRequestIdHeader(request.headers[REQUEST_ID_HEADER])
      ?? createRequestId();

    response.setHeader(REQUEST_ID_HEADER, requestId);
    this.logException(exception, {
      requestId,
      status,
      code,
      message,
      method: request.method,
      path: getSanitizedRequestPath(request),
      timestamp,
    });

    response.status(status).json({
      statusCode: status,
      code,
      message,
      path: getSanitizedRequestPath(request),
      method: request.method,
      requestId,
      timestamp,
    });
  }

  private getMessage(exceptionResponse: string | object | null): ErrorMessage {
    if (!exceptionResponse) {
      return 'Internal server error';
    }

    if (typeof exceptionResponse === 'string') {
      return exceptionResponse;
    }

    if ('message' in exceptionResponse) {
      const message = exceptionResponse.message;
      if (typeof message === 'string') {
        return message;
      }

      if (Array.isArray(message) && message.every((item) => typeof item === 'string')) {
        return message;
      }
    }

    return 'Request failed';
  }

  private getCode(exceptionResponse: string | object | null, status: HttpStatus): AppErrorCode | string {
    if (exceptionResponse && typeof exceptionResponse === 'object' && 'code' in exceptionResponse) {
      const code = exceptionResponse.code;
      if (typeof code === 'string') {
        return code;
      }
    }

    if (status === HttpStatus.BAD_REQUEST) return AppErrorCode.BAD_REQUEST;
    if (status === HttpStatus.UNAUTHORIZED) return AppErrorCode.UNAUTHORIZED;
    if (status === HttpStatus.FORBIDDEN) return AppErrorCode.FORBIDDEN;
    if (status === HttpStatus.NOT_FOUND) return AppErrorCode.NOT_FOUND;
    if (status === HttpStatus.CONFLICT) return AppErrorCode.CONFLICT;

    return AppErrorCode.INTERNAL_ERROR;
  }

  private logException(
    exception: unknown,
    context: {
      requestId: string;
      status: number;
      code: AppErrorCode | string;
      message: ErrorMessage;
      method: string;
      path: string;
      timestamp: string;
    },
  ) {
    const stack = process.env.NODE_ENV !== 'production' && exception instanceof Error && exception.stack
      ? redactSensitiveText(exception.stack)
      : undefined;
    const payload = {
      type: 'http_error',
      requestId: context.requestId,
      method: context.method,
      path: context.path,
      status: context.status,
      code: context.code,
      message: this.redactMessage(context.message),
      errorName: this.getErrorName(exception),
      timestamp: context.timestamp,
      ...(stack ? { stack } : {}),
    };

    writeStructuredLog(context.status >= 500 ? 'error' : 'warn', payload);
  }

  private redactMessage(message: ErrorMessage) {
    return Array.isArray(message)
      ? message.map((item) => redactSensitiveText(item))
      : redactSensitiveText(message);
  }

  private getErrorName(exception: unknown) {
    if (exception instanceof Error) {
      return exception.name;
    }

    return typeof exception;
  }
}
