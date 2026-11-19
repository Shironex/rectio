import './globals.css';

import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import { APPEARANCE_SCRIPT } from '@/components/appearance-script';

export const metadata: Metadata = {
  title: { default: 'Fernhill Finance', template: '%s | Fernhill Finance' },
  description: 'Invoices, expenses, the journal and reports for Fernhill Systems.',
};

export const viewport: Viewport = {
  colorScheme: 'light dark',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-IE" data-theme="default" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: APPEARANCE_SCRIPT }} />
      </head>
      <body className="min-h-dvh bg-surface-canvas font-sans text-fg">{children}</body>
    </html>
  );
}
