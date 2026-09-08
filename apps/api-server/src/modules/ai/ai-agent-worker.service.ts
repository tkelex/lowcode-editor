import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import type { AiAgentRunRequest, AiAgentRunResult } from '@lowcode/schema';
import { AiAgentOrchestrationService } from './ai-agent-orchestration.service';
import { AiAgentRunStore } from './ai-agent-run-store.service';

@Injectable()
export class AiAgentWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AiAgentWorker.name);
  private timer?: ReturnType<typeof setTimeout>;
  private stopped = false;

  constructor(private readonly store: AiAgentRunStore, private readonly generator: AiAgentOrchestrationService) {}

  onModuleInit() { this.schedule(); }
  onModuleDestroy() { this.stopped = true; clearTimeout(this.timer); }

  private schedule() {
    if (this.stopped) return;
    this.timer = setTimeout(() => void this.tick(), 1000);
    this.timer.unref();
  }

  async tick() {
    try {
      const row = await this.store.claim();
      if (!row) return;
      let renewing = false;
      const heartbeat = setInterval(() => {
        if (renewing || this.stopped) return;
        renewing = true;
        void this.store.heartbeat(row).catch(() => undefined).finally(() => { renewing = false; });
      }, 10_000);
      heartbeat.unref();
      let deadline: ReturnType<typeof setTimeout> | undefined;
      try {
        await this.store.checkExecutionAccess(row);
        const result = await Promise.race([
          this.generator.run(row.input as unknown as AiAgentRunRequest, row.actorId),
          new Promise<never>((_, reject) => { deadline = setTimeout(() => reject(new Error('Execution deadline')), 120_000); }),
        ]);
        if (result.status === 'failed') {
          // Drop the generator's raw error and event details before persisting a failure.
          await this.store.finish(row, { ...(row.snapshot as unknown as AiAgentRunResult),
            status: 'failed', events: [], error: '候选生成未通过校验或模型服务不可用，请重新生成',
          });
        } else {
          await this.store.finish(row, result);
        }
      } catch {
        // Never persist provider exceptions: they may contain URLs or credential-bearing bodies.
        const result = row.snapshot as unknown as AiAgentRunResult;
        await this.store.finish(row, { ...result, status: 'failed', candidate: undefined,
          events: [], error: '任务执行失败或超过执行期限，请重新生成',
        });
      } finally {
        clearInterval(heartbeat);
        clearTimeout(deadline);
      }
    } catch {
      this.logger.warn('Agent worker 暂不可用；下次轮询将重试');
    } finally {
      this.schedule();
    }
  }
}
