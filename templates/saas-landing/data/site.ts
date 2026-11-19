import type { MarketingAction, MarketingLink } from '@rectio/blocks/marketing';

/**
 * The site's own facts: name, routes and the links every page shares. Rostra and everything about
 * it is invented sample content; replace this file and the rest of data/ to make the site yours.
 */

export const SITE = {
  name: 'Rostra',
  legalName: 'Rostra Software Ltd',
  tagline: 'Shift scheduling for teams that run on rotas.',
  description:
    'Rostra builds the week for shift teams: availability in, a fair rota out, swaps and time off handled in the app.',
  /** The site's own address, for links in metadata, the sitemap and robots.txt. */
  url: 'https://rostra.example',
  /** Where the product itself lives. Point these at your app. */
  appUrl: 'https://app.rostra.example',
  email: {
    sales: 'sales@rostra.example',
    support: 'support@rostra.example',
    privacy: 'privacy@rostra.example',
  },
} as const;

export const NAV: readonly MarketingLink[] = [
  { label: 'Features', href: '/features' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Customers', href: '/customers' },
  { label: 'Blog', href: '/blog' },
  { label: 'Changelog', href: '/changelog' },
  { label: 'Contact', href: '/contact' },
];

/** One label per intent, used everywhere on the site. */
export const START: MarketingAction = { label: 'Start free', href: '/pricing' };
export const DEMO: MarketingAction = { label: 'Book a demo', href: '/contact' };
export const SIGN_IN: MarketingAction = { label: 'Sign in', href: `${SITE.appUrl}/sign-in` };

export const LEGAL_LINKS: readonly MarketingLink[] = [
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
  { label: 'Cookies', href: '/cookies' },
];

export const FOOTER_COLUMNS = [
  {
    id: 'product',
    title: 'Product',
    links: [
      { label: 'Features', href: '/features' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Changelog', href: '/changelog' },
    ],
  },
  {
    id: 'company',
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Customers', href: '/customers' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    id: 'resources',
    title: 'Resources',
    links: [
      { label: 'Blog', href: '/blog' },
      { label: 'Help centre', href: `${SITE.appUrl}/help`, external: true },
      { label: 'Status', href: 'https://status.rostra.example', external: true },
    ],
  },
] as const;

/** The announcement at the top of every page. Change `id` to show a new one to everyone again. */
export const ANNOUNCEMENT = {
  id: '2026-11-open-shifts',
  tag: 'New',
  message: 'Open shifts are here',
  action: { label: 'Read the changelog', href: '/changelog' },
} as const;

/** Storage keys. Prefix them with your product so they never clash on a shared domain. */
export const STORAGE = {
  theme: 'rostra-theme',
  consent: 'rostra-consent',
  announcement: 'rostra-announcement',
} as const;

/** The version of the cookie list. Bump it when the categories change, so everyone is asked again. */
export const CONSENT_VERSION = '2026-11';
