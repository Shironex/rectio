import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

import { Wordmark } from '@/components/wordmark';
import { repoUrl } from '@/lib/site';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: { title: <Wordmark />, url: '/' },
    links: [
      { text: 'Docs', url: '/docs', active: 'nested-url' },
      { text: 'Components', url: '/docs/components/button', active: 'none' },
      { text: 'Templates', url: '/templates', active: 'nested-url' },
      { text: 'Changelog', url: '/changelog', active: 'url' },
    ],
    githubUrl: repoUrl,
  };
}
