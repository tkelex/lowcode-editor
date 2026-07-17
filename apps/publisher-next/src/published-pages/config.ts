export interface PublisherRuntimeConfig {
  apiBaseUrl: string;
  siteUrl: string;
  lowcodeHttpAllowedOrigins: string[];
  revalidateSecret: string;
}

const DEFAULT_API_BASE_URL = 'http://localhost:3000/api';
const DEFAULT_SITE_URL = 'http://localhost:5174';

export function getPublisherRuntimeConfig(): PublisherRuntimeConfig {
  return {
    apiBaseUrl: trimTrailingSlash(process.env.PUBLISHER_API_BASE_URL || DEFAULT_API_BASE_URL),
    siteUrl: trimTrailingSlash(process.env.PUBLISHER_SITE_URL || DEFAULT_SITE_URL),
    lowcodeHttpAllowedOrigins: parseCsv(process.env.PUBLISHER_LOWCODE_HTTP_ALLOWED_ORIGINS),
    revalidateSecret: process.env.PUBLISHER_REVALIDATE_SECRET || '',
  };
}

export function createPublishedPageTag(publicId: string) {
  return `published-page:${publicId}`;
}

export function parseCsv(value: string | undefined) {
  return (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}
