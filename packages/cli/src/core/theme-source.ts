/** The theme generator, where a theme is designed and encoded in a URL. */
export const THEME_GENERATOR_URL = 'https://shironex.github.io/rectio/docs/theming/generator';

/** A theme the registry ships (`default`), or one encoded in a generator URL. */
export type ThemeSource = { kind: 'registry'; id: string } | { kind: 'url'; url: string };

export type ThemeSourceResult = { ok: true; source: ThemeSource } | { ok: false; message: string };

const looksLikeUrl = (input: string) => /^[a-z][a-z0-9+.-]*:\/\//i.test(input);

/**
 * What the theme answer of `rectio init` means. The one seam for theme URLs: a URL from the
 * generator becomes `{ kind: 'url' }` once `rectio add <theme-url>` can decode it, and init then
 * hands the URL to add after the setup. Until then a URL is refused at the prompt with a message,
 * so nothing is written for a theme that cannot be installed.
 */
export function resolveThemeSource(input: string): ThemeSourceResult {
  const value = input.trim();
  if (value === '') return { ok: false, message: 'paste a theme URL from the generator' };
  if (!looksLikeUrl(value)) return { ok: true, source: { kind: 'registry', id: value } };
  return {
    ok: false,
    message: 'theme URLs need a newer @rectio/cli; choose default for now',
  };
}
