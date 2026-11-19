import { HomeLayout } from 'fumadocs-ui/layouts/home';
import type { ReactNode } from 'react';

import { ThemeSwitch } from '@/components/theme-switch';
import { baseOptions } from '@/lib/layout.shared';

export default function Layout({ children }: { children: ReactNode }) {
  const base = baseOptions();
  return (
    <>
      <a
        href="#content"
        className="sr-only z-50 rounded-control bg-accent px-4 py-2 text-base font-medium text-accent-contrast focus-visible:not-sr-only focus-visible:fixed focus-visible:start-4 focus-visible:top-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        Skip to content
      </a>
      <HomeLayout
        {...base}
        links={[
          ...(base.links ?? []),
          {
            type: 'custom',
            on: 'all',
            secondary: true,
            children: (
              // The secondary nav is a list: its custom item must be a list item.
              <li className="list-none">
                <ThemeSwitch />
              </li>
            ),
          },
        ]}
      >
        {children}
      </HomeLayout>
    </>
  );
}
