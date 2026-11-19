import './globals.css';

import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import { SITE } from '@/data/site';
import { BOOT_SCRIPT } from '@/lib/theme-script';

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: `${SITE.name}: ${SITE.tagline}`,
  description: SITE.description,
  openGraph: { type: 'website', siteName: SITE.name, locale: 'en_GB' },
  twitter: { card: 'summary' },
};

export const viewport: Viewport = {
  colorScheme: 'light dark',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-GB" data-theme="ledger" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: BOOT_SCRIPT }} />
      </head>
      <body className="flex min-h-dvh flex-col bg-surface-canvas font-sans text-fg">
        {children}
      </body>
    </html>
  );
}
