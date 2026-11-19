/**
 * Fuzzy matching for the command menu: the query's characters must appear in order, not
 * necessarily together, so `inv` finds "Invoices" and `nwinv` finds "New invoice". The score
 * prefers matches at word starts and runs of consecutive characters, so the likeliest command
 * comes first. Case and accents are ignored.
 */
export interface FuzzyMatch {
  /** Higher is better. */
  score: number;
  /** Positions in the text that matched, for highlighting. */
  indices: number[];
}

const fold = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

const isBoundary = (text: string, index: number) => {
  if (index === 0) return true;
  const before = text.charAt(index - 1);
  return /[\s\-_/.,:(]/.test(before);
};

/** The best match of `query` in `text`, or null when the characters are not all there in order. */
export function fuzzyMatch(query: string, text: string): FuzzyMatch | null {
  const q = fold(query.trim()).replace(/\s+/g, '');
  if (q === '') return { score: 0, indices: [] };
  const t = fold(text);
  // NFD folding can change length for some scripts; fall back to plain lowercase then.
  const haystack = t.length === text.length ? t : text.toLowerCase();

  // Prefer a contiguous substring at a word start, then anywhere: the strongest signals.
  const direct = haystack.indexOf(q);
  if (direct !== -1) {
    const indices = Array.from({ length: q.length }, (_, i) => direct + i);
    const start = isBoundary(haystack, direct) ? 40 : 20;
    return { score: 100 + start + q.length * 4 - direct * 0.5, indices };
  }

  // An in-order walk that prefers word starts; if that strands a later character, the earliest
  // occurrences instead, which always succeed when any in-order match exists.
  return walk(q, haystack, true) ?? walk(q, haystack, false);
}

function walk(q: string, haystack: string, preferBoundary: boolean): FuzzyMatch | null {
  const indices: number[] = [];
  let score = 0;
  let from = 0;
  for (const char of q) {
    let found = -1;
    for (let i = from; i < haystack.length; i += 1) {
      if (haystack.charAt(i) !== char) continue;
      if (found === -1) found = i;
      if (!preferBoundary || isBoundary(haystack, i)) {
        found = i;
        break;
      }
    }
    if (found === -1) return null;
    const previous = indices.at(-1);
    if (previous !== undefined && found === previous + 1) score += 6;
    if (isBoundary(haystack, found)) score += 8;
    score += 1 - (found - from) * 0.1;
    indices.push(found);
    from = found + 1;
  }
  return { score, indices };
}

/** The best score of `query` across a label and its keywords; matches on the label win ties. */
export function fuzzyScore(
  query: string,
  label: string,
  keywords: readonly string[] = [],
): FuzzyMatch | null {
  const onLabel = fuzzyMatch(query, label);
  let best = onLabel;
  for (const keyword of keywords) {
    const match = fuzzyMatch(query, keyword);
    if (match === null) continue;
    // Keyword hits rank just under label hits and highlight nothing in the label.
    const score = match.score - 5;
    if (best === null || score > best.score) best = { score, indices: [] };
  }
  return best;
}
