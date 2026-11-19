/**
 * Heading ids, the same way the docs blocks make them, for the build-time code: the table of
 * contents, the search index and the anchors must agree. Server code cannot import the blocks
 * package (it holds client components), so these few lines live here too.
 */
export function slugify(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** A second "Options" on a page becomes "options-1". */
export function uniqueSlugs(texts: readonly string[]): string[] {
  const seen = new Map<string, number>();
  return texts.map((text) => {
    const base = slugify(text) || 'section';
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return count === 0 ? base : `${base}-${String(count)}`;
  });
}
