import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

type PrismaWriter = PrismaService | Prisma.TransactionClient;

export interface AuditLogInput {
  actorId?: number;
  projectId?: number;
  pageId?: number;
  action: string;
  targetType: string;
  targetId?: string | number;
  summary?: string;
  metadata?: Prisma.InputJsonValue;
}

@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  record(input: AuditLogInput, tx?: Prisma.TransactionClient) {
    const client: PrismaWriter = tx ?? this.prisma;

    return client.auditLog.create({
      data: {
        actorId: input.actorId,
        projectId: input.projectId,
        pageId: input.pageId,
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId === undefined ? undefined : String(input.targetId),
        summary: input.summary,
        metadata: input.metadata,
      },
    });
  }

  listByProject(projectId: number) {
    return this.prisma.auditLog.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }
}
