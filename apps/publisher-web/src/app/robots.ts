import type { MetadataRoute } from 'next';
import { getPublisherRuntimeConfig } from '@/published-pages/config';

export default function robots(): MetadataRoute.Robots {
  const config = getPublisherRuntimeConfig();

  return {
    rules: {
      userAgent: '*',
      allow: '/publish/',
    },
    sitemap: `${config.siteUrl}/sitemap.xml`,
  };
}
