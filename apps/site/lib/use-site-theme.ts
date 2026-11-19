'use client';

import { useSyncExternalStore } from 'react';

import { MODES, THEMES, THEME_STORAGE_KEY, type Mode, type ThemeId } from './site';

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme', 'data-mode'],
  });
  return () => {
    observer.disconnect();
  };
}

const read = () => {
  const { theme, mode } = document.documentElement.dataset;
  return `${theme ?? 'default'}:${mode ?? 'light'}`;
};

/** The theme and mode the site shows right now, kept in step with the attributes on <html>. */
export function useSiteTheme(): { theme: ThemeId; mode: Mode } {
  const [theme, mode] = useSyncExternalStore(subscribe, read, () => 'default:light').split(':');
  return {
    theme: THEMES.find((t) => t.id === theme)?.id ?? 'default',
    mode: MODES.find((m) => m === mode) ?? 'light',
  };
}

const prefersReducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Runs `apply` (a change of theme or mode attributes) as a view transition. Where the browser has
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

function rememberTheme(theme: ThemeId) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Private windows may refuse storage; the switch still works for this visit.
  }
}

/** Switches the whole site to a theme, keeping the visitor's light or dark mode. */
export function setSiteTheme(theme: ThemeId, origin?: { x: number; y: number }) {
  const root = document.documentElement;
  if (root.dataset.theme === theme) return;
  rememberTheme(theme);
  morph(() => {
    root.dataset.theme = theme;
  }, origin);
}

/**
 * Switches theme and mode together: a look. `setMode` persists the mode through the site's theme
 * provider; the attributes are also set here, inside the transition, so the circle opens on the
 * finished look rather than on a half-applied one.
 */
export function setSiteLook(
  look: { theme: ThemeId; mode: Mode },
  setMode: (mode: Mode) => void,
  origin?: { x: number; y: number },
) {
  const root = document.documentElement;
  if (root.dataset.theme === look.theme && root.dataset.mode === look.mode) return;
  rememberTheme(look.theme);
  morph(() => {
    root.dataset.theme = look.theme;
    root.dataset.mode = look.mode;
    root.classList.toggle('dark', look.mode === 'dark');
    root.classList.toggle('light', look.mode === 'light');
    root.style.colorScheme = look.mode;
    setMode(look.mode);
  }, origin);
}
