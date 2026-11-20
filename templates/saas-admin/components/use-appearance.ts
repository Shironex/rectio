'use client';

import { useSyncExternalStore } from 'react';

import {
  APPEARANCE_STORAGE_KEY,
  MODES,
  THEMES,
  type ModeId,
  type ThemeId,
} from './appearance-script';

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
  return `${theme ?? 'default'}:${mode ?? 'system'}`;
};

export interface Appearance {
  theme: ThemeId;
  mode: ModeId;
}

/** The look the app shows right now, in step with the attributes on <html>. */
export function useAppearance(): Appearance {
  const [theme, mode] = useSyncExternalStore(subscribe, read, () => 'default:system').split(':');
  return {
    theme: THEMES.find((t) => t.value === theme)?.value ?? 'default',
    mode: MODES.find((m) => m.value === mode)?.value ?? 'system',
  };
}

const DARK_QUERY = '(prefers-color-scheme: dark)';

function subscribeToScheme(onChange: () => void) {
  const query = matchMedia(DARK_QUERY);
  query.addEventListener('change', onChange);
  const stopAttributes = subscribe(onChange);
  return () => {
    query.removeEventListener('change', onChange);
    stopAttributes();
  };
}

const readDark = () => {
  const { mode } = document.documentElement.dataset;
  return mode === undefined ? matchMedia(DARK_QUERY).matches : mode === 'dark';
};

/** Whether the app is dark right now: the chosen mode, or the system's when none is chosen. */
export function useDarkMode(): boolean {
  return useSyncExternalStore(subscribeToScheme, readDark, () => false);
}

/** Changes the theme, the mode or both, applies them to <html> and remembers them. */
export function setAppearance(next: Partial<Appearance>) {
  const root = document.documentElement;
  const current = {
    theme: (root.dataset.theme ?? 'default') as ThemeId,
    mode: (root.dataset.mode ?? 'system') as ModeId,
  };
  const look = { ...current, ...next };
  root.dataset.theme = look.theme;
  if (look.mode === 'system') delete root.dataset.mode;
  else root.dataset.mode = look.mode;
  try {
    localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(look));
  } catch {
    // Private windows may refuse storage; the change still holds for this visit.
  }
}
