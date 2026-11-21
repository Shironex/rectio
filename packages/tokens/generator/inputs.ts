/**
 * What a generated theme is made of: the colour inputs the derivation reads, the non-colour choices
 * (radius, density, fonts) and per-token overrides. Everything here is plain data, so the docs page,
 * the share link and the CLI all describe a theme the same way.
 */
import type { Preset } from '../scripts/derive-core.ts';

export type ColorInputs = Omit<Preset, 'name' | 'label'>;

export type RadiusId = 'none' | 'sharp' | 'default' | 'soft' | 'round';
export type Density = 'comfortable' | 'compact';
export type FontRole = 'sans' | 'display' | 'mono' | 'numeric';
export type FontId =
  | 'plex-sans'
  | 'plex-mono'
  | 'schibsted'
  | 'source-serif'
  | 'system-sans'
  | 'system-serif'
  | 'system-mono';

/** Token names without the `--rx-` prefix, to OKLCH strings. */
export type Overrides = Record<string, string>;

export interface ThemeInputs {
  /** The `data-theme` id and the registry item name after `theme-`. */
  name: string;
  /**
   * `default` keeps the shipped default light colours (still checked and corrected) and derives dark
   * from `color`; `derived` derives both. Changing any colour input switches a theme to `derived`.
   */
  base: 'default' | 'derived';
  color: ColorInputs;
  radius: RadiusId;
  density: Density;
  fonts: Record<FontRole, FontId>;
  overrides: { light: Overrides; dark: Overrides };
}

export const DEFAULT_NAME = 'custom';
export const DEFAULT_STEPS: [number, number, number, number] = [0.025, 0.05, 0.075, 0.11];
export const DEFAULT_TEXT = 0.93;
export const DEFAULT_SELECTED_CHROMA = 0.035;

/** Allowed ranges, shared by the page's controls and the decoder that checks a shared code. */
export const RANGES = {
  hue: [0, 360],
  brandChroma: [0.02, 0.3],
  neutralChroma: [0, 0.03],
  depth: [0.11, 0.22],
  step: [0, 0.2],
  text: [0.88, 0.97],
  accentL: [0.4, 0.9],
  selectedChroma: [0.01, 0.05],
  /* The fine tuning a preset may carry (see Preset in scripts/derive-core.ts); no control sets them. */
  selectedStep: [0, 0.1],
  subtleChroma: [0, 0.1],
  borderL: [0.1, 0.6],
  seriesL: [0.4, 0.9],
  seriesChroma: [0.05, 0.2],
  strongL: [0.6, 0.95],
  strongChroma: [0, 0.2],
} as const satisfies Record<string, readonly [number, number]>;

export interface RadiusScale {
  id: RadiusId;
  label: string;
  control: string;
  panel: string;
  badge: string;
}

/** Corner scales, sharpest first. `default` is the shipped default theme, `sharp` the ledger look. */
export const RADII: RadiusScale[] = [
  { id: 'none', label: 'None', control: '0rem', panel: '0rem', badge: '0rem' },
  { id: 'sharp', label: 'Sharp', control: '0.125rem', panel: '0.25rem', badge: '0.125rem' },
  { id: 'default', label: 'Default', control: '0.25rem', panel: '0.5rem', badge: '0.125rem' },
  { id: 'soft', label: 'Soft', control: '0.375rem', panel: '0.75rem', badge: '0.25rem' },
  { id: 'round', label: 'Round', control: '0.5rem', panel: '1rem', badge: '0.375rem' },
];

export interface FontChoice {
  id: FontId;
  label: string;
  /** The `font-family` value. */
  stack: string;
  roles: FontRole[];
  /** `@import` targets, in the order the theme CSS lists them. */
  imports: string[];
  /** The npm package and range the imports come from; system stacks have none. */
  pkg?: { name: string; range: string };
}

/**
 * The fonts the kit ships faces for (all SIL Open Font License 1.1), plus system stacks that need
 * no download. Catalogue order is the order of the theme's `@import` lines.
 */
