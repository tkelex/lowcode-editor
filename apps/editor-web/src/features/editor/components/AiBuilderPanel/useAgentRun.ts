import { useCallback, useEffect, useRef, useState } from 'react';
import type { AiAgentRunResult } from '@lowcode/schema';
import {
  confirmAiAgentRun, createAiAgentRunForPage, createAiAgentRunForProject, getAiAgentRun, listAiAgentRuns,
  rejectAiAgentRun,
  type CreateAiAgentRunInput,
} from '../../api/ai';

/** One cancellable subscription per panel; leaving the panel never cancels the server task. */
export function useAgentRun(pageId?: number, projectId?: number) {
  const [run, setRun] = useState<AiAgentRunResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [decisionBusy, setDecisionBusy] = useState<'confirm' | 'reject' | null>(null);
  const [error, setError] = useState('');
  const session = useRef<{ controller: AbortController; timer?: ReturnType<typeof setTimeout> }>();

  const reset = useCallback(() => {
    session.current?.controller.abort();
    clearTimeout(session.current?.timer);
    session.current = { controller: new AbortController() };
    setRun(null);
    setBusy(false);
    setDecisionBusy(null);
    setError('');
    return session.current;
  }, []);

  const poll = useCallback(async (runId: string, current: NonNullable<typeof session.current>) => {
    try {
      const next = await getAiAgentRun(runId, current.controller.signal);
      if (session.current !== current || current.controller.signal.aborted) return;
      setRun(next);
      const active = next.status === 'queued' || next.status === 'running';
      setBusy(active);
      if (active) current.timer = setTimeout(() => void poll(runId, current), 1500);
      else if (next.status === 'failed') setError(next.error || 'Agent 任务执行失败');
    } catch {
      if (session.current !== current || current.controller.signal.aborted) return;
      setBusy(false);
      setError('任务状态读取失败，请重新打开面板恢复。后台任务不会因此取消。');
    }
  }, []);

  useEffect(() => {
    const current = reset();
    if (pageId || projectId) {
      setBusy(true);
      void listAiAgentRuns(pageId, projectId, current.controller.signal).then(async (runs) => {
        if (session.current !== current || current.controller.signal.aborted) return;
        const latest = runs[0];
        if (latest) await poll(latest.id, current);
        else setBusy(false);
      }).catch(() => {
        if (session.current !== current || current.controller.signal.aborted) return;
        setBusy(false);
        setError('历史任务读取失败，可重新打开面板重试');
      });
    }
    return () => {
      current.controller.abort();
      clearTimeout(current.timer);
      session.current?.controller.abort();
      clearTimeout(session.current?.timer);
    };
  }, [pageId, projectId, poll, reset]);

  async function submit(input: CreateAiAgentRunInput) {
    const current = reset();
    setBusy(true);
    try {
      const created = pageId
        ? await createAiAgentRunForPage(pageId, input)
        : await createAiAgentRunForProject(projectId!, input);
      if (session.current !== current || current.controller.signal.aborted) return;
      await poll(created.runId, current);
    } catch {
      if (session.current !== current || current.controller.signal.aborted) return;
      setBusy(false);
      setError('任务提交失败，或当前页面已有活动任务；请重新打开面板查询，避免重复提交。');
    }
  }

  async function confirm(candidateId: string) {
    if (!run) throw new Error('Agent 任务不存在');
    setDecisionBusy('confirm');
    setError('');
    try {
      const next = await confirmAiAgentRun(run.runId, candidateId);
      setRun(next);
      return next;
    } catch (requestError) {
      setError('候选确认失败，请刷新任务状态后重试');
      throw requestError;
    } finally {
      setDecisionBusy(null);
    }
  }

  async function reject(candidateId: string, reason?: string) {
    if (!run) throw new Error('Agent 任务不存在');
    setDecisionBusy('reject');
    setError('');
    try {
      const next = await rejectAiAgentRun(run.runId, candidateId, reason);
      setRun(next);
      return next;
    } catch (requestError) {
      setError('候选拒绝失败，请刷新任务状态后重试');
      throw requestError;
    } finally {
      setDecisionBusy(null);
    }
  }

  return { run, busy, decisionBusy, error, setError, reset, submit, confirm, reject };
}
