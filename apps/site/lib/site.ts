export const siteName = 'rectio';
/** The source, linked from the header, the landing and the footer. */
export const repoUrl = 'https://github.com/Shironex/rectio';
export const siteDescription =
  'Open source React components, blocks and templates for finance and back-office software: amounts, ledgers, approvals. MIT licensed.';

export const MODES = ['light', 'dark'] as const;
export type Mode = (typeof MODES)[number];
