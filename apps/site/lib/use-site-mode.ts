'use client';

import { useSyncExternalStore } from 'react';

import { MODES, type Mode } from './site';

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-mode'],
  });
  return () => {
    observer.disconnect();
  };
}

const read = () => document.documentElement.dataset.mode ?? 'light';

/** The mode the site shows right now, kept in step with `data-mode` on <html>. */
export function useSiteMode(): Mode {
  const mode = useSyncExternalStore(subscribe, read, () => 'light');
  return MODES.find((m) => m === mode) ?? 'light';
}

const prefersReducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Runs `apply` (a change of the mode attributes) as a view transition. Where the browser has
 * them, the new look opens as a circle from `origin` (the control that was pressed); with reduced
 * motion it crossfades. Without an origin, as from the keyboard, or without view transitions, it
 * switches at once.
 */
function morph(apply: () => void, origin?: { x: number; y: number }) {
  const root = document.documentElement;
  // Keyboard changes (no origin) switch at once: an animation on every arrow press would be noise.
  if (typeof document.startViewTransition !== 'function' || origin === undefined) {
    apply();
    return;
  }
  const reduced = prefersReducedMotion();
  root.dataset.morph = reduced ? 'fade' : 'circle';
  if (!reduced) {
    const radius = Math.hypot(
      Math.max(origin.x, innerWidth - origin.x),
      Math.max(origin.y, innerHeight - origin.y),
    );
    root.style.setProperty('--site-morph-x', `${String(origin.x)}px`);
    root.style.setProperty('--site-morph-y', `${String(origin.y)}px`);
    root.style.setProperty('--site-morph-r', `${String(radius)}px`);
  }
  const transition = document.startViewTransition(apply);
  void transition.finished.finally(() => {
    delete root.dataset.morph;
  });
}

/**
 * Switches the site between light and dark. `setMode` persists the mode through the site's theme
 * provider; the attributes are also set here, inside the transition, so the circle opens on the
 * finished mode rather than on a half-applied one.
 */
export function setSiteMode(
  mode: Mode,
  setMode: (mode: Mode) => void,
  origin?: { x: number; y: number },
) {
  const root = document.documentElement;
  if (root.dataset.mode === mode) return;
  morph(() => {
    root.dataset.mode = mode;
    root.classList.toggle('dark', mode === 'dark');
    root.classList.toggle('light', mode === 'light');
    root.style.colorScheme = mode;
    setMode(mode);
  }, origin);
}
