import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: { email: { equals: email.trim(), mode: 'insensitive' } },
      orderBy: { id: 'asc' },
    });
  }

  findByUsername(username: string) {
    return this.prisma.user.findUnique({ where: { username: username.trim() } });
  }

  findById(id: number) {
    return this.prisma.user.findUnique({ where: { id } });
  }
}
