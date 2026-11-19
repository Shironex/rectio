import type { MetadataRoute } from 'next';

import { ARTICLES } from '@/data/blog';
import { SITE } from '@/data/site';

export const dynamic = 'force-static';

const PAGES = [
  '',
  '/features',
  '/pricing',
  '/customers',
  '/blog',
  '/about',
  '/contact',
  '/changelog',
  '/privacy',
  '/terms',
  '/cookies',
];

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...PAGES.map((path) => ({ url: `${SITE.url}${path}` })),
    ...ARTICLES.map((article) => ({
      url: `${SITE.url}/blog/${article.slug}`,
      lastModified: article.date,
    })),
  ];
}
