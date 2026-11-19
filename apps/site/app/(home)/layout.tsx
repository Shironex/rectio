import { HomeLayout } from 'fumadocs-ui/layouts/home';
import type { ReactNode } from 'react';

import { ThemeSwitch } from '@/components/theme-switch';
import { baseOptions } from '@/lib/layout.shared';

export default function Layout({ children }: { children: ReactNode }) {
  const base = baseOptions();
  return (
    <HomeLayout
      {...base}
      links={[
        ...(base.links ?? []),
        { type: 'custom', on: 'nav', secondary: true, children: <ThemeSwitch /> },
      ]}
    >
      {children}
    </HomeLayout>
  );
}
