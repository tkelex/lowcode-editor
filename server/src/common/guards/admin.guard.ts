import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { UserRole, UserStatus } from '@prisma/client';
import { CurrentUserPayload } from '../decorators/current-user.decorator';
import { BusinessException } from '../errors/business.exception';
import { AppErrorCode } from '../errors/error-codes';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<{ user?: CurrentUserPayload }>();
    const userId = request.user?.userId;

    if (!userId) {
      throw new BusinessException(AppErrorCode.UNAUTHORIZED, 'Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, status: true },
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new BusinessException(AppErrorCode.AUTH_ACCOUNT_DISABLED, 'Account is disabled', HttpStatus.UNAUTHORIZED);
    }

    if (user.role !== UserRole.ADMIN) {
      throw new BusinessException(AppErrorCode.FORBIDDEN, 'Admin permission required', HttpStatus.FORBIDDEN);
    }

    return true;
  }
}
