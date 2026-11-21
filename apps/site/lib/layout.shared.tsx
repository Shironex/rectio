import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

import { Wordmark } from '@/components/wordmark';
import { repoUrl } from '@/lib/site';

/** The site's top links, shared by the docs layout and the site header of the other pages. */
export const SITE_LINKS = [
  { text: 'Docs', url: '/docs', active: 'nested-url' },
  { text: 'Components', url: '/docs/components/button', active: 'none' },
  { text: 'Templates', url: '/templates', active: 'nested-url' },
  { text: 'Theme generator', url: '/docs/theming/generator', active: 'url' },
  { text: 'Changelog', url: '/changelog', active: 'url' },
] as const;

export type SiteLink = (typeof SITE_LINKS)[number];

export function baseOptions(): BaseLayoutProps {
  return {
    nav: { title: <Wordmark />, url: '/' },
    links: [...SITE_LINKS],
    githubUrl: repoUrl,
  };
}
