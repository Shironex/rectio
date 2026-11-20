'use client';

import { useSyncExternalStore } from 'react';

import { STORAGE } from '@/data/site';

/**
 * The visitor's colour mode, kept on <html> as `data-mode` (no `data-mode` follows the system) and
 * remembered in localStorage. The theme is fixed by `data-theme="default"` on <html>. The tokens
 * read the attributes, so every page, popup and overlay follows without a provider.
 */

export const MODES = ['system', 'light', 'dark'] as const;
export type ModePreference = (typeof MODES)[number];

export interface ThemeChoice {
  mode: ModePreference;
}

const isMode = (value: unknown): value is ModePreference => MODES.some((mode) => mode === value);

function read(): string {
  const { mode } = document.documentElement.dataset;
  return isMode(mode) ? mode : 'system';
}

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

export function useThemeChoice(): ThemeChoice {
  const mode = useSyncExternalStore(subscribe, read, () => 'system');
  return { mode: isMode(mode) ? mode : 'system' };
}

export function setThemeChoice(next: ThemeChoice) {
  const root = document.documentElement;
  if (next.mode === 'system') delete root.dataset.mode;
  else root.dataset.mode = next.mode;
  try {
    localStorage.setItem(STORAGE.theme, JSON.stringify(next));
  } catch {
    // Storage blocked: the choice holds for this page view.
  }
}
