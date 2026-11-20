export const siteName = 'rectio';
export const siteDescription =
  'Open source React components, blocks and templates for finance and back-office software: amounts, ledgers, approvals. MIT licensed.';

/** The two shipped themes. The site itself switches between them. */
export const THEMES = [
  { id: 'default', name: 'Default' },
  { id: 'ledger', name: 'Ledger' },
] as const;
export type ThemeId = (typeof THEMES)[number]['id'];

export const MODES = ['light', 'dark'] as const;
export type Mode = (typeof MODES)[number];

/** Where the site remembers the visitor's theme. */
export const THEME_STORAGE_KEY = 'rectio-site-theme';
