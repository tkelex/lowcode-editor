import type { Metadata } from 'next';
import { fetchPublishedPage } from '@publisher/published-pages/fetchPublishedPage';
import { getPublisherRuntimeConfig } from '@publisher/published-pages/config';
import { createPublishedPageMetadata } from '@publisher/published-pages/metadata';
import { PublishedPageRuntime } from '@publisher/published-pages/PublishedPageRuntime';
import type { Component } from '../../../../../src/editor/stores/components';

interface PublishedPageRouteProps {
  params: Promise<{
    publicId: string;
  }>;
}

export async function generateMetadata({ params }: PublishedPageRouteProps): Promise<Metadata> {
  const { publicId } = await params;
  const page = await fetchPublishedPage(publicId);
  return createPublishedPageMetadata(page);
}

export default async function PublishedPage({ params }: PublishedPageRouteProps) {
  const { publicId } = await params;
  const page = await fetchPublishedPage(publicId);
  const config = getPublisherRuntimeConfig();

  return (
    <PublishedPageRuntime
      components={page.schema.components as Component[]}
      apiBaseUrl={config.apiBaseUrl}
      allowedOrigins={config.lowcodeHttpAllowedOrigins}
    />
  );
}
