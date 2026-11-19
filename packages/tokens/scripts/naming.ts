/** Token names: DTCG paths to CSS custom properties and Tailwind utility names. */

export const THEMES = ['default', 'ledger'] as const;
export const MODES = ['light', 'dark'] as const;
export type Theme = (typeof THEMES)[number];
export type Mode = (typeof MODES)[number];

/** Tier 1 groups. They feed the semantic tier and are never emitted as CSS. */
export const PRIMITIVE_GROUPS = new Set([
  'palette',
  'size',
  'font-family',
  'font-size',
  'font-weight',
  'duration',
  'easing',
]);

/** Semantic colour groups that become Tailwind colours. */
export const COLOR_GROUPS = new Set([
  'surface',
  'text',
  'border',
  'accent',
  'positive',
  'negative',
  'warning',
  'info',
  'focus',
  'scrim',
  'chart',
  'identity',
  'code',
]);

/**
 * `component.button.height.md` -> `--rx-button-height-md`, `surface.default` -> `--rx-surface`.
 * The `component` group and a trailing `default` add nothing to the name.
 */
export function cssVarName(path: readonly string[]): string {
  const parts = path[0] === 'component' ? path.slice(1) : [...path];
  if (parts.length > 1 && parts.at(-1) === 'default') parts.pop();
  return `--rx-${parts.join('-')}`;
}

/** Utility names read better than the token groups: `text-fg-muted`, not `text-text-muted`. */
const COLOR_ALIASES: Record<string, string> = { text: 'fg', border: 'line' };

/** `['text', 'muted']` -> `fg-muted`, `['surface']` -> `surface`. */
export function tailwindColorName(path: readonly string[]): string {
  const [group = '', ...rest] = path;
  return [COLOR_ALIASES[group] ?? group, ...rest].join('-');
}
