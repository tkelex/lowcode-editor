import type { Metadata } from 'next';
import type { LowcodeComponentSchema } from '@lowcode/schema';
import { getPublisherRuntimeConfig } from './config';
import type { PreparedPublishedPage } from './types';

const MAX_TITLE_LENGTH = 80;
const MAX_DESCRIPTION_LENGTH = 160;

export function createPublishedPageMetadata(page: PreparedPublishedPage): Metadata {
  const config = getPublisherRuntimeConfig();
  const pageProps = getPageProps(page.schema.components);
  const title = normalizeText(pageProps.seoTitle, MAX_TITLE_LENGTH) || normalizeText(page.name, MAX_TITLE_LENGTH) || '发布页';
  const description = normalizeText(pageProps.seoDescription, MAX_DESCRIPTION_LENGTH);
  const favicon = normalizeSafeUrl(pageProps.favicon, config.siteUrl);
  const publicUrl = `${config.siteUrl}/publish/${encodeURIComponent(page.publicId)}`;

  return {
    title,
    description: description || undefined,
    alternates: {
      canonical: publicUrl,
    },
    icons: favicon ? { icon: favicon } : undefined,
    openGraph: {
      title,
      description: description || undefined,
      url: publicUrl,
      type: 'website',
      siteName: '低代码发布页',
    },
  };
}

export function getPageProps(components: LowcodeComponentSchema[]) {
  const root = components[0];
  return root?.name === 'Page' && root.props ? root.props : {};
}

export function normalizeText(value: unknown, maxLength: number) {
  if (typeof value !== 'string') return '';

  const text = value.trim().replace(/\s+/g, ' ');
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim();
}

export function normalizeSafeUrl(value: unknown, siteUrl: string) {
  if (typeof value !== 'string') return '';

  const text = value.trim();
  if (!text) return '';

  try {
    const url = new URL(text, siteUrl);
    if (!['http:', 'https:'].includes(url.protocol)) {
      return '';
    }

    return url.toString();
  } catch {
    return '';
  }
}
