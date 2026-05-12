import { HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole, UserStatus } from '@prisma/client';
import { compare, hash } from 'bcryptjs';
import { BusinessException } from '../../common/errors/business.exception';
import { AppErrorCode } from '../../common/errors/error-codes';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async register(dto: RegisterDto) {
    const [emailUser, usernameUser] = await Promise.all([
      this.usersService.findByEmail(dto.email),
      this.usersService.findByUsername(dto.username),
    ]);

    if (emailUser || usernameUser) {
      throw new BusinessException(
        AppErrorCode.AUTH_ACCOUNT_EXISTS,
        'Email or username already exists',
        HttpStatus.BAD_REQUEST,
      );
    }

    const passwordHash = await hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        passwordHash,
      },
    });

    return this.createAuthResponse(user);
  }

  async login(dto: LoginDto) {
    const user = dto.account.includes('@')
      ? await this.usersService.findByEmail(dto.account)
      : await this.usersService.findByUsername(dto.account);

    if (!user) {
      throw new BusinessException(
        AppErrorCode.AUTH_INVALID_CREDENTIALS,
        'Invalid account or password',
        HttpStatus.UNAUTHORIZED,
      );
    }

    this.assertActiveUser(user);

    const passwordMatched = await compare(dto.password, user.passwordHash);
    if (!passwordMatched) {
      throw new BusinessException(
        AppErrorCode.AUTH_INVALID_CREDENTIALS,
        'Invalid account or password',
        HttpStatus.UNAUTHORIZED,
      );
    }

    return this.createAuthResponse(user);
  }

  async me(userId: number) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new BusinessException(
        AppErrorCode.AUTH_USER_NOT_FOUND,
        'User not found',
        HttpStatus.UNAUTHORIZED,
      );
    }

    this.assertActiveUser(user);

    return this.toSafeUser(user);
  }

  private createAuthResponse(user: SafeUserSource) {
    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      username: user.username,
      role: this.toApiUserRole(user.role),
    });

    return {
      accessToken,
      user: this.toSafeUser(user),
    };
  }

  private toSafeUser(user: SafeUserSource) {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      role: this.toApiUserRole(user.role),
      status: this.toApiUserStatus(user.status),
    };
  }

  private assertActiveUser(user: Pick<SafeUserSource, 'status'>) {
    if (user.status !== UserStatus.ACTIVE) {
      throw new BusinessException(AppErrorCode.AUTH_ACCOUNT_DISABLED, 'Account is disabled', HttpStatus.UNAUTHORIZED);
    }
  }

  private toApiUserRole(role: UserRole) {
    return role === UserRole.ADMIN ? 'admin' : 'user';
  }

  private toApiUserStatus(status: UserStatus) {
    return status === UserStatus.DISABLED ? 'disabled' : 'active';
  }
}

interface SafeUserSource {
  id: number;
  email: string;
  username: string;
  role: UserRole;
  status: UserStatus;
  nickname: string | null;
  avatarUrl: string | null;
}
