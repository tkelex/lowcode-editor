export function normalizeActionUrl(rawUrl: string) {
  const url = rawUrl.trim();

  if (!url) {
    return '';
  }

  if (
    url.startsWith('/') ||
    url.startsWith('#') ||
    url.startsWith('?') ||
    /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(url)
  ) {
    return url;
  }

  return `https://${url}`;
}

export interface NormalizeHttpActionUrlOptions {
  apiBaseUrl?: string;
  allowedOrigins?: string[];
}

export function normalizeHttpActionUrl(rawUrl: string, options: NormalizeHttpActionUrlOptions = {}) {
  const url = rawUrl.trim();

  if (!url) {
    return '';
  }

  if (isLocalhostUrl(url)) {
    return `http://${url}`;
  }

  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(url) || url.startsWith('//')) {
    return url;
  }

  if (looksLikeWebHost(url)) {
    return `https://${url}`;
  }

  const apiBaseUrl = options.apiBaseUrl?.trim();
  if (apiBaseUrl) {
    return joinUrl(apiBaseUrl, stripApiPrefix(url));
  }

  return url.startsWith('/') ? url : `/${url}`;
}

export function isHttpActionUrlAllowed(url: string, options: NormalizeHttpActionUrlOptions = {}) {
  const allowedOrigins = (options.allowedOrigins || [])
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (allowedOrigins.length === 0) {
    return true;
  }

  if (!isAbsoluteHttpUrl(url)) {
    return true;
  }

  const targetOrigin = readOrigin(url);
  if (!targetOrigin) {
    return false;
  }

  return allowedOrigins.some((allowedOrigin) => {
    if (allowedOrigin === '*') {
      return true;
    }

    return targetOrigin === readOrigin(allowedOrigin);
  });
}

function isLocalhostUrl(url: string) {
  return /^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?(?:[/?#]|$)/i.test(url);
}

function looksLikeWebHost(url: string) {
  if (url.startsWith('/')) {
    return false;
  }

  const firstSegment = url.split(/[/?#]/)[0];
  return firstSegment.includes('.');
}

function stripApiPrefix(url: string) {
  return url.replace(/^\/?api(?:\/|$)/i, '');
}

function joinUrl(baseUrl: string, path: string) {
  const normalizedBase = baseUrl.replace(/\/+$/, '');
  const normalizedPath = path.replace(/^\/+/, '');

  if (!normalizedPath) {
    return normalizedBase;
  }

  return `${normalizedBase}/${normalizedPath}`;
}

function isAbsoluteHttpUrl(url: string) {
  return /^https?:\/\//i.test(url);
}

function readOrigin(url: string) {
  try {
    return new URL(url).origin;
  } catch {
    return '';
  }
}
