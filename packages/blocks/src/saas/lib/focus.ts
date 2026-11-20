import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';

/**
 * The moment relative times are read from: your `now` when you pass one, otherwise the time the
 * block first rendered, held still so memoised work keeps. Pass `now` from your app when you
 * render on the server (so both renders agree) or want times that tick.
 */
export function useNow(now?: Date): Date {
  const [mounted] = useState(() => new Date());
  return now ?? mounted;
}

/**
 * After a refused submit, moves focus to the first field marked invalid inside `root`, on the
 * next frame so the error state has rendered. Keyboard and screen reader users land on what to fix.
 */
export function focusFirstInvalid(root: HTMLElement | null): void {
  requestAnimationFrame(() => {
    root?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  });
}

/**
 * Remembers the element that had focus when a panel opened (an inline form, a composer, a bulk
 * bar) and hands focus back to it when the panel closes, instead of dropping it on the page.
 * Call `remember()` as the panel opens and `restore()` as it closes. When the opener itself was
 * unmounted meanwhile, `restore(fallback)` focuses what `fallback` finds after the re-render.
 */
export function useReturnFocus(): {
  remember: () => void;
  restore: (fallback?: () => HTMLElement | null | undefined) => void;
  ref: RefObject<HTMLElement | null>;
} {
  const ref = useRef<HTMLElement | null>(null);
  const remember = useCallback(() => {
    ref.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  }, []);
  const restore = useCallback((fallback?: () => HTMLElement | null | undefined) => {
    const target = ref.current;
    requestAnimationFrame(() => {
      if (target?.isConnected === true) target.focus();
      else fallback?.()?.focus();
    });
  }, []);
  return { remember, restore, ref };
}

/** What a row offers to keyboard focus, when it does not mark one with `data-row-focus`. */
const ROW_FOCUSABLE =
  'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Laid out on screen: a control in a column folded away at this width does not count. */
const shown = (element: HTMLElement) => element.getClientRects().length > 0;

/** The control a row offers to focus: a shown `data-row-focus` one first, else its first control. */
function rowTarget(row: HTMLElement): HTMLElement | null {
  const marked = [...row.querySelectorAll<HTMLElement>('[data-row-focus]')];
  const controls = [...row.querySelectorAll<HTMLElement>(ROW_FOCUSABLE)];
  // Without layout (a test DOM) nothing reads as shown, so the first one stands.
  return marked.find(shown) ?? controls.find(shown) ?? marked[0] ?? controls[0] ?? null;
}

/**
 * Where focus lands when nothing is left to land on: the empty state's first action, otherwise
 * the block's heading, so a keyboard or screen reader user stays in the block.
 */
export function blockLanding(block: HTMLElement | null): HTMLElement | null {
  return (
    block?.querySelector<HTMLElement>('[data-slot="empty-state"] button:not([disabled])') ??
    block?.querySelector<HTMLElement>('h2, h3') ??
    null
  );
}

export interface RemovalFocus {
  /** Call just before asking your app to remove these rows. */
  prepare: (removed: readonly string[]) => void;
  /**
   * For a confirm dialog's `finalFocus`: the row or heading focus should land on once the removed
   * rows are gone, or `true` (back to the opener) while they are still there.
   */
  landing: () => HTMLElement | true;
}

interface PendingRemoval {
  removed: Set<string>;
  candidates: (string | undefined)[];
  /** The block around the list, which outlives a list that empties and unmounts. */
  block: HTMLElement | null;
}

/**
 * Keeps focus in the list when rows are removed: once the rows are gone from `ids` (your app may
 * take a moment), focus moves to the next row, else the previous one, else `fallback` (by default
 * the empty state's action or the block heading). Never lost to the page. Rows carry
 * `data-row-id`; inside a row the shown element marked `data-row-focus` takes focus, else its
 * first control.
 */
export function useRemovalFocus(
  root: RefObject<HTMLElement | null>,
  ids: readonly string[],
  fallback: (block: HTMLElement | null) => HTMLElement | null | undefined = blockLanding,
): RemovalFocus {
  const pending = useRef<PendingRemoval | null>(null);
  // The removal that last completed, for a dialog that closes after the list changed.
  const landed = useRef<PendingRemoval | null>(null);
  const order = useRef(ids);
  const fallbackRef = useRef(fallback);
  useLayoutEffect(() => {
    order.current = ids;
    fallbackRef.current = fallback;
  });
  const key = ids.join('\u0000');

  const gone = (wanted: PendingRemoval) => !order.current.some((id) => wanted.removed.has(id));
  const resolve = useCallback((wanted: PendingRemoval): HTMLElement | null => {
    for (const id of wanted.candidates) {
      if (id === undefined) continue;
      const row = wanted.block?.querySelector<HTMLElement>(`[data-row-id="${CSS.escape(id)}"]`);
      const target = row === null || row === undefined ? null : rowTarget(row);
      if (target !== null) return target;
    }
    const landing = fallbackRef.current(wanted.block) ?? null;
    if (landing !== null && landing.tabIndex < 0 && !landing.hasAttribute('tabindex')) {
      landing.tabIndex = -1;
    }
    return landing;
  }, []);

  useEffect(() => {
    const wanted = pending.current;
    if (wanted === null || !gone(wanted)) return;
    pending.current = null;
    // On the next frame, once the list has settled; a closing dialog asks `landing` instead.
    const frame = requestAnimationFrame(() => {
      resolve(wanted)?.focus();
    });
    landed.current = wanted;
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [key, resolve]);
  const prepare = useCallback(
    (removed: readonly string[]) => {
      const set = new Set(removed);
      const list = order.current;
      const indices = list.flatMap((id, index) => (set.has(id) ? [index] : []));
      if (indices.length === 0) return;
      const first = Math.min(...indices);
      const last = Math.max(...indices);
      landed.current = null;
      pending.current = {
        block: root.current?.closest<HTMLElement>('[data-slot="block"]') ?? root.current,
        removed: set,
        candidates: [
          list.slice(last + 1).find((id) => !set.has(id)),
          list
            .slice(0, first)
            .reverse()
            .find((id) => !set.has(id)),
        ],
      };
    },
    [root],
  );

  const landing = useCallback((): HTMLElement | true => {
    const wanted = landed.current ?? pending.current;
    if (wanted === null || !gone(wanted)) return true;
    landed.current = null;
    return resolve(wanted) ?? true;
  }, [resolve]);

  return { prepare, landing };
}
