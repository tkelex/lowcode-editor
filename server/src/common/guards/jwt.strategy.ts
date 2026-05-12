import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserStatus } from '@prisma/client';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { CurrentUserPayload } from '../decorators/current-user.decorator';
import { BusinessException } from '../errors/business.exception';
import { AppErrorCode } from '../errors/error-codes';
import { PrismaService } from '../../prisma/prisma.service';

interface JwtPayload {
  sub: number;
  email: string;
  username: string;
  role?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new BusinessException(
        AppErrorCode.CONFIG_INVALID,
        'JWT secret is not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload): Promise<CurrentUserPayload> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        status: true,
      },
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new BusinessException(AppErrorCode.AUTH_ACCOUNT_DISABLED, 'Account is disabled', HttpStatus.UNAUTHORIZED);
    }

    return {
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role === 'ADMIN' ? 'admin' : 'user',
    };
  }
}
