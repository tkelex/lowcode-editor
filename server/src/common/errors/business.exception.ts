import { HttpException, HttpStatus } from '@nestjs/common';
import { AppErrorCode } from './error-codes';

export class BusinessException extends HttpException {
  constructor(
    public readonly code: AppErrorCode,
    message: string,
    status: HttpStatus,
    details?: unknown,
  ) {
    super({ code, message, details }, status);
  }
}
