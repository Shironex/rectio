import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

import { Wordmark } from '@/components/wordmark';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: { title: <Wordmark />, url: '/' },
    links: [
      { text: 'Docs', url: '/docs', active: 'nested-url' },
      { text: 'Components', url: '/docs/components/button', active: 'none' },
      { text: 'Pricing', url: '/#pricing', active: 'none' },
    ],
  };
}
