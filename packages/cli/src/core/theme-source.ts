import { isThemeReference } from '@rectio/tokens/generator';

import { CliError } from './context.ts';
import { readThemeLink } from './theme-link.ts';

/** The theme generator, where a theme is designed and encoded in a URL. */
export const THEME_GENERATOR_URL = 'https://shironex.github.io/rectio/docs/theming/generator';

/** A theme the registry ships (`default`), or one encoded in a generator URL. */
export type ThemeSource = { kind: 'registry'; id: string } | { kind: 'url'; url: string };

export type ThemeSourceResult = { ok: true; source: ThemeSource } | { ok: false; message: string };

/**
 * What the theme answer of `rectio init` means. The one seam for theme URLs: a link from the
 * generator (or the bare theme code in it) becomes `{ kind: 'url' }` once its code reads, and init
 * hands it to `rectio add` after the setup. A link whose code does not read is refused here, so
 * nothing is written for a theme that cannot be installed.
 */
export function resolveThemeSource(input: string): ThemeSourceResult {
  const value = input.trim();
  if (value === '') return { ok: false, message: 'paste a theme URL from the generator' };
  if (!isThemeReference(value)) return { ok: true, source: { kind: 'registry', id: value } };
  try {
    readThemeLink(value);
  } catch (error) {
    if (error instanceof CliError) return { ok: false, message: error.message };
    throw error;
  }
  return { ok: true, source: { kind: 'url', url: value } };
}

/** `--theme <id or link>`: the same seam as the prompt, failing as a usage error. */
export function themeFromFlag(input: string): ThemeSource {
  const result = resolveThemeSource(input);
  if (!result.ok) throw new CliError(result.message);
  return result.source;
}

/** The theme as the recap names it: the registry id, or the generated theme's name. */
export function themeLabel(source: ThemeSource): string {
  return source.kind === 'registry'
    ? `${source.id} theme`
    : `${readThemeLink(source.url).name} theme from a link`;
}
