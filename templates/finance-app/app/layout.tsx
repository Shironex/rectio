import './globals.css';

import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: { default: 'Fernhill Finance', template: '%s | Fernhill Finance' },
  description: 'Invoices, expenses, the journal and reports for Fernhill Systems.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="default" suppressHydrationWarning>
      <body className="min-h-dvh bg-surface-canvas font-sans text-fg">{children}</body>
    </html>
  );
}
