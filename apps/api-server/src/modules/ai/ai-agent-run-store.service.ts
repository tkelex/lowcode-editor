import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AiAgentRun, Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import type { AiAgentRunCreated, AiAgentRunRequest, AiAgentRunResult } from '@lowcode/schema';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AiAgentContextService } from './ai-agent-context.service';

type Tx = Prisma.TransactionClient;
export const AGENT_LEASE_MS = 30_000;

/** PostgreSQL owns task state; no model calls are made inside these transactions. */
@Injectable()
export class AiAgentRunStore {
  constructor(private readonly prisma: PrismaService, private readonly context: AiAgentContextService) {}

  async enqueue(input: AiAgentRunRequest, actorId: number): Promise<AiAgentRunCreated> {
    const encoded = agentJson(input);
    try {
      return await this.prisma.$transaction(async (tx) => {
        await this.assertAccess(tx, input.projectId!, actorId, true, input.pageId);
        // Serialize this actor's admission across API instances (including project-only tasks).
        await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${actorId} FOR UPDATE`;
        const recent = await tx.aiAgentRun.count({ where: { actorId, createdAt: { gte: new Date(Date.now() - 60_000) } } });
        if (recent >= 12) throw new ConflictException('Agent 请求过于频繁，请稍后重试');
        const page = input.pageId ? await tx.page.findUnique({ where: { id: input.pageId }, include: {
          versions: { orderBy: { versionNo: 'desc' }, take: 1, select: { id: true } },
        } }) : null;
        const runId = randomUUID();
        const context = this.context.build(input);
        await tx.aiAgentRun.create({ data: {
          id: runId, actorId, projectId: input.projectId!, pageId: input.pageId,
          input: encoded, baselineFingerprint: context.pageFingerprint,
          savedVersionId: page?.versions[0]?.id,
          snapshot: agentJson({ runId, status: 'queued', context, plan: [], toolCalls: [], events: [] }),
        } });
        await this.event(tx, runId, 'message', '任务已入队');
        return { runId, status: 'queued' as const };
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('当前页面已有排队或执行中的 Agent 任务');
      }
      throw error;
    }
  }

  async get(runId: string, actorId: number): Promise<AiAgentRunResult> {
    return this.prisma.$transaction(async (tx) => {
      const row = await this.lock(tx, runId);
      await this.assertAccess(tx, row.projectId, actorId, false, row.pageId ?? undefined);
      const events = await tx.aiAgentRunEvent.findMany({ where: { runId }, orderBy: { sequence: 'asc' } });
      return {
        ...(row.snapshot as unknown as AiAgentRunResult),
        runId, status: row.status as AiAgentRunResult['status'], lastSequence: row.lastSequence,
        savedVersionId: row.savedVersionId ?? undefined,
        candidateExpiresAt: row.candidateExpiresAt?.toISOString(),
        events: events.map((e) => ({ ...(e.payload as object), id: `${runId}:${e.sequence}`,
          sequence: e.sequence, type: e.type, createdAt: e.createdAt.toISOString(),
        })) as AiAgentRunResult['events'],
      };
    });
  }

  async list(projectId: number, actorId: number, pageId?: number) {
    return this.prisma.$transaction(async (tx) => {
      await this.assertAccess(tx, projectId, actorId, false, pageId);
      return tx.aiAgentRun.findMany({ where: { projectId, actorId, pageId: pageId ?? null },
        orderBy: { createdAt: 'desc' }, take: 20,
        select: { id: true, status: true, createdAt: true },
      });
    });
  }

  async cancel(runId: string, actorId: number) {
    await this.prisma.$transaction(async (tx) => {
      const row = await this.lock(tx, runId);
      const ownerId = await this.assertAccess(tx, row.projectId, actorId, true, row.pageId ?? undefined);
      if (row.actorId !== actorId && ownerId !== actorId) throw new ForbiddenException('仅发起者或项目所有者可取消任务');
      if (row.status === 'cancelled') return;
      if (!['queued', 'running'].includes(row.status)) throw new ConflictException('当前状态不能取消');
      await tx.aiAgentRun.update({ where: { id: runId }, data: {
        status: 'cancelled', leaseToken: null, leaseExpiresAt: null, finishedAt: new Date(),
      } });
      await this.event(tx, runId, 'error', '任务已取消');
    });
    return this.get(runId, actorId);
  }

  async confirm(runId: string, actorId: number, candidateId: string) {
    const expired = await this.prisma.$transaction(async (tx) => {
      const row = await this.lock(tx, runId);
      const ownerId = await this.assertAccess(tx, row.projectId, actorId, true, row.pageId ?? undefined);
      if (row.actorId !== actorId && ownerId !== actorId) {
        throw new ForbiddenException('仅发起者或项目所有者可确认候选');
      }

      const snapshot = row.snapshot as unknown as AiAgentRunResult;
      if (row.status === 'expired') return true;
      if (row.status === 'accepted') {
        if (snapshot.decision?.candidateId !== candidateId) {
          throw new ConflictException('候选与已确认记录不一致');
        }
        return false;
      }
      if (row.status !== 'awaiting_confirmation') {
        throw new ConflictException('当前状态不能确认候选');
      }
      if (!snapshot.candidate || snapshot.candidate.id !== candidateId) {
        throw new ConflictException('候选已更新，请刷新后重试');
      }

      const [clock] = await tx.$queryRaw<{ now: Date }[]>`SELECT clock_timestamp() AS now`;
      if (!row.candidateExpiresAt || row.candidateExpiresAt <= clock.now) {
        await tx.aiAgentRun.update({ where: { id: runId }, data: {
          status: 'expired',
          snapshot: agentJson({ ...snapshot, status: 'expired' }),
        } });
        await this.event(tx, runId, 'error', '候选已过期');
        await tx.auditLog.create({ data: {
          actorId,
          projectId: row.projectId,
          pageId: row.pageId,
          action: 'ai.agent.expire',
          targetType: 'aiAgentRun',
          targetId: row.id,
          summary: 'Agent candidate expired',
          metadata: { runId: row.id, candidateId, status: 'expired' },
        } });
        return true;
      }
      const decision = {
        type: 'accepted' as const,
        candidateId,
        actorId,
        decidedAt: clock.now.toISOString(),
      };
      await tx.aiAgentRun.update({ where: { id: runId }, data: {
        status: 'accepted',
        snapshot: agentJson({ ...snapshot, status: 'accepted', decision }),
      } });
      await this.event(tx, runId, 'message', '候选已确认');
      await tx.auditLog.create({ data: {
        actorId,
        projectId: row.projectId,
        pageId: row.pageId,
        action: 'ai.agent.confirm',
        targetType: 'aiAgentRun',
        targetId: row.id,
        summary: 'Agent candidate confirmed',
        metadata: { runId: row.id, candidateId, status: 'accepted' },
      } });
      return false;
    });
    if (expired) throw new ConflictException('候选已过期，请重新生成');
    return this.get(runId, actorId);
  }

  async reject(runId: string, actorId: number, candidateId: string, reason?: string) {
    const expired = await this.prisma.$transaction(async (tx) => {
      const row = await this.lock(tx, runId);
      const ownerId = await this.assertAccess(tx, row.projectId, actorId, true, row.pageId ?? undefined);
      if (row.actorId !== actorId && ownerId !== actorId) {
        throw new ForbiddenException('仅发起者或项目所有者可拒绝候选');
      }

      const snapshot = row.snapshot as unknown as AiAgentRunResult;
      if (row.status === 'expired') return true;
      if (row.status === 'rejected') {
        if (snapshot.decision?.candidateId !== candidateId) {
          throw new ConflictException('候选与已拒绝记录不一致');
        }
        return false;
      }
      if (row.status !== 'awaiting_confirmation') {
        throw new ConflictException('当前状态不能拒绝候选');
      }
      if (!snapshot.candidate || snapshot.candidate.id !== candidateId) {
        throw new ConflictException('候选已更新，请刷新后重试');
      }

      const [clock] = await tx.$queryRaw<{ now: Date }[]>`SELECT clock_timestamp() AS now`;
      if (!row.candidateExpiresAt || row.candidateExpiresAt <= clock.now) {
        await tx.aiAgentRun.update({ where: { id: runId }, data: {
          status: 'expired',
          snapshot: agentJson({ ...snapshot, status: 'expired' }),
        } });
        await this.event(tx, runId, 'error', '候选已过期');
        await tx.auditLog.create({ data: {
          actorId,
          projectId: row.projectId,
          pageId: row.pageId,
          action: 'ai.agent.expire',
          targetType: 'aiAgentRun',
          targetId: row.id,
          summary: 'Agent candidate expired',
          metadata: { runId: row.id, candidateId, status: 'expired' },
        } });
        return true;
      }
      const decision = {
        type: 'rejected' as const,
        candidateId,
        actorId,
        decidedAt: clock.now.toISOString(),
        ...(reason ? { reason } : {}),
      };
      await tx.aiAgentRun.update({ where: { id: runId }, data: {
        status: 'rejected',
        snapshot: agentJson({ ...snapshot, status: 'rejected', decision }),
      } });
      await this.event(tx, runId, 'message', '候选已拒绝', reason);
      await tx.auditLog.create({ data: {
        actorId,
        projectId: row.projectId,
        pageId: row.pageId,
        action: 'ai.agent.reject',
        targetType: 'aiAgentRun',
        targetId: row.id,
        summary: 'Agent candidate rejected',
        metadata: { runId: row.id, candidateId, status: 'rejected', ...(reason ? { reason } : {}) },
      } });
      return false;
    });
    if (expired) throw new ConflictException('候选已过期，请重新生成');
    return this.get(runId, actorId);
  }

  async claim(): Promise<AiAgentRun | null> {
    return this.prisma.$transaction(async (tx) => {
      // SKIP LOCKED allows multiple API workers without waiting on another claim.
      const expired = await tx.$queryRaw<AiAgentRun[]>`
        SELECT * FROM "AiAgentRun" WHERE "status" = 'running' AND "leaseExpiresAt" <= NOW()
        ORDER BY "leaseExpiresAt" LIMIT 10 FOR UPDATE SKIP LOCKED`;
      for (const row of expired) {
        const status = row.recoveryCount < 1 ? 'queued' : 'failed';
        await tx.aiAgentRun.update({ where: { id: row.id }, data: {
          status, recoveryCount: { increment: 1 }, leaseToken: null, leaseExpiresAt: null,
          finishedAt: status === 'failed' ? new Date() : null,
        } });
        await this.event(tx, row.id, 'error', status === 'queued' ? '执行租约过期，重新排队一次' : '恢复预算耗尽，任务失败');
      }
      const rows = await tx.$queryRaw<AiAgentRun[]>`
        SELECT * FROM "AiAgentRun" WHERE "status" = 'queued'
        ORDER BY "createdAt" LIMIT 1 FOR UPDATE SKIP LOCKED`;
      if (!rows[0]) return null;
      const row = rows[0];
      const [clock] = await tx.$queryRaw<{ now: Date }[]>`SELECT clock_timestamp() AS now`;
      const claimed = await tx.aiAgentRun.update({ where: { id: row.id }, data: {
        status: 'running', leaseToken: randomUUID(), startedAt: row.startedAt ?? clock.now,
        leaseExpiresAt: new Date(clock.now.getTime() + AGENT_LEASE_MS),
      } });
      await this.event(tx, row.id, 'message', '任务开始执行');
      return claimed;
    });
  }

  async heartbeat(row: AiAgentRun) {
    return this.prisma.$executeRaw`UPDATE "AiAgentRun"
      SET "leaseExpiresAt" = clock_timestamp() + interval '30 seconds'
      WHERE "id" = ${row.id} AND "status" = 'running' AND "leaseToken" = ${row.leaseToken}
        AND "leaseExpiresAt" > clock_timestamp()`;
  }

  async checkExecutionAccess(row: AiAgentRun) {
    await this.prisma.$transaction((tx) => this.assertAccess(tx, row.projectId, row.actorId, true, row.pageId ?? undefined));
  }

  async finish(row: AiAgentRun, result: AiAgentRunResult) {
    const snapshot = agentJson({ ...result, runId: row.id, events: [],
      audit: result.audit ? { ...result.audit, runId: row.id } : undefined,
      // Raw provider/tool payloads are not required for the visible execution trace.
      toolCalls: result.toolCalls.map(({ id, toolName, status, startedAt, finishedAt, summary }) =>
        ({ id, toolName, args: {}, status, startedAt, finishedAt, summary })),
    });
    return this.prisma.$transaction(async (tx) => {
      const current = await this.lock(tx, row.id);
      const [clock] = await tx.$queryRaw<{ now: Date }[]>`SELECT clock_timestamp() AS now`;
      if (current.status !== 'running' || current.leaseToken !== row.leaseToken ||
        !current.leaseExpiresAt || current.leaseExpiresAt <= clock.now) return false;
      if (result.status === 'awaiting_confirmation') {
        await this.assertAccess(tx, row.projectId, row.actorId, true, row.pageId ?? undefined);
      }
      await tx.aiAgentRun.update({ where: { id: row.id }, data: {
        status: result.status, snapshot, leaseToken: null, leaseExpiresAt: null,
        finishedAt: clock.now,
        candidateExpiresAt: result.candidate ? new Date(clock.now.getTime() + 86_400_000) : null,
      } });
      for (const event of result.events) await this.event(tx, row.id, event.type, event.title, event.detail);
      await this.event(tx, row.id, result.status === 'awaiting_confirmation' ? 'candidate' : 'error',
        result.status === 'awaiting_confirmation' ? '候选已保存，等待确认' : '任务执行失败');
      await tx.auditLog.create({ data: { actorId: row.actorId, projectId: row.projectId, pageId: row.pageId,
        action: 'ai.agent.run', targetType: 'aiAgentRun', targetId: row.id,
        summary: `Agent run: ${result.status}`, metadata: { runId: row.id, status: result.status },
      } });
      return true;
    });
  }

  private async lock(tx: Tx, runId: string) {
    const rows = await tx.$queryRaw<AiAgentRun[]>`SELECT * FROM "AiAgentRun" WHERE "id" = ${runId} FOR UPDATE`;
    if (!rows[0]) throw new NotFoundException('Agent 任务不存在');
    return rows[0];
  }

  private async event(tx: Tx, runId: string, type: string, title: string, detail?: string) {
    // All callers already hold the run row lock (or have just inserted it).
    const row = await tx.aiAgentRun.update({ where: { id: runId }, data: { lastSequence: { increment: 1 } } });
    await tx.aiAgentRunEvent.create({ data: { runId, sequence: row.lastSequence, type,
      payload: agentJson({ title, detail }),
    } });
  }

  private async assertAccess(tx: Tx, projectId: number, actorId: number, edit: boolean, pageId?: number) {
    const project = await tx.project.findUnique({ where: { id: projectId } });
    const user = await tx.user.findUnique({ where: { id: actorId }, select: { status: true } });
    if (!project || project.status !== 'ACTIVE' || user?.status !== 'ACTIVE') throw new ForbiddenException('项目或用户不可用');
    const member = await tx.projectMember.findUnique({ where: { projectId_userId: { projectId, userId: actorId } } });
    if (project.ownerId !== actorId && (!member || (edit && member.role === 'VIEWER'))) throw new ForbiddenException('无权访问任务');
    if (pageId && !await tx.page.findFirst({ where: { id: pageId, projectId } })) throw new NotFoundException('页面不存在');
    return project.ownerId;
  }
}

/** Reject recognizable credentials instead of silently changing executable schema/baselines. */
export function agentJson(value: unknown): Prisma.InputJsonValue {
  const json = JSON.stringify(value);
  if (Buffer.byteLength(json, 'utf8') > 512_000) throw new BadRequestException('Agent 上下文或结果超过 512 KB');
  if (/"(?:authorization|cookie|api[-_]?key|password|secret|access[-_]?token)"\s*:\s*"[^"\s][^"]*"/i.test(json) ||
    /\bBearer\s+[a-z0-9._~-]+/i.test(json)) {
    throw new BadRequestException('Agent 输入或输出包含凭证，请移除后重试');
  }
  return JSON.parse(json) as Prisma.InputJsonValue;
}
