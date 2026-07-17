import { notFound } from 'next/navigation';
import { preparePublishedPageSnapshot } from '@root/src/editor/runtime/public';
import { createPublishedPageTag, getPublisherRuntimeConfig } from './config';
import type { PreparedPublishedPage, PublishedPage } from './types';

export class PublishedPageLoadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PublishedPageLoadError';
  }
}

export async function fetchPublishedPage(publicId: string): Promise<PreparedPublishedPage> {
  const config = getPublisherRuntimeConfig();
  const response = await fetch(`${config.apiBaseUrl}/public/pages/${encodeURIComponent(publicId)}`, {
    next: {
      tags: [createPublishedPageTag(publicId)],
    },
  } as RequestInit & { next?: { tags?: string[] } });

  if (response.status === 404) {
    notFound();
  }

  if (!response.ok) {
    throw new PublishedPageLoadError(`读取发布页失败：HTTP ${response.status}`);
  }

  const page = await response.json() as PublishedPage;

  try {
    return preparePublishedPageSnapshot(page);
  } catch (error) {
    console.error('Published page schema migration failed', error);
    throw new PublishedPageLoadError('发布快照无法正常解析');
  }
}
