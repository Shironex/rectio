/**
 * Writes a generated theme as CSS in exactly the shape the kit ships: the default theme file
 * (`styles/rectio/themes/default.css`, as `rectio init` writes it) is the template, its values
 * swapped for the generated ones and its theme id for the new one. Same blocks, same order, same
 * token list, so the file pastes over a theme or installs beside one, and `rectio diff` reads it.
 */
import type { Mode } from '../scripts/derive-core.ts';
import { encodeTheme } from './code.ts';
import { FONTS, fontById, radiusById, type ThemeInputs } from './inputs.ts';
import type { ResolvedTheme, ShippedColors } from './resolve.ts';

const DECLARATION = /^(\s*)(--rx-[a-z0-9-]+): (.+);$/;
const THEME_ATTR = /\[data-theme="[^"]+"\]/g;
const IMPORT = /^@import '[^']+';$/;
/** Marks a template line to drop. */
const DROP = '/* rectio:drop */';
/** The id the template is written for. */
const TEMPLATE_ID = 'default';

/** Which mode a declaration belongs to, from the blocks around it. */
function modeOf(preludes: readonly string[]): Mode {
  return preludes.some(
    (p) => p.includes('data-mode="dark"') || p.includes('prefers-color-scheme: dark'),
  )
    ? 'dark'
    : 'light';
}

/** Walks the template's declarations with the mode each sits in. */
function walk(
  template: string,
  visit: (
    line: string,
    ctx: { mode: Mode; name?: string; indent?: string; value?: string; closing?: boolean },
  ) => string,
): string {
  const preludes: string[] = [];
  return template
    .split('\n')
    .map((line) => {
      const trimmed = line.trim();
      if (trimmed.endsWith('{')) {
        // A selector list can span lines: the block's prelude is everything since the last block.
        preludes.push(trimmed);
        return visit(line, { mode: modeOf(preludes) });
      }
      if (trimmed === '}') {
        const mode = modeOf(preludes);
        preludes.pop();
        return visit(line, { mode, closing: true });
      }
      const m = DECLARATION.exec(line);
      if (m === null) return visit(line, { mode: modeOf([...preludes, trimmed]) });
      const [, indent = '', name = '', value = ''] = m;
      return visit(line, { mode: modeOf(preludes), name, indent, value });
    })
    .join('\n');
}

/** The shipped colour values of the template, per mode (every `oklch()` declaration). */
export function templateColors(template: string): ShippedColors {
  const out: ShippedColors = { light: {}, dark: {} };
  // The dark mode block and the system-dark media block hold the same values; the first wins.
  walk(template, (line, { mode, name, value }) => {
    if (name !== undefined && value?.startsWith('oklch(') === true && out[mode][name] === undefined)
      out[mode][name] = value;
    return line;
  });
  // A colour the dark blocks leave out inherits its light value.
  for (const [name, value] of Object.entries(out.light)) out.dark[name] ??= value;
  return out;
}

/** The ids of every font the theme uses, in catalogue order: the order of its imports. */
export function usedFonts(inputs: ThemeInputs) {
  const ids = new Set(Object.values(inputs.fonts));
  return FONTS.filter((f) => ids.has(f.id));
}

/** npm packages the theme's font imports need, with ranges. */
export function fontDependencies(inputs: ThemeInputs): Record<string, string> {
  return Object.fromEntries(
    usedFonts(inputs).flatMap((f) => (f.pkg === undefined ? [] : [[f.pkg.name, f.pkg.range]])),
  );
}

/** A shadow's colour follows the neutral hue, as the derivation's dark proposals do. */
function tintShadow(value: string, hue: number): string {
  return value.replace(
    /oklch\(([\d.]+%) ([\d.]+) [\d.]+( \/ [\d.]+)?\)/g,
    (_m, l: string, c: string, a = '') =>
      `oklch(${l} ${c} ${String(Math.round(hue * 100) / 100)}${a})`,
  );
}

