import type { ReactNode } from 'react';

/** What every SaaS block demo takes: the variant, the empty switch and the locale. */
export interface DemoProps {
  motion: boolean;
  empty: boolean;
  locale: 'en-GB';
}

export type Demo = (props: DemoProps) => ReactNode;

/** Sample data only. The demo's now is 19 March 2026, 14:20, like the finance blocks. */
export const NOW = new Date(2026, 2, 19, 14, 20);

/** A moment `minutes` before NOW. */
export const ago = (minutes: number) => new Date(NOW.getTime() - minutes * 60_000);

/** EUR sample prices. */
export const CURRENCY = { 'en-GB': 'EUR' } as const;
export const RATE = { 'en-GB': 1 } as const;
