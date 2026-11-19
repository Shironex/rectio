import type { MarketingAction, MarketingLink } from '@rectio/blocks/marketing';

/**
 * The launch page's facts. Quarry and everything about it is invented sample content; replace this
 * file and the rest of data/ to launch your own product.
 */

export const SITE = {
  name: 'Quarry',
  legalName: 'Quarry Labs ApS',
  url: 'https://quarry.example',
  tagline: 'The research notebook that turns customer interviews into evidence.',
  description:
    'Quarry turns customer interviews into tagged, searchable evidence your whole product team can cite. Join the waitlist for early access.',
  launch: 'Early access opens in January 2027',
  email: 'hello@quarry.example',
} as const;

export const NAV: readonly MarketingLink[] = [
  { label: 'Product', href: '#product' },
  { label: 'How it works', href: '#how' },
  { label: 'FAQ', href: '#faq' },
];

export const JOIN: MarketingAction = { label: 'Join the waitlist', href: '#waitlist' };

export const STORAGE = {
  theme: 'quarry-theme',
  consent: 'quarry-consent',
  waitlist: 'quarry-waitlist',
} as const;

export const CONSENT_VERSION = '2026-11';