function valueFor(
  inputs: ThemeInputs,
  resolved: ResolvedTheme,
  compact: Record<string, string>,
  mode: Mode,
  name: string,
  value: string,
): string {
  const colour = resolved[mode].tokens[name];
  if (colour !== undefined) return colour;
  if (name.startsWith('--rx-shadow-'))
    return inputs.base === 'default' ? value : tintShadow(value, inputs.color.neutral.hue);
  if (mode === 'dark') return value;
  const radius = radiusById(inputs.radius);
  const fixed: Record<string, string> = {
    '--rx-radius-control': radius.control,
    '--rx-radius-panel': radius.panel,
    '--rx-radius-badge': radius.badge,
    '--rx-font-family-sans': fontById(inputs.fonts.sans).stack,
    '--rx-font-family-display': fontById(inputs.fonts.display).stack,
    '--rx-font-family-mono': fontById(inputs.fonts.mono).stack,
    '--rx-font-family-numeric': fontById(inputs.fonts.numeric).stack,
    ...(inputs.density === 'compact' ? compact : {}),
  };
  return fixed[name] ?? value;
}

export interface CssOptions {
  /** Leave out the `@import` lines and the `:root` selectors: the page's scoped live preview. */
  scoped?: boolean;
  /** The data-theme id to write; defaults to the theme's name. */
  id?: string;
}

/** The theme as CSS, from the shipped default theme file as template. */
export function renderThemeCss(
  template: string,
  inputs: ThemeInputs,
  resolved: ResolvedTheme,
  compact: Record<string, string>,
  options: CssOptions = {},
): string {
  const id = options.id ?? inputs.name;
  const imports = usedFonts(inputs).flatMap((f) => f.imports.map((path) => `@import '${path}';`));
  let importsWritten = false;
  const code = encodeTheme(inputs);
  // Declarations of the block being walked, so a dark block can gain the colours it leaves out.
  let block = new Map<string, string>();
  const out = walk(template, (line, { mode, name, indent, value, closing }) => {
    if (name !== undefined && value !== undefined) {
      block.set(name, indent ?? '');
      return `${indent ?? ''}${name}: ${valueFor(inputs, resolved, compact, mode, name, value)};`;
    }
    if (closing === true) {
      const extra = mode === 'dark' && block.size > 0 ? missingDark(resolved, block) : [];
      block = new Map();
      return [...extra, line].join('\n');
    }
    if (line.trim().endsWith('{')) block = new Map();
    if (line.startsWith('/* rectio theme '))
      return options.scoped === true
        ? ''
        : `/* rectio theme "${id}". Made with the rectio theme generator; theme code ${code}. Fonts: SIL Open Font License 1.1. */`;
    if (IMPORT.test(line)) {
      if (importsWritten || options.scoped === true) return DROP;
      importsWritten = true;
      return imports.length === 0 ? DROP : imports.join('\n');
    }
    return line.replace(THEME_ATTR, (attr) =>
      attr === `[data-theme="${TEMPLATE_ID}"]` ? `[data-theme="${id}"]` : attr,
    );
  });
  // Dropped import lines, and their blank line when no font needs an import.
  let css = out
    .split(`${DROP}\n`)
    .join('')
    .replace(/\n\n\n+/g, '\n\n');
  if (options.scoped === true) css = scopeSelectors(css);
  return `${css.trim()}\n`;
}

/**
 * Dark colours the template's dark block leaves out (it inherits them from light), written when the
 * generated dark value differs from the light one.
 */
function missingDark(resolved: ResolvedTheme, block: Map<string, string>): string[] {
  const indent = [...block.values()][0] ?? '  ';
  return Object.entries(resolved.dark.tokens)
    .filter(([name, value]) => !block.has(name) && resolved.light.tokens[name] !== value)
    .map(([name, value]) => `${indent}${name}: ${value};`);
}

/** Drops `:root...` entries from every selector list, so the CSS only reaches the preview. */
function scopeSelectors(css: string): string {
  return css.replace(/^(\s*):root[^,{\n]*,\n/gm, '');
}
