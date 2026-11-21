/** Token names: DTCG paths to CSS custom properties and Tailwind utility names. */

/** Shipped themes. A theme is a folder in src/themes; more can be added beside default. */
export const THEMES: readonly string[] = ['default'];
export const MODES = ['light', 'dark'] as const;
export type Theme = string;
export type Mode = (typeof MODES)[number];

/**
 * Shipped skins. A skin is a file in src/skins: token overrides applied with `data-skin="<id>"` on
 * any element, on top of whichever theme, mode and density are in force there.
 */
export const SKINS: readonly string[] = ['dense', 'editorial'];

/**
 * The skin contract: the token groups a skin may override. Type, corners, border width, rhythm and
 * control sizes, plus non-colour component tokens. Colour, shadow and motion belong to the theme
 * and its modes (and to reduced motion), so a skin composes with any theme, light or dark, and
 * never changes a contrast pair. A skin may set any subset of these; it never adds a token, and it
 * never sets a touch height. Layout measures such as the alert dialog width, the sheet measure and
 * the tree indent are component dimensions, so a skin may set them.
 */
export const SKIN_GROUPS: readonly (readonly string[])[] = [
  ['font', 'size'],
  ['font', 'line-height'],
  ['font', 'weight'],
  ['font', 'tracking'],
  ['font', 'family'],
  ['radius'],
  ['border', 'width'],
  ['space'],
  ['control'],
];
const SKIN_COMPONENT_TYPES = new Set(['dimension', 'fontWeight', 'fontFamily', 'number', 'other']);

/** Why a token may not be in a skin, or undefined when the skin contract allows it. */
export function skinViolation(path: readonly string[], type: string): string | undefined {
  // Touch heights hold the 44px target on coarse pointers in every skin: `control.height.touch`,
  // `button.height.touch`, `tree.row-height-touch` and any later one named the same way.
  if (path.some((part) => part === 'touch' || part.endsWith('-touch'))) return 'a touch target';
  if (path[0] === 'component')
    return SKIN_COMPONENT_TYPES.has(type) ? undefined : `a ${type} component token`;
  const allowed = SKIN_GROUPS.some((group) => group.every((part, i) => path[i] === part));
  return allowed ? undefined : 'outside the skin groups';
}

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
