import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { CurrentUserPayload } from '../decorators/current-user.decorator';
import { BusinessException } from '../errors/business.exception';
import { AppErrorCode } from '../errors/error-codes';

interface JwtPayload {
  sub: number;
  email: string;
  username: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
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

  validate(payload: JwtPayload): CurrentUserPayload {
    return {
      userId: payload.sub,
      email: payload.email,
      username: payload.username,
    };
  }
}
