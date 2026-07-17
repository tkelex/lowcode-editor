import type { MetadataRoute } from 'next';
import { getPublisherRuntimeConfig } from '@publisher/published-pages/config';

export default function sitemap(): MetadataRoute.Sitemap {
  const config = getPublisherRuntimeConfig();

  return [
    {
      url: config.siteUrl,
      lastModified: new Date(),
    },
  ];
}
