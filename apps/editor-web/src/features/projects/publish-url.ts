const DEFAULT_PUBLISH_PATH_PREFIX = '/publish';

export function buildPublishedPageUrl(publicId: string, options?: { siteUrl?: string; origin?: string }) {
  const normalizedPublicId = encodeURIComponent(publicId);
  const siteUrl = normalizeBaseUrl(options?.siteUrl);

  if (siteUrl) {
    return `${siteUrl}${DEFAULT_PUBLISH_PATH_PREFIX}/${normalizedPublicId}`;
  }

  const origin = normalizeBaseUrl(options?.origin);
  return origin
    ? `${origin}${DEFAULT_PUBLISH_PATH_PREFIX}/${normalizedPublicId}`
    : `${DEFAULT_PUBLISH_PATH_PREFIX}/${normalizedPublicId}`;
}

export function getConfiguredPublisherSiteUrl() {
  return readViteEnv('VITE_PUBLISHER_SITE_URL');
}

function normalizeBaseUrl(value: string | undefined) {
  return value?.trim().replace(/\/+$/, '') || '';
}

function readViteEnv(name: string) {
  try {
    const meta = import.meta as ImportMeta & {
      env?: Record<string, string | undefined>;
    };
    return meta.env?.[name];
  } catch {
    return undefined;
  }
}
