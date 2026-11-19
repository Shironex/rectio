/**
 * Docs search: the result shape every provider returns, a small local provider over an index built
 * at build time, match ranges for highlighting and the recent searches list. Bring your own
 * provider (Algolia, Orama, Pagefind, a server route) by returning `DocsSearchResult`s.
 */

export interface DocsSearchResult {
  /** Unique across the results. */
  id: string;
  title: string;
  href: string;
  /** The group the result is listed under, such as the page's section. */
  group?: string | undefined;
  /** Text around the match, shown under the title. */
  excerpt?: string | undefined;
  /** A heading within a page, shown with the page it belongs to. */
  page?: string | undefined;
}

/**
 * Returns results for a query. Called as the reader types (debounced); the signal aborts when a
 * newer query replaces this one, so a slow provider never shows stale results.
 */
export type DocsSearchProvider = (
  query: string,
  signal: AbortSignal,
) => Promise<readonly DocsSearchResult[]> | readonly DocsSearchResult[];

/** A page in the local search index. */
export interface DocsSearchDocument {
  id: string;
  title: string;
  href: string;
  group?: string | undefined;
  description?: string | undefined;
  headings?: readonly { id: string; title: string }[] | undefined;
  /** The page's text without markup. */
  content: string;
}

/** Query words, lowercased and folded, without duplicates. */
export function queryTerms(query: string): string[] {
  return [
    ...new Set(
      fold(query)
        .split(/[^\p{L}\p{N}_@./-]+/u)
        .filter((term) => term.length > 0),
    ),
  ];
}

function fold(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

/**
 * Where the query's words appear in a text, as [start, end) ranges sorted and merged, for marking
 * them. Matching ignores case and accents.
 */
export function matchRanges(text: string, query: string): [number, number][] {
  const terms = queryTerms(query);
  if (terms.length === 0) return [];
  const folded = fold(text);
  // Folding can change the length of some scripts; then no ranges rather than wrong ones.
  if (folded.length !== text.length) return [];
  const ranges: [number, number][] = [];
  for (const term of terms) {
    let from = folded.indexOf(term);
    while (from !== -1) {
      ranges.push([from, from + term.length]);
      from = folded.indexOf(term, from + term.length);
    }
  }
  ranges.sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const range of ranges) {
    const last = merged.at(-1);
    if (last !== undefined && range[0] <= last[1]) last[1] = Math.max(last[1], range[1]);
    else merged.push([range[0], range[1]]);
  }
  return merged;
}

/** A window of text around the first match, trimmed to whole words. */
export function excerptAround(text: string, query: string, size = 140): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  const first = matchRanges(clean, query)[0];
  if (first === undefined || clean.length <= size) return clean.slice(0, size);
  const start = Math.max(0, first[0] - Math.floor(size / 3));
  const end = Math.min(clean.length, start + size);
  let slice = clean.slice(start, end);
  if (start > 0) slice = `…${slice.replace(/^\S*\s/, '')}`;
  if (end < clean.length) slice = `${slice.replace(/\s\S*$/, '')}…`;
  return slice;
}

/**
 * A provider over an index you build at build time, for a small or medium docs site (a few
 * hundred pages). Every word must appear; a title match ranks above a heading match, which ranks
 * above body text. Headings are results of their own, so a search lands on the right section.
 */
export function createLocalSearch(
  documents: readonly DocsSearchDocument[],
  { limit = 12 }: { limit?: number } = {},
): DocsSearchProvider {
  const prepared = documents.map((doc) => ({
    doc,
    title: fold(doc.title),
    description: fold(doc.description ?? ''),
    content: fold(doc.content),
    headings: (doc.headings ?? []).map((heading) => ({ ...heading, folded: fold(heading.title) })),
  }));
  return (query) => {
    const terms = queryTerms(query);
    if (terms.length === 0) return [];
    const scored: { result: DocsSearchResult; score: number }[] = [];
    for (const entry of prepared) {
      const all = `${entry.title} ${entry.description} ${entry.content}`;
      if (
        !terms.every(
          (term) => all.includes(term) || entry.headings.some((h) => h.folded.includes(term)),
        )
      ) {
        continue;
      }
      let score = 0;
      for (const term of terms) {
        if (entry.title.startsWith(term)) score += 12;
        else if (entry.title.includes(term)) score += 8;
        if (entry.description.includes(term)) score += 3;
        if (entry.content.includes(term)) score += 1;
      }
      scored.push({
        score,
        result: {
          id: entry.doc.id,
          title: entry.doc.title,
          href: entry.doc.href,
          group: entry.doc.group,
          excerpt: excerptAround(
            entry.description.includes(terms[0] ?? '')
              ? (entry.doc.description ?? '')
              : entry.doc.content,
            query,
          ),
        },
      });
      for (const heading of entry.headings) {
        if (!terms.every((term) => heading.folded.includes(term))) continue;
        // A page whose title matches stays above its own sections; otherwise the section wins.
        const titleMatch = terms.every((term) => entry.title.includes(term));
        scored.push({
          score: titleMatch ? score - 0.5 : score + 6,
          result: {
            id: `${entry.doc.id}#${heading.id}`,
            title: heading.title,
            href: `${entry.doc.href}#${heading.id}`,
            group: entry.doc.group,
            page: entry.doc.title,
          },
        });
      }
    }
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((entry) => entry.result);
  };
}

/** Results in display groups, keeping the order of the first result of each group. */
export function groupResults(
  results: readonly DocsSearchResult[],
  fallback = 'Results',
): { label: string; items: DocsSearchResult[] }[] {
  const groups = new Map<string, DocsSearchResult[]>();
  for (const result of results) {
    const label = result.group ?? fallback;
    const list = groups.get(label);
    if (list === undefined) groups.set(label, [result]);
    else list.push(result);
  }
  return [...groups].map(([label, items]) => ({ label, items }));
}

/** The recent searches list: the newest first, no duplicates, at most `max` entries. */
export function pushRecent(
  list: readonly DocsSearchResult[],
  result: DocsSearchResult,
  max = 5,
): DocsSearchResult[] {
  // Excerpts belong to the query that found them, not to the recent list.
  const kept: DocsSearchResult = { ...result };
  delete kept.excerpt;
  return [kept, ...list.filter((entry) => entry.href !== result.href)].slice(0, max);
}

export function readRecent(key: string | undefined): DocsSearchResult[] {
  if (key === undefined) return [];
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(key) ?? '[]');
    return Array.isArray(parsed)
      ? parsed.filter(
          (entry): entry is DocsSearchResult =>
            typeof entry === 'object' &&
            entry !== null &&
            typeof (entry as DocsSearchResult).href === 'string' &&
            typeof (entry as DocsSearchResult).title === 'string' &&
            typeof (entry as DocsSearchResult).id === 'string',
        )
      : [];
  } catch {
    return [];
  }
}

export function writeRecent(key: string | undefined, list: readonly DocsSearchResult[]): void {
  if (key === undefined) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(list));
  } catch {
    // Storage refused: recent searches last for this visit only.
  }
}
