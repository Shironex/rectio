import './globals.css';

import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import { SiteShell } from '@/components/site-shell';
import { SITE } from '@/data/site';
import { BOOT_SCRIPT } from '@/lib/theme-script';

export const metadata: Metadata = {
  title: { default: `${SITE.name}: ${SITE.tagline}`, template: `%s | ${SITE.name}` },
  description: SITE.description,
};

export const viewport: Viewport = {
  colorScheme: 'light dark',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="default" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: BOOT_SCRIPT }} />
      </head>
      <body className="flex min-h-dvh flex-col bg-surface-canvas font-sans text-fg">
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
