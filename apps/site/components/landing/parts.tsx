'use client';

import { deferred } from '@/components/defer';

import type * as ExpenseApprovalModule from '@/demos/expense-approval';
import type * as InvoiceListModule from '@/demos/invoice-list';
import type * as BenchModule from './bench';
import type * as CloseBooksModule from './close-books';
import type * as ComponentStripModule from './component-strip';
import type * as CurrencyGridModule from './currency-grid';
import type * as PlainVsMotionModule from './plain-vs-motion';
import type * as RegistryDemoModule from './registry-demo';
import type * as TemplateGalleryModule from './template-gallery';
import type * as ThemeCurtainModule from './theme-curtain';

/*
 * The landing's live parts, each rendered into the HTML but loaded and hydrated only as it nears
 * the screen, so the first screen pays for the hero alone. Import these, never the modules behind
 * them, anywhere on the landing.
 *
 * The server takes each module synchronously, so its HTML has every part in full (readable with
 * no JavaScript). Next replaces `typeof window` at build time, so that `require` is cut from the
 * client bundle, where the part loads only through its `import()`.
 */
/* eslint-disable @typescript-eslint/no-require-imports -- the server-only branch described above */
export const CloseBooks = deferred(
  () => import('./close-books').then((m) => m.CloseBooks),
  typeof window === 'undefined'
    ? (require('./close-books') as typeof CloseBooksModule).CloseBooks
    : undefined,
);
export const ComponentStrip = deferred(
  () => import('./component-strip').then((m) => m.ComponentStrip),
  typeof window === 'undefined'
    ? (require('./component-strip') as typeof ComponentStripModule).ComponentStrip
    : undefined,
);
export const ThemeCurtain = deferred(
  () => import('./theme-curtain').then((m) => m.ThemeCurtain),
  typeof window === 'undefined'
    ? (require('./theme-curtain') as typeof ThemeCurtainModule).ThemeCurtain
    : undefined,
);
export const Bench = deferred(
  () => import('./bench').then((m) => m.Bench),
  typeof window === 'undefined' ? (require('./bench') as typeof BenchModule).Bench : undefined,
);
export const TemplateGallery = deferred(
  () => import('./template-gallery').then((m) => m.TemplateGallery),
  typeof window === 'undefined'
    ? (require('./template-gallery') as typeof TemplateGalleryModule).TemplateGallery
    : undefined,
);
export const RegistryDemo = deferred(
  () => import('./registry-demo').then((m) => m.RegistryDemo),
  typeof window === 'undefined'
    ? (require('./registry-demo') as typeof RegistryDemoModule).RegistryDemo
    : undefined,
);
export const PlainVsMotion = deferred(
  () => import('./plain-vs-motion').then((m) => m.PlainVsMotion),
  typeof window === 'undefined'
    ? (require('./plain-vs-motion') as typeof PlainVsMotionModule).PlainVsMotion
    : undefined,
);
export const CurrencyGrid = deferred(
  () => import('./currency-grid').then((m) => m.CurrencyGrid),
  typeof window === 'undefined'
    ? (require('./currency-grid') as typeof CurrencyGridModule).CurrencyGrid
    : undefined,
);

// The hero window is a picture of the kit (inert, nothing in it can be used), so its blocks never
// load on the client: the server's markup is all it needs.
export const HeroInvoiceList = deferred(
  () => import('@/demos/invoice-list').then((m) => m.default),
  typeof window === 'undefined'
    ? (require('@/demos/invoice-list') as typeof InvoiceListModule).default
    : undefined,
  'never',
);
export const HeroApprovals = deferred(
  () => import('@/demos/expense-approval').then((m) => m.default),
  typeof window === 'undefined'
    ? (require('@/demos/expense-approval') as typeof ExpenseApprovalModule).default
    : undefined,
  'never',
);
