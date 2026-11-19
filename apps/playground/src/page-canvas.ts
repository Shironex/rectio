import { useCallback } from 'react';

import type { Mode } from './themes';

/**
 * A ref for a view's ThemeScope that paints the page behind it in the scope's canvas colour and
 * colour scheme, so an overscroll or a page taller than the scope never shows a white band under a
 * dark theme. Only those two values reach the page: the tokens stay inside the scope, so a popup
 * that escaped it would still show up unthemed.
 */
export function usePageCanvas(mode: Mode) {
  return useCallback(
    (scope: HTMLDivElement | null) => {
      if (scope === null) return;
      const root = document.documentElement;
      root.style.backgroundColor = getComputedStyle(scope).backgroundColor;
      root.style.colorScheme = mode;
      return () => {
        root.style.removeProperty('background-color');
        root.style.removeProperty('color-scheme');
      };
    },
    [mode],
  );
}
