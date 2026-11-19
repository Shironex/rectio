/** The tokens the theme showcase reads out, as authored in @rectio/tokens. */
export const READOUT = [
  { token: '--rx-font-family-display', label: 'Headings', format: 'family' },
  { token: '--rx-radius-control', label: 'Corners', format: 'raw' },
  { token: '--rx-accent', label: 'Accent', format: 'colour', swatch: 'bg-accent' },
  { token: '--rx-surface-canvas', label: 'Canvas', format: 'colour', swatch: 'bg-surface-canvas' },
  { token: '--rx-motion-duration-count', label: 'Count-up', format: 'raw' },
] as const;

export type ReadoutToken = (typeof READOUT)[number]['token'];
export type Readout = Record<string, Record<string, Record<ReadoutToken, string>>>;
