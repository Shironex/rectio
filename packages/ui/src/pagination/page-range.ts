/** Which pages a pagination bar draws. A plain function, so a server can run it too. */

/** A page number, or a gap standing for the pages between its neighbours. */
export type PageRangeItem = number | 'gap-start' | 'gap-end';

/**
 * The pages to draw: always the first and last, the current one with `siblings` on each side, and
 * a gap where pages are skipped. The length stays the same as the current page moves, so the
 * buttons never jump under the pointer. A gap never stands for a single page: that page is shown.
 */
export function paginationRange(page: number, pageCount: number, siblings = 1): PageRangeItem[] {
  const count = Math.max(1, Math.floor(pageCount));
  const current = Math.min(Math.max(1, Math.floor(page)), count);
  const slots = siblings * 2 + 5;
  if (count <= slots) return Array.from({ length: count }, (_, i) => i + 1);
  const range = (from: number, to: number) =>
    Array.from({ length: to - from + 1 }, (_, i) => from + i);
  const left = Math.max(current - siblings, 1);
  const right = Math.min(current + siblings, count);
  const showStartGap = left > 3;
  const showEndGap = right < count - 2;
  const edge = siblings * 2 + 3;
  if (!showStartGap) return [...range(1, edge), 'gap-end', count];
  if (!showEndGap) return [1, 'gap-start', ...range(count - edge + 1, count)];
  return [1, 'gap-start', ...range(left, right), 'gap-end', count];
}
