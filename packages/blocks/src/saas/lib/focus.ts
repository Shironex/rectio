import { useCallback, useRef, useState, type RefObject } from 'react';

/**
 * The moment relative times are read from: your `now` when you pass one, otherwise the time the
 * block first rendered, held still so a server and client render agree and memoised work keeps.
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
 * Call `remember()` as the panel opens and `restore()` as it closes.
 */
export function useReturnFocus(): {
  remember: () => void;
  restore: () => void;
  ref: RefObject<HTMLElement | null>;
} {
  const ref = useRef<HTMLElement | null>(null);
  const remember = useCallback(() => {
    ref.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  }, []);
  const restore = useCallback(() => {
    const target = ref.current;
    requestAnimationFrame(() => {
      if (target?.isConnected === true) target.focus();
    });
  }, []);
  return { remember, restore, ref };
}
