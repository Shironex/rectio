'use client';

import { deferred } from '@/components/defer';

/*
 * The landing's live parts, each rendered into the HTML but loaded and hydrated only as it nears
 * the screen, so the first screen pays for the hero alone. Import these, never the modules behind
 * them, anywhere on the landing.
 */
export const CloseBooks = deferred(() => import('./close-books').then((m) => m.CloseBooks));
export const ComponentStrip = deferred(() =>
  import('./component-strip').then((m) => m.ComponentStrip),
);
export const ThemeCurtain = deferred(() => import('./theme-curtain').then((m) => m.ThemeCurtain));
export const Bench = deferred(() => import('./bench').then((m) => m.Bench));
export const TemplateGallery = deferred(() =>
  import('./template-gallery').then((m) => m.TemplateGallery),
);
export const RegistryDemo = deferred(() => import('./registry-demo').then((m) => m.RegistryDemo));
export const PlainVsMotion = deferred(() =>
  import('./plain-vs-motion').then((m) => m.PlainVsMotion),
);
export const CurrencyGrid = deferred(() => import('./currency-grid').then((m) => m.CurrencyGrid));

// The hero window is a picture of the kit (inert, nothing in it can be used), so its blocks never
// load on the client: the server's markup is all it needs.
export const HeroInvoiceList = deferred(
  () => import('@/demos/invoice-list').then((m) => m.default),
  'never',
);
export const HeroApprovals = deferred(
  () => import('@/demos/expense-approval').then((m) => m.default),
  'never',
);
