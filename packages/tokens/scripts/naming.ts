/** Token names: DTCG paths to CSS custom properties and Tailwind utility names. */

/** Shipped themes. A theme is a folder in src/themes; more can be added beside default. */
export const THEMES: readonly string[] = ['default'];
export const MODES = ['light', 'dark'] as const;
export type Theme = string;
export type Mode = (typeof MODES)[number];

/**
 * Shipped skins. A skin is a file in src/skins: token overrides applied with `data-skin="<id>"` on
 * any element, on top of whichever theme, mode and density are in force there. A skin may add a
 * translucent layer in src/skins/<id>.translucent.json, applied only where the browser can blur the
 * backdrop and the person has not asked for reduced transparency; without it the skin is solid.
 */
export const SKINS: readonly string[] = ['dense', 'editorial', 'glass', 'brutalist'];

/** `data-skin="none"` turns an outer skin off for a subtree, so no skin may take the id. */
export const NO_SKIN = 'none';

/**
 * The canvas wash at full strength (`--rx-surface-wash: 1`): which tint each top corner glows with
 * and how much of it the canvas takes there, in percent. The tints are the theme's own subtle fills,
 * close to the canvas in lightness, so whatever sits on the canvas keeps its contrast; the
 * `canvas-wash` utility fades them to nothing across the page.
 */
export const WASH = { 'accent-subtle': 100, 'info-subtle': 90 } as const;

/** The suffix of a skin's translucent layer: `glass.translucent.json`. */
export const TRANSLUCENT = 'translucent';

/**
 * The skin contract: the token groups a skin may override. Type, corners, border width and weight,
 * rhythm and control sizes, the surface and shadow switches, plus non-colour component tokens.
 * Colour belongs to the theme and its modes, and motion to them and to reduced motion, so a skin
 * composes with any theme, light or dark, and never changes a contrast pair: the switches only turn
 * on what every theme defines in each of its modes (the edge highlight, the offset shadow colour,
 * the backdrop blur), and they are plain numbers and lengths, the same in light and dark. A skin may
 * clear the theme's soft shadows, never draw one of its own. A skin may set any subset of these; it
 * never adds a token, and it never sets a touch height. Layout measures such as the alert dialog
 * width, the sheet measure and the tree indent are component dimensions, so a skin may set them.
 */
export const SKIN_GROUPS: readonly (readonly string[])[] = [
  ['font', 'size'],
  ['font', 'line-height'],
  ['font', 'weight'],
  ['font', 'tracking'],
  ['font', 'family'],
  ['radius'],
  ['border', 'width'],
  ['border', 'ink'],
  ['space'],
  ['control'],
  ['surface', 'blur'],
  ['surface', 'wash'],
  ['shadow', 'highlight'],
  ['shadow', 'offset', 'raised'],
  ['shadow', 'offset', 'overlay'],
  ['shadow', 'raised'],
  ['shadow', 'overlay'],
];

/** What a translucent layer may set: how see-through floating surfaces are, and their backdrop. */
export const TRANSLUCENT_GROUPS: readonly (readonly string[])[] = [
  ['surface', 'opacity'],
  ['surface', 'backdrop'],
  ['surface', 'blur'],
];

const SKIN_COMPONENT_TYPES = new Set(['dimension', 'fontWeight', 'fontFamily', 'number', 'other']);

/** A shadow with no visible layer: every colour in it is fully transparent. */
export function isClearShadow(value: string): boolean {
  const colors = [...value.matchAll(/oklch\([^)]*\)|transparent/g)].map((m) => m[0]);
  return colors.length > 0 && colors.every((c) => c === 'transparent' || c.endsWith('/ 0)'));
}

const inGroups = (groups: readonly (readonly string[])[], path: readonly string[]) =>
  groups.some((group) => group.every((part, i) => path[i] === part));

/**
 * Why a token may not be in a skin, or undefined when the skin contract allows it. `value` is the
 * token's CSS value, which decides whether a shadow is cleared or drawn.
 */
export function skinViolation(
  path: readonly string[],
  type: string,
  value = '',
  layer: 'solid' | 'translucent' = 'solid',
): string | undefined {
  // Touch heights hold the 44px target on coarse pointers in every skin: `control.height.touch`,
  // `button.height.touch`, `tree.row-height-touch` and any later one named the same way.
  if (path.some((part) => part === 'touch' || part.endsWith('-touch'))) return 'a touch target';
  if (layer === 'translucent')
    return inGroups(TRANSLUCENT_GROUPS, path) ? undefined : 'outside the translucent layer';
  if (path[0] === 'component')
    return SKIN_COMPONENT_TYPES.has(type) ? undefined : `a ${type} component token`;
  if (!inGroups(SKIN_GROUPS, path)) return 'outside the skin groups';
  if (type === 'shadow' && !isClearShadow(value)) return 'a shadow drawn by the skin, not cleared';
  return undefined;
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
