import { useSyncExternalStore } from 'react';

export type PerfPhase = 'baseline' | 'current';

export interface PerfSample {
  id: number;
  action: string;
  phase: PerfPhase;
  latencyMs: number;
  renderDurationMs: number;
  commitAt: number;
}

export interface PerfStats {
  count: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  avgRenderDurationMs: number;
}

export interface FirstRenderStats {
  count: number;
  avgMs: number;
  p95Ms: number;
  latestMs: number;
}

interface PerfSnapshot {
  phase: PerfPhase;
  enabled: boolean;
  baselineStats: PerfStats;
  currentStats: PerfStats;
  latestSamples: PerfSample[];
  firstRenderStats: FirstRenderStats;
}

interface PendingUpdate {
  id: number;
  action: string;
  phase: PerfPhase;
  startAt: number;
}

const EMPTY_STATS: PerfStats = {
  count: 0,
  avgLatencyMs: 0,
  p95LatencyMs: 0,
  avgRenderDurationMs: 0,
};

const MAX_SAMPLES = 500;
const MAX_LATEST_SAMPLES = 30;
const MAX_FIRST_RENDER_SAMPLES = 50;

let seq = 0;
let pendingUpdate: PendingUpdate | null = null;

const state: {
  enabled: boolean;
  phase: PerfPhase;
  samples: PerfSample[];
  appStartAt: number | null;
  hasCapturedFirstRenderInCycle: boolean;
  firstRenderSamples: number[];
} = {
  enabled: true,
  phase: 'baseline',
  samples: [],
  appStartAt: null,
  hasCapturedFirstRenderInCycle: false,
  firstRenderSamples: [],
};

const listeners = new Set<() => void>();
let snapshotVersion = 0;
let cachedSnapshotVersion = -1;
let cachedSnapshot: PerfSnapshot | null = null;

function emit() {
  snapshotVersion += 1;
  listeners.forEach((listener) => listener());
}

function round(value: number) {
  return Number(value.toFixed(2));
}

function calculateStats(samples: PerfSample[]): PerfStats {
  if (samples.length === 0) {
    return EMPTY_STATS;
  }

  const latencies = samples.map((sample) => sample.latencyMs).sort((a, b) => a - b);
  const totalLatency = latencies.reduce((sum, value) => sum + value, 0);
  const renderTotal = samples.reduce((sum, sample) => sum + sample.renderDurationMs, 0);

  const p95Index = Math.max(0, Math.ceil(latencies.length * 0.95) - 1);

  return {
    count: samples.length,
    avgLatencyMs: round(totalLatency / samples.length),
    p95LatencyMs: round(latencies[p95Index]),
    avgRenderDurationMs: round(renderTotal / samples.length),
  };
}

function calculateFirstRenderStats(samples: number[]): FirstRenderStats {
  if (samples.length === 0) {
    return {
      count: 0,
      avgMs: 0,
      p95Ms: 0,
      latestMs: 0,
    };
  }

  const sorted = [...samples].sort((a, b) => a - b);
  const total = sorted.reduce((sum, value) => sum + value, 0);
  const p95Index = Math.max(0, Math.ceil(sorted.length * 0.95) - 1);

  return {
    count: samples.length,
    avgMs: round(total / samples.length),
    p95Ms: round(sorted[p95Index]),
    latestMs: round(samples[samples.length - 1]),
  };
}

function getSnapshot(): PerfSnapshot {
  if (cachedSnapshot && cachedSnapshotVersion === snapshotVersion) {
    return cachedSnapshot;
  }

  const baselineSamples = state.samples.filter((sample) => sample.phase === 'baseline');
  const currentSamples = state.samples.filter((sample) => sample.phase === 'current');

  cachedSnapshot = {
    phase: state.phase,
    enabled: state.enabled,
    baselineStats: calculateStats(baselineSamples),
    currentStats: calculateStats(currentSamples),
    latestSamples: state.samples.slice(-MAX_LATEST_SAMPLES).reverse(),
    firstRenderStats: calculateFirstRenderStats(state.firstRenderSamples),
  };

  cachedSnapshotVersion = snapshotVersion;

  return cachedSnapshot;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useZustandPerfSnapshot() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function setZustandPerfPhase(phase: PerfPhase) {
  state.phase = phase;
  emit();
}

export function setZustandPerfEnabled(enabled: boolean) {
  state.enabled = enabled;
  if (!enabled) {
    pendingUpdate = null;
  }
  emit();
}

export function clearZustandPerfSamples() {
  state.samples = [];
  pendingUpdate = null;
  state.firstRenderSamples = [];
  emit();
}

export function markAppStart() {
  if (typeof performance === 'undefined') {
    return;
  }

  state.appStartAt = performance.now();
  state.hasCapturedFirstRenderInCycle = false;
  emit();
}

export function markFirstMountCommit(commitTime: number) {
  if (typeof performance === 'undefined' || state.appStartAt === null || state.hasCapturedFirstRenderInCycle) {
    return;
  }

  const durationMs = Math.max(0, commitTime - state.appStartAt);
  state.firstRenderSamples.push(round(durationMs));
  if (state.firstRenderSamples.length > MAX_FIRST_RENDER_SAMPLES) {
    state.firstRenderSamples.splice(0, state.firstRenderSamples.length - MAX_FIRST_RENDER_SAMPLES);
  }

  state.hasCapturedFirstRenderInCycle = true;
  emit();
}

export function markZustandUpdate(action: string) {
  if (!state.enabled || typeof performance === 'undefined') {
    return;
  }

  pendingUpdate = {
    id: ++seq,
    action,
    phase: state.phase,
    startAt: performance.now(),
  };
}

export function markReactCommit(actualDuration: number, commitTime: number) {
  if (!state.enabled || !pendingUpdate) {
    return;
  }

  const matchedUpdate = pendingUpdate;
  pendingUpdate = null;

  const latencyMs = Math.max(0, commitTime - matchedUpdate.startAt);

  state.samples.push({
    id: matchedUpdate.id,
    action: matchedUpdate.action,
    phase: matchedUpdate.phase,
    latencyMs: round(latencyMs),
    renderDurationMs: round(actualDuration),
    commitAt: Date.now(),
  });

  if (state.samples.length > MAX_SAMPLES) {
    state.samples.splice(0, state.samples.length - MAX_SAMPLES);
  }

  emit();
}
