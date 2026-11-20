/** The tokens the light and dark showcase reads out, as authored in @rectio/tokens. */
export const READOUT = [
  { token: '--rx-surface-canvas', label: 'Canvas', swatch: 'bg-surface-canvas' },
  { token: '--rx-surface-raised', label: 'Raised surface', swatch: 'bg-surface-raised' },
  { token: '--rx-text', label: 'Text', swatch: 'bg-fg' },
  { token: '--rx-border', label: 'Lines', swatch: 'bg-line' },
  { token: '--rx-accent-strong', label: 'Accent text', swatch: 'bg-accent-strong' },
] as const;

export type ReadoutToken = (typeof READOUT)[number]['token'];
/** The readout values of the default theme, per mode. */
export type Readout = Record<string, Record<ReadoutToken, string>>;
