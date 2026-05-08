import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { AppErrorCode } from '../errors/error-codes';

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

    response.status(status).json({
      statusCode: status,
      code: this.getCode(exceptionResponse, status),
      message: this.getMessage(exceptionResponse),
      path: request.url,
      method: request.method,
      timestamp: new Date().toISOString(),
    });
  }

  private getMessage(exceptionResponse: string | object | null) {
    if (!exceptionResponse) {
      return 'Internal server error';
    }

    if (typeof exceptionResponse === 'string') {
      return exceptionResponse;
    }

    if ('message' in exceptionResponse) {
      return exceptionResponse.message;
    }

    return 'Request failed';
  }

  private getCode(exceptionResponse: string | object | null, status: HttpStatus) {
    if (exceptionResponse && typeof exceptionResponse === 'object' && 'code' in exceptionResponse) {
      return exceptionResponse.code;
    }

    if (status === HttpStatus.BAD_REQUEST) return AppErrorCode.BAD_REQUEST;
    if (status === HttpStatus.UNAUTHORIZED) return AppErrorCode.UNAUTHORIZED;
    if (status === HttpStatus.FORBIDDEN) return AppErrorCode.FORBIDDEN;
    if (status === HttpStatus.NOT_FOUND) return AppErrorCode.NOT_FOUND;
    if (status === HttpStatus.CONFLICT) return AppErrorCode.CONFLICT;

    return AppErrorCode.INTERNAL_ERROR;
  }
}
