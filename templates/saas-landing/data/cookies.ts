import type { CookieCategory } from '@rectio/blocks/marketing';

/** The cookie categories the banner and the preferences ask about. Keep them in step with /cookies. */
export const COOKIE_CATEGORIES: readonly CookieCategory[] = [
  {
    id: 'necessary',
    title: 'Necessary',
    description:
      'Remember this choice and your theme. The site does not work properly without them.',
    required: true,
  },
  {
    id: 'analytics',
    title: 'Analytics',
    description: 'Count visits and see which pages help, without identifying you.',
  },
  {
    id: 'marketing',
    title: 'Marketing',
    description: 'Measure our campaigns on other sites.',
  },
];
