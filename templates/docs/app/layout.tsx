import './globals.css';

import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import { APPEARANCE_SCRIPT } from '@/components/appearance-script';
import { LinkProvider } from '@/components/links';
import { SITE } from '@/data/site';

export const metadata: Metadata = {
  title: { default: SITE.title, template: `%s | ${SITE.title}` },
  description: SITE.description,
};

export const viewport: Viewport = {
  colorScheme: 'light dark',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang={SITE.locale} data-theme="default" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: APPEARANCE_SCRIPT }} />
      </head>
      <body className="min-h-dvh bg-surface-canvas font-sans text-fg">
        <LinkProvider>{children}</LinkProvider>
      </body>
    </html>
  );
}
