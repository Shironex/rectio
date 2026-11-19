import { HouseIcon } from '@phosphor-icons/react/dist/ssr';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { ReactNode } from 'react';

import { ThemeSwitch } from '@/components/theme-switch';
import { baseOptions } from '@/lib/layout.shared';
import { source } from '@/lib/source';

export default function Layout({ children }: { children: ReactNode }) {
  const base = baseOptions();
  return (
    <DocsLayout
      tree={source.getPageTree()}
      {...base}
      links={[
        ...(base.links ?? []),
        {
          type: 'icon',
          icon: <HouseIcon aria-hidden />,
          text: 'rectio home',
          label: 'rectio home',
          url: '/',
        },
      ]}
      sidebar={{ banner: <ThemeSwitch /> }}
    >
      {children}
    </DocsLayout>
  );
}
