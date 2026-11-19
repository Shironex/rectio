import { useLayoutEffect, useRef, type RefObject } from 'react';

import { springTo, type Controls } from './animate';
import { readMotionTokens } from './tokens';

/**
 * One highlight for a whole list (the Select options, a menu's rows) that glides to the row under the pointer, on the press
 * spring: the eye follows where the highlight went instead of finding it again. Arrow keys move it
 * at once, never a glide: keyboard navigation repeats too often to wait for motion. It appears in
 * place when the list opens or the pointer comes back. Only its transform moves; its height is set
 * outright, so no frame lays the list out again.
 */
export function useGlidingHighlight(
  popup: RefObject<HTMLElement | null>,
  open: boolean,
  slot: string,
) {
  const highlight = useRef<HTMLSpanElement | null>(null);

  useLayoutEffect(() => {
    const list = popup.current;
    const mark = highlight.current;
    if (!open || list === null || mark === null) return;
    let shown = false;
    let fromKeyboard = false;
    let glide: Controls | null = null;
    let hiding = 0;

    const follow = () => {
      const item = list.querySelector<HTMLElement>(`[data-slot="${slot}"][data-highlighted]`);
      const tokens = readMotionTokens(list);
      // Where the highlight is now, mid glide if the pointer moved on quickly: read before
      // stopping it, so the next glide starts from there instead of hopping to the last target.
      const from = getComputedStyle(mark).transform;
      glide?.stop();
      cancelAnimationFrame(hiding);
      if (item === null || tokens === null) {
        // The pointer crossing from one option to the next clears the highlight a moment before
        // the next option takes it: hide only if nothing is highlighted a frame later, so the
        // highlight glides across instead of reappearing.
        hiding = requestAnimationFrame(() => {
          mark.style.opacity = '0';
          shown = false;
        });
        return;
      }
      const to = `translateY(${String(item.offsetTop)}px)`;
      // A row may ask for its own tint, such as a destructive action.
      if (item.dataset.tone === undefined) delete mark.dataset.tone;
      else mark.dataset.tone = item.dataset.tone;
      Object.assign(mark.style, {
        transform: to,
        height: `${String(item.offsetHeight)}px`,
        opacity: '1',
      });
      if (shown && !fromKeyboard) {
        glide = springTo(mark, { transform: [from, to] }, tokens.spring.press);
      }
      shown = true;
    };

    // Captured on the document: the key reaches the list before Base UI moves the highlight.
    const onKey = () => {
      fromKeyboard = true;
    };
    const onPointer = () => {
      fromKeyboard = false;
    };
    follow();
    const observer = new MutationObserver(follow);
    observer.observe(list, {
      subtree: true,
      attributes: true,
      attributeFilter: ['data-highlighted'],
    });
    document.addEventListener('keydown', onKey, true);
    list.addEventListener('pointermove', onPointer);
    return () => {
      observer.disconnect();
      document.removeEventListener('keydown', onKey, true);
      list.removeEventListener('pointermove', onPointer);
      glide?.stop();
      cancelAnimationFrame(hiding);
      mark.style.opacity = '0';
    };
  }, [popup, open, slot]);

  return highlight;
}
