import { AppWindowIcon, HouseIcon } from '@phosphor-icons/react/dist/ssr';
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
      // The sidebar is the docs navigation; the site links would repeat it, so only home stays.
      links={[
        {
          type: 'icon',
          icon: <HouseIcon aria-hidden />,
          text: 'rectio home',
          label: 'rectio home',
          url: '/',
        },
        // The live templates sit outside the docs tree, so they keep a link of their own.
        {
          type: 'icon',
          icon: <AppWindowIcon aria-hidden />,
          text: 'Live templates',
          label: 'Live templates',
          url: '/templates',
        },
      ]}
      sidebar={{ banner: <ThemeSwitch /> }}
    >
      {children}
    </DocsLayout>
  );
}
