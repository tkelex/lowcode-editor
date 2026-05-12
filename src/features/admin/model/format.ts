import dayjs from 'dayjs';

export function normalizeKeyword(value: unknown) {
  return String(value ?? '').trim().toLowerCase();
}

export function formatDateTime(value?: string | null) {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-';
}

export function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  if (value < 1024 * 1024 * 1024) return `${(value / 1024 / 1024).toFixed(1)} MB`;
  return `${(value / 1024 / 1024 / 1024).toFixed(1)} GB`;
}