export const FONTS: FontChoice[] = [
  {
    id: 'plex-sans',
    label: 'IBM Plex Sans',
    stack: '"IBM Plex Sans Variable", "IBM Plex Sans", ui-sans-serif, system-ui, sans-serif',
    roles: ['sans', 'display', 'numeric'],
    imports: ['@fontsource-variable/ibm-plex-sans/wght.css'],
    pkg: { name: '@fontsource-variable/ibm-plex-sans', range: '^5.3.0' },
  },
  {
    id: 'plex-mono',
    label: 'IBM Plex Mono',
    stack: '"IBM Plex Mono", ui-monospace, "SFMono-Regular", "Menlo", monospace',
    roles: ['mono', 'numeric'],
    imports: ['@fontsource/ibm-plex-mono/400.css', '@fontsource/ibm-plex-mono/500.css'],
    pkg: { name: '@fontsource/ibm-plex-mono', range: '^5.3.0' },
  },
  {
    id: 'schibsted',
    label: 'Schibsted Grotesk',
    stack:
      '"Schibsted Grotesk Variable", "Schibsted Grotesk", ui-sans-serif, system-ui, sans-serif',
    roles: ['sans', 'display', 'numeric'],
    imports: ['@fontsource-variable/schibsted-grotesk/wght.css'],
    pkg: { name: '@fontsource-variable/schibsted-grotesk', range: '^5.3.0' },
  },
  {
    id: 'source-serif',
    label: 'Source Serif 4',
    stack: '"Source Serif 4 Variable", "Source Serif 4", ui-serif, "Georgia", serif',
    roles: ['display'],
    imports: [
      '@fontsource-variable/source-serif-4/opsz.css',
      '@fontsource-variable/source-serif-4/opsz-italic.css',
    ],
    pkg: { name: '@fontsource-variable/source-serif-4', range: '^5.3.1' },
  },
  {
    id: 'system-sans',
    label: 'System sans',
    stack: 'ui-sans-serif, system-ui, sans-serif',
    roles: ['sans', 'display', 'numeric'],
    imports: [],
  },
  {
    id: 'system-serif',
    label: 'System serif',
    stack: 'ui-serif, "Georgia", serif',
    roles: ['display'],
    imports: [],
  },
  {
    id: 'system-mono',
    label: 'System mono',
    stack: 'ui-monospace, "SFMono-Regular", "Menlo", monospace',
    roles: ['mono', 'numeric'],
    imports: [],
  },
];

export const DEFAULT_FONTS: Record<FontRole, FontId> = {
  sans: 'plex-sans',
  display: 'plex-sans',
  mono: 'plex-mono',
  numeric: 'plex-sans',
};

const FALLBACK_FONT: FontChoice = {
  id: 'system-sans',
  label: 'System sans',
  stack: 'ui-sans-serif, system-ui, sans-serif',
  roles: ['sans'],
  imports: [],
};
const FALLBACK_RADIUS: RadiusScale = {
  id: 'default',
  label: 'Default',
  control: '0.25rem',
  panel: '0.5rem',
  badge: '0.125rem',
};

export const fontById = (id: FontId): FontChoice => FONTS.find((f) => f.id === id) ?? FALLBACK_FONT;

export const radiusById = (id: RadiusId): RadiusScale =>
  RADII.find((r) => r.id === id) ?? FALLBACK_RADIUS;

/** Colour inputs of a derivation preset, without its name and label. */
export function colorOf(preset: Preset): ColorInputs {
  const color: Partial<Preset> = structuredClone(preset);
  delete color.name;
  delete color.label;
  return color as ColorInputs;
}

export interface GeneratorPreset {
  id: string;
  label: string;
  /** One line for the picker. */
  note: string;
  inputs: ThemeInputs;
}

/**
 * The presets the page offers, built from the derivation presets in scripts/derive.ts (read at
 * build time, never copied): Default is the shipped light with the Graphite dark; Ledger adds
 * the non-colour half of that look (sharp corners, a grotesk with serif headings).
 */
export function generatorPresets(presets: Preset[]): GeneratorPreset[] {
  const byName = new Map(presets.map((p) => [p.name, p]));
  const base = (preset: Preset | undefined): ThemeInputs | undefined =>
    preset === undefined
      ? undefined
      : {
          name: DEFAULT_NAME,
          base: 'derived',
          color: colorOf(preset),
          radius: 'default',
          density: 'comfortable',
          fonts: { ...DEFAULT_FONTS },
          overrides: { light: {}, dark: {} },
        };
  const out: GeneratorPreset[] = [];
  const graphite = base(byName.get('graphite'));
  if (graphite !== undefined) {
    out.push({
      id: 'default',
      label: 'Default',
      note: 'The shipped light with the Graphite dark',
      inputs: { ...structuredClone(graphite), base: 'default' },
    });
    out.push({
      id: 'graphite',
      label: 'Graphite',
      note: 'Warm charcoal, white ink on cobalt',
      inputs: graphite,
    });
  }
  const notes: Record<string, string> = {
    ink: 'Cool blue-black, light solids',
    onyx: 'Near black, soft accent',
    'ledger-look': 'Olive paper, citron on ink',
  };
  for (const name of ['ink', 'onyx', 'ledger-look']) {
    const inputs = base(byName.get(name));
    if (inputs === undefined) continue;
    const ledger = name === 'ledger-look';
    if (ledger) {
      inputs.radius = 'sharp';
      inputs.fonts = { ...DEFAULT_FONTS, sans: 'schibsted', display: 'source-serif' };
    }
    out.push({
      id: ledger ? 'ledger' : name,
      label: ledger ? 'Ledger' : (byName.get(name)?.label ?? name),
      note: notes[name] ?? '',
      inputs,
    });
  }
  return out;
}

/** `My Theme 2` to `my-theme-2`: a valid data-theme id and registry item name. */
export function slugName(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/^[^a-z]+/, '')
    .slice(0, 40)
    .replace(/-+$/, '');
  return slug === '' ? DEFAULT_NAME : slug;
}
