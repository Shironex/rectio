import './global.css';

import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import { Provider } from '@/components/provider';
import { THEME_STORAGE_KEY, siteDescription, siteName } from '@/lib/site';

export const metadata: Metadata = {
  title: { default: `${siteName}: open source finance UI for React`, template: `%s | ${siteName}` },
  description: siteDescription,
};

export const viewport: Viewport = {
  colorScheme: 'light dark',
};

/** Applies the remembered theme before the first paint, so a ledger visitor never sees a flash. */
const themeScript = `try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t==='ledger'||t==='default')document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="default" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-dvh flex-col bg-surface-canvas font-sans text-fg">
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
