import './globals.css';

import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import { APPEARANCE_SCRIPT } from '@/components/appearance-script';
import { LinkProvider } from '@/components/link-provider';

export const metadata: Metadata = {
  title: { default: 'Lindwell', template: '%s | Lindwell' },
  description: 'The help desk of Copperline: tickets, customers, the team and the account.',
};

export const viewport: Viewport = {
  colorScheme: 'light dark',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-US" data-theme="default" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: APPEARANCE_SCRIPT }} />
      </head>
      <body className="min-h-dvh bg-surface-canvas font-sans text-fg">
        <LinkProvider>{children}</LinkProvider>
      </body>
    </html>
  );
}
