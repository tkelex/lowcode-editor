import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
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
      throw new BadRequestException('Email or username already exists');
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
      throw new UnauthorizedException('Invalid account or password');
    }

    const passwordMatched = await compare(dto.password, user.passwordHash);
    if (!passwordMatched) {
      throw new UnauthorizedException('Invalid account or password');
    }

    return this.createAuthResponse(user);
  }

  async me(userId: number) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.toSafeUser(user);
  }

  private createAuthResponse(user: { id: number; email: string; username: string; nickname: string | null; avatarUrl: string | null }) {
    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      username: user.username,
    });

    return {
      accessToken,
      user: this.toSafeUser(user),
    };
  }

  private toSafeUser(user: { id: number; email: string; username: string; nickname: string | null; avatarUrl: string | null }) {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
    };
  }
}
