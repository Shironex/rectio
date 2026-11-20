import './global.css';

import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import { Provider } from '@/components/provider';
import { siteDescription, siteName } from '@/lib/site';

export const metadata: Metadata = {
  title: { default: `${siteName}: open source finance UI for React`, template: `%s | ${siteName}` },
  description: siteDescription,
};

export const viewport: Viewport = {
  colorScheme: 'light dark',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="default" suppressHydrationWarning>
      <body className="flex min-h-dvh flex-col bg-surface-canvas font-sans text-fg">
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
