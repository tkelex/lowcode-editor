import { create } from 'zustand';

export type RuntimeLogLevel = 'error' | 'warning' | 'info';

export interface RuntimeLogEntry {
  id: string;
  level: RuntimeLogLevel;
  title: string;
  message: string;
  source: 'event' | 'render' | 'runtime';
  componentId?: number;
  componentName?: string;
  componentDesc?: string;
  eventName?: string;
  actionType?: string;
  stack?: string;
  createdAt: string;
}

interface RuntimeLogsState {
  logs: RuntimeLogEntry[];
  addLog: (entry: Omit<RuntimeLogEntry, 'id' | 'createdAt'>) => void;
  clearLogs: () => void;
}

const MAX_RUNTIME_LOGS = 50;

export const useRuntimeLogsStore = create<RuntimeLogsState>((set) => ({
  logs: [],
  addLog: (entry) => {
    set((state) => ({
      logs: [
        {
          ...entry,
          id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          createdAt: new Date().toISOString(),
        },
        ...state.logs,
      ].slice(0, MAX_RUNTIME_LOGS),
    }));
  },
  clearLogs: () => set({ logs: [] }),
}));

export function formatRuntimeErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message || error.name;
  }

  if (typeof error === 'string') {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return '未知错误';
  }
}

export function formatRuntimeErrorStack(error: unknown) {
  return error instanceof Error ? error.stack : undefined;
}
